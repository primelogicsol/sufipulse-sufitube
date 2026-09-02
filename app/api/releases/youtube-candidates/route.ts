import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { mapVideoToRelease } from '@/lib/release-mapping';
import {
  fetchReadOnlyYouTubeChannelVideos,
  fetchReadOnlyYouTubeVideosByIds,
} from '@/lib/youtube-data-api-readonly';
import {
  readYouTubeReleaseCandidates,
  removeYouTubeReleaseCandidate,
  upsertYouTubeReleaseCandidates,
} from '@/lib/youtube-release-candidates';

const MAX_CHANNEL_VIDEOS = 500;

function thumbnailFor(video: any): string {
  return String(
    video.thumbnailUrl ||
      video.snippet?.thumbnails?.maxres?.url ||
      video.snippet?.thumbnails?.standard?.url ||
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.medium?.url ||
      video.snippet?.thumbnails?.default?.url ||
      ''
  ).trim();
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const pending = readYouTubeReleaseCandidates().filter(
    (candidate) => !cmsServerStorage.getReleaseByYoutubeId(candidate.youtubeId),
  );

  return NextResponse.json(
    { items: pending, count: pending.length },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));

    if (body.action === 'scan') {
      const live = await fetchReadOnlyYouTubeChannelVideos(MAX_CHANNEL_VIDEOS);
      const videos = Array.isArray(live.videos) ? live.videos : [];
      const candidates = videos
        .filter((video: any) => video?.id && !cmsServerStorage.getReleaseByYoutubeId(video.id))
        .map((video: any) => ({
          youtubeId: video.id,
          title: video.title || video.snippet?.title || video.id,
          description: video.description || video.snippet?.description || '',
          thumbnailUrl: thumbnailFor(video) || undefined,
          publishedDate: video.publishedDate || video.snippet?.publishedAt,
          durationSeconds: video.durationSeconds,
          durationFormatted: video.durationFormatted,
          views: video.views,
        }));

      if (candidates.length > 0) upsertYouTubeReleaseCandidates(candidates);

      const pending = readYouTubeReleaseCandidates().filter(
        (candidate) => !cmsServerStorage.getReleaseByYoutubeId(candidate.youtubeId),
      );

      revalidatePath('/admin/youtube-release-candidates');
      return NextResponse.json({
        ok: true,
        scanned: videos.length,
        detected: candidates.length,
        pending: pending.length,
        items: pending,
        source: 'youtube_data_api',
        credentialMode: live.credentialMode,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    const youtubeId = String(body.youtubeId || '').trim();
    if (!youtubeId) {
      return NextResponse.json({ error: 'youtubeId is required' }, { status: 400 });
    }

    const existing = cmsServerStorage.getReleaseByYoutubeId(youtubeId);
    if (existing) {
      removeYouTubeReleaseCandidate(youtubeId);
      return NextResponse.json({ ok: true, alreadyApproved: true, release: existing });
    }

    const live = await fetchReadOnlyYouTubeVideosByIds([youtubeId]);
    const video = live.videos?.find((item: any) => item?.id === youtubeId);
    if (!video) {
      return NextResponse.json({ error: 'Video could not be retrieved from YouTube' }, { status: 404 });
    }

    const release = mapVideoToRelease(video, null);
    release.status = 'published';
    release.visibility = 'public';
    release.source = 'youtube';

    const saved = cmsServerStorage.bulkSaveReleasesTransactional([release]);
    cmsServerStorage.forceHydrate();
    const approved = saved[0] || cmsServerStorage.getReleaseByYoutubeId(youtubeId);

    removeYouTubeReleaseCandidate(youtubeId);

    revalidatePath('/releases');
    revalidatePath('/admin/cms-releases');
    revalidatePath('/admin/youtube-release-candidates');
    revalidatePath(`/release-metadata/${youtubeId}`);
    if (approved?.slug) revalidatePath(`/release-detail/${approved.slug}`);

    return NextResponse.json({
      ok: true,
      approved: true,
      release: approved,
      source: 'youtube_data_api',
      credentialMode: live.credentialMode,
    });
  } catch (error: unknown) {
    console.error('[youtube-candidates][POST]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'YouTube candidate operation failed' },
      { status: 500 },
    );
  }
}
