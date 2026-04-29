// lib/youtube-service.ts

/**
 * Format inference priority (from YouTube API data):
 *  1. liveStreamingDetails present → 'live'
 *  2. durationSeconds <= 60        → 'short'  (YouTube Shorts heuristic)
 *  3. default                      → 'video'
 *
 * 'audio' and 'playlist' are admin-only designations — YouTube does not
 * expose them as video-level fields in the Data API v3.
 */
export type ReleaseFormat = 'video' | 'audio' | 'short' | 'live' | 'playlist';

function inferFormat(durationSeconds: number, hasLiveDetails: boolean): ReleaseFormat {
    if (hasLiveDetails) return 'live';
    if (durationSeconds <= 60) return 'short';
    return 'video';
}

interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    publishedDate: string;
    durationSeconds: number;
    durationFormatted: string;
    views: number;
    source: string;
    format: ReleaseFormat;
}

export interface YouTubePlaylist {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    publishedDate: string;
    itemCount: number;
}

interface YouTubeServiceConfig {
    apiKey: string;
    channelId: string;
    cacheExpiryMs: number;
    maxRetries: number;
    retryDelayMs: number;
}

class YouTubeService {
    private config: YouTubeServiceConfig;
    private cache = new Map<string, { data: any; timestamp: number }>();
    private quotaExceeded = false;
    private quotaResetTime: number | null = null;

    constructor(config: Partial<YouTubeServiceConfig> = {}) {
        this.config = {
            apiKey: config.apiKey || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || '',
            channelId: config.channelId || 'UCraDr3i5A3k0j7typ6tOOsQ',
            cacheExpiryMs: config.cacheExpiryMs || 4 * 60 * 60 * 1000, // 4 hours
            maxRetries: config.maxRetries || 3,
            retryDelayMs: config.retryDelayMs || 1000,
            ...config
        };
    }

    private isCacheValid(key: string): boolean {
        const cached = this.cache.get(key);
        if (!cached) return false;
        return Date.now() - cached.timestamp < this.config.cacheExpiryMs;
    }

    private setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    private getCache(key: string): any | null {
        if (this.isCacheValid(key)) {
            return this.cache.get(key)?.data || null;
        }
        return null;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async makeRequest(url: string, retries = this.config.maxRetries): Promise<any> {
        // Check if quota is exceeded and not yet reset
        if (this.quotaExceeded && this.quotaResetTime && Date.now() < this.quotaResetTime) {
            throw new Error('YouTube API quota exceeded. Using static data fallback.');
        }

        try {
            // Next.js App Router dynamic fetch caching: revalidate only on server
            const fetchOptions: any = {};
            if (typeof window === 'undefined') {
                fetchOptions.next = { revalidate: 14400 };
            }

            const response = await fetch(url, fetchOptions);
            const data = await response.json();

            if (response.status === 403 && data.error?.message?.includes('quota')) {
                this.quotaExceeded = true;
                // Set reset time to next day at midnight PST (approximate)
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                this.quotaResetTime = tomorrow.getTime();

                throw new Error(`YouTube API quota exceeded. Resets at ${tomorrow.toLocaleString()}`);
            }

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
            }

            // Reset quota flag on successful request
            this.quotaExceeded = false;
            this.quotaResetTime = null;

            return data;
        } catch (error: any) {
            if (retries > 0 && !error.message.includes('quota')) {
                console.warn(`YouTube API request failed, retrying... (${retries} attempts left)`);
                await this.delay(this.config.retryDelayMs);
                return this.makeRequest(url, retries - 1);
            }
            throw error;
        }
    }

