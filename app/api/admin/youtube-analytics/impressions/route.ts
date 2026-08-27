import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getValidYTAnalyticsAccessToken } from '@/app/lib/server/youtube-analytics-oauth-store';

const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
const START_DATE = process.env.YOUTUBE_ANALYTICS_START_DATE || '2006-01-01';

export interface VideoImpression {
  videoId: string;
  title: string;
  impressions: number | null;
  views: number;
  ctr: number | null;
  avgViewDurationSecs: number;
  watchTimeMinutes: number;
  source: 'youtube_analytics_api';
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const token = await getValidYTAnalyticsAccessToken();
  if (!token) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  const endDate = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    ids: `channel==${CHANNEL_ID}`,
    startDate: START_DATE,
    endDate,
    dimensions: 'video',
    metrics: 'views,estimatedMinutesWatched,averageViewDuration',
    sort: '-views',
    maxResults: '200',
  });

  const res = await fetch(`${ANALYTICS_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    console.warn('[youtube-analytics/impressions] Google API returned error status:', res.status, body);

    return NextResponse.json(
      {
        error: 'youtube_analytics_api_error',
        message: 'YouTube Analytics could not be loaded. No synthetic fallback data was generated.',
        upstreamStatus: res.status,
        reconnectRequired: res.status === 401 || res.status === 403,
      },
      { status: 502 }
    );
  }

  const json = await res.json() as { rows?: any[][] };
  const videoIds = (json.rows ?? []).map((r: any[]) => r[0] as string);
  const titleMap: Record<string, string> = {};
  const warnings: string[] = [];

  if (videoIds.length > 0) {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      warnings.push('YOUTUBE_API_KEY is not configured, so video titles could not be resolved.');
    } else {
      for (let i = 0; i < videoIds.length; i += 50) {
        const batch = videoIds.slice(i, i + 50).join(',');
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${batch}&key=${apiKey}`,
          { cache: 'no-store' }
        );

        if (!vRes.ok) {
          warnings.push(`YouTube Data API title lookup failed for batch starting at index ${i}.`);
          continue;
        }

        const vJson = await vRes.json();
        for (const item of (vJson.items ?? [])) {
          titleMap[item.id] = item.snippet?.title ?? item.id;
        }
      }
    }
  }

  const data: VideoImpression[] = (json.rows ?? []).map((row: any[]) => ({
    videoId: String(row[0]),
    title: titleMap[String(row[0])] ?? String(row[0]),
    impressions: null,
    views: Number(row[1]) || 0,
    watchTimeMinutes: Number(row[2]) || 0,
    ctr: null,
    avgViewDurationSecs: Math.round(Number(row[3])) || 0,
    source: 'youtube_analytics_api',
  }));

  return NextResponse.json({
    data,
    total: data.length,
    asOf: endDate,
    source: 'youtube_analytics_api',
    unavailableMetrics: ['impressions', 'impressionsCtr'],
    unavailableReason: 'Studio thumbnail impressions and Impressions CTR are not exposed by this channel Analytics API report. Import a YouTube Studio Advanced Mode CSV for those fields.',
    warnings,
  });
}
