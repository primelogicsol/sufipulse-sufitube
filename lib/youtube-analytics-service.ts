import 'dotenv/config';
import { analyticsStorage, type AnalyticsSnapshot, type GlobalReachPayload, DEFAULT_PAYLOAD } from './analytics-storage';

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';

import { getValidYTAnalyticsAccessToken } from '@/app/lib/server/youtube-analytics-oauth-store';

async function getAccessToken(): Promise<string> {
  // First attempt: retrieved from stored OAuth tokens (e.g. from YouTube OAuth flow)
  try {
    const storedToken = await getValidYTAnalyticsAccessToken();
    if (storedToken) return storedToken;
  } catch (err) {
    console.warn('[youtubeAnalyticsService] Stored OAuth token retrieval failed, trying env vars...', err);
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_OAUTH_REFRESH_TOKEN || process.env.REFRESH_TOKEN;
  
  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [];
    if (!clientId) missing.push('YOUTUBE_CLIENT_ID');
    if (!clientSecret) missing.push('YOUTUBE_CLIENT_SECRET');
    if (!refreshToken) missing.push('YOUTUBE_REFRESH_TOKEN');
    throw new Error(`YouTube API credentials missing in environment: ${missing.join(', ')}`);
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  
  const json = await res.json();
  if (!json.access_token) {
    throw new Error(`YouTube token exchange failed: ${json.error_description || json.error || 'Unknown error'}`);
  }
  return json.access_token;
}

async function analyticsQuery(token: string, extra: Record<string, string>) {
  const endDate = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    ids: `channel==${CHANNEL_ID}`,
    startDate: '2006-01-01', // Lifetime scope as requested
    endDate,
    ...extra,
  });
  
  const res = await fetch(`${ANALYTICS_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    const errorJson = JSON.parse(errorText);
    
    // If it's a metric error, try falling back to basic metrics
    if (errorJson.error?.message?.includes('identifier')) {
       console.warn(`[youtubeAnalyticsService] Metric error, falling back to basic views/watchTime. Original error: ${errorJson.error.message}`);
       const fallbackParams = new URLSearchParams({
         ids: `channel==${CHANNEL_ID}`,
         startDate: '2006-01-01',
         endDate,
         metrics: 'views,estimatedMinutesWatched,averageViewDuration'
       });
       const fallbackRes = await fetch(`${ANALYTICS_BASE}?${fallbackParams}`, {
         headers: { Authorization: `Bearer ${token}` }
       });
       if (fallbackRes.ok) return fallbackRes.json();
    }
    
    throw new Error(`YouTube Analytics API error (${res.status}): ${errorText}`);
  }
  
  return res.json() as Promise<{ rows?: any[][], columnHeaders?: any[] }>;
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const AGE_ORDER = ['age13-17', 'age18-24', 'age25-34', 'age35-44', 'age45-54', 'age55-64', 'age65-'];
const AGE_LABEL_MAP: Record<string, string> = {
  'age13-17': '13-17',
  'age18-24': '18-24',
  'age25-34': '25-34',
  'age35-44': '35-44',
  'age45-54': '45-54',
  'age55-64': '55-64',
  'age65-':   '65+',
};

const RECOMMENDATION_SOURCES = new Set([
  'SUGGESTED_VIDEOS',
  'BROWSE_FEATURES',
  'RELATED_VIDEO',
  'SHORTS',
]);

export const youtubeAnalyticsService = {
  async getLifetimeGlobalReachAnalytics(forceRefresh = false): Promise<AnalyticsSnapshot> {
    const current = analyticsStorage.getSnapshot();
    
    // Check if we should refresh based on the Friday 3AM rule
    if (!forceRefresh && !analyticsStorage.shouldRefresh()) {
      return current;
    }

    const nextFriday = analyticsStorage.getNextFriday3AM();
    const lastCheck = new Date().toISOString();

    try {
      console.log('[youtubeAnalyticsService] Performing live API health check (Lifetime Window)...');
      const token = await getAccessToken();

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = '2006-01-01'; // Lifetime scope

      const [basicRaw, trafficRaw] = await Promise.all([
        analyticsQuery(token, {
          startDate,
          endDate,
          metrics: 'views,estimatedMinutesWatched,averageViewDuration',
        }),
        analyticsQuery(token, {
          startDate,
          endDate,
          dimensions: 'insightTrafficSourceType',
          metrics: 'views',
          sort: '-views',
          maxResults: '25',
        })
      ]);

      // Process Basic Metrics
      const br = basicRaw.rows?.[0] ?? [0, 0, 0];
      const lifetimeViews = Number(br[0]) || 0;
      const lifetimeWatchTimeHours = br[1] ? Math.round(Number(br[1]) / 60) : 0;
      const lifetimeAvgDurationSecs = Number(br[2]) || 0;

      let recommendationViews = 0;
      (trafficRaw.rows ?? []).forEach((row: any[]) => {
         const source = String(row[0]);
         const views = Number(row[1]);
         if (RECOMMENDATION_SOURCES.has(source)) {
           recommendationViews += views;
         }
      });
      const viewsPercentage = lifetimeViews > 0 ? Number(((recommendationViews / lifetimeViews) * 100).toFixed(1)) : 0;

      const topTrafficSources = (trafficRaw.rows ?? [])
        .slice(0, 5)
        .map((row: any[]) => ({
          source: String(row[0]),
          views: Number(row[1])
        }));

      const newLastUpdated = new Date().toISOString();

      const updatedSnapshot: AnalyticsSnapshot = {
        ...current,
        status: 'active',
        lastUpdated: newLastUpdated, // Fresh valid timestamp
        nextRefreshAt: nextFriday.toISOString(),
        
        // 1. Update Institutional Source of Truth with fetched lifetime data
        lifetimeSnapshot: {
          ...current.lifetimeSnapshot,
          performance: {
            ...current.lifetimeSnapshot.performance,
            views: lifetimeViews > 0 ? lifetimeViews : current.lifetimeSnapshot.performance.views,
            watchTimeHours: lifetimeWatchTimeHours > 0 ? lifetimeWatchTimeHours : current.lifetimeSnapshot.performance.watchTimeHours,
            averageViewDurationFormatted: lifetimeAvgDurationSecs > 0 ? fmtDuration(lifetimeAvgDurationSecs) : current.lifetimeSnapshot.performance.averageViewDurationFormatted,
          },
          recommendationEngine: {
            ...current.lifetimeSnapshot.recommendationEngine,
            viewsPercentage: viewsPercentage > 0 ? viewsPercentage : current.lifetimeSnapshot.recommendationEngine.viewsPercentage
          }
        },

        // 2. Live API Telemetry (Admin view)
        recentAnalytics: {
          lastQueryWindow: "Lifetime",
          views: lifetimeViews,
          watchTimeHours: lifetimeWatchTimeHours,
          averageViewDurationSeconds: lifetimeAvgDurationSecs,
          topTrafficSources
        },

        // 3. Admin / System Metadata
        apiStatus: {
          connected: true,
          lastCheck,
          availableLiveMetrics: ["views", "watchTime", "averageDuration", "trafficSource"],
          restrictedMetrics: ["impressions", "ctr", "demographics", "geography"]
        }
      };

      analyticsStorage.saveSnapshot(updatedSnapshot);
      return updatedSnapshot;

    } catch (error: any) {
      console.error('[youtubeAnalyticsService] API Health Check Failed:', error);
      
      const errorSnapshot: AnalyticsSnapshot = {
        ...current,
        status: 'error',
        errorMessage: error.message || 'Unknown refresh error',
        lastUpdated: current.lastUpdated,
        
        // Preserve verified baseline even on error
        lifetimeSnapshot: current.lifetimeSnapshot || DEFAULT_PAYLOAD.lifetimeSnapshot,
        
        apiStatus: {
          connected: false,
          lastCheck,
          availableLiveMetrics: [],
          restrictedMetrics: ["impressions", "ctr", "demographics", "geography"],
          lastError: error.message || 'Unknown refresh error'
        }
      };
      
      analyticsStorage.saveSnapshot(errorSnapshot);
      return errorSnapshot;
    }
  }
};
