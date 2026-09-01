import 'server-only';
import {
  getValidYTAnalyticsAccessToken,
  hasYTAnalyticsRefreshCredential,
} from '@/app/lib/server/youtube-analytics-oauth-store';

export type YouTubeReadCredentialMode = 'youtube-oauth-client' | 'server-api-key';

export type ReadOnlyYouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedDate: string;
  durationSeconds: number;
  durationFormatted: string;
  views: number;
  likes?: number;
  comments?: number;
  liveBroadcastContent?: string;
  
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
  captionsAvailable?: boolean;
  captionTracks?: any[];
  recordingDate?: string;
  categoryId?: string;
  categoryName?: string;
  license?: string;
  privacyStatus?: string;
  embeddable?: boolean;
  licensedContent?: boolean;
  regionRestriction?: any;
  channelId?: string;
  channelTitle?: string;
  channelUrl?: string;
  fetchedAt?: string;

  source: 'youtube';
  format: 'video' | 'short' | 'live';
};

type ReadCredential = {
  mode: YouTubeReadCredentialMode;
  value: string;
};

type YouTubeThumbnail = { url?: string };
type YouTubeApiItem = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    channelId?: string;
    liveBroadcastContent?: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
    categoryId?: string;
    channelTitle?: string;
    thumbnails?: {
      maxres?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
    };
  };
  contentDetails?: {
    duration?: string;
    videoId?: string;
    caption?: string;
    licensedContent?: boolean;
    regionRestriction?: any;
    relatedPlaylists?: { uploads?: string };
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  
  status?: {
    license?: string;
    privacyStatus?: string;
    embeddable?: boolean;
  };
  recordingDetails?: {
    recordingDate?: string;
  };

  liveStreamingDetails?: {
    actualStartTime?: string;
    scheduledStartTime?: string;
  };
};

type YouTubeApiPayload = {
  items?: YouTubeApiItem[];
  nextPageToken?: string;
  error?: {
    errors?: Array<{ reason?: string }>;
    status?: string;
    message?: string;
  };
  error_description?: string;
  raw?: string;
};

export class YouTubeDataApiReadError extends Error {
  status: number;
  reason: string;
  reconnectRequired: boolean;

  constructor(message: string, options: { status?: number; reason?: string; reconnectRequired?: boolean } = {}) {
    super(message);
    this.name = 'YouTubeDataApiReadError';
    this.status = options.status ?? 502;
    this.reason = options.reason ?? 'youtube_data_api_error';
    this.reconnectRequired = options.reconnectRequired ?? false;
  }
}

