import { getTable, type YouTubeAnalyticsSnapshot } from './database-schema';

export type GlobalReachPayload = YouTubeAnalyticsSnapshot;
export type AnalyticsSnapshot = YouTubeAnalyticsSnapshot;

// Initial default data if database is empty
const DEFAULT_PAYLOAD: GlobalReachPayload = {
  id: "lifetime",
  channelId: 'UCraDr3i5A3k0j7typ6tOOsQ',
  scope: 'lifetime',
  status: 'active',
  performance: {
    impressions: 955500,
    views: 82100,
    watchTimeHours: 8700,
    clickThroughRate: 8.6,
    averageViewDurationSeconds: 381,
    averageViewDurationFormatted: "6:21"
  },
  ageGender: {
    gender: { female: 43.2, male: 56.8 },
    ageGroups: [
      { ageGroup: "13-17", percentage: 3.6 },
      { ageGroup: "18-24", percentage: 23.6 },
      { ageGroup: "25-34", percentage: 42.6 },
      { ageGroup: "35-44", percentage: 18.7 },
      { ageGroup: "45-54", percentage: 8.1 },
      { ageGroup: "55-64", percentage: 2.3 },
      { ageGroup: "65+",   percentage: 1.2 }
    ]
  },
  recommendationEngine: {
    viewsPercentage: 88.1,
    label: "views driven by the recommendation engine"
  },
  geographies: {
    totalCountries: 47,
    countries: [
      { code: 'US', name: 'United States', views: 12000 },
      { code: 'PK', name: 'Pakistan', views: 10500 },
      { code: 'GB', name: 'United Kingdom', views: 8000 },
      { code: 'IN', name: 'India', views: 7500 },
      { code: 'TR', name: 'Turkey', views: 5000 }
    ]
  },
  lastUpdated: new Date(2026, 4, 15, 3, 0).toISOString(),
  nextRefreshAt: new Date(2026, 4, 22, 3, 0).toISOString()
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

