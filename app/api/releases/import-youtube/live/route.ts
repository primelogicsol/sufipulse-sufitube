import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { mapVideoToRelease } from '@/lib/release-mapping';
import { queryYouTubeAnalytics } from '@/lib/youtube-analytics-client';
import { getValidYTAnalyticsAccessToken } from '@/app/lib/server/youtube-analytics-oauth-store';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const streams = await youtubeService.getCompletedLiveStreams(50);
    const rows = (streams || []).map((v) => ({
      ...v,
      alreadyImported: !!cmsServerStorage.getReleaseByYoutubeId(v.id),
    }));
    return NextResponse.json({ count: rows.length, items: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch live streams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
      const resolutions = body.resolutions || {}; // { [videoId]: 'youtube' | 'cms' }
    const videoIds: string[] = Array.isArray(body.videoIds) ? body.videoIds.filter(Boolean) : [];
    if (!videoIds.length) {
      return NextResponse.json({ error: 'No videoIds provided' }, { status: 400 });
    }

    let contentTypeMap = new Map<string, string>();
    try {
      const token = await getValidYTAnalyticsAccessToken();
      if (token) {
        const res = await queryYouTubeAnalytics({
          metrics: 'views',
          dimensions: 'video,creatorContentType'
        }, token);
        if (res?.rows) {
          for (const row of res.rows) {
            contentTypeMap.set(String(row[0]), String(row[1]));
          }
        }
      }
    } catch (err) {
      console.warn('Analytics map fetch failed', err);
    }

    const toSave = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = await youtubeService.getVideosByIds(videoIds.slice(i, i + 50));
      for (const video of batch) {
        if (contentTypeMap.has(video.id)) {
          video.youtubeContentType = contentTypeMap.get(video.id);
          video.formatClassificationSource = 'youtube_analytics';
        } else {
          video.youtubeContentType = 'LIVE_STREAM';
          video.formatClassificationSource = 'inferred';
        }
        const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
        toSave.push(mapVideoToRelease(video, existing, resolutions[video.id]));
      }
    }

    const saved = cmsServerStorage.bulkSaveReleasesTransactional(toSave);
    cmsServerStorage.forceHydrate();

    // Read-back verification
    const allReleasesAfter = cmsServerStorage.getAllReleases();
    const verifiedCount = saved.filter(s => allReleasesAfter.some(r => r.id === s.id)).length;
    revalidatePath('/');
    revalidatePath('/releases');
    revalidatePath('/admin/cms-releases');

    return NextResponse.json({ importedCount: saved.length, verifiedCount, items: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to import live streams' }, { status: 500 });
  }
}
