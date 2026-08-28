import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  getChannelStatistics,
  getYouTubeVideoTitleMap,
  queryYouTubeAnalytics,
  YouTubeAnalyticsUpstreamError,
} from '@/lib/youtube-analytics-client';
import {
  getYouTubeStudioSnapshot,
  getYouTubeStudioLifetimeFunnel,
  type YouTubeStudioLifetimeFunnel,
} from '@/lib/youtube-studio-import';

export type MetricSource = 'youtube_analytics_api' | 'studio_csv' | 'youtube_data_api' | 'unavailable';

export interface ChannelAnalyticsSummary {
  views: number | null;
  impressions: number | null;
  impressionsCtr: number | null;
  subscribers: number | null;
  totalVideos: number | null;
  watchTimeHours: number | null;
  averageViewDurationSeconds: number | null;
  averageViewPercentage: number | null;
  lifetimeImpressions: number | null;
  lifetimeCtr: number | null;
  lifetimeRecommendationPercentage: number | null;
  lifetimeEngagedViews: number | null;
  lifetimeWatchTimeHours: number | null;
  lifetimeAvgDurationFormatted: string | null;
  lifetimePeriod: string | null;
  metricSources: {
    views: MetricSource;
    impressions: MetricSource;
    impressionsCtr: MetricSource;
    subscribers: MetricSource;
    totalVideos: MetricSource;
    watchTimeHours: MetricSource;
    averageViewDurationSeconds: MetricSource;
    averageViewPercentage: MetricSource;
    lifetimeImpressions: MetricSource;
  };
}

export interface TrafficSourceMetric {
  rank: number;
  sourceRaw: string;
  source: string;
  views: number;
  viewShare: number;
  watchTimeHours: number;
  metricSource: MetricSource;
}

export interface GeographyMetric {
  rank: number;
  countryCode: string;
  countryName: string;
  views: number;
  viewShare: number;
  watchTimeHours: number;
  averageViewDurationSeconds: number | null;
  metricSource: MetricSource;
}

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

const TRAFFIC_SOURCE_MAP: Record<string, string> = {
  BROWSE_FEATURES: 'Browse features',
  SUBSCRIBER: 'Browse features',
  SUGGESTED_VIDEOS: 'Suggested videos',
  RELATED_VIDEO: 'Suggested videos',
  YT_SEARCH: 'YouTube Search',
  SEARCH: 'YouTube Search',
  EXT_URL: 'External',
  EXTERNAL: 'External',
  CHANNEL: 'Channel pages',
  CHANNEL_PAGES: 'Channel pages',
  NO_LINK_OTHER: 'Direct or unknown',
  DIRECT: 'Direct or unknown',
  PLAYLIST: 'Playlists',
  SHORTS: 'YouTube Shorts',
  SHORTS_CAROUSEL: 'YouTube Shorts',
  NOTIFICATION: 'Notifications',
  NOTIFICATIONS: 'Notifications',
  YT_OTHER_PAGE: 'Other YouTube features',
  OTHER: 'Other YouTube features',
  END_SCREEN: 'End screens',
  CARD: 'Cards and annotations',
  SOUND_PAGE: 'Sound pages',
  VIDEO_REMIXES: 'Remixes',
  CAMPAIGN_CARD: 'Campaign cards',
};

