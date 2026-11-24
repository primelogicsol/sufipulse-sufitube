import { getReleaseStorageBackend, getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease, toPublicPremiereRelease, toPublicRelease } from '@/server/storage/release-dto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { type CMSRelease } from '@/lib/cms-storage';
import { auditLog } from '@/app/lib/audit-log';
import { logger } from '@/app/lib/logger';
import { requireAdmin, getAuthUser, checkIsAdmin } from '@/server/middleware/authenticate';
import { generateSocialShareKit } from '@/lib/social-share-generator';
import { applyCanonicalLyricsWorkflow } from '@/server/services/canonical-lyrics-workflow';
import { runPublishedReleaseDiscoveryPipeline } from '@/lib/release-discovery-pipeline';


import { cmsReleaseSchema, cmsReleaseStatusPatchSchema } from '@/app/lib/validation-schemas';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=0, s-maxage=0, must-revalidate',
};

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

const apiLogger = logger.api;

function revalidateReleaseCaches(
  slugs: Array<string | undefined | null>,
  youtubeIds: Array<string | undefined | null>,
) {
  try {
    revalidatePath('/');
    revalidatePath('/releases');
    revalidatePath('/release-premieres');
    revalidatePath('/sitemap.xml');
    revalidatePath('/release-detail/[slug]', 'page');
    for (const s of new Set(slugs.filter(Boolean) as string[])) {
      revalidatePath(`/release-detail/${s}`);
    }
    for (const yt of new Set(youtubeIds.filter(Boolean) as string[])) {
      revalidatePath(`/release-detail/${yt}`);
      revalidatePath(`/release-metadata/${yt}`);
      revalidatePath(`/api/releases/youtube/${yt}`);
    }
  } catch (cacheErr) {
    apiLogger.warn('Cache revalidation failed', { err: String(cacheErr) });
  }
}

/**
 * Normalize snake_case field names from the public page to camelCase
 * so they match the CMSRelease type used by the CMS dashboard.
 */
