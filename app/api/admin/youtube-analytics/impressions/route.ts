import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getValidYTAnalyticsAccessToken } from '@/app/lib/server/youtube-analytics-oauth-store';

const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';

export interface VideoImpression {
  videoId: string;
  title: string;
  impressions: number;
  views: number;
  ctr: number;
  avgViewDurationSecs: number;
  watchTimeMinutes: number;
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
    startDate: '2020-01-01',
    endDate,
    dimensions: 'video',
    metrics: 'impressions,views,estimatedMinutesWatched,impressionClickThroughRate,averageViewDuration',
    sort: '-impressions',
    maxResults: '200',
  });

  const res = await fetch(`${ANALYTICS_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[youtube-analytics/impressions]', res.status, body);
    return NextResponse.json({ error: `analytics_${res.status}` }, { status: res.status });
  }

  const json = await res.json() as { rows?: any[][] };

  // Fetch video titles from YouTube Data API
  const videoIds = (json.rows ?? []).map((r: any[]) => r[0] as string);
  const titleMap: Record<string, string> = {};

  if (videoIds.length > 0) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    // Batch in groups of 50 (API limit)
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50).join(',');
      const vRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${batch}&key=${apiKey}`
      );
      if (vRes.ok) {
        const vJson = await vRes.json();
        for (const item of (vJson.items ?? [])) {
          titleMap[item.id] = item.snippet.title;
        }
      }
    }
  }

  const data: VideoImpression[] = (json.rows ?? []).map((row: any[]) => ({
    videoId: row[0],
    title: titleMap[row[0]] ?? row[0],
    impressions: Number(row[1]),
    views: Number(row[2]),
    watchTimeMinutes: Number(row[3]),
    ctr: Math.round(Number(row[4]) * 1000) / 10,
    avgViewDurationSecs: Math.round(Number(row[5])),
  }));

  return NextResponse.json({ data, total: data.length, asOf: endDate });
}
