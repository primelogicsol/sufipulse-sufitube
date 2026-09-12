import { getValidYTAnalyticsAccessToken, normalizeYTAnalyticsCredential } from '@/app/lib/server/youtube-analytics-oauth-store';

export const CANONICAL_CHANNEL_ID = 'UCraDr3i5A3k0j7typ6tOOsQ';

export type YouTubeHealth = {
  oauth: 'CONNECTED' | 'REAUTH_REQUIRED' | 'ERROR';
  dataApi: 'READY' | 'ERROR';
  analyticsApi: 'READY' | 'ERROR';
  captionApi: 'READY' | 'ERROR' | 'AUTHORIZATION_REQUIRED';
  canonicalChannel: 'ACCESSIBLE' | 'NOT_ACCESSIBLE';
  apiKey: 'VALID' | 'INVALID' | 'UNUSED';
  refreshToken: 'AVAILABLE' | 'MISSING' | 'REVOKED';
  lastError?: string;
};

export async function getYouTubeConnection() {
  const apiKey = normalizeYTAnalyticsCredential(process.env.YOUTUBE_API_KEY) || normalizeYTAnalyticsCredential(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY);
  
  return {
    channelId: CANONICAL_CHANNEL_ID,
    
    // Core function to get OAuth access token securely
    async getAccessToken(): Promise<string | null> {
      try {
        return await getValidYTAnalyticsAccessToken();
      } catch (err) {
        return null;
      }
    },
    
    // Core function to get API Key securely
    getApiKey(): string | null {
      return apiKey || null;
    },

    // A unified fetch that automatically prefers OAuth over API Key
    async fetch(url: string, init?: RequestInit): Promise<Response> {
      const accessToken = await this.getAccessToken();
      
      const parsedUrl = new URL(url);
      
      if (accessToken) {
        const headers = new Headers(init?.headers);
        headers.set('Authorization', `Bearer ${accessToken}`);
        
        // Strip API key from URL if we are using OAuth to prevent conflicts
        if (parsedUrl.searchParams.has('key')) {
          parsedUrl.searchParams.delete('key');
        }
        
        return fetch(parsedUrl.toString(), { ...init, headers });
      }

      // Fallback to API Key if Data API (Analytics API requires OAuth)
      if (parsedUrl.hostname === 'www.googleapis.com' && apiKey) {
        if (!parsedUrl.searchParams.has('key')) {
          parsedUrl.searchParams.set('key', apiKey);
        }
        return fetch(parsedUrl.toString(), init);
      }

      return fetch(url, init);
    },
    
    async checkHealth(): Promise<YouTubeHealth> {
      const health: YouTubeHealth = {
        oauth: 'ERROR',
        dataApi: 'ERROR',
        analyticsApi: 'ERROR',
        canonicalChannel: 'NOT_ACCESSIBLE',
        apiKey: 'UNUSED',
        refreshToken: 'MISSING',
        captionApi: 'AUTHORIZATION_REQUIRED'
      };

      try {
        // 1. Check OAuth
        const accessToken = await this.getAccessToken();
        const envRefresh = normalizeYTAnalyticsCredential(process.env.YOUTUBE_REFRESH_TOKEN);
        
        if (accessToken) {
          health.oauth = 'CONNECTED';
          health.refreshToken = 'AVAILABLE';
        } else if (envRefresh) {
          health.refreshToken = 'REVOKED'; // If we have one but no access token, it failed to exchange
          health.oauth = 'REAUTH_REQUIRED';
        } else {
          health.oauth = 'ERROR';
          health.refreshToken = 'MISSING';
        }

        // 2. Check Data API & Canonical Channel
        const dataApiUrl = new URL('https://www.googleapis.com/youtube/v3/channels?part=id');
        dataApiUrl.searchParams.set('id', this.channelId);
        
        try {
          const res = await this.fetch(dataApiUrl.toString(), { cache: 'no-store' });
          if (res.ok) {
            health.dataApi = 'READY';
            health.canonicalChannel = 'ACCESSIBLE';
            if (!accessToken && apiKey) health.apiKey = 'VALID'; else if (accessToken) health.apiKey = 'UNUSED';
          } else {
            const body = await res.json().catch(() => ({}));
            health.dataApi = 'ERROR';
            health.lastError = body?.error?.message || 'Data API Error';
            if (!accessToken && apiKey && res.status === 400) health.apiKey = 'INVALID';
          }
        } catch (e) {
          health.dataApi = 'ERROR';
        }

        // 3. Check Analytics API
        if (health.oauth === 'CONNECTED') {
          const analyticsUrl = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
          const endDate = new Date().toISOString().split('T')[0];
          analyticsUrl.searchParams.set('ids', `channel==${this.channelId}`);
          analyticsUrl.searchParams.set('startDate', '2006-01-01');
          analyticsUrl.searchParams.set('endDate', endDate);
          analyticsUrl.searchParams.set('metrics', 'views');
          
          try {
            const aRes = await this.fetch(analyticsUrl.toString(), { cache: 'no-store' });
            if (aRes.ok) {
              health.analyticsApi = 'READY';
            } else {
              health.analyticsApi = 'ERROR';
              const body = await aRes.json().catch(() => ({}));
              health.lastError = body?.error?.message || 'Analytics API Error';
            }
          } catch (e) {
             health.analyticsApi = 'ERROR';
          }
        }
        
        // 4. Check Caption API Scopes via tokeninfo
        if (accessToken) {
          try {
            const tokenInfo = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + accessToken, { cache: 'no-store' });
            if (tokenInfo.ok) {
              const info = await tokenInfo.json();
              if (info.scope && info.scope.includes('youtube.force-ssl')) {
                health.captionApi = 'READY';
              } else {
                health.captionApi = 'AUTHORIZATION_REQUIRED';
              }
            } else {
               health.captionApi = 'ERROR';
            }
          } catch (e) {
            health.captionApi = 'ERROR';
          }
        }
        
      } catch (err: any) {
        health.lastError = err.message;
      }
      
      return health;
    }
  };
}
