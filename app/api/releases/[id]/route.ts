import { getReleaseStorageBackend, getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease, toPublicPremiereRelease, toPublicRelease } from '@/server/storage/release-dto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { type CMSRelease } from '@/lib/cms-storage';
import { auditLog } from '@/app/lib/audit-log';
import { logger } from '@/app/lib/logger';
import { requireAdmin, getAuthUser } from '@/server/middleware/authenticate';
import { generateSocialShareKit } from '@/lib/social-share-generator';

import { cmsReleaseSchema } from '@/app/lib/validation-schemas';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=2592000',
};

const apiLogger = logger.api;

/**
 * Normalize snake_case field names from the public page to camelCase
 * so they match the CMSRelease type used by the CMS dashboard.
 */
function normalizeFieldNames(body: Record<string, any>): Record<string, any> {
  const snakeToCamel = (str: string) =>
    str.replace(/(_[a-z])/g, (group) => group.toUpperCase().replace('_', ''));

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    // Map known snake_case â†’ camelCase fields from the public page
    const fieldMap: Record<string, string> = {
      release_title: 'title',
      subtitle_cues: 'subtitleCues',
      subtitle_translations: 'subtitleTranslations',
      subtitle_language_statuses: 'subtitleLanguageStatuses',
      subtitle_cue_metadata: 'subtitleCueMetadata',
      subtitle_style_packs: 'subtitleStylePacks',
      language_style_overrides: 'languageStyleOverrides',
      public_credits: 'publicCredits',
      public_commentary: 'publicCommentary',
      public_sponsors: 'publicSponsors',
      public_sponsors_intro: 'publicSponsorsIntro',
      lyrics_structure: 'lyricsStructure',
      youtube_video_id: 'youtubeId',
      youtube_channel_id: 'youtubeChannelId',
      youtube_channel_url: 'youtubeChannelUrl',
      youtube_subtitle_auto_sync: 'youtubeSubtitleAutoSync',
      youtube_caption_tracks: 'youtubeCaptionTracks',
      content_readiness_state: 'contentReadinessState',
      duration_seconds: 'durationSeconds',
      duration_formatted: 'durationFormatted',
      view_count: 'viewCount',
      like_count: 'likeCount',
      enable_lyrics: 'enableLyrics',
      enable_commentary: 'enableCommentary',
      enable_sponsors: 'enableSponsors',
      enable_adoption: 'enableAdoption',
      enable_credits: 'enableCredits',
      available_languages: 'availableLanguages',
      default_language: 'defaultLanguage',
    };

    const normalizedKey = fieldMap[key] || (key.includes('_') ? snakeToCamel(key) : key);
    result[normalizedKey] = value;
  }

  return result;
}

