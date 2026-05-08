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
  const slug = existing?.slug || buildUniqueSlug(video.title, video.id, existing?.id);
  const now = new Date().toISOString();
  
  // Operational Metadata from YouTube (The "Cache" Layer)
  const youtubeStats = {
    viewCount: Number(video.views || 0),
    likeCount: Number(video.likes || 0),
    commentCount: Number(video.comments || 0),
    duration: video.durationFormatted || '0:00',
    durationSeconds: Number(video.durationSeconds || 0),
    publishedAt: video.publishedDate || video.publishedAt || now,
    thumbnailUrl: video.thumbnailUrl || '',
    title: video.title || '',
    liveBroadcastContent: video.liveBroadcastContent || 'none',
  };

  // Log specific updates for transparency
  if (existing) {
    const isTarget = video.title.includes('Kemis Taani') || video.id === 'D7hvqyQYJrk';
    if (isTarget) {
      console.log(`[mapVideoToRelease] REFRESHING metadata for: ${video.title}`);
      console.log(`  - Views: ${existing.viewCount} -> ${youtubeStats.viewCount}`);
      console.log(`  - Sync Time: ${existing.lastYoutubeSyncAt || 'Never'} -> ${now}`);
    }
  }

  return {
    ...(existing || {}),
    id,
    slug,
    youtubeId: video.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
    
    // --- DISPLAY PRIORITY MERGE ---
    // If editorial fields are missing (new import), use YouTube data.
    // Otherwise, existing CMS editorial fields take priority for Title/Thumb/Desc.
    title: existing?.title || youtubeStats.title,
    thumbnailUrl: existing?.thumbnailUrl || youtubeStats.thumbnailUrl,
    description: existing?.description || video.description || '',
    
    // --- OPERATIONAL DATA (Always Fresh from YouTube) ---
    viewCount: youtubeStats.viewCount,
    likeCount: youtubeStats.likeCount,
    durationSeconds: youtubeStats.durationSeconds,
    durationFormatted: youtubeStats.duration,
    
    // --- CACHE LAYER ---
    youtubeStats,
    lastYoutubeSyncAt: now,

    // --- SYSTEM / EDITORIAL PRESERVATION ---
    status: existing?.status || 'published',
    visibility: existing?.visibility || 'public',
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

  if (!process.env.YOUTUBE_API_KEY && !process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) {
    return NextResponse.json({ 
      error: 'YouTube API configuration missing on server. Please set YOUTUBE_API_KEY.' 
    }, { status: 401 });
  }

  try {
    // Clear cache BEFORE fetching to ensure we get the absolute latest from YouTube
    youtubeService.clearCache();

    const body = await request.json().catch(() => ({}));
    const requestedIds = Array.isArray(body.videoIds) ? body.videoIds.filter(Boolean) : [];

    let selected: any[] = [];

    if (requestedIds.length) {
      for (const vid of requestedIds) {
        try {
          const detail = await youtubeService.getVideoById(vid);
          if (detail) selected.push(detail);
        } catch (e) {
          console.error(`Failed to fetch details for ${vid}:`, e);
        }
      }
    } else {
      // 1. Default: fetch latest 100 from uploads
      selected = await youtubeService.getLatestVideos(100);
      
      // 2. ALSO collect all existing youtubeIds from CMS to refresh metadata/stats
      const allExisting = cmsServerStorage.getAllReleases();
      const existingIds = allExisting
        .filter(r => r.youtubeId && !selected.find(v => v.id === r.youtubeId))
        .map(r => r.youtubeId);
      
      if (existingIds.length > 0) {
        console.log(`[ImportYouTube] Refreshing metadata for ${existingIds.length} existing releases...`);
        // Batch fetch detailed stats for existing IDs (50 per request)
        for (let i = 0; i < existingIds.length; i += 50) {
          const chunk = existingIds.slice(i, i + 50);
          const details = await youtubeService.getVideosByIds(chunk);
          
          // Map raw API details to YouTubeVideo format (to match getLatestVideos output)
          const mappedDetails = details.map((video: any) => {
             const durationSecs = youtubeService.parseDuration(video.contentDetails?.duration || 'PT0S');
             const hasLiveDetails = !!(video.liveStreamingDetails?.actualStartTime || video.liveStreamingDetails?.scheduledStartTime);
             // Use public helper from youtubeService or replicate mapping
             return {
                id: video.id,
                title: video.snippet.title,
                description: video.snippet.description,
                thumbnailUrl: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
                publishedDate: video.snippet.publishedAt,
                durationSeconds: durationSecs,
                durationFormatted: video.contentDetails?.duration || 'PT0S', // will be formatted in mapVideoToRelease
                views: parseInt(video.statistics?.viewCount || '0'),
                likes: parseInt(video.statistics?.likeCount || '0'),
                comments: parseInt(video.statistics?.commentCount || '0'),
                liveBroadcastContent: video.snippet.liveBroadcastContent || 'none',
                source: 'youtube_legacy',
                format: inferFormat(durationSecs, hasLiveDetails),
             };
          });
          selected.push(...mappedDetails);
        }
      }
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

    // Force re-hydration of the storage server to pick up changes
    cmsServerStorage.forceHydrate();

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
