import { getYouTubeConnection, CANONICAL_CHANNEL_ID } from './youtube-connection';

export const YOUTUBE_CHANNEL_ID = CANONICAL_CHANNEL_ID;
export const YOUTUBE_ANALYTICS_START_DATE = process.env.YOUTUBE_ANALYTICS_START_DATE || '2006-01-01';

const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';

export type YouTubeAnalyticsResponse = {
  rows?: unknown[][];
  columnHeaders?: Array<{ name?: string; columnType?: string; dataType?: string }>;
};

export class YouTubeAnalyticsUpstreamError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    let parsedBody = body;
    try {
      const json = JSON.parse(body);
      if (json.error && json.error.message) {
        parsedBody = json.error.message;
      }
    } catch (e) {}
    super(`YouTube Analytics API error (${status}): ${parsedBody}`);
    this.name = 'YouTubeAnalyticsUpstreamError';
    this.status = status;
    this.body = body;
  }
}

export async function getYouTubeAnalyticsAccessToken(): Promise<string> {
  const yt = await getYouTubeConnection();
  const token = await yt.getAccessToken();
  if (token) return token;
  throw new Error('YouTube Analytics OAuth is not connected. Configure OAuth credentials and authorize the channel account.');
}

export async function queryYouTubeAnalytics(
  extra: Record<string, string>,
  token?: string
): Promise<YouTubeAnalyticsResponse> {
  const yt = await getYouTubeConnection();
  // Ensure we fail cleanly if neither token is provided
  const hasToken = token || await yt.getAccessToken();
  if (!hasToken) {
    throw new Error('YouTube Analytics OAuth is not connected.');
  }

  const endDate = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    ids: `channel==${YOUTUBE_CHANNEL_ID}`,
    startDate: YOUTUBE_ANALYTICS_START_DATE,
    endDate,
    ...extra,
  });

  const res = await yt.fetch(`${ANALYTICS_BASE}?${params}`, {
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
  const yt = await getYouTubeConnection();

  if (videoIds.length === 0) return { titles, warnings };

  // Note: yt.fetch will try OAuth first, then API key.
  const hasAuth = await yt.getAccessToken() || yt.getApiKey();
  if (!hasAuth) {
    warnings.push('YouTube API connection is not configured, so video titles could not be resolved.');
    return { titles, warnings };
  }

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(',');
    // No need to inject &key= manually here, yt.fetch injects it safely if needed.
    const res = await yt.fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${batch}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      let parsedErr = errTxt.substring(0, 100);
      try {
        const j = JSON.parse(errTxt);
        if (j.error && j.error.message) parsedErr = j.error.message;
      } catch (e) {}
      warnings.push(`YouTube Data API title lookup failed (Status ${res.status}): ${parsedErr}`);
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
  const yt = await getYouTubeConnection();
  const hasAuth = await yt.getAccessToken() || yt.getApiKey();
  
  if (!hasAuth) {
    return { subscriberCount: null, videoCount: null, viewCount: null };
  }

  try {
    const res = await yt.fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${YOUTUBE_CHANNEL_ID}`, {
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

  return { subscriberCount: null, videoCount: null, viewCount: null };
}

export async function getChannelSubscriberCount(): Promise<number | null> {
  const stats = await getChannelStatistics();
  return stats.subscriberCount;
}
