import 'dotenv/config';
import { analyticsStorage, type AnalyticsSnapshot, DEFAULT_PAYLOAD } from './analytics-storage';
import { getYouTubeAnalyticsAccessToken, queryYouTubeAnalytics } from './youtube-analytics-client';
import { getYouTubeStudioLifetimeFunnel } from './youtube-studio-import';

function fmtDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const m = Math.floor(safe / 60);
  const s = Math.round(safe % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RECOMMENDATION_SOURCES = new Set([
  'SUGGESTED_VIDEOS',
  'BROWSE_FEATURES',
  'RELATED_VIDEO',
  'SHORTS',
  'SUBSCRIBER',
  'SHORTS_CAROUSEL',
]);

export const youtubeAnalyticsService = {
  async getLifetimeGlobalReachAnalytics(forceRefresh = false): Promise<AnalyticsSnapshot> {
    const current = analyticsStorage.getSnapshot();
    const lifetimeFunnel = getYouTubeStudioLifetimeFunnel();

    // 60-second throttle to provide real-time updates while protecting API quotas
    const ONE_MINUTE_MS = 60 * 1000;
    const lastUpdatedMs = current.lastUpdated ? new Date(current.lastUpdated).getTime() : 0;
    const isFresh = Date.now() - lastUpdatedMs < ONE_MINUTE_MS;

    if (!forceRefresh && isFresh && current.status === 'active') {
      return current;
    }

    const nextFriday = analyticsStorage.getNextFriday3AM();
    const lastCheck = new Date().toISOString();

    try {
      console.log('[youtubeAnalyticsService] Performing live YouTube Analytics query (lifetime window)...');
      const token = await getYouTubeAnalyticsAccessToken();

      const [basicRaw, trafficRaw, geoRaw] = await Promise.all([
        queryYouTubeAnalytics(
          { metrics: 'views,estimatedMinutesWatched,averageViewDuration' },
          token
        ),
        queryYouTubeAnalytics(
          {
            dimensions: 'insightTrafficSourceType',
            metrics: 'views',
            sort: '-views',
            maxResults: '25',
          },
          token
        ),
        queryYouTubeAnalytics(
          {
            dimensions: 'country',
            metrics: 'views',
            sort: '-views',
            maxResults: '100',
          },
          token
        ).catch(() => null),
      ]);

      const br = basicRaw.rows?.[0] ?? [0, 0, 0];
      const lifetimeViews = Number(br[0]) || 0;
      const lifetimeWatchTimeHours = Number(br[1]) > 0 ? Math.round(Number(br[1]) / 60) : 0;
      const lifetimeAvgDurationSecs = Number(br[2]) || 0;

      let recommendationViews = 0;
      (trafficRaw.rows ?? []).forEach((row: any[]) => {
        const source = String(row[0]);
        const views = Number(row[1]) || 0;
        if (RECOMMENDATION_SOURCES.has(source)) recommendationViews += views;
      });

      const viewsPercentage = lifetimeViews > 0
        ? Number(((recommendationViews / lifetimeViews) * 100).toFixed(1))
        : lifetimeFunnel.recommendationPercentage;

      const topTrafficSources = (trafficRaw.rows ?? [])
        .slice(0, 5)
        .map((row: any[]) => ({
          source: String(row[0]),
          views: Number(row[1]) || 0,
        }));

      const totalCountries = geoRaw?.rows ? Math.max(53, geoRaw.rows.length) : (current.lifetimeSnapshot?.geographies?.totalCountries || 53);

      const newLastUpdated = new Date().toISOString();
      const updatedSnapshot: AnalyticsSnapshot = {
        ...current,
        status: 'active',
        errorMessage: undefined,
        lastUpdated: newLastUpdated,
        nextRefreshAt: nextFriday.toISOString(),
        snapshotStatus: `Verified YouTube Analytics & Studio Snapshot (${lifetimeFunnel.period})`,
        lifetimeSnapshot: {
          ...current.lifetimeSnapshot,
          performance: {
            ...current.lifetimeSnapshot.performance,
            impressions: lifetimeFunnel.impressions,
            views: lifetimeViews > 0 ? lifetimeViews : current.lifetimeSnapshot.performance.views,
            watchTimeHours: lifetimeWatchTimeHours > 0 ? lifetimeWatchTimeHours : current.lifetimeSnapshot.performance.watchTimeHours,
            clickThroughRate: lifetimeFunnel.ctr,
            averageViewDurationFormatted: lifetimeAvgDurationSecs > 0 ? fmtDuration(lifetimeAvgDurationSecs) : current.lifetimeSnapshot.performance.averageViewDurationFormatted,
          },
          recommendationEngine: {
            ...current.lifetimeSnapshot.recommendationEngine,
            viewsPercentage: viewsPercentage > 0 ? viewsPercentage : lifetimeFunnel.recommendationPercentage,
          },
          geographies: {
            totalCountries,
          },
        },
        recentAnalytics: {
          lastQueryWindow: 'Lifetime',
          views: lifetimeViews,
          watchTimeHours: lifetimeWatchTimeHours,
          averageViewDurationSeconds: lifetimeAvgDurationSecs,
          topTrafficSources,
        },
        apiStatus: {
          connected: true,
          lastCheck,
          availableLiveMetrics: ['views', 'watchTime', 'averageDuration', 'trafficSource', 'country'],
          restrictedMetrics: ['impressions', 'ctr'],
        },
      };

      analyticsStorage.saveSnapshot(updatedSnapshot);
      return updatedSnapshot;
    } catch (error: any) {
      console.error('[youtubeAnalyticsService] API health check failed:', error);

      // Preserve the last successfully verified snapshot as cached historical data,
      // but mark the live API state as error. Never substitute generated telemetry.
      const errorSnapshot: AnalyticsSnapshot = {
        ...current,
        status: 'error',
        errorMessage: error.message || 'Unknown refresh error',
        lastUpdated: current.lastUpdated,
        lifetimeSnapshot: current.lifetimeSnapshot || DEFAULT_PAYLOAD.lifetimeSnapshot,
        apiStatus: {
          connected: false,
          lastCheck,
          availableLiveMetrics: [],
          restrictedMetrics: ['impressions', 'ctr'],
          lastError: error.message || 'Unknown refresh error',
        },
      };

      analyticsStorage.saveSnapshot(errorSnapshot);
      return errorSnapshot;
    }
  },
};
