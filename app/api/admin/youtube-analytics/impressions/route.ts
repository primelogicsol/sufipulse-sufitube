import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  getYouTubeVideoTitleMap,
  queryYouTubeAnalytics,
  YouTubeAnalyticsUpstreamError,
} from '@/lib/youtube-analytics-client';
import { getYouTubeStudioSnapshot } from '@/lib/youtube-studio-import';

export interface VideoImpression {
  videoId: string;
  title: string;
  impressions: number | null;
  views: number | null;
  ctr: number | null;
  avgViewDurationSecs: number | null;
  watchTimeMinutes: number | null;
  source: 'youtube_analytics_api' | 'studio_csv' | 'youtube_analytics_api+studio_csv';
  metricSources: {
    views: 'youtube_analytics_api' | 'studio_csv' | 'unavailable';
    watchTime: 'youtube_analytics_api' | 'studio_csv' | 'unavailable';
    averageViewDuration: 'youtube_analytics_api' | 'studio_csv' | 'unavailable';
    impressions: 'studio_csv' | 'unavailable';
    ctr: 'studio_csv' | 'unavailable';
  };
}

function studioFallbackResponse(message: string, reconnectRequired: boolean) {
  const studio = getYouTubeStudioSnapshot();
  if (!studio || studio.rows.length === 0) return null;

  const data: VideoImpression[] = studio.rows.map(row => ({
    videoId: row.videoId,
    title: row.title || row.videoId,
    impressions: row.impressions,
    views: row.views,
    ctr: row.ctr,
    avgViewDurationSecs: row.avgViewDurationSecs,
    watchTimeMinutes: row.watchTimeMinutes,
    source: 'studio_csv',
    metricSources: {
      views: row.views !== null ? 'studio_csv' : 'unavailable',
      watchTime: row.watchTimeMinutes !== null ? 'studio_csv' : 'unavailable',
      averageViewDuration: row.avgViewDurationSecs !== null ? 'studio_csv' : 'unavailable',
      impressions: row.impressions !== null ? 'studio_csv' : 'unavailable',
      ctr: row.ctr !== null ? 'studio_csv' : 'unavailable',
    },
  }));

  return NextResponse.json({
    data,
    total: data.length,
    asOf: studio.importedAt.split('T')[0],
    source: 'studio_csv',
    provenance: {
      liveAnalytics: 'unavailable',
      studioCsvImportedAt: studio.importedAt,
      studioCsvFileName: studio.fileName,
    },
    warnings: [message, 'Serving the latest imported YouTube Studio Advanced Mode CSV. No synthetic fallback data was generated.'],
    reconnectRequired,
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const endDate = new Date().toISOString().split('T')[0];
  const studio = getYouTubeStudioSnapshot();
  const studioByVideoId = new Map((studio?.rows ?? []).map(row => [row.videoId, row]));

  try {
    const json = await queryYouTubeAnalytics({
      dimensions: 'video',
      metrics: 'views,estimatedMinutesWatched,averageViewDuration',
      sort: '-views',
      maxResults: '200',
    });

    const videoIds = (json.rows ?? []).map((row: any[]) => String(row[0]));
    const unresolvedTitleIds = videoIds.filter(id => !studioByVideoId.get(id)?.title || studioByVideoId.get(id)?.title === id);
    const { titles, warnings } = await getYouTubeVideoTitleMap(unresolvedTitleIds);

    const data: VideoImpression[] = (json.rows ?? []).map((row: any[]) => {
      const videoId = String(row[0]);
      const imported = studioByVideoId.get(videoId);
      return {
        videoId,
        title: imported?.title || titles[videoId] || videoId,
        impressions: imported?.impressions ?? null,
        views: Number(row[1]) || 0,
        watchTimeMinutes: Number(row[2]) || 0,
        ctr: imported?.ctr ?? null,
        avgViewDurationSecs: Math.round(Number(row[3])) || 0,
        source: imported ? 'youtube_analytics_api+studio_csv' : 'youtube_analytics_api',
        metricSources: {
          views: 'youtube_analytics_api',
          watchTime: 'youtube_analytics_api',
          averageViewDuration: 'youtube_analytics_api',
          impressions: imported?.impressions !== null && imported?.impressions !== undefined ? 'studio_csv' : 'unavailable',
          ctr: imported?.ctr !== null && imported?.ctr !== undefined ? 'studio_csv' : 'unavailable',
        },
      };
    });

    // Include Studio rows that are not present in the Analytics report so the imported
    // first-party catalog snapshot remains visible without inventing missing metrics.
    for (const imported of (studio?.rows ?? [])) {
      if (data.some(row => row.videoId === imported.videoId)) continue;
      data.push({
        videoId: imported.videoId,
        title: imported.title || imported.videoId,
        impressions: imported.impressions,
        views: imported.views,
        ctr: imported.ctr,
        avgViewDurationSecs: imported.avgViewDurationSecs,
        watchTimeMinutes: imported.watchTimeMinutes,
        source: 'studio_csv',
        metricSources: {
          views: imported.views !== null ? 'studio_csv' : 'unavailable',
          watchTime: imported.watchTimeMinutes !== null ? 'studio_csv' : 'unavailable',
          averageViewDuration: imported.avgViewDurationSecs !== null ? 'studio_csv' : 'unavailable',
          impressions: imported.impressions !== null ? 'studio_csv' : 'unavailable',
          ctr: imported.ctr !== null ? 'studio_csv' : 'unavailable',
        },
      });
    }

    return NextResponse.json({
      data,
      total: data.length,
      asOf: endDate,
      source: studio ? 'youtube_analytics_api+studio_csv' : 'youtube_analytics_api',
      provenance: {
        liveAnalytics: 'youtube_analytics_api',
        studioCsvImportedAt: studio?.importedAt ?? null,
        studioCsvFileName: studio?.fileName ?? null,
      },
      unavailableMetrics: studio ? [] : ['impressions', 'impressionsCtr'],
      unavailableReason: studio
        ? null
        : 'Studio thumbnail impressions and Impressions CTR are not exposed by this channel Analytics API report. Import a YouTube Studio Advanced Mode CSV for those fields.',
      warnings,
    });
  } catch (error: any) {
    if (error instanceof YouTubeAnalyticsUpstreamError) {
      console.warn('[youtube-analytics/impressions] Google API returned error status:', error.status, error.body);
      const fallback = studioFallbackResponse(
        `Live YouTube Analytics returned HTTP ${error.status}.`,
        error.status === 401 || error.status === 403
      );
      if (fallback) return fallback;

      return NextResponse.json(
        {
          error: 'youtube_analytics_api_error',
          message: 'YouTube Analytics could not be loaded and no Studio CSV snapshot is available. No synthetic fallback data was generated.',
          upstreamStatus: error.status,
          reconnectRequired: error.status === 401 || error.status === 403,
        },
        { status: 502 }
      );
    }

    const message = error?.message || 'YouTube Analytics is not connected.';
    const fallback = studioFallbackResponse(message, true);
    if (fallback) return fallback;

    return NextResponse.json(
      {
        error: 'not_connected',
        message,
        reconnectRequired: true,
      },
      { status: 401 }
    );
  }
}