    async searchVideos(query: string = '', maxResults: number = 50, order: string = 'date'): Promise<YouTubeVideo[]> {
        const safeMaxResults = Math.max(1, Math.min(maxResults, 500));
        const cacheKey = `search_${query}_${safeMaxResults}_${order}`;

        if (!this.config.apiKey) {
            console.warn('YouTube API key is missing. Falling back to static registry data.');
            const { STATIC_YOUTUBE_VIDEOS } = require('@/app/data/youtube-videos');
            return STATIC_YOUTUBE_VIDEOS.slice(0, safeMaxResults);
        }

        // Check cache first
        const cached = this.getCache(cacheKey);
        if (cached) {
            console.log('🎯 Returning cached search results for:', query || 'latest');
            return cached;
        }

        try {
            console.log('🔍 Searching YouTube for:', query || 'latest videos');
            const pageSize = Math.min(50, safeMaxResults);
            const maxPages = Math.max(1, Math.ceil(safeMaxResults / pageSize));

            let nextPageToken: string | null = null;
            let pagesFetched = 0;
            const searchItems: any[] = [];

            while (pagesFetched < maxPages && searchItems.length < safeMaxResults) {
                const tokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
                const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.config.channelId}&maxResults=${pageSize}&order=${order}&type=video&q=${encodeURIComponent(query)}${tokenParam}&key=${this.config.apiKey}`;
                const searchData = await this.makeRequest(searchUrl);
                const items = searchData.items || [];

                if (items.length === 0) {
                    break;
                }

                searchItems.push(...items);
                pagesFetched += 1;
                nextPageToken = searchData.nextPageToken || null;
                if (!nextPageToken) {
                    break;
                }
            }

            if (searchItems.length === 0) {
                console.log('📭 No videos found for search query');
                const emptyResult: YouTubeVideo[] = [];
                this.setCache(cacheKey, emptyResult);
                return emptyResult;
            }

            const uniqueIds = Array.from(
                new Set(searchItems.map((item: any) => item?.id?.videoId).filter(Boolean))
            ).slice(0, safeMaxResults);

            const searchItemById = new Map<string, any>();
            searchItems.forEach((item: any) => {
                const id = item?.id?.videoId;
                if (id && !searchItemById.has(id)) {
                    searchItemById.set(id, item);
                }
            });

            // Get detailed video information
            console.log(`📊 Fetching details for ${uniqueIds.length} videos across ${pagesFetched} page(s)`);
            const chunks: string[][] = [];
            for (let i = 0; i < uniqueIds.length; i += 50) {
                chunks.push(uniqueIds.slice(i, i + 50));
            }

            const chunkResults = await Promise.all(
                chunks.map((chunk) => this.getVideosByIds(chunk))
            );
            const videosData = chunkResults.flat();

            const formatted = videosData.map((video: any) => {
                const durationSecs = this.parseDuration(video.contentDetails?.duration || 'PT0S');
                const hasLiveDetails = !!(video.liveStreamingDetails?.actualStartTime || video.liveStreamingDetails?.scheduledStartTime);
                return {
                    id: video.id,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    thumbnailUrl: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
                    publishedDate: video.snippet.publishedAt,
                    durationSeconds: durationSecs,
                    durationFormatted: this.formatDuration(video.contentDetails?.duration || 'PT0S'),
                    views: parseInt(video.statistics?.viewCount || '0'),
                    source: 'youtube_legacy',
                    format: inferFormat(durationSecs, hasLiveDetails),
                };
            });

            if (order === 'date') {
                formatted.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
            } else if (order === 'viewCount') {
                formatted.sort((a, b) => b.views - a.views);
            }

            console.log(`✅ Successfully processed ${formatted.length} videos`);
            this.setCache(cacheKey, formatted);
            return formatted.slice(0, safeMaxResults);

        } catch (error: any) {
            console.error('❌ YouTube search failed:', error.message);

            // Return static data as fallback
            console.log('🔄 Falling back to static video data');
            const { STATIC_YOUTUBE_VIDEOS } = require('@/app/data/youtube-videos');
            
            // Filter and sort based on the original query
            let results = [...STATIC_YOUTUBE_VIDEOS];
            
            if (order === 'viewCount') {
                results.sort((a, b) => b.views - a.views);
            } else if (order === 'date') {
                results.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
            }
            
            return results.slice(0, safeMaxResults);
        }
    }

    async getVideosByIds(videoIds: string | string[]): Promise<any[]> {
        const ids = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
        const cacheKey = `videos_${ids}`;

        const cached = this.getCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,liveStreamingDetails&id=${ids}&key=${this.config.apiKey}`;
            const data = await this.makeRequest(videosUrl);

            this.setCache(cacheKey, data.items || []);
            return data.items || [];
        } catch (error: any) {
            console.error('Failed to get video details:', error.message);
            
            // Fallback to static videos
            try {
                const { STATIC_YOUTUBE_VIDEOS } = require('@/app/data/youtube-videos');
                const idArray = Array.isArray(videoIds) ? videoIds : videoIds.split(',');
                
                // Convert static videos to YouTube API response format
                const staticVideos = idArray
                    .map((id: string) => {
                        const staticVideo = STATIC_YOUTUBE_VIDEOS.find((v: any) => v.id === id.trim());
                        if (staticVideo) {
                            return {
                                id: staticVideo.id,
                                snippet: {
                                    title: staticVideo.title,
                                    description: staticVideo.description,
                                    publishedAt: staticVideo.publishedDate,
                                    thumbnails: {
                                        maxres: { url: staticVideo.thumbnailUrl },
                                        high: { url: staticVideo.thumbnailUrl },
                                        medium: { url: staticVideo.thumbnailUrl }
                                    }
                                },
                                contentDetails: {
                                    duration: `PT${Math.floor(staticVideo.durationSeconds / 3600)}H${Math.floor((staticVideo.durationSeconds % 3600) / 60)}M${staticVideo.durationSeconds % 60}S`
                                },
                                statistics: {
                                    viewCount: staticVideo.views.toString(),
                                    likeCount: Math.floor(staticVideo.views * 0.05).toString()
                                }
                            };
                        }
                        return null;
                    })
                    .filter((v: any) => v !== null);
                
                if (staticVideos.length > 0) {
                    console.log('🔄 Using static video data for:', idArray.join(', '));
                    this.setCache(cacheKey, staticVideos);
                    return staticVideos;
                }
            } catch (fallbackError: any) {
                console.error('Failed to use static video fallback:', fallbackError.message);
            }
            
            return [];
        }
    }

