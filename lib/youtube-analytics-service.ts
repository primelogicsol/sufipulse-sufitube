import 'dotenv/config';
import { analyticsStorage, type AnalyticsSnapshot, DEFAULT_PAYLOAD } from './analytics-storage';
import { getYouTubeAnalyticsAccessToken, queryYouTubeAnalytics } from './youtube-analytics-client';

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
]);

export const youtubeAnalyticsService = {
  async getLifetimeGlobalReachAnalytics(forceRefresh = false): Promise<AnalyticsSnapshot> {
    const current = analyticsStorage.getSnapshot();

    if (!forceRefresh && !analyticsStorage.shouldRefresh()) {
      return current;
    }

    const nextFriday = analyticsStorage.getNextFriday3AM();
    const lastCheck = new Date().toISOString();

    try {
      console.log('[youtubeAnalyticsService] Performing live YouTube Analytics query (lifetime window)...');
      const token = await getYouTubeAnalyticsAccessToken();

      const [basicRaw, trafficRaw] = await Promise.all([
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
        : 0;

      const topTrafficSources = (trafficRaw.rows ?? [])
        .slice(0, 5)
        .map((row: any[]) => ({
          source: String(row[0]),
          views: Number(row[1]) || 0,
        }));

      const newLastUpdated = new Date().toISOString();
      const updatedSnapshot: AnalyticsSnapshot = {
        ...current,
        status: 'active',
        errorMessage: undefined,
        lastUpdated: newLastUpdated,
        nextRefreshAt: nextFriday.toISOString(),
        lifetimeSnapshot: {
          ...current.lifetimeSnapshot,
          performance: {
            ...current.lifetimeSnapshot.performance,
            views: lifetimeViews,
            watchTimeHours: lifetimeWatchTimeHours,
            averageViewDurationFormatted: fmtDuration(lifetimeAvgDurationSecs),
          },
          recommendationEngine: {
            ...current.lifetimeSnapshot.recommendationEngine,
            viewsPercentage,
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
          availableLiveMetrics: ['views', 'watchTime', 'averageDuration', 'trafficSource'],
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