// GET /api/releases/[id]
// Published releases are publicly readable (needed by the public release-detail page).
// All other statuses (draft, in_review, approved, unpublished, archived) require admin auth.
// Unauthenticated requests for non-published releases receive 404, not 401, to avoid
// leaking the existence of draft content.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const store = getReleaseReadStore();
      let release = await store.getById(id);
      if (!release) {
        release = await store.getBySlug(id);
      }
      if (!release) {
        release = await store.getByYoutubeId(id);
      }
    if (!release) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const user = await getAuthUser(request);
    const isAdmin = user?.role === 'admin';

    // Senior Logic: Dynamic Thumbnail Backfill
    if (!release.thumbnailUrl && release.youtubeId) {
      release.thumbnailUrl = `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg`;
    }

    const canonical = toCanonicalCMSRelease(release);

    if (canonical.status !== 'published') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(canonical);
    }

    if (!isAdmin && ['upcoming', 'teaser_live', 'premiere_scheduled'].includes(canonical.releaseLifecycle || '')) {
      if (canonical.visibility !== 'public' || canonical.premiereVisibility !== 'public') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(toPublicPremiereRelease(canonical), { headers: cacheHeaders });
    }

    if (isAdmin) {
      return NextResponse.json(canonical, { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } });
    }

    return NextResponse.json(toPublicRelease(canonical), { headers: cacheHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/releases/[id] (update or upsert for admins)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // We will handle Postgres replication after canonical mutation, so we remove the strict block here.

  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  try {
    const rawBody = await request.json();
    const body = normalizeFieldNames(rawBody);
    let existing = cmsServerStorage.getRelease(id);

    // If it doesn't exist, we'll create it (upsert)
    // This happens when an admin edits a "legacy" YouTube release from the public page
    const nextYoutubeId = String(body.youtubeId || (existing?.youtubeId) || (id.length === 11 ? id : '')).trim();

    // Check if this YouTube ID already exists under a different CMS ID
    if (!existing && nextYoutubeId) {
      const youtubeOwner = cmsServerStorage.getReleaseByYoutubeId(nextYoutubeId);
      if (youtubeOwner) {
        apiLogger.info(`Legacy edit pivot: Mapping YouTube ID ${nextYoutubeId} to existing CMS ID ${youtubeOwner.id}`);
        existing = youtubeOwner;
      }
    }

    const isNew = !existing;
    const now = new Date().toISOString();

    if (isNew) {
      apiLogger.info(`Creating new release via upsert (PUT) for ID: ${id}`);
    }

    const nextSlug = String(body.slug || (existing?.slug) || id).trim();

    if (!nextSlug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    // Collision checks
    const slugOwner = cmsServerStorage.getReleaseBySlug(nextSlug);
    if (slugOwner && slugOwner.id !== (existing?.id || id)) {
      return NextResponse.json(
        { error: `Release slug already exists: ${nextSlug}` },
        { status: 409 }
      );
    }

    if (nextYoutubeId) {
      const youtubeOwner = cmsServerStorage.getReleaseByYoutubeId(nextYoutubeId);
      if (youtubeOwner && youtubeOwner.id !== (existing?.id || id)) {
        return NextResponse.json(
          { error: `YouTube ID already linked to release: ${nextYoutubeId}` },
          { status: 409 }
        );
      }
    }

    const merged: CMSRelease = {
      ...(existing || {
        id,
        title: body.title || 'Untitled',
        slug: nextSlug,
        youtubeId: nextYoutubeId,
        description: body.description || '',
        releaseDate: body.releaseDate || now,
        durationSeconds: body.durationSeconds || 0,
        durationFormatted: body.durationFormatted || '0:00',
        viewCount: body.viewCount || 0,
        likeCount: body.likeCount || 0,
        status: 'published',
        source: 'youtube_import',
        createdAt: now,
        updatedAt: now,
        availableLanguages: ['en', 'ur'],
        defaultLanguage: 'en',
        enableLyrics: true,
        enableCommentary: true,
        enableSponsors: false,
        enableAdoption: true,
        enableCredits: true,
      }) as CMSRelease,
      ...body,
      id: existing?.id || id, // Always enforce the correct ID
      slug: nextSlug,
      youtubeId: nextYoutubeId,
      updatedAt: now,
    };

    // Preserve critical fields for existing releases unless explicitly changed and valid
    if (existing) {
       merged.source = existing.source || merged.source;
       merged.status = body.status || existing.status;
       merged.visibility = body.visibility || existing.visibility;
    }

    // Run Zod validation schema
    const validationResult = cmsReleaseSchema.safeParse(merged);
    if (!validationResult.success) {
      console.warn(`[API /api/releases/${id}] Validation failed:`, validationResult.error.format());
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Generate social share kit whenever status becomes published (first publish or re-publish)
    const isBeingPublished = (!existing || existing.status !== 'published') && merged.status === 'published';
    if (isBeingPublished && merged.youtubeId) {
      merged.socialShareKit = generateSocialShareKit(merged as any);
    }

    const updated = cmsServerStorage.saveRelease(merged as any);

    // --- Postgres Replication ---
    if (process.env.RELEASE_STORAGE_BACKEND === 'postgres') {
      try {
        const { PostgresReleaseRepository } = await import('@/server/db/release-repository');
        const repo = new PostgresReleaseRepository();
        await repo.bulkUpsert([updated as any]);
      } catch (err) {
        if (existing) {
          cmsServerStorage.saveRelease(existing);
        } else {
          cmsServerStorage.deleteRelease(updated.id);
        }
        apiLogger.error('Postgres replication failed, rolled back registry', { err: String(err) });
        throw new Error('Postgres replication failed: ' + String(err));
      }
    }

    // --- CACHE INVALIDATION ---
    try {
      revalidatePath('/');
      revalidatePath('/releases');
      revalidatePath(`/release-detail/${nextSlug}`);
      // Also revalidate the generic pattern
      revalidatePath('/release-detail/[slug]', 'page');
      revalidatePath('/release-premieres');
    } catch (cacheErr) {
      apiLogger.warn('Cache revalidation failed', { err: String(cacheErr) });
    }

    // Audit log
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
    apiLogger.info(`Release ${isNew ? 'created' : 'updated'} via PUT: ${id}`, { id, slug: nextSlug });
    auditLog({
      userId: authResult.id,
      userEmail: authResult.email,
      action: isNew ? 'release_created' : 'release_updated',
      resourceType: 'release',
      resourceId: id,
      details: { title: merged.title, slug: nextSlug },
      ipAddress: ip,
    });

    // Auto-notify subscribers when a release is first published
    if ((!existing || existing.status !== 'published') && updated.status === 'published' && updated.youtubeId) {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${base}/api/admin/notify-subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
        body: JSON.stringify({
          title: updated.title,
          youtubeId: updated.youtubeId,
          youtubePlaylistId: updated.youtubePlaylistId,
          slug: updated.slug,
          releaseId: updated.id,
        }),
      }).catch((err) => apiLogger.warn('Subscriber notification failed', { err: String(err) }));
    }

    // --- LYRICS REQUEST NOTIFICATIONS ---
    // Identify newly published languages for lyrics translation requests
    const newlyPublishedLanguages: string[] = [];
    if (body.subtitleLanguageStatuses) {
      for (const [lang, status] of Object.entries(body.subtitleLanguageStatuses)) {
        const isNowPublished = status === 'published';
        const wasNotPublished = !existing?.subtitleLanguageStatuses || existing.subtitleLanguageStatuses[lang] !== 'published';

        if (isNowPublished && wasNotPublished) {
          newlyPublishedLanguages.push(lang);
        }
      }
    }

    // Notify requesters for each newly published language
    if (newlyPublishedLanguages.length > 0) {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      for (const langCode of newlyPublishedLanguages) {
        fetch(`${base}/api/admin/notify-lyrics-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
          body: JSON.stringify({
            releaseId: updated.id,
            languageCode: langCode,
          }),
        }).catch((err) => apiLogger.warn(`Lyrics request notification failed for ${langCode}`, { err: String(err) }));
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`[API /api/releases/${id}] PUT ERROR:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/releases/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  try {
    const existing = cmsServerStorage.getRelease(id);
    if (!existing) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    cmsServerStorage.deleteRelease(id);

    // --- Postgres Replication ---
    if (process.env.RELEASE_STORAGE_BACKEND === 'postgres') {
      try {
        const { PostgresReleaseRepository } = await import('@/server/db/release-repository');
        const repo = new PostgresReleaseRepository();
        await repo.delete(id);
      } catch (err) {
        // Rollback Registry deletion on PG failure
        cmsServerStorage.saveRelease(existing);
        apiLogger.error('Postgres deletion replication failed', { err: String(err) });
        throw new Error('Postgres deletion replication failed: ' + String(err));
      }
    }

    // --- CACHE INVALIDATION ---
    try {
      revalidatePath('/');
      revalidatePath('/releases');
      revalidatePath('/release-premieres');
      if (existing.slug) revalidatePath(`/release-detail/${existing.slug}`);
      revalidatePath('/release-detail/[slug]', 'page');
    } catch (cacheErr) {
      apiLogger.warn('Cache revalidation failed', { err: String(cacheErr) });
    }

    // Audit log
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
    apiLogger.warn(`Release deleted: ${id}`, { id, title: existing.title });
    auditLog({
      userId: authResult.id,
      userEmail: authResult.email,
      action: 'release_deleted',
      resourceType: 'release',
      resourceId: id,
      details: { title: existing.title },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
