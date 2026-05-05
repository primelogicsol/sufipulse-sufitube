import fs from 'node:fs';
import path from 'node:path';

const ANALYTICS_DIR = path.join(process.cwd(), '.data');
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, 'analytics_snapshot.json');

export interface AnalyticsSnapshot {
  discovery: {
    impressions: number;
    ctr: number;
    viewsFromImpressions: number;
    avgViewDuration: string;
    watchTimeHours: number;
    recommendationShare: number;
  };
  audience: {
    genderSplit: { female: number; male: number };
    ageGroups: Record<string, number>;
  };
  geography: {
    countriesReached: number;
  };
  lastUpdatedAt: string;
  scope: 'lifetime';
}

// Initial default data if file doesn't exist
const DEFAULT_SNAPSHOT: AnalyticsSnapshot = {
  discovery: {
    impressions: 955500,
    ctr: 8.6,
    viewsFromImpressions: 82100,
    avgViewDuration: '6:21',
    watchTimeHours: 8700,
    recommendationShare: 88.1,
  },
  audience: {
    genderSplit: { female: 43.2, male: 56.8 },
    ageGroups: {
      '13–17': 3.6,
      '18–24': 23.6,
      '25–34': 42.6,
      '35–44': 18.7,
      '45–54': 8.1,
      '55–64': 2.3,
      '65+': 1.2,
    },
  },
  geography: { countriesReached: 47 },
  lastUpdatedAt: new Date(2026, 4, 4).toISOString(), // May 4, 2026
  scope: 'lifetime',
};

export const analyticsStorage = {
  getSnapshot(): AnalyticsSnapshot {
    try {
      if (fs.existsSync(ANALYTICS_FILE)) {
        const content = fs.readFileSync(ANALYTICS_FILE, 'utf8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('[analyticsStorage] Failed to read snapshot:', e);
    }
    return DEFAULT_SNAPSHOT;
  },

  saveSnapshot(data: AnalyticsSnapshot): void {
    try {
      if (!fs.existsSync(ANALYTICS_DIR)) {
        fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
      }
      fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[analyticsStorage] Failed to save snapshot:', e);
    }
  },

  shouldRefresh(): boolean {
    const snapshot = this.getSnapshot();
    const lastUpdate = new Date(snapshot.lastUpdatedAt).getTime();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return now - lastUpdate > sevenDaysMs;
  },
};
