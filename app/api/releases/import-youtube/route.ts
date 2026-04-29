import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

const slugify = (value: string): string => {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'release';
};

const parseIsoDurationSeconds = (duration: string): number => {
  const normalized = String(duration || '').trim();
  const hours = Number(normalized.match(/(\d+)H/)?.[1] || 0);
  const minutes = Number(normalized.match(/(\d+)M/)?.[1] || 0);
  const seconds = Number(normalized.match(/(\d+)S/)?.[1] || 0);
  return hours * 3600 + minutes * 60 + seconds;
};

const formatSeconds = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
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

  return {
    ...(existing || {}),
    id,
    title: video.title,
    slug,
    youtubeId: video.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
    thumbnailUrl: video.thumbnailUrl,
    description: video.description || existing?.description || '',
    releaseDate: (video.publishedDate || existing?.releaseDate || now).slice(0, 10),
    durationSeconds: Number(video.durationSeconds || existing?.durationSeconds || 0),
    durationFormatted: video.durationFormatted || existing?.durationFormatted || '0:00',
    viewCount: Number(video.views || existing?.viewCount || 0),
    likeCount: Number(existing?.likeCount || 0),
    status: existing?.status || 'draft',
    contentReadinessState: existing?.contentReadinessState || 'draft',
    format: existing?.format || (Number(video.durationSeconds || existing?.durationSeconds || 0) <= 60 ? 'short' : 'video'),
    enableLyrics: existing?.enableLyrics !== false,
    enableCommentary: existing?.enableCommentary !== false,
    enableSponsors: !!existing?.enableSponsors,
    enableAdoption: existing?.enableAdoption !== false,
    enableCredits: existing?.enableCredits !== false,
    publicCommentary: existing?.publicCommentary || [
      {
        id: 'context',
        title: 'Historical Context',
        content: '',
        isPublished: true,
      },
      {
        id: 'theme',
        title: 'Thematic Interpretation',
        content: '',
        isPublished: true,
      },
    ],
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
    publishedAt: existing?.publishedAt,
  };
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

    const videos = await youtubeService.searchVideos('', max, 'date');
    const rows = (videos || []).map((video) => ({
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
    const body = await request.json().catch(() => ({}));
    const requestedIds = Array.isArray(body.videoIds) ? body.videoIds.filter(Boolean) : [];

    let selected: any[] = [];

    if (requestedIds.length) {
      // Use direct lookup for selected IDs so imports are not limited by search page size.
      const detailed: any[] = [];
      for (let i = 0; i < requestedIds.length; i += 50) {
        const batchIds = requestedIds.slice(i, i + 50);
        const batch = await youtubeService.getVideosByIds(batchIds);
        detailed.push(...batch);
      }

      selected = detailed.map((video) => {
        const parsedDuration = parseIsoDurationSeconds(video?.contentDetails?.duration || 'PT0S');
        return {
          id: video.id,
          title: video?.snippet?.title || `Video ${video.id}`,
          description: video?.snippet?.description || '',
          thumbnailUrl:
            video?.snippet?.thumbnails?.maxres?.url ||
            video?.snippet?.thumbnails?.high?.url ||
            video?.snippet?.thumbnails?.medium?.url ||
            '',
          publishedDate: video?.snippet?.publishedAt || new Date().toISOString(),
          durationSeconds: parsedDuration,
          durationFormatted: formatSeconds(parsedDuration),
          views: Number(video?.statistics?.viewCount || 0),
        };
      });
    } else {
      selected = await youtubeService.searchVideos('', 500, 'date');
    }

    if (!selected.length) {
      return NextResponse.json({ error: 'No videos selected for import' }, { status: 400 });
    }

    const imported: CMSRelease[] = [];
    // Batch: collect all mapped releases, save once per batch of 10 to avoid large single writes
    const batchSize = 10;
    for (let i = 0; i < selected.length; i += batchSize) {
      const batch = selected.slice(i, i + batchSize);
      const mappedBatch = batch.map((video) => {
        const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
        return mapVideoToRelease(video, existing);
      });
      mappedBatch.forEach((mapped) => {
        imported.push(cmsServerStorage.saveRelease(mapped));
      });
    }

    return NextResponse.json({
      importedCount: imported.length,
      items: imported,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to import YouTube videos' }, { status: 500 });
  }
}
