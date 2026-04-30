import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { auditLog } from '@/app/lib/audit-log';
import { logger } from '@/app/lib/logger';
import { requireAdmin, getAuthUser } from '@/server/middleware/authenticate';
import { generateSocialShareKit } from '@/lib/social-share-generator';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
    const release = cmsServerStorage.getRelease(id);
    if (!release) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (release.status !== 'published') {
      const user = await getAuthUser(request);
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(release);
    }

    return NextResponse.json(release, { headers: cacheHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/releases/[id] (update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  try {
    const rawBody = await request.json();
    const body = normalizeFieldNames(rawBody);
    const existing = cmsServerStorage.getRelease(id);

    if (!existing) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const nextSlug = String(body.slug ?? existing.slug ?? '').trim();
    const nextYoutubeId = String(body.youtubeId ?? existing.youtubeId ?? '').trim();

    if (!nextSlug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const slugOwner = cmsServerStorage.getReleaseBySlug(nextSlug);
    if (slugOwner && slugOwner.id !== id) {
      return NextResponse.json(
        { error: `Release slug already exists: ${nextSlug}` },
        { status: 409 }
      );
    }

    if (nextYoutubeId) {
      const youtubeOwner = cmsServerStorage.getReleaseByYoutubeId(nextYoutubeId);
      if (youtubeOwner && youtubeOwner.id !== id) {
        return NextResponse.json(
          { error: `YouTube ID already linked to release: ${nextYoutubeId}` },
          { status: 409 }
        );
      }
    }

    const merged = { ...existing, ...body, slug: nextSlug, youtubeId: nextYoutubeId, id };

    // Generate social share kit whenever status becomes published (first publish or re-publish)
    const isBeingPublished = existing.status !== 'published' && merged.status === 'published';
    if (isBeingPublished && merged.youtubeId) {
      merged.socialShareKit = generateSocialShareKit(merged as any);
    }

    const updated = cmsServerStorage.saveRelease(merged as any);

    // Audit log
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
    apiLogger.info(`Release updated: ${id}`, { id, slug: nextSlug });
    auditLog({
      userId: authResult.id,
      userEmail: authResult.email,
      action: 'release_updated',
      resourceType: 'release',
      resourceId: id,
      details: { title: body.title, slug: nextSlug },
      ipAddress: ip,
    });

    // Auto-notify subscribers when a release is first published
    if (existing.status !== 'published' && updated.status === 'published' && updated.youtubeId) {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${base}/api/admin/notify-subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
        body: JSON.stringify({
          title: updated.title,
          youtubeId: updated.youtubeId,
          youtubePlaylistId: updated.youtubePlaylistId,
          slug: updated.slug,
        }),
      }).catch((err) => apiLogger.warn('Subscriber notification failed', { err: String(err) }));
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/releases/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  try {
    const existing = cmsServerStorage.getRelease(id);
    if (!existing) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    cmsServerStorage.deleteRelease(id);

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
