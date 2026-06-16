import 'dotenv/config';
import { analyticsStorage, type AnalyticsSnapshot, type GlobalReachPayload, DEFAULT_PAYLOAD } from './analytics-storage';

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';

async function getAccessToken(): Promise<string> {
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
      console.log('[youtubeAnalyticsService] Performing live API health check (Recent Window)...');
      const token = await getAccessToken();

      // We query the last 365 days as a health check and to see recent growth
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
      const recentViews = Number(br[0]) || 0;
      const recentWatchTimeHours = br[1] ? Math.round(Number(br[1]) / 60) : 0;
      const recentAvgDurationSecs = Number(br[2]) || 0;

      // Process Traffic Sources
      const topTrafficSources = (trafficRaw.rows ?? [])
        .slice(0, 5)
        .map((row: any[]) => ({
          source: String(row[0]),
          views: Number(row[1])
        }));

      const updatedSnapshot: AnalyticsSnapshot = {
        ...current,
        status: 'active',
        lastUpdated: current.lastUpdated, // Preserve original verified timestamp
        nextRefreshAt: nextFriday.toISOString(),
        
        // 1. Institutional Source of Truth (STRICTLY PRESERVED)
        lifetimeSnapshot: current.lifetimeSnapshot || DEFAULT_PAYLOAD.lifetimeSnapshot,

        // 2. Live API Telemetry (Recent growth)
        recentAnalytics: {
          lastQueryWindow: "Last 365 Days",
          views: recentViews,
          watchTimeHours: recentWatchTimeHours,
          averageViewDurationSeconds: recentAvgDurationSecs,
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
