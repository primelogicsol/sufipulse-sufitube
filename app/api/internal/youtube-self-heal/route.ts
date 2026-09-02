import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { mapVideoToRelease } from '@/lib/release-mapping';
import {
  fetchReadOnlyYouTubeChannelVideos,
  YouTubeDataApiReadError,
} from '@/lib/youtube-data-api-readonly';
import { upsertYouTubeReleaseCandidates } from '@/lib/youtube-release-candidates';
import type { CMSRelease } from '@/lib/cms-storage';

const MAX_CHANNEL_VIDEOS = 500;
const TOKEN_PREFIX = 'sufipulse-youtube-self-heal:v1:';

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function deriveExpectedToken(): string | null {
  const seed = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!seed) return null;
  return createHash('sha256').update(`${TOKEN_PREFIX}${seed}`).digest('hex');
}

function isAuthorized(request: NextRequest): boolean {
  const expected = deriveExpectedToken();
  const supplied = request.headers.get('x-sufipulse-self-heal-token')?.trim() || '';
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
  } catch {
    return false;
  }
}

function liveThumbnail(video: any): string {
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

function changedPackagingFields(existing: CMSRelease, video: any): string[] {
  const changed: string[] = [];
  const nextTitle = video.title || video.snippet?.title || '';
  const nextDescription = video.description || video.snippet?.description || '';
  const nextThumbnail = liveThumbnail(video);

  if (normalizeText(existing.youtubeTitle || '') !== normalizeText(nextTitle)) changed.push('title');
  if (normalizeText(existing.youtubeDescription || '') !== normalizeText(nextDescription)) changed.push('description');
  if (normalizeText((existing as any).youtubeThumbnailUrl || '') !== normalizeText(nextThumbnail)) changed.push('thumbnail');

  return changed;
}

function shouldFollowYouTubeThumbnail(existing: CMSRelease): boolean {
  const canonical = normalizeText((existing as any).canonicalThumbnail || '');
  const display = normalizeText((existing as any).thumbnailUrl || '');
  const priorYoutube = normalizeText((existing as any).youtubeThumbnailUrl || '');

  if (!canonical && !display) return true;
  if (priorYoutube && (canonical === priorYoutube || display === priorYoutube)) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!deriveExpectedToken()) {
    console.error('[youtube-self-heal] YOUTUBE_REFRESH_TOKEN is not configured');
    return NextResponse.json({ error: 'Self-heal authentication is not configured' }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const live = await fetchReadOnlyYouTubeChannelVideos(MAX_CHANNEL_VIDEOS);
    const videos = Array.isArray(live.videos) ? live.videos : [];
    const cmsReleases = cmsServerStorage.getAllReleases();
    const byYoutubeId = new Map<string, CMSRelease>();

    for (const release of cmsReleases) {
      if (release.youtubeId && !byYoutubeId.has(release.youtubeId)) {
        byYoutubeId.set(release.youtubeId, release);
      }
    }

    const toSave: CMSRelease[] = [];
    const changed: Array<{
      youtubeId: string;
      releaseId: string;
      fields: string[];
      title: string;
    }> = [];
    const newCandidates: Array<{
      youtubeId: string;
      title: string;
      description: string;
      thumbnailUrl?: string;
      publishedDate?: string;
      durationSeconds?: number;
      durationFormatted?: string;
      views?: number;
    }> = [];
    let matched = 0;

    for (const video of videos) {
      if (!video?.id) continue;
      const existing = byYoutubeId.get(video.id);

      if (!existing) {
        newCandidates.push({
          youtubeId: video.id,
          title: video.title || video.snippet?.title || video.id,
          description: video.description || video.snippet?.description || '',
          thumbnailUrl: liveThumbnail(video) || undefined,
          publishedDate: video.publishedDate || video.snippet?.publishedAt,
          durationSeconds: video.durationSeconds,
          durationFormatted: video.durationFormatted,
          views: video.views,
        });
        continue;
      }

      matched += 1;
      const fields = changedPackagingFields(existing, video);
      if (fields.length === 0) continue;

      const mapped = mapVideoToRelease(video, existing);
      const nextThumbnail = liveThumbnail(video);
      if (fields.includes('thumbnail') && nextThumbnail && shouldFollowYouTubeThumbnail(existing)) {
        (mapped as any).thumbnailUrl = nextThumbnail;
        (mapped as any).canonicalThumbnail = nextThumbnail;
      }

      toSave.push(mapped);
      changed.push({
        youtubeId: video.id,
        releaseId: existing.id,
        fields,
        title: mapped.canonicalTitle || mapped.title || video.title || video.id,
      });
    }

    if (newCandidates.length > 0) {
      upsertYouTubeReleaseCandidates(newCandidates);
    }

    if (toSave.length > 0) {
      cmsServerStorage.bulkSaveReleasesTransactional(toSave);
      cmsServerStorage.forceHydrate();

      revalidatePath('/');
      revalidatePath('/releases');
      revalidatePath('/sitemap.xml');
      for (const item of changed) {
        const release = cmsServerStorage.getRelease(item.releaseId);
        if (release?.slug) revalidatePath(`/release-detail/${release.slug}`);
        revalidatePath(`/release-metadata/${item.youtubeId}`);
        revalidatePath(`/api/releases/youtube/${item.youtubeId}`);
      }
    }

    return NextResponse.json({
      ok: true,
      checkedYouTube: videos.length,
      matchedCms: matched,
      updated: toSave.length,
      unchanged: Math.max(0, matched - toSave.length),
      pendingApprovalDetected: newCandidates.length,
      candidates: newCandidates.map((item) => ({ youtubeId: item.youtubeId, title: item.title })),
      changed,
      source: 'youtube_data_api',
      credentialMode: live.credentialMode,
      completedAt: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error: unknown) {
    console.error('[youtube-self-heal]', error);
    if (error instanceof YouTubeDataApiReadError) {
      return NextResponse.json({
        error: error.message,
        reason: error.reason,
        reconnectRequired: error.reconnectRequired,
        source: 'youtube_data_api',
      }, { status: error.status >= 400 && error.status <= 599 ? error.status : 502 });
    }
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'YouTube metadata self-heal failed',
      source: 'youtube_data_api',
    }, { status: 502 });
  }
}