    async getLatestVideos(count: number = 10): Promise<YouTubeVideo[]> {
        try {
            return await this.searchVideos('', count, 'date');
        } catch (error) {
            console.log('API failed, using static data');
            const { STATIC_YOUTUBE_VIDEOS } = require('@/app/data/youtube-videos');
            return STATIC_YOUTUBE_VIDEOS.slice(0, count);
        }
    }

    async getPopularVideos(count: number = 10): Promise<YouTubeVideo[]> {
        // Use YouTube's viewCount ordering for accurate all-time popular results.
        try {
            const result = await this.searchVideos('', count, 'viewCount');
            if (result.length > 0) {
                return result;
            }
        } catch (error) {
            console.log('API failed, using static data');
        }
        
        // Fall back to static videos sorted by views
        const { STATIC_YOUTUBE_VIDEOS } = require('@/app/data/youtube-videos');
        return [...STATIC_YOUTUBE_VIDEOS]
            .sort((a, b) => b.views - a.views)
            .slice(0, count);
    }

    async getVideoById(videoId: string): Promise<YouTubeVideo | null> {
        const cacheKey = `video_${videoId}`;

        // Check cache first
        const cached = this.getCache(cacheKey);
        if (cached) {
            console.log('🎯 Returning cached video details for:', videoId);
            return cached;
        }

        try {
            console.log('🔍 Fetching video details for:', videoId);
            const videos = await this.getVideosByIds(videoId);

            if (!videos || videos.length === 0) {
                console.log('📭 Video not found via API, checking static data');
                
                // Try to find in static videos
                const { STATIC_YOUTUBE_VIDEOS } = require('@/app/data/youtube-videos');
                const staticVideo = STATIC_YOUTUBE_VIDEOS.find((v: any) => v.id === videoId);
                if (staticVideo) {
                    this.setCache(cacheKey, staticVideo);
                    return staticVideo;
                }
                
                return null;
            }

            const video = videos[0];
            const durationSecs = this.parseDuration(video.contentDetails?.duration || 'PT0S');
            const hasLiveDetails = !!(video.liveStreamingDetails?.actualStartTime || video.liveStreamingDetails?.scheduledStartTime);
            const formatted: YouTubeVideo = {
                id: video.id,
                title: video.snippet.title,
                description: video.snippet.description,
                thumbnailUrl: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
                publishedDate: video.snippet.publishedAt,
                durationSeconds: durationSecs,
                durationFormatted: this.formatDuration(video.contentDetails?.duration || 'PT0S'),
                views: parseInt(video.statistics?.viewCount || '0'),
                source: 'youtube_legacy',
                format: inferFormat(durationSecs, hasLiveDetails),
            };

            console.log('✅ Successfully fetched video details');
            this.setCache(cacheKey, formatted);
            return formatted;

        } catch (error: any) {
            console.error('❌ Failed to get video details:', error.message);

            // Try to find in static videos first
            const { STATIC_YOUTUBE_VIDEOS } = require('@/app/data/youtube-videos');
            const staticVideo = STATIC_YOUTUBE_VIDEOS.find((v: any) => v.id === videoId);
            if (staticVideo) {
                console.log('🔄 Using static video data');
                return staticVideo;
            }

            return null;
        }
    }

    public parseDuration(duration: string): number {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;

        const h = parseInt(match[1]) || 0;
        const m = parseInt(match[2]) || 0;
        const s = parseInt(match[3]) || 0;

        return h * 3600 + m * 60 + s;
    }

    private formatDuration(duration: string): string {
        const seconds = this.parseDuration(duration);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        } else {
            return `${m}:${s.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Fetch all public playlists for the SufiPulse channel.
     * Returns playlist metadata only — items are fetched separately via playlistItems.list.
     */
    async getChannelPlaylists(maxResults: number = 50): Promise<YouTubePlaylist[]> {
        if (!this.config.apiKey) {
            console.warn('YouTube API key missing — cannot fetch playlists');
            return [];
        }
        const cacheKey = `playlists_${this.config.channelId}_${maxResults}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${this.config.channelId}&maxResults=${maxResults}&key=${this.config.apiKey}`;
            const data = await this.makeRequest(url);
            const playlists: YouTubePlaylist[] = (data.items || []).map((item: any) => ({
                id: item.id,
                title: item.snippet?.title || '',
                description: item.snippet?.description || '',
                thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
                publishedDate: item.snippet?.publishedAt || '',
                itemCount: item.contentDetails?.itemCount || 0,
            }));
            this.setCache(cacheKey, playlists);
            return playlists;
        } catch (err: any) {
            console.error('Failed to fetch channel playlists:', err.message);
            return [];
        }
    }

    // Utility methods
    isQuotaExceeded(): boolean {
        return this.quotaExceeded;
    }

    getQuotaResetTime(): Date | null {
        return this.quotaResetTime ? new Date(this.quotaResetTime) : null;
    }

    clearCache(): void {
        this.cache.clear();
        console.log('YouTube cache cleared');
    }

    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
export const youtubeService = new YouTubeService();

// Export types and class for advanced usage
export type { YouTubeVideo, YouTubeServiceConfig };
export { YouTubeService, inferFormat };