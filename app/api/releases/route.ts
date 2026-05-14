import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin, getAuthUser } from '@/server/middleware/authenticate';
import { resolveRelease } from '@/lib/release-resolver';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=3600',
};

export async function GET(request: NextRequest) {
  console.time('[releases] total');
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const slug = searchParams.get('slug');
    const youtubeId = searchParams.get('youtubeId');
    const user = await getAuthUser(request);
    const isAdmin = user?.role === 'admin';
    const noCache = isAdmin || searchParams.get('refresh') === '1' || searchParams.get('nocache') === '1';
    const headers = noCache 
      ? { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
      : cacheHeaders;

    // --- SINGLE DETAIL MODE ---
    const lookupKey = key || slug || youtubeId;
    if (lookupKey) {
      const release = resolveRelease(lookupKey);
      if (!release) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
        
      return NextResponse.json(release, { headers });
    }

    // --- FAST LIST MODE ---
    const status = searchParams.get('status') || 'published';

    console.time('[releases] loadAll');
    let base: CMSRelease[] = [];
    
    if (isAdmin) {
      base = cmsServerStorage.getAllReleases(status !== 'all' ? { status } : undefined);
    } else if (status === 'all') {
      // Non-admins should only see published releases even if they ask for "all"
      base = cmsServerStorage.getPublishedReleases();
    } else {
      base = cmsServerStorage.getPublishedReleases();
    }
    console.timeEnd('[releases] loadAll');

    // 24-hour staleness check
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let needsRefresh = false;

    // Merge and filter
    const format = searchParams.get('format') || '';
    const type = searchParams.get('type') || '';
    const duration = searchParams.get('duration') || '';
    const year = searchParams.get('year') || '';
    const search = (searchParams.get('search') || '').toLowerCase().trim();

    const merged = base.map((r) => {
      const lastSync = r.lastYoutubeSyncAt ? new Date(r.lastYoutubeSyncAt).getTime() : 0;
      if (now - lastSync > oneDayMs) needsRefresh = true;

      // Merge Strategy: CMS editorial priority, then YouTube Operational Cache
      // Senior Logic: Dynamic Thumbnail Backfill
      const thumbnail = r.thumbnailUrl || (r.youtubeId ? `https://i.ytimg.com/vi/${r.youtubeId}/maxresdefault.jpg` : '');

      return {
        id: r.id,
        slug: r.slug,
        youtubeId: r.youtubeId,
        title: r.title, // CMS editorial title
        thumbnail,      // Generated or editorial thumb
        duration: r.youtubeStats?.duration || r.durationFormatted || '0:00',
        durationSeconds: r.youtubeStats?.durationSeconds || r.durationSeconds || 0,
        publishedAt: r.youtubeStats?.publishedAt || r.publishedAt || r.releaseDate || r.createdAt,
        viewCount: r.youtubeStats?.viewCount ?? r.viewCount ?? 0,
        likeCount: r.youtubeStats?.likeCount ?? r.likeCount ?? 0,
        format: r.format || 'video',
        releaseType: r.releaseType || 'studio-release',
        source: r.source || 'native',
        lastYoutubeSyncAt: r.lastYoutubeSyncAt,
        description: r.description,
        vocalist: r.vocalist,
        writer: r.writer,
        tags: r.tags,
        status: r.status,
      };
    });

    console.time('[releases] filter');
    let filtered = merged;
    if (format || type || duration || year || search || (status && status !== 'all' && !isAdmin)) {
      filtered = merged.filter((r) => {
        if (status && status !== 'all' && r.status !== status && !isAdmin) return false;
        if (format && r.format !== format) return false;
        if (type && r.releaseType !== type) return false;
        if (duration) {
          const mins = (r.durationSeconds || 0) / 60;
          if (duration === 'short' && mins >= 3) return false;
          if (duration === 'standard' && (mins < 3 || mins > 8)) return false;
          if (duration === 'long' && mins <= 8) return false;
        }
        if (year) {
          const releaseYear = new Date(r.publishedAt).getFullYear();
          if (releaseYear !== parseInt(year)) return false;
        }
        if (search) {
          const haystack = `${r.title} ${r.description || ''}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      });
    }
    console.timeEnd('[releases] filter');

    // Final Sort: Latest First (by publishedAt descending)
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      return dateB - dateA;
    });

    const responseData = {
        items: filtered,
        needsRefresh,
        count: filtered.length
    };

    console.timeEnd('[releases] total');
    return NextResponse.json(responseData, { headers });

  } catch (error: any) {
    console.error(`[API /api/releases] ERROR:`, error);
    console.timeEnd('[releases] total');
    return NextResponse.json({ error: error.message }, { status: 500 });
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

// POST /api/releases (create)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const rawBody = await request.json();
    const body = normalizeFieldNames(rawBody);
    
    const id = body.id || `release_${Date.now()}`;
    const slug = String(body.slug || '').trim();
    const youtubeId = String(body.youtubeId || '').trim();

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    if (cmsServerStorage.getRelease(id)) {
      return NextResponse.json({ error: `Release ID already exists: ${id}` }, { status: 409 });
    }

    if (cmsServerStorage.getReleaseBySlug(slug)) {
      return NextResponse.json({ error: `Release slug already exists: ${slug}` }, { status: 409 });
    }

    if (youtubeId) {
      const youtubeOwner = cmsServerStorage.getReleaseByYoutubeId(youtubeId);
      if (youtubeOwner) {
        return NextResponse.json(
          { error: `YouTube ID already linked to release: ${youtubeId}` },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();
    const release: CMSRelease = {
      ...body,
      id,
      slug,
      youtubeId,
      status: body.status || 'draft',
      createdAt: now,
      updatedAt: now,
      source: body.source || 'native',
    } as CMSRelease;

    const saved = cmsServerStorage.saveRelease(release);

    // --- CACHE INVALIDATION ---
    try {
      revalidatePath('/');
      revalidatePath('/releases');
    } catch (cacheErr) {
      console.warn('[API /api/releases] Cache revalidation failed', cacheErr);
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error(`[API /api/releases] POST ERROR:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
