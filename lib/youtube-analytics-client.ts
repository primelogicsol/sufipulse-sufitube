import { getValidYTAnalyticsAccessToken } from '@/app/lib/server/youtube-analytics-oauth-store';

export const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
export const YOUTUBE_ANALYTICS_START_DATE = process.env.YOUTUBE_ANALYTICS_START_DATE || '2006-01-01';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';

export type YouTubeAnalyticsResponse = {
  rows?: unknown[][];
  columnHeaders?: Array<{ name?: string; columnType?: string; dataType?: string }>;
};

export class YouTubeAnalyticsUpstreamError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`YouTube Analytics API error (${status})`);
    this.name = 'YouTubeAnalyticsUpstreamError';
    this.status = status;
    this.body = body;
  }
}

async function exchangeEnvironmentRefreshToken(): Promise<string | null> {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_OAUTH_REFRESH_TOKEN || process.env.REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`YouTube token exchange failed: ${json.error_description || json.error || 'Unknown error'}`);
  }

  return String(json.access_token);
}

export async function getYouTubeAnalyticsAccessToken(): Promise<string> {
  try {
    const storedToken = await getValidYTAnalyticsAccessToken();
    if (storedToken) return storedToken;
  } catch (error) {
    console.warn('[youtube-analytics-client] Stored OAuth token refresh failed; checking environment fallback.', error);
  }

  const envToken = await exchangeEnvironmentRefreshToken();
  if (envToken) return envToken;

  throw new Error('YouTube Analytics OAuth is not connected. Configure OAuth credentials and authorize the channel account.');
}

export async function queryYouTubeAnalytics(
  extra: Record<string, string>,
  token?: string
): Promise<YouTubeAnalyticsResponse> {
  const accessToken = token || await getYouTubeAnalyticsAccessToken();
  const endDate = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    ids: `channel==${YOUTUBE_CHANNEL_ID}`,
    startDate: YOUTUBE_ANALYTICS_START_DATE,
    endDate,
    ...extra,
  });

  const res = await fetch(`${ANALYTICS_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new YouTubeAnalyticsUpstreamError(res.status, body);
  }

  return res.json() as Promise<YouTubeAnalyticsResponse>;
}

export async function getYouTubeVideoTitleMap(videoIds: string[]): Promise<{
  titles: Record<string, string>;
  warnings: string[];
}> {
  const titles: Record<string, string> = {};
  const warnings: string[] = [];
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (videoIds.length === 0) return { titles, warnings };
  if (!apiKey) {
    warnings.push('YouTube Data API key is not configured, so video titles could not be resolved.');
    return { titles, warnings };
  }

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(',');
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${batch}&key=${apiKey}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      warnings.push(`YouTube Data API title lookup failed for batch starting at index ${i}.`);
      continue;
    }

    const json = await res.json();
    for (const item of (json.items ?? [])) {
      if (item?.id) titles[item.id] = item.snippet?.title ?? item.id;
    }
  }

  return { titles, warnings };
}

export interface ChannelStatistics {
  subscriberCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
}

export async function getChannelStatistics(): Promise<ChannelStatistics> {
  const channelId = YOUTUBE_CHANNEL_ID;
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  try {
    const accessToken = await getYouTubeAnalyticsAccessToken().catch(() => null);
    if (accessToken) {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const stats = json.items?.[0]?.statistics;
        return {
          subscriberCount: stats?.subscriberCount !== undefined ? Number(stats.subscriberCount) : null,
          videoCount: stats?.videoCount !== undefined ? Number(stats.videoCount) : null,
          viewCount: stats?.viewCount !== undefined ? Number(stats.viewCount) : null,
        };
      }
    }
  } catch {}

  if (apiKey) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const stats = json.items?.[0]?.statistics;
        return {
          subscriberCount: stats?.subscriberCount !== undefined ? Number(stats.subscriberCount) : null,
          videoCount: stats?.videoCount !== undefined ? Number(stats.videoCount) : null,
          viewCount: stats?.viewCount !== undefined ? Number(stats.viewCount) : null,
        };
      }
    } catch {}
  }

  return { subscriberCount: null, videoCount: null, viewCount: null };
}

export async function getChannelSubscriberCount(): Promise<number | null> {
  const stats = await getChannelStatistics();
  return stats.subscriberCount;
}
