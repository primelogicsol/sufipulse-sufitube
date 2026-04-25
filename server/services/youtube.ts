/**
 * server/services/youtube.ts
 *
 * YouTube Data API v3 integration.
 * Re-exports the existing service with a clean interface.
 *
 * Config keys: YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID
 */

export { YouTubeService } from '@/lib/youtube-service';

import { YouTubeService } from '@/lib/youtube-service';
import { config } from '@/server/config';

// Default singleton — use this for all server-side YouTube calls
export const youtubeService = new YouTubeService({
  apiKey: config.youtube.apiKey,
  channelId: config.youtube.defaultChannelId,
  cacheExpiryMs: config.youtube.cacheExpiryMs,
});
