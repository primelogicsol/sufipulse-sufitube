import { getTable, type YouTubeAnalyticsSnapshot } from './database-schema';

export type GlobalReachPayload = PublicGlobalReachPayload;
export type AnalyticsSnapshot = YouTubeAnalyticsSnapshot;

/**
 * Sanitized payload for public UI
 */
export interface PublicGlobalReachPayload {
  title: string;
  subtitle: string;
  ageGender: YouTubeAnalyticsSnapshot['lifetimeSnapshot']['ageGender'];
  performance: YouTubeAnalyticsSnapshot['lifetimeSnapshot']['performance'];
  recommendationEngine: YouTubeAnalyticsSnapshot['lifetimeSnapshot']['recommendationEngine'];
  geographies: YouTubeAnalyticsSnapshot['lifetimeSnapshot']['geographies'];
  snapshotStatus?: string;
  lastUpdated: string;
  status: 'active' | 'stale' | 'error';
  errorMessage?: string;
}

// Initial default data: Verified Institutional Baseline
export const DEFAULT_PAYLOAD: AnalyticsSnapshot = {
  id: "lifetime",
  channelId: 'UCraDr3i5A3k0j7typ6tOOsQ',
  scope: 'lifetime',
  status: 'active',
  title: "SufiPulse Global Reach",
  subtitle: "Lifetime audience intelligence from the official SufiPulse SufiTube channel, updated from the latest verified YouTube Analytics snapshot.",

  // 1. Immutable Institutional Results
  lifetimeSnapshot: {
    performance: {
      impressions: 85115666,
      views: 7149716,
      watchTimeHours: 755803,
      clickThroughRate: 8.4,
      averageViewDurationFormatted: "6:20"
    },
    ageGender: {
      gender: { female: 42.7, male: 57.3 },
      ageGroups: [
        { ageGroup: "13-17", percentage: 3.7 },
        { ageGroup: "18-24", percentage: 23.5 },
        { ageGroup: "25-34", percentage: 42.3 },
        { ageGroup: "35-44", percentage: 18.7 },
        { ageGroup: "45-54", percentage: 8.1 },
        { ageGroup: "55-64", percentage: 2.4 },
        { ageGroup: "65+",   percentage: 1.3 }
      ]
    },
    recommendationEngine: {
      viewsPercentage: 86.9
    },
    geographies: {
      totalCountries: 53
    }
  },
  snapshotStatus: "Verified YouTube Studio Snapshot (May 20, 2025 - Jul 24, 2026)",

  // 2. Live API Telemetry (Admins only)
  apiStatus: {
    connected: false,
    lastCheck: new Date().toISOString(),
    availableLiveMetrics: ["views", "watchTime", "averageDuration", "trafficSource"],
    restrictedMetrics: ["impressions", "ctr", "demographics", "geography"]
  },

  lastUpdated: new Date("2026-07-24T00:00:00Z").toISOString(),
  nextRefreshAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

export const analyticsStorage = {
  getSnapshot(): AnalyticsSnapshot {
    try {
      const table = getTable<YouTubeAnalyticsSnapshot>('youtube_analytics_snapshots');
      const snapshot = table.findById('lifetime');
      if (snapshot) {
        // Check if stale (older than 8 days)
        const lastUpdate = new Date(snapshot.lastUpdated).getTime();
        const now = Date.now();
        const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
        
        if (now - lastUpdate > eightDaysMs && snapshot.status !== 'stale') {
          return { ...snapshot, status: 'stale' };
        }
        return snapshot;
      }
    } catch (e) {
      console.error('[analyticsStorage] Failed to read snapshot from database:', e);
    }
    // Fallback to default
    return DEFAULT_PAYLOAD;
  },

  saveSnapshot(data: AnalyticsSnapshot): void {
    try {
      const table = getTable<YouTubeAnalyticsSnapshot>('youtube_analytics_snapshots');
      const existing = table.findById('lifetime');
      
      if (existing) {
        table.update('lifetime', { ...data, id: 'lifetime' });
      } else {
        table.insert({ ...data, id: 'lifetime' });
      }
    } catch (e) {
      console.error('[analyticsStorage] Failed to save snapshot to database:', e);
    }
  },

  /**
   * Calculates the next Friday at 3:00 AM
   */
  getNextFriday3AM(from: Date = new Date()): Date {
    const nextFriday = new Date(from);
    nextFriday.setUTCHours(3, 0, 0, 0);
    
    // day 5 is Friday
    const day = nextFriday.getUTCDay();
    let daysUntilFriday = (5 - day + 7) % 7;
    
    // If it's currently Friday but past 3:00 AM, go to next week
    if (daysUntilFriday === 0 && from.getUTCHours() >= 3) {
      daysUntilFriday = 7;
    }
    
    nextFriday.setUTCDate(nextFriday.getUTCDate() + daysUntilFriday);
    return nextFriday;
  },

  shouldRefresh(): boolean {
    const snapshot = this.getSnapshot();
    const nextRefresh = new Date(snapshot.nextRefreshAt).getTime();
    const now = Date.now();
    return now >= nextRefresh;
  },
};

