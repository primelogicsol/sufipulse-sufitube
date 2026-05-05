import { NextRequest, NextResponse } from 'next/server';
import { youtubeService, inferFormat } from '@/lib/youtube-service';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { revalidatePath } from 'next/cache';

const slugify = (value: string): string => {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'release';
};

const buildUniqueSlug = (title: string, youtubeId: string, currentReleaseId?: string): string => {
  const base = slugify(title);
  const fallback = `${base}-${youtubeId.toLowerCase()}`;

  const byBase = cmsServerStorage.getReleaseBySlug(base);
  if (!byBase || byBase.id === currentReleaseId) {
    return base;
  }

  const byFallback = cmsServerStorage.getReleaseBySlug(fallback);
  if (!byFallback || byFallback.id === currentReleaseId) {
    return fallback;
  }

  return `${fallback}-${Date.now()}`;
};

const mapVideoToRelease = (video: any, existing?: CMSRelease | null): CMSRelease => {
  const id = existing?.id || `release_${Date.now()}_${video.id}`;
  const slug = buildUniqueSlug(video.title, video.id, existing?.id);
  const now = new Date().toISOString();
  const publishedDate = video.publishedDate || video.publishedAt || existing?.releaseDate || now;

  return {
    ...(existing || {}),
    id,
    title: video.title,
    slug,
    youtubeId: video.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnailUrl: video.thumbnailUrl,
    description: video.description || existing?.description || '',
    releaseDate: publishedDate.slice(0, 10),
    publishedAt: video.publishedAt || video.publishedDate || existing?.publishedAt || now,
    durationSeconds: Number(video.durationSeconds || existing?.durationSeconds || 0),
    durationFormatted: video.durationFormatted || existing?.durationFormatted || '0:00',
    viewCount: Number(video.views || existing?.viewCount || 0),
    likeCount: Number(existing?.likeCount || 0),
    status: existing?.status || 'published',
    contentReadinessState: existing?.contentReadinessState || 'draft',
    releaseType: existing?.releaseType || 'studio-release',
    format: existing?.format || video.format || (Number(video.durationSeconds) <= 60 ? 'short' : 'video'),
    source: 'youtube',
    visibility: 'public',
    enableLyrics: existing?.enableLyrics !== false,
    enableCommentary: existing?.enableCommentary !== false,
    enableSponsors: !!existing?.enableSponsors,
    enableAdoption: existing?.enableAdoption !== false,
    enableCredits: existing?.enableCredits !== false,
    availableLanguages: existing?.availableLanguages || ['en', 'ur'],
    defaultLanguage: existing?.defaultLanguage || 'en',
    lyrics: existing?.lyrics || {},
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  } as CMSRelease;
};

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('fetchAll') === '1';
    const max = fetchAll
      ? 500
      : Math.max(1, Math.min(Number(searchParams.get('max') || 25), 500));

    const videos = await youtubeService.getLatestVideos(max);
    const rows = (videos || []).map((video: any) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      publishedDate: video.publishedDate,
      durationSeconds: video.durationSeconds,
      durationFormatted: video.durationFormatted,
      views: video.views,
      alreadyImported: !!cmsServerStorage.getReleaseByYoutubeId(video.id),
    }));

    return NextResponse.json({
      count: rows.length,
      requestedMax: max,
      fetchAll,
      items: rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch YouTube videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Clear cache BEFORE fetching to ensure we get the absolute latest from YouTube
    youtubeService.clearCache();

    const body = await request.json().catch(() => ({}));
    const requestedIds = Array.isArray(body.videoIds) ? body.videoIds.filter(Boolean) : [];

    let selected: any[] = [];

    if (requestedIds.length) {
      for (const vid of requestedIds) {
        try {
          const detail = await youtubeService.getVideoDetails(vid);
          if (detail) selected.push(detail);
        } catch (e) {
          console.error(`Failed to fetch details for ${vid}:`, e);
        }
      }
    } else {
      // Default: fetch latest 100
      selected = await youtubeService.getLatestVideos(100);
    }

    if (!selected.length) {
      return NextResponse.json({ error: 'No videos found to import' }, { status: 404 });
    }

    console.log(`[ImportYouTube] First 10 IDs: ${selected.slice(0, 10).map(v => v.id).join(', ')}`);

    const imported: CMSRelease[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    console.log(`[ImportYouTube] Processing ${selected.length} videos...`);

    for (const video of selected) {
      // Normalize search titles for logging
      const isTarget = video.title.includes('Kemis Taani') || video.title.includes('Phir Likh');
      
      const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
      if (!existing) {
        createdCount++;
        if (isTarget) console.log(`[ImportYouTube] TARGET FOUND (New): ${video.title} (ID: ${video.id})`);
      } else {
        updatedCount++;
        if (isTarget) console.log(`[ImportYouTube] TARGET FOUND (Existing): ${video.title} (ID: ${video.id})`);
      }
      
      const mapped = mapVideoToRelease(video, existing);
      const saved = cmsServerStorage.saveRelease(mapped);
      imported.push(saved);
    }

    // Clear cache and revalidate public paths
    youtubeService.clearCache();
    revalidatePath('/');
    revalidatePath('/releases');
    
    const allReleases = cmsServerStorage.getAllReleases();
    const newest = imported.length > 0 ? imported[0] : null;

    console.log(`[ImportYouTube] Sync complete. Created: ${createdCount}, Updated: ${updatedCount}, Total: ${allReleases.length}`);
    if (newest) {
      console.log(`[ImportYouTube] Newest synced: ${newest.title} [${newest.publishedAt || newest.releaseDate}]`);
    }

    return NextResponse.json({
      fetchedCount: selected.length,
      createdCount,
      updatedCount,
      skippedCount: 0,
      totalSavedReleases: allReleases.length,
      newestSavedTitle: newest?.title,
      newestSavedPublishedAt: newest?.publishedAt || newest?.releaseDate,
      items: imported,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to import YouTube videos' }, { status: 500 });
  }
}
