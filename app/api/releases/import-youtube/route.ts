import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { youtubeService } from '@/lib/youtube-service';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { mapVideoToRelease } from '@/lib/release-mapping';
import type { CMSRelease } from '@/lib/cms-storage';

const MAX_CHANNEL_VIDEOS = 500;

function dedupeVideos(videos: any[]): any[] {
  const byId = new Map<string, any>();
  for (const video of videos) {
    if (video?.id && !byId.has(video.id)) byId.set(video.id, video);
  }
  return Array.from(byId.values());
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const videoIdsParam = searchParams.get('videoIds');
    const fetchAll = searchParams.get('fetchAll') === '1';

    let videos: any[] = [];

    if (videoIdsParam) {
      const ids = videoIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      for (const id of ids) {
        const video = await youtubeService.getVideoById(id);
        if (video) videos.push(video);
      }
    } else {
      const max = fetchAll
        ? MAX_CHANNEL_VIDEOS
        : Math.max(1, Math.min(Number(searchParams.get('max') || 25), MAX_CHANNEL_VIDEOS));
      videos = await youtubeService.getLatestVideos(max);
    }

    const rows = (videos || []).map((video: any) => ({
      id: video.id,
      title: video.title || video.snippet?.title,
      description: video.description || video.snippet?.description,
      thumbnailUrl:
        video.thumbnailUrl ||
        video.snippet?.thumbnails?.maxres?.url ||
        video.snippet?.thumbnails?.high?.url ||
        video.snippet?.thumbnails?.medium?.url,
      publishedDate: video.publishedDate || video.snippet?.publishedAt,
      durationSeconds: video.durationSeconds,
      durationFormatted: video.durationFormatted,
      views: video.views,
      alreadyImported: !!cmsServerStorage.getReleaseByYoutubeId(video.id),
    }));

    return NextResponse.json({
      count: rows.length,
      requestedMax: fetchAll ? MAX_CHANNEL_VIDEOS : Math.max(1, Math.min(Number(searchParams.get('max') || 25), MAX_CHANNEL_VIDEOS)),
      fetchAll,
      items: rows,
      source: 'youtube_data_api',
    });
  } catch (error: any) {
    console.error('[api/releases/import-youtube][GET]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch YouTube videos' },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    youtubeService.clearCache();
    const body = await request.json().catch(() => ({}));
    const requestedIds = Array.isArray(body.videoIds)
      ? body.videoIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];
    const mode = body.mode === 'incremental' ? 'incremental' : 'full';
    const lookbackDays = Math.max(1, Math.min(Number(body.lookbackDays || 30), 3650));
    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    let selected: any[] = [];

    if (requestedIds.length > 0) {
      for (const id of requestedIds) {
        const video = await youtubeService.getVideoById(id);
        if (video) selected.push(video);
      }
    } else {
      selected = await youtubeService.getLatestVideos(MAX_CHANNEL_VIDEOS);
    }

    selected = dedupeVideos(selected);

    if (mode === 'incremental' && requestedIds.length === 0) {
      selected = selected.filter(video => {
        const published = new Date(video.publishedDate || video.snippet?.publishedAt || 0);
        return Number.isFinite(published.getTime()) && published >= cutoff;
      });
    }

    if (selected.length === 0) {
      return NextResponse.json({
        importedCount: 0,
        imported: 0,
        count: 0,
        newCount: 0,
        updatedCount: 0,
        checkedCount: 0,
        registryCount: cmsServerStorage.getAllReleases().length,
        mode,
        source: 'youtube_data_api',
        message: mode === 'incremental'
          ? `No YouTube uploads found in the last ${lookbackDays} days.`
          : 'No YouTube videos were returned for the configured channel.',
      });
    }

    const toSave: CMSRelease[] = [];
    const diagnostics: Array<{
      youtubeId: string;
      title: string;
      action: 'created' | 'updated' | 'failed';
      error?: string;
    }> = [];

    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const video of selected) {
      try {
        const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
        const mapped = mapVideoToRelease(video, existing);

        // API-key channel sync only returns publicly accessible channel videos.
        // Keep the CMS representation aligned with the public YouTube state.
        mapped.status = 'published';
        mapped.visibility = 'public';

        if (existing) updatedCount += 1;
        else newCount += 1;

        toSave.push(mapped);
        diagnostics.push({
          youtubeId: video.id,
          title: video.title || video.snippet?.title || video.id,
          action: existing ? 'updated' : 'created',
        });
      } catch (error: any) {
        errorCount += 1;
        diagnostics.push({
          youtubeId: video?.id || 'unknown',
          title: video?.title || video?.snippet?.title || 'Unknown video',
          action: 'failed',
          error: error?.message || 'Mapping failed',
        });
      }
    }

    if (toSave.length === 0 && errorCount > 0) {
      return NextResponse.json(
        {
          error: 'All YouTube videos failed during mapping; no CMS records were changed.',
          checkedCount: selected.length,
          errorCount,
          diagnostics,
        },
        { status: 422 }
      );
    }

    const saved = cmsServerStorage.bulkSaveReleases(toSave);
    cmsServerStorage.forceHydrate();

    revalidatePath('/');
    revalidatePath('/releases');
    revalidatePath('/admin/cms-releases');
    revalidatePath('/admin/youtube-sync');

    const registryCount = cmsServerStorage.getAllReleases().length;

    return NextResponse.json({
      importedCount: saved.length,
      imported: saved.length,
      count: saved.length,
      newCount,
      updatedCount,
      errorCount,
      checkedCount: selected.length,
      registryCount,
      mode,
      lookbackDays: mode === 'incremental' ? lookbackDays : null,
      source: 'youtube_data_api',
      diagnostics,
      message: `YouTube sync complete. Checked ${selected.length}; ${newCount} created, ${updatedCount} updated, ${errorCount} failed. Registry now contains ${registryCount} releases.`,
    });
  } catch (error: any) {
    console.error('[api/releases/import-youtube][POST]', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to import YouTube videos',
        source: 'youtube_data_api',
      },
      { status: 502 }
    );
  }
}