function normalizeFieldNames(body: Record<string, any>): Record<string, any> {
  const snakeToCamel = (str: string) =>
    str.replace(/(_[a-z])/g, (group) => group.toUpperCase().replace('_', ''));

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(body)) {
    // Map known snake_case → camelCase fields from the public page
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
    const isAdmin = checkIsAdmin(user);

    // Senior Logic: Dynamic Thumbnail Backfill
    if (!release.thumbnailUrl && release.youtubeId) {
      release.thumbnailUrl = `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg`;
    }

    const canonical = toCanonicalCMSRelease(release);

    if (canonical.status !== 'published' || canonical.visibility !== 'public') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStoreHeaders });
      }
      return NextResponse.json(canonical, { headers: noStoreHeaders });
    }

    if (!isAdmin && ['upcoming', 'teaser_live', 'premiere_scheduled'].includes(canonical.releaseLifecycle || '')) {
      if (canonical.visibility !== 'public' || canonical.premiereVisibility !== 'public') {
        return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noStoreHeaders });
      }
      return NextResponse.json(toPublicPremiereRelease(canonical), { headers: cacheHeaders });
    }

    if (isAdmin) {
      return NextResponse.json(canonical, { headers: noStoreHeaders });
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

    // Do not let a browser tab loaded before a Studio/YouTube reconciliation
    // overwrite the newer public metadata or publication state.
    if (
      existing?.source === 'studio_pipeline' &&
      existing.updatedAt &&
      body.originalUpdatedAt &&
      new Date(body.originalUpdatedAt).getTime() !== new Date(existing.updatedAt).getTime()
    ) {
      return NextResponse.json(
        {
          error: 'This release changed since the editor was opened. Reload the editor before saving to avoid overwriting the published record.',
          code: 'STALE_RELEASE',
        },
        { status: 409 }
      );
    }
    delete body.originalUpdatedAt;

    const userId = authResult.id || (authResult as any).email || 'system';
    const studioLocked = existing?.source === 'studio_pipeline' && Boolean(existing?.studioProduction?.approvedAt);
    if (studioLocked) {
      // Protect the approved master even if a stale browser tab submits old form data.
      // Editorial metadata remains editable, but canonical media fields always come from the approved record.
      for (const key of ['canonicalLyrics', 'videoStructure', 'durationSeconds', 'durationFormatted', 'studioProduction'] as const) {
        delete body[key];
      }
    } else if (body.canonicalLyrics !== undefined) {
      body.canonicalLyrics = applyCanonicalLyricsWorkflow(existing?.canonicalLyrics, body.canonicalLyrics, userId, new Date().toISOString());
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
      if (rawBody.visibility !== undefined) {
        merged.visibility = body.visibility;
      } else if (body.status && body.status !== existing.status) {
        if (body.status === 'published') {
          merged.visibility = 'public';
        } else {
          merged.visibility = 'private';
        }
      } else {
        merged.visibility = existing.visibility || (merged.status === 'published' ? 'public' : 'private');
      }
    }

    // Lifecycle audit timestamps & override protection
    if (merged.status === 'unpublished' && existing?.status !== 'unpublished') {
      merged.unpublishedAt = now;
      merged.unpublishedBy = userId;
      merged.publicationOverride = true;
    } else if (merged.status === 'archived' && existing?.status !== 'archived') {
      merged.archivedAt = now;
      merged.archivedBy = userId;
      merged.publicationOverride = true;
    } else if (merged.status === 'published') {
      merged.publishedAt = merged.publishedAt || existing?.publishedAt || now;
      if (existing?.status === 'unpublished') {
        merged.unpublishedAt = null;
        merged.unpublishedBy = null;
      }
    }
    if (merged.status !== 'published' || merged.visibility !== 'public') {
      merged.publicationOverride = true;
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

    // --- CACHE INVALIDATION & ORGANIC SEARCH DISCOVERY PIPELINE ---
    revalidateReleaseCaches([existing?.slug, nextSlug], [existing?.youtubeId, nextYoutubeId]);
    if (updated.status === 'published' && (updated.visibility || 'public') === 'public') {
      runPublishedReleaseDiscoveryPipeline(updated.id, authResult.email || authResult.id || 'admin_put').catch((err) =>
        apiLogger.warn('Post-publish search discovery pipeline warning', { err: String(err) })
      );
    }

    // Audit log
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
    apiLogger.info(`Release ${isNew ? 'created' : 'updated'} via PUT: ${id}`, { id, slug: nextSlug, status: updated.status, visibility: updated.visibility });
    auditLog({
      userId: authResult.id,
      userEmail: authResult.email,
      action: isNew ? 'release_created' : 'release_updated',
      resourceType: 'release',
      resourceId: updated.id,
      details: {
        title: merged.title,
        slug: nextSlug,
        previousStatus: existing?.status || null,
        status: updated.status,
        previousVisibility: existing?.visibility || null,
        visibility: updated.visibility,
      },
      ipAddress: ip,
    });

    // Auto-notify subscribers when a release is first published publicly
    if ((!existing || existing.status !== 'published') && updated.status === 'published' && updated.visibility === 'public' && updated.youtubeId) {
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

    return NextResponse.json(toCanonicalCMSRelease(updated), { headers: noStoreHeaders });
  } catch (error: any) {
    console.error(`[API /api/releases/${id}] PUT ERROR:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/releases/[id] — Narrowly scoped editorial status & visibility endpoint
// Preserves all editorial content (title, lyrics, subtitles, credits, commentary, dates, YouTube ID)
// without requiring full-object submission or risking legacy field validation failures.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsed = cmsReleaseStatusPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid status update payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    let existing = cmsServerStorage.getRelease(id);
    if (!existing) {
      existing = cmsServerStorage.getReleaseBySlug(id) || cmsServerStorage.getReleaseByYoutubeId(id);
    }
    if (!existing) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const { action, status: requestedStatus, visibility: requestedVisibility, reason } = parsed.data;
    const now = new Date().toISOString();
    const actor = authResult.id || authResult.email || 'admin';

    let nextStatus = existing.status || 'draft';
    let nextVisibility: 'public' | 'private' | 'unlisted' = existing.visibility || 'public';

    if (action === 'unpublish') {
      nextStatus = 'unpublished';
      nextVisibility = requestedVisibility || 'private';
    } else if (action === 'archive') {
      nextStatus = 'archived';
      nextVisibility = requestedVisibility || 'private';
    } else if (action === 'restore_draft' || action === 'draft') {
      nextStatus = 'draft';
      nextVisibility = requestedVisibility || 'private';
    } else if (action === 'queue') {
      nextStatus = 'queued';
      nextVisibility = requestedVisibility || 'private';
    } else if (action === 'in_review') {
      nextStatus = 'in_review';
      nextVisibility = requestedVisibility || 'private';
    } else if (action === 'approve') {
      nextStatus = 'approved';
      nextVisibility = requestedVisibility || 'private';
    } else if (action === 'publish') {
      nextStatus = 'published';
      nextVisibility = requestedVisibility || 'public';
    } else if (action === 'set_visibility') {
      nextStatus = requestedStatus || existing.status || 'draft';
      nextVisibility = requestedVisibility || existing.visibility || 'private';
    } else {
      if (requestedStatus) {
        nextStatus = requestedStatus;
        if (requestedVisibility) {
          nextVisibility = requestedVisibility;
        } else if (requestedStatus === 'published') {
          nextVisibility = 'public';
        } else {
          nextVisibility = 'private';
        }
      } else if (requestedVisibility) {
        nextVisibility = requestedVisibility;
      }
    }

    // Server-side publish readiness validation
    if (nextStatus === 'published') {
      if (!String(existing.title || '').trim() || String(existing.title || '').trim().length < 3) {
        return NextResponse.json({ error: 'Cannot publish release: a valid title (at least 3 characters) is required.' }, { status: 400 });
      }
      if (!String(existing.slug || '').trim() || String(existing.slug || '').trim().length < 3) {
        return NextResponse.json({ error: 'Cannot publish release: a valid URL slug is required.' }, { status: 400 });
      }
      const isPremiereAnnouncement = ['upcoming', 'teaser_live', 'premiere_scheduled'].includes(existing.releaseLifecycle || '');
      if (!existing.youtubeId && !isPremiereAnnouncement && existing.format !== 'audio' && existing.format !== 'playlist' && !existing.webOnly) {
        return NextResponse.json(
          { error: 'Cannot publish release: a valid YouTube video ID is required unless in Premiere announcement or audio/playlist mode.' },
          { status: 400 }
        );
      }
    }

    const patched: CMSRelease = {
      ...existing,
      status: nextStatus,
      visibility: nextVisibility,
      updatedAt: now,
      publicationOverride: true,
    };

    if (nextStatus === 'unpublished') {
      patched.unpublishedAt = now;
      patched.unpublishedBy = actor;
    } else if (nextStatus === 'archived') {
      patched.archivedAt = now;
      patched.archivedBy = actor;
    } else if (nextStatus === 'published') {
      patched.publishedAt = existing.publishedAt || now;
      patched.unpublishedAt = null;
      patched.unpublishedBy = null;
      if ((!existing.socialShareKit) && existing.youtubeId) {
        patched.socialShareKit = generateSocialShareKit(patched as any);
      }
    }

    const updated = cmsServerStorage.saveRelease(patched);

    // --- Postgres Replication ---
    if (process.env.RELEASE_STORAGE_BACKEND === 'postgres') {
      try {
        const { PostgresReleaseRepository } = await import('@/server/db/release-repository');
        const repo = new PostgresReleaseRepository();
        await repo.bulkUpsert([updated as any]);
      } catch (err) {
        cmsServerStorage.saveRelease(existing);
        apiLogger.error('Postgres replication failed during PATCH, rolled back registry', { err: String(err) });
        throw new Error('Postgres replication failed: ' + String(err));
      }
    }

    revalidateReleaseCaches([existing.slug, updated.slug], [existing.youtubeId, updated.youtubeId]);
    if (updated.status === 'published' && (updated.visibility || 'public') === 'public') {
      runPublishedReleaseDiscoveryPipeline(updated.id, actor).catch((err) =>
        apiLogger.warn('Post-patch search discovery pipeline warning', { err: String(err) })
      );
    }

    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
    apiLogger.info(`Release status patched via PATCH: ${existing.id}`, {
      id: existing.id,
      slug: updated.slug,
      action: action || 'direct_patch',
      previousStatus: existing.status,
      status: updated.status,
      previousVisibility: existing.visibility,
      visibility: updated.visibility,
    });
    const auditAction =
      action === 'publish'
        ? 'release_published'
        : action === 'unpublish'
          ? 'release_unpublished'
          : action === 'archive'
            ? 'release_archived'
            : action === 'restore_draft'
              ? 'release_restored_draft'
              : action === 'set_visibility'
                ? 'release_visibility_changed'
                : 'release_updated';

    auditLog({
      userId: authResult.id,
      userEmail: authResult.email,
      action: auditAction,
      resourceType: 'release',
      resourceId: existing.id,
      details: {
        title: updated.title,
        slug: updated.slug,
        previousStatus: existing.status,
        status: updated.status,
        previousVisibility: existing.visibility || 'public',
        visibility: updated.visibility,
        reason: reason || null,
      },
      ipAddress: ip,
    });

    return NextResponse.json(toCanonicalCMSRelease(updated), { headers: noStoreHeaders });
  } catch (error: any) {
    console.error(`[API /api/releases/${id}] PATCH ERROR:`, error);
    return NextResponse.json({ error: error.message || 'Status update failed' }, { status: 500 });
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
    revalidateReleaseCaches([existing.slug], [existing.youtubeId]);

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