function normalizeSecret(raw: unknown, keyName = ''): string {
  let value = String(raw ?? '').trim();
  if (keyName && value.startsWith(`${keyName}=`)) value = value.slice(keyName.length + 1).trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function expectedChannelId(): string {
  return normalizeSecret(
    process.env.YOUTUBE_CHANNEL_ID || process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ',
    'YOUTUBE_CHANNEL_ID'
  );
}

function parseDuration(duration: string): number {
  const match = String(duration || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function inferFormat(durationSeconds: number, hasLiveDetails: boolean): ReadOnlyYouTubeVideo['format'] {
  if (hasLiveDetails) return 'live';
  // Removed duration-based short inference
  return 'video';
}

async function getCredential(): Promise<ReadCredential> {
  if (await hasYTAnalyticsRefreshCredential()) {
    const accessToken = await getValidYTAnalyticsAccessToken();
    if (accessToken) {
      return { mode: 'youtube-oauth-client', value: accessToken };
    }
    // OAuth refresh failed — fall through to API key fallback before giving up
    console.warn('[youtube-data-api-readonly] OAuth token refresh failed. Falling back to YOUTUBE_API_KEY for read operations. Reconnect YouTube OAuth at /admin/youtube-analytics to restore full access.');
  }

  const apiKey = normalizeSecret(
    process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    'YOUTUBE_API_KEY'
  );
  if (apiKey && !apiKey.includes('YOUR_KEY_HERE')) {
    return { mode: 'server-api-key', value: apiKey };
  }

  throw new YouTubeDataApiReadError(
    'YouTube OAuth authorization is expired or revoked. Reconnect the SufiPulse YouTube account at /admin/youtube-analytics.',
    { status: 401, reason: 'oauth_refresh_failed', reconnectRequired: true }
  );
}

async function youtubeRequest(
  resource: string,
  params: Record<string, string>,
  credential: ReadCredential
): Promise<YouTubeApiPayload> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const headers: Record<string, string> = {};
  if (credential.mode === 'youtube-oauth-client') headers.Authorization = `Bearer ${credential.value}`;
  else url.searchParams.set('key', credential.value);

  let response: Response;
  try {
    response = await fetch(url, { headers, cache: 'no-store' });
  } catch (error) {
    throw new YouTubeDataApiReadError(
      `YouTube Data API request could not be completed: ${error instanceof Error ? error.message : 'network failure'}`,
      { status: 502, reason: 'upstream_network_failure' }
    );
  }

  const text = await response.text();
  let payload: YouTubeApiPayload = {};
  try {
    payload = text ? (JSON.parse(text) as YouTubeApiPayload) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const reason = String(payload.error?.errors?.[0]?.reason || payload.error?.status || 'youtube_data_api_error');
    const message = String(payload.error?.message || payload.error_description || `YouTube Data API returned ${response.status}.`);
    const lower = `${reason} ${message}`.toLowerCase();
    const quota = response.status === 403 && lower.includes('quota');
    const insufficientScope =
      credential.mode === 'youtube-oauth-client' &&
      response.status === 403 &&
      (lower.includes('insufficient') || lower.includes('permission') || lower.includes('forbidden'));
    const reconnectRequired = credential.mode === 'youtube-oauth-client' && (response.status === 401 || insufficientScope);

    throw new YouTubeDataApiReadError(message, {
      status: response.status,
      reason: quota ? 'quota_exceeded' : insufficientScope ? 'insufficient_scope' : reason,
      reconnectRequired,
    });
  }

  return payload;
}

async function getUploadsPlaylist(credential: ReadCredential): Promise<string> {
  const configuredChannelId = expectedChannelId();
  const channelPayload = credential.mode === 'youtube-oauth-client'
    ? await youtubeRequest('channels', { part: 'contentDetails,snippet', mine: 'true', maxResults: '50' }, credential)
    : await youtubeRequest('channels', { part: 'contentDetails,snippet', id: configuredChannelId }, credential);

  const items = Array.isArray(channelPayload.items) ? channelPayload.items : [];
  const channel = items.find(item => String(item.id || '').trim() === configuredChannelId);
  if (!channel) {
    throw new YouTubeDataApiReadError(
      credential.mode === 'youtube-oauth-client'
        ? `Authorized YouTube identity did not return the configured SufiPulse channel ${configuredChannelId}.`
        : `YouTube Data API did not return the configured SufiPulse channel ${configuredChannelId}.`,
      { status: 409, reason: 'wrong_channel_identity', reconnectRequired: credential.mode === 'youtube-oauth-client' }
    );
  }

  const uploads = String(channel.contentDetails?.relatedPlaylists?.uploads || '').trim();
  if (!uploads) {
    throw new YouTubeDataApiReadError('YouTube did not return the uploads playlist for the configured channel.', {
      status: 502,
      reason: 'uploads_playlist_missing',
    });
  }
  return uploads;
}

function normalizeVideo(video: YouTubeApiItem): ReadOnlyYouTubeVideo {
  const durationSeconds = parseDuration(video.contentDetails?.duration || 'PT0S');
  const hasLiveDetails = Boolean(
    video.liveStreamingDetails?.actualStartTime || video.liveStreamingDetails?.scheduledStartTime
  );
  
  return {
    id: String(video.id || ''),
    title: String(video.snippet?.title || ''),
    description: String(video.snippet?.description || ''),
    thumbnailUrl:
      video.snippet?.thumbnails?.maxres?.url ||
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.medium?.url ||
      '',
    publishedDate: String(video.snippet?.publishedAt || ''),
    durationSeconds,
    durationFormatted: formatDuration(durationSeconds),
    views: Number(video.statistics?.viewCount || 0),
    likes: Number(video.statistics?.likeCount || 0),
    comments: Number(video.statistics?.commentCount || 0),
    liveBroadcastContent: String(video.snippet?.liveBroadcastContent || 'none'),
    
    defaultLanguage: video.snippet?.defaultLanguage,
    defaultAudioLanguage: video.snippet?.defaultAudioLanguage,
    captionsAvailable: video.contentDetails?.caption === 'true',
    recordingDate: video.recordingDetails?.recordingDate,
    categoryId: video.snippet?.categoryId,
    license: video.status?.license,
    privacyStatus: video.status?.privacyStatus,
    embeddable: video.status?.embeddable,
    licensedContent: video.contentDetails?.licensedContent,
    regionRestriction: video.contentDetails?.regionRestriction,
    channelId: video.snippet?.channelId,
    channelTitle: video.snippet?.channelTitle,
    channelUrl: video.snippet?.channelId ? `https://youtube.com/channel/${video.snippet.channelId}` : undefined,
    fetchedAt: new Date().toISOString(),
    
    source: 'youtube',
    format: inferFormat(durationSeconds, hasLiveDetails),
  };

}

async function getVideosByIdsWithCredential(ids: string[], credential: ReadCredential): Promise<ReadOnlyYouTubeVideo[]> {
  const normalizedIds = Array.from(new Set(ids.map(id => String(id).trim()).filter(Boolean)));
  if (normalizedIds.length === 0) return [];

  const expected = expectedChannelId();
  const result: ReadOnlyYouTubeVideo[] = [];
  for (let index = 0; index < normalizedIds.length; index += 50) {
    const chunk = normalizedIds.slice(index, index + 50);
    const payload = await youtubeRequest(
      'videos',
      {
        part: 'snippet,contentDetails,statistics,liveStreamingDetails,status,recordingDetails',
        id: chunk.join(','),
        maxResults: '50',
      },
      credential
    );
    for (const item of payload.items || []) {
      if (String(item.snippet?.channelId || '').trim() !== expected) continue;
      result.push(normalizeVideo(item));
    }
  }
  return result;
}

export async function fetchReadOnlyYouTubeVideosByIds(ids: string[]): Promise<{
  videos: ReadOnlyYouTubeVideo[];
  credentialMode: YouTubeReadCredentialMode;
}> {
  const credential = await getCredential();
  if (credential.mode === 'youtube-oauth-client') await getUploadsPlaylist(credential);
  const videos = await getVideosByIdsWithCredential(ids, credential);
  return { videos, credentialMode: credential.mode };
}

export async function fetchReadOnlyYouTubeChannelVideos(maxResults = 500): Promise<{
  videos: ReadOnlyYouTubeVideo[];
  credentialMode: YouTubeReadCredentialMode;
}> {
  const safeMax = Math.max(1, Math.min(Number(maxResults || 500), 500));
  const credential = await getCredential();
  const uploadsPlaylist = await getUploadsPlaylist(credential);

  const ids: string[] = [];
  let pageToken = '';
  while (ids.length < safeMax) {
    const params: Record<string, string> = {
      part: 'contentDetails',
      playlistId: uploadsPlaylist,
      maxResults: String(Math.min(50, safeMax - ids.length)),
    };
    if (pageToken) params.pageToken = pageToken;
    const page = await youtubeRequest('playlistItems', params, credential);
    for (const item of page.items || []) {
      const id = String(item.contentDetails?.videoId || '').trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
    pageToken = String(page.nextPageToken || '');
    if (!pageToken || (page.items || []).length === 0) break;
  }

  const videos = await getVideosByIdsWithCredential(ids.slice(0, safeMax), credential);
  const byId = new Map(videos.map(video => [video.id, video]));
  const ordered = ids.map(id => byId.get(id)).filter((video): video is ReadOnlyYouTubeVideo => Boolean(video));
  return { videos: ordered, credentialMode: credential.mode };
}