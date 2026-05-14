import { analyticsStorage, type AnalyticsSnapshot, type GlobalReachPayload } from './analytics-storage';

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_OAUTH_REFRESH_TOKEN;
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('YouTube API credentials missing in environment (CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN)');
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

    try {
      console.log('[youtubeAnalyticsService] Refreshing lifetime analytics from YouTube...');
      const token = await getAccessToken();

      const [discoveryRaw, trafficRaw, demographicsRaw, geoRaw] = await Promise.all([
        // Performance query
        analyticsQuery(token, {
          metrics: 'impressions,impressionClickThroughRate,views,estimatedMinutesWatched,averageViewDuration',
        }),
        // Recommendation / Traffic query
        analyticsQuery(token, {
          dimensions: 'insightTrafficSourceType',
          metrics: 'views',
          sort: '-views',
          maxResults: '50',
        }),
        // Demographics query
        analyticsQuery(token, {
          dimensions: 'ageGroup,gender',
          metrics: 'viewerPercentage',
        }),
        // Geographies query
        analyticsQuery(token, {
          dimensions: 'country',
          metrics: 'views',
          maxResults: '200',
          sort: '-views',
        }),
      ]);

      // 1. Process Performance
      const dr = discoveryRaw.rows?.[0] ?? [0, 0, 0, 0, 0];
      const impressions = Number(dr[0]) || null;
      const ctrDecimal = Number(dr[1]) || 0;
      const ctr = impressions ? Math.round(ctrDecimal * 1000) / 10 : null;
      const views = Number(dr[2]) || null;
      const avgDurationSecs = Number(dr[4]) || null;
      const avgViewDurationFormatted = avgDurationSecs ? fmtDuration(avgDurationSecs) : null;
      const watchTimeHours = dr[3] ? Math.round(Number(dr[3]) / 60) : null;

      // 2. Process Recommendation Engine
      let recViews = 0;
      let totalTrafficViews = 0;
      for (const row of (trafficRaw.rows ?? [])) {
        const src = String(row[0]);
        const v = Number(row[1]);
        totalTrafficViews += v;
        if (RECOMMENDATION_SOURCES.has(src)) recViews += v;
      }
      const viewsPercentage = totalTrafficViews > 0
        ? Math.round((recViews / totalTrafficViews) * 1000) / 10
        : null;

      // 3. Process Demographics (Age & Gender)
      const genderAcc: Record<string, number> = { female: 0, male: 0 };
      const ageAcc: Record<string, number> = {};
      
      for (const row of (demographicsRaw.rows ?? [])) {
        const ageKey = String(row[0]);
        const genderKey = String(row[1]);
        const pct = Number(row[2]);
        
        if (genderKey === 'female' || genderKey === 'male') {
          genderAcc[genderKey] += pct;
        }
        if (AGE_LABEL_MAP[ageKey]) {
          ageAcc[ageKey] = (ageAcc[ageKey] ?? 0) + pct;
        }
      }

      const ageGroups = AGE_ORDER.map(key => ({
        ageGroup: AGE_LABEL_MAP[key],
        percentage: ageAcc[key] ? Math.round(ageAcc[key] * 10) / 10 : null
      }));

      const genderSplit = {
        female: genderAcc.female ? Math.round(genderAcc.female * 10) / 10 : null,
        male: genderAcc.male ? Math.round(genderAcc.male * 10) / 10 : null,
      };

      // 4. Process Geographies
      const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const countries = (geoRaw.rows ?? [])
        .filter(r => Number(r[1]) > 0)
        .map(r => {
          const code = String(r[0]);
          let name = code;
          try { name = countryNames.of(code) || code; } catch { /* fallback to code */ }
          return {
            code,
            name,
            views: Number(r[1])
          };
        });

      const nextFriday = analyticsStorage.getNextFriday3AM();

      const snapshot: AnalyticsSnapshot = {
        period: "lifetime",
        title: "SufiPulse Global Reach",
        subtitle: "Lifetime audience intelligence from the official SufiPulse SufiTube channel, updated from the latest verified YouTube Analytics snapshot.",
        ageGender: {
          gender: genderSplit,
          ageGroups
        },
        performance: {
          impressions,
          views,
          watchTimeHours,
          clickThroughRate: ctr,
          averageViewDurationSeconds: avgDurationSecs,
          averageViewDurationFormatted: avgViewDurationFormatted
        },
        recommendationEngine: {
          viewsPercentage,
          label: "views driven by the recommendation engine"
        },
        geographies: {
          totalCountries: countries.length,
          countries
        },
        lastUpdated: new Date().toISOString(),
        nextRefreshAt: nextFriday.toISOString(),
        checkedAt: new Date().toISOString(),
        scope: 'lifetime'
      };

      // Only save if we actually got real data (at least views should be > 0)
      if (snapshot.performance.views && snapshot.performance.views > 0) {
        snapshot.status = 'active';
        snapshot.errorMessage = undefined;
        analyticsStorage.saveSnapshot(snapshot);
      } else {
        console.warn('[youtubeAnalyticsService] Fetched data seems empty or invalid, skipping save.');
      }

      return snapshot;

    } catch (error: any) {
      console.error('[youtubeAnalyticsService] Failed to fetch analytics:', error);
      
      const current = analyticsStorage.getSnapshot();
      const errorSnapshot: AnalyticsSnapshot = {
        ...current,
        status: 'error',
        errorMessage: error.message || 'Unknown refresh error',
        checkedAt: new Date().toISOString()
      };
      
      // Save the error state so admins know why it's failing
      analyticsStorage.saveSnapshot(errorSnapshot);
      
      return errorSnapshot;
    }
  }
};
