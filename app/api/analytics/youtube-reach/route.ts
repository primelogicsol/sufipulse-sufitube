import { NextResponse } from 'next/server';

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';
const CACHE_TTL = 8 * 60 * 60 * 1000; // 8 hours

let _cache: { data: ReachData; at: number } | null = null;

// Real channel snapshot — used when OAuth credentials are not yet configured.
// Update these values when refreshing the static snapshot from YouTube Studio.
const STATIC_SNAPSHOT: ReachData = {
  discovery: {
    impressions: 955500,
    ctr: 8.6,
    viewsFromImpressions: 82100,
    avgViewDuration: '6:21',
    watchTimeFromImpressions: 8700, // hours
    recommendationShare: 88.1,
  },
  audience: {
    gender: { female: 43.2, male: 56.8 },
    age: {
      '13–17': 3.6,
      '18–24': 23.6,
      '25–34': 42.6,
      '35–44': 18.7,
      '45–54': 8.1,
      '55–64': 2.3,
      '65+': 1.2,
    },
  },
  geography: { countriesReached: 47 },
};

// Shape exposed to the frontend — no dates, no channel age, no raw OAuth
export interface ReachData {
  discovery: {
    impressions: number;
    ctr: number;                    // percentage, e.g. 8.6
    viewsFromImpressions: number;
    avgViewDuration: string;        // formatted "M:SS"
    watchTimeFromImpressions: number; // minutes
    recommendationShare: number;    // percentage, e.g. 88.1
  };
  audience: {
    gender: { female: number; male: number };
    age: Record<string, number>;    // "18–24": 23.6, etc.
  };
  geography: {
    countriesReached: number;
  };
}

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
    startDate: '2020-01-01', // broad window, never forwarded to client
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

// Canonical age group order as YouTube Analytics returns them
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

// Traffic sources considered part of YouTube's recommendation engine
const RECOMMENDATION_SOURCES = new Set([
  'SUGGESTED_VIDEOS',
  'BROWSE_FEATURES',
  'RELATED_VIDEO',
  'SHORTS',
]);

export async function GET() {
  if (_cache && Date.now() - _cache.at < CACHE_TTL) {
    return NextResponse.json(_cache.data);
  }

  try {
    const token = await getAccessToken();

    // Fire all 4 queries in parallel
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

    // ── Discovery ────────────────────────────────────────────────────────────
    const dr = discoveryRaw.rows?.[0] ?? [0, 0, 0, 0, 0];
    const impressions        = Number(dr[0]);
    const ctrDecimal         = Number(dr[1]);   // 0–1 from API
    const ctr                = Math.round(ctrDecimal * 1000) / 10; // → e.g. 8.6
    const viewsFromImpressions = Math.round(impressions * ctrDecimal);
    const watchMinutesTotal  = Number(dr[3]);
    const avgDurationSecs    = Number(dr[4]);
    const avgViewDuration    = fmtDuration(avgDurationSecs);
    const watchTimeFromImpressions = Math.round(viewsFromImpressions * avgDurationSecs / 3600); // hours

    // Recommendation share: views from algorithmic surfaces / total views
    let recViews = 0;
    let totalTrafficViews = 0;
    for (const row of (trafficRaw.rows ?? [])) {
      const src   = String(row[0]);
      const views = Number(row[1]);
      totalTrafficViews += views;
      if (RECOMMENDATION_SOURCES.has(src)) recViews += views;
    }
    const recommendationShare =
      totalTrafficViews > 0
        ? Math.round((recViews / totalTrafficViews) * 1000) / 10
        : 0;

    // ── Demographics ─────────────────────────────────────────────────────────
    const genderAcc: Record<string, number> = {};
    const ageAcc: Record<string, number>    = {};

    for (const row of (demographicsRaw.rows ?? [])) {
      const ageKey    = String(row[0]);
      const genderKey = String(row[1]);
      const pct       = Number(row[2]);

      // Skip unknown/user-specified gender
      if (genderKey === 'female' || genderKey === 'male') {
        genderAcc[genderKey] = (genderAcc[genderKey] ?? 0) + pct;
      }
      // Skip unknown age groups; skip any that are effectively 0
      if (AGE_LABEL[ageKey]) {
        ageAcc[ageKey] = (ageAcc[ageKey] ?? 0) + pct;
      }
    }

    const age: Record<string, number> = {};
    for (const key of AGE_ORDER) {
      const val = Math.round((ageAcc[key] ?? 0) * 10) / 10;
      if (val > 0) age[AGE_LABEL[key]] = val;
    }

    const gender = {
      female: Math.round((genderAcc['female'] ?? 0) * 10) / 10,
      male:   Math.round((genderAcc['male']   ?? 0) * 10) / 10,
    };

    // ── Geography ────────────────────────────────────────────────────────────
    const countriesReached = (geoRaw.rows ?? []).filter(r => Number(r[1]) > 0).length;

    const data: ReachData = {
      discovery: {
        impressions,
        ctr,
        viewsFromImpressions,
        avgViewDuration,
        watchTimeFromImpressions,
        recommendationShare,
      },
      audience: { gender, age },
      geography: { countriesReached },
    };

    _cache = { data, at: Date.now() };
    return NextResponse.json(data);
  } catch (e: any) {
    if (e.message === 'credentials_missing') {
      return NextResponse.json(STATIC_SNAPSHOT);
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
