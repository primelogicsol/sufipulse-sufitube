import { NextResponse } from 'next/server';
import { analyticsStorage, type AnalyticsSnapshot } from '@/lib/analytics-storage';

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error('credentials_missing');

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
  if (!json.access_token) throw new Error('token_exchange_failed');
  return json.access_token;
}

async function analyticsQuery(token: string, extra: Record<string, string>) {
  const endDate = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    ids: `channel==${CHANNEL_ID}`,
    startDate: '2020-01-01', // Lifetime scope
    endDate,
    ...extra,
  });
  const res = await fetch(`${ANALYTICS_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`analytics_${res.status}`);
  return res.json() as Promise<{ rows?: any[][] }>;
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const AGE_ORDER = ['age13-17', 'age18-24', 'age25-34', 'age35-44', 'age45-54', 'age55-64', 'age65-'];
const AGE_LABEL: Record<string, string> = {
  'age13-17': '13–17',
  'age18-24': '18–24',
  'age25-34': '25–34',
  'age35-44': '35–44',
  'age45-54': '45–54',
  'age55-64': '55–64',
  'age65-':   '65+',
};

const RECOMMENDATION_SOURCES = new Set([
  'SUGGESTED_VIDEOS',
  'BROWSE_FEATURES',
  'RELATED_VIDEO',
  'SHORTS',
]);

async function performRefresh(): Promise<AnalyticsSnapshot | null> {
  try {
    const token = await getAccessToken();

    const [discoveryRaw, trafficRaw, demographicsRaw, geoRaw] = await Promise.all([
      analyticsQuery(token, {
        metrics: 'impressions,impressionClickThroughRate,views,estimatedMinutesWatched,averageViewDuration',
      }),
      analyticsQuery(token, {
        dimensions: 'insightTrafficSourceType',
        metrics: 'views',
        sort: '-views',
        maxResults: '25',
      }),
      analyticsQuery(token, {
        dimensions: 'ageGroup,gender',
        metrics: 'viewerPercentage',
      }),
      analyticsQuery(token, {
        dimensions: 'country',
        metrics: 'views',
        maxResults: '250',
        sort: '-views',
      }),
    ]);

    const dr = discoveryRaw.rows?.[0] ?? [0, 0, 0, 0, 0];
    const impressions = Number(dr[0]);
    const ctrDecimal = Number(dr[1]);
    const ctr = Math.round(ctrDecimal * 1000) / 10;
    const viewsFromImpressions = Math.round(impressions * ctrDecimal);
    const avgDurationSecs = Number(dr[4]);
    const avgViewDuration = fmtDuration(avgDurationSecs);
    const watchTimeHours = Math.round(viewsFromImpressions * avgDurationSecs / 3600);

    let recViews = 0;
    let totalTrafficViews = 0;
    for (const row of (trafficRaw.rows ?? [])) {
      const src = String(row[0]);
      const views = Number(row[1]);
      totalTrafficViews += views;
      if (RECOMMENDATION_SOURCES.has(src)) recViews += views;
    }
    const recommendationShare = totalTrafficViews > 0
      ? Math.round((recViews / totalTrafficViews) * 1000) / 10
      : 0;

    const genderAcc: Record<string, number> = {};
    const ageAcc: Record<string, number> = {};
    for (const row of (demographicsRaw.rows ?? [])) {
      const ageKey = String(row[0]);
      const genderKey = String(row[1]);
      const pct = Number(row[2]);
      if (genderKey === 'female' || genderKey === 'male') {
        genderAcc[genderKey] = (genderAcc[genderKey] ?? 0) + pct;
      }
      if (AGE_LABEL[ageKey]) {
        ageAcc[ageKey] = (ageAcc[ageKey] ?? 0) + pct;
      }
    }

    const ageGroups: Record<string, number> = {};
    for (const key of AGE_ORDER) {
      const val = Math.round((ageAcc[key] ?? 0) * 10) / 10;
      if (val > 0) ageGroups[AGE_LABEL[key]] = val;
    }

    const genderSplit = {
      female: Math.round((genderAcc['female'] ?? 0) * 10) / 10,
      male: Math.round((genderAcc['male'] ?? 0) * 10) / 10,
    };

    const countriesReached = (geoRaw.rows ?? []).filter(r => Number(r[1]) > 0).length;

    const snapshot: AnalyticsSnapshot = {
      discovery: {
        impressions,
        ctr,
        viewsFromImpressions,
        avgViewDuration,
        watchTimeHours,
        recommendationShare,
      },
      audience: { genderSplit, ageGroups },
      geography: { countriesReached },
      lastUpdatedAt: new Date().toISOString(),
      scope: 'lifetime',
    };

    analyticsStorage.saveSnapshot(snapshot);
    return snapshot;
  } catch (e) {
    console.error('[API /api/analytics/youtube-reach] Refresh failed:', e);
    return null;
  }
}

export async function GET() {
  const current = analyticsStorage.getSnapshot();

  // Background refresh if needed
  if (analyticsStorage.shouldRefresh()) {
    // Note: In some serverless environments, this might be cut short.
    // Ideally this would be a CRON job, but here we trigger on-demand and continue.
    performRefresh();
  }

  return NextResponse.json(current);
}