function formatTrafficSource(raw: string): string {
  const normalized = raw.trim().toUpperCase();
  if (TRAFFIC_SOURCE_MAP[normalized]) return TRAFFIC_SOURCE_MAP[normalized];
  return raw
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function studioFallbackResponse(message: string, reconnectRequired: boolean) {
  const studio = getYouTubeStudioSnapshot();
  const lifetimeFunnel = getYouTubeStudioLifetimeFunnel();
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

  const totalViews = studio.rows.reduce((s, r) => s + (r.views ?? 0), 0);
  const totalWatchMinutes = studio.rows.reduce((s, r) => s + (r.watchTimeMinutes ?? 0), 0);
  const studioImpressions = studio.rows.reduce((s, r) => s + (r.impressions ?? 0), 0);

  const validCtrRows = studio.rows.filter(r => r.impressions !== null && r.impressions > 0 && r.ctr !== null);
  const totalImpressionWeight = validCtrRows.reduce((s, r) => s + (r.impressions ?? 0), 0);
  const weightedCtr = totalImpressionWeight > 0
    ? Number((validCtrRows.reduce((s, r) => s + ((r.impressions ?? 0) * (r.ctr ?? 0)), 0) / totalImpressionWeight).toFixed(2))
    : null;

  const validDurationRows = studio.rows.filter(r => r.views !== null && r.views > 0 && r.avgViewDurationSecs !== null);
  const totalDurationViews = validDurationRows.reduce((s, r) => s + (r.views ?? 0), 0);
  const weightedDuration = totalDurationViews > 0
    ? Math.round(validDurationRows.reduce((s, r) => s + ((r.views ?? 0) * (r.avgViewDurationSecs ?? 0)), 0) / totalDurationViews)
    : null;

  const summary: ChannelAnalyticsSummary = {
    views: totalViews,
    impressions: studioImpressions > 0 ? studioImpressions : null,
    impressionsCtr: weightedCtr,
    subscribers: null,
    totalVideos: studio.rows.length,
    watchTimeHours: totalWatchMinutes > 0 ? Number((totalWatchMinutes / 60).toFixed(1)) : null,
    averageViewDurationSeconds: weightedDuration,
    averageViewPercentage: null,
    lifetimeImpressions: lifetimeFunnel.impressions,
    lifetimeCtr: lifetimeFunnel.ctr,
    lifetimeRecommendationPercentage: lifetimeFunnel.recommendationPercentage,
    lifetimeEngagedViews: lifetimeFunnel.engagedViews,
    lifetimeWatchTimeHours: lifetimeFunnel.watchTimeHours,
    lifetimeAvgDurationFormatted: lifetimeFunnel.avgViewDurationFormatted,
    lifetimePeriod: lifetimeFunnel.period,
    metricSources: {
      views: totalViews > 0 ? 'studio_csv' : 'unavailable',
      impressions: studioImpressions > 0 ? 'studio_csv' : 'unavailable',
      impressionsCtr: weightedCtr !== null ? 'studio_csv' : 'unavailable',
      subscribers: 'unavailable',
      totalVideos: studio.rows.length > 0 ? 'studio_csv' : 'unavailable',
      watchTimeHours: totalWatchMinutes > 0 ? 'studio_csv' : 'unavailable',
      averageViewDurationSeconds: weightedDuration !== null ? 'studio_csv' : 'unavailable',
      averageViewPercentage: 'unavailable',
      lifetimeImpressions: 'studio_csv',
    },
  };

  return NextResponse.json({
    summary,
    lifetimeFunnel,
    trafficSources: [] as TrafficSourceMetric[],
    geographies: [] as GeographyMetric[],
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
  const lifetimeFunnel = getYouTubeStudioLifetimeFunnel();
  const studioByVideoId = new Map((studio?.rows ?? []).map(row => [row.videoId, row]));

  try {
    const [json, summaryJson, trafficJson, geoJson, channelStats] = await Promise.all([
      queryYouTubeAnalytics({
        dimensions: 'video',
        metrics: 'views,estimatedMinutesWatched,averageViewDuration',
        sort: '-views',
        maxResults: '200',
      }),
      queryYouTubeAnalytics({
        metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage',
      }).catch(() => null),
      queryYouTubeAnalytics({
        dimensions: 'insightTrafficSourceType',
        metrics: 'views,estimatedMinutesWatched',
        sort: '-views',
        maxResults: '5',
      }).catch(() => null),
      queryYouTubeAnalytics({
        dimensions: 'country',
        metrics: 'views,estimatedMinutesWatched,averageViewDuration',
        sort: '-views',
        maxResults: '5',
      }).catch(() => null),
      getChannelStatistics().catch(() => ({ subscriberCount: null, videoCount: null, viewCount: null })),
    ]);

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

    // Include Studio rows that are not present in the Analytics report
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

    // ── Primary Summary KPI Calculations ───────────────────────────────────────
    const sumRow = summaryJson?.rows?.[0];
    const liveTotalViews = sumRow ? Number(sumRow[0]) || 0 : data.reduce((s, r) => s + (r.views ?? 0), 0);
    const liveWatchTimeMinutes = sumRow ? Number(sumRow[1]) || 0 : data.reduce((s, r) => s + (r.watchTimeMinutes ?? 0), 0);
    const liveAvgDurationSecs = sumRow && sumRow[2] !== undefined && sumRow[2] !== null
      ? Math.round(Number(sumRow[2]))
      : (data.length > 0
          ? (() => {
              const wr = data.filter(r => r.views !== null && r.avgViewDurationSecs !== null);
              const wv = wr.reduce((s, r) => s + (r.views ?? 0), 0);
              return wv > 0 ? Math.round(wr.reduce((s, r) => s + ((r.avgViewDurationSecs ?? 0) * (r.views ?? 0)), 0) / wv) : null;
            })()
          : null);
    const liveAvgPercentage = sumRow && sumRow[3] !== undefined && sumRow[3] !== null
      ? Number(Number(sumRow[3]).toFixed(1))
      : null;

    // Impressions & CTR from Studio CSV
    const studioImpressions = studio?.rows?.reduce((s, r) => s + (r.impressions ?? 0), 0) ?? null;
    const validCtrRows = (studio?.rows ?? []).filter(r => r.impressions !== null && r.impressions > 0 && r.ctr !== null);
    const totalImpressionWeight = validCtrRows.reduce((s, r) => s + (r.impressions ?? 0), 0);
    const weightedCtr = totalImpressionWeight > 0
      ? Number((validCtrRows.reduce((s, r) => s + ((r.impressions ?? 0) * (r.ctr ?? 0)), 0) / totalImpressionWeight).toFixed(2))
      : null;

    const liveTotalVideos = channelStats.videoCount ?? (data.length > 0 ? data.length : (studio?.rows.length ?? null));
    const totalVideosSource: MetricSource = channelStats.videoCount !== null ? 'youtube_data_api' : (data.length > 0 ? (studio ? 'studio_csv' : 'youtube_analytics_api') : 'unavailable');

    const summary: ChannelAnalyticsSummary = {
      views: liveTotalViews,
      impressions: studioImpressions && studioImpressions > 0 ? studioImpressions : null,
      impressionsCtr: weightedCtr,
      subscribers: channelStats.subscriberCount,
      totalVideos: liveTotalVideos,
      watchTimeHours: liveWatchTimeMinutes > 0 ? Number((liveWatchTimeMinutes / 60).toFixed(1)) : null,
      averageViewDurationSeconds: liveAvgDurationSecs,
      averageViewPercentage: liveAvgPercentage,
      lifetimeImpressions: lifetimeFunnel.impressions,
      lifetimeCtr: lifetimeFunnel.ctr,
      lifetimeRecommendationPercentage: lifetimeFunnel.recommendationPercentage,
      lifetimeEngagedViews: lifetimeFunnel.engagedViews,
      lifetimeWatchTimeHours: lifetimeFunnel.watchTimeHours,
      lifetimeAvgDurationFormatted: lifetimeFunnel.avgViewDurationFormatted,
      lifetimePeriod: lifetimeFunnel.period,
      metricSources: {
        views: 'youtube_analytics_api',
        impressions: studioImpressions && studioImpressions > 0 ? 'studio_csv' : 'unavailable',
        impressionsCtr: weightedCtr !== null ? 'studio_csv' : 'unavailable',
        subscribers: channelStats.subscriberCount !== null ? 'youtube_data_api' : 'unavailable',
        totalVideos: totalVideosSource,
        watchTimeHours: liveWatchTimeMinutes > 0 ? 'youtube_analytics_api' : 'unavailable',
        averageViewDurationSeconds: liveAvgDurationSecs !== null ? 'youtube_analytics_api' : 'unavailable',
        averageViewPercentage: liveAvgPercentage !== null ? 'youtube_analytics_api' : 'unavailable',
        lifetimeImpressions: 'studio_csv',
      },
    };

    // ── Traffic Sources (Top 5) ────────────────────────────────────────────────
    const totalTrafficViews = (trafficJson?.rows ?? []).reduce((sum: number, r: any[]) => sum + (Number(r[1]) || 0), 0) || liveTotalViews || 1;
    const trafficSources: TrafficSourceMetric[] = (trafficJson?.rows ?? []).slice(0, 5).map((row: any[], i: number) => {
      const raw = String(row[0] || '');
      const views = Number(row[1]) || 0;
      const watchMinutes = Number(row[2]) || 0;
      return {
        rank: i + 1,
        sourceRaw: raw,
        source: formatTrafficSource(raw),
        views,
        viewShare: Number(((views / totalTrafficViews) * 100).toFixed(1)),
        watchTimeHours: Number((watchMinutes / 60).toFixed(1)),
        metricSource: 'youtube_analytics_api' as const,
      };
    });

    // ── Geographies (Top 5) ───────────────────────────────────────────────────
    let regionNames: Intl.DisplayNames | null = null;
    try {
      regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {}

    const totalGeoViews = (geoJson?.rows ?? []).reduce((sum: number, r: any[]) => sum + (Number(r[1]) || 0), 0) || liveTotalViews || 1;
    const geographies: GeographyMetric[] = (geoJson?.rows ?? []).slice(0, 5).map((row: any[], i: number) => {
      const code = String(row[0] || '').toUpperCase();
      let countryName = code;
      try {
        if (regionNames) countryName = regionNames.of(code) || code;
      } catch {
        countryName = code;
      }
      const views = Number(row[1]) || 0;
      const watchMinutes = Number(row[2]) || 0;
      const avgDur = Math.round(Number(row[3])) || null;
      return {
        rank: i + 1,
        countryCode: code,
        countryName,
        views,
        viewShare: Number(((views / totalGeoViews) * 100).toFixed(1)),
        watchTimeHours: Number((watchMinutes / 60).toFixed(1)),
        averageViewDurationSeconds: avgDur,
        metricSource: 'youtube_analytics_api' as const,
      };
    });

    return NextResponse.json({
      summary,
      lifetimeFunnel,
      trafficSources,
      geographies,
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
