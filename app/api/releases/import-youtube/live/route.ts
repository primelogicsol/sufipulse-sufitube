import { NextRequest, NextResponse } from 'next/server';
import { youtubeService, inferFormat } from '@/lib/youtube-service';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

const slugify = (value: string): string =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'release';

const buildUniqueSlug = (title: string, youtubeId: string, currentId?: string): string => {
  const base = slugify(title);
  const fallback = `${base}-${youtubeId.toLowerCase()}`;
  const byBase = cmsServerStorage.getReleaseBySlug(base);
  if (!byBase || byBase.id === currentId) return base;
  const byFallback = cmsServerStorage.getReleaseBySlug(fallback);
  if (!byFallback || byFallback.id === currentId) return fallback;
  return `${fallback}-${Date.now()}`;
};

/**
 * GET /api/releases/import-youtube/live
 * Admin: fetch completed live streams from the channel.
 * Uses YouTube search eventType=completed — these videos have liveStreamingDetails
 * so they are correctly tagged as format='live' on import.
 *
 * POST /api/releases/import-youtube/live
 * Admin: import selected live stream video IDs.
 * Body: { videoIds: string[] }
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const streams = await youtubeService.getCompletedLiveStreams(50);
    const rows = streams.map((v) => ({
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
    const videoIds: string[] = Array.isArray(body.videoIds) ? body.videoIds.filter(Boolean) : [];
    if (!videoIds.length) {
      return NextResponse.json({ error: 'No videoIds provided' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const imported: CMSRelease[] = [];

    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = await youtubeService.getVideosByIds(videoIds.slice(i, i + 50));
      for (const video of batch) {
        const durationSecs = youtubeService.parseDuration(video?.contentDetails?.duration || 'PT0S');
        const hasLiveDetails = !!(video?.liveStreamingDetails?.actualStartTime || video?.liveStreamingDetails?.scheduledStartTime);
        const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
        const slug = buildUniqueSlug(video.snippet?.title || video.id, video.id, existing?.id);

        const release: CMSRelease = {
          ...(existing || {}),
          id: existing?.id || `release_${Date.now()}_${video.id}`,
          title: video.snippet?.title || video.id,
          slug,
          youtubeId: video.id,
          youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
          thumbnailUrl: video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '',
          description: video.snippet?.description || existing?.description || '',
          releaseDate: (video.snippet?.publishedAt || existing?.releaseDate || now).slice(0, 10),
          durationSeconds: durationSecs,
          durationFormatted: existing?.durationFormatted || `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`,
          viewCount: Number(video.statistics?.viewCount || existing?.viewCount || 0),
          likeCount: Number(existing?.likeCount || 0),
          status: existing?.status || 'draft',
          contentReadinessState: existing?.contentReadinessState || 'draft',
          // Admin override preserved; otherwise always 'live' since we fetched via eventType=completed
          format: existing?.format || inferFormat(durationSecs, hasLiveDetails),
          enableLyrics: existing?.enableLyrics !== false,
          enableCommentary: existing?.enableCommentary !== false,
          enableSponsors: !!existing?.enableSponsors,
          enableAdoption: existing?.enableAdoption !== false,
          enableCredits: existing?.enableCredits !== false,
          publicCommentary: existing?.publicCommentary || [],
          publicSponsorsIntro: existing?.publicSponsorsIntro || '',
          publicSponsors: existing?.publicSponsors || [],
          publicCredits: existing?.publicCredits || {},
          availableLanguages: existing?.availableLanguages || ['en', 'ur'],
          defaultLanguage: existing?.defaultLanguage || 'en',
          lyrics: existing?.lyrics || {},
          lyricsStructure: existing?.lyricsStructure || {},
          masterTimingVersion: existing?.masterTimingVersion || 1,
          subtitleCues: existing?.subtitleCues || [],
          subtitleTranslations: existing?.subtitleTranslations || {},
          subtitleLanguageStatuses: existing?.subtitleLanguageStatuses || {},
          subtitleLanguageAssignments: existing?.subtitleLanguageAssignments || {},
          subtitleCueMetadata: existing?.subtitleCueMetadata || {},
          subtitleStylePacks: existing?.subtitleStylePacks || {},
          subtitleReviewLogs: existing?.subtitleReviewLogs || [],
          youtubeSubtitleAutoSync: existing?.youtubeSubtitleAutoSync !== false,
          youtubeCaptionTracks: existing?.youtubeCaptionTracks || {},
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };

        imported.push(cmsServerStorage.saveRelease(release));
      }
    }

    return NextResponse.json({ importedCount: imported.length, items: imported });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to import live streams' }, { status: 500 });
  }
}
