import fs from 'node:fs';
import path from 'node:path';

export type DiscoverySourceType = 'concept' | 'theme' | 'region' | 'release' | 'playlist';
export type DiscoveryActionType = 'video_click' | 'playlist_click' | 'subscribe_click' | 'page_view' | 'brand_asset_click';

export interface DiscoveryClickTally {
  sourceType: DiscoverySourceType;
  sourceSlug: string;
  actionType: DiscoveryActionType;
  count: number;
  updatedAt: string;
  assetType?: string;
  assetName?: string;
  sourcePage?: string;
}

const resolveDataDir = () => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (typeof window === 'undefined' && fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const ANALYTICS_FILE = path.join(DATA_DIR, 'discovery-analytics.json');

class DiscoveryAnalytics {
  private tallies: Record<string, DiscoveryClickTally> = {};
  private initialized = false;

  constructor() {
    this.init();
  }

  public init(): void {
    if (typeof window !== 'undefined') return;
    if (this.initialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(ANALYTICS_FILE)) {
        const content = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
        const list = JSON.parse(content || '[]');
        this.tallies = {};
        list.forEach((tally: DiscoveryClickTally) => {
          const key = `${tally.sourceType}_${tally.sourceSlug}_${tally.actionType}`;
          this.tallies[key] = tally;
        });
      } else {
        console.log('[DISCOVERY-ANALYTICS] Analytics file not found. Seeding initial baseline telemetry...');
        this.seedInitialMetrics();
        this.persist();
      }
      this.initialized = true;
    } catch (error) {
      console.error('[DISCOVERY-ANALYTICS] Initialization failed:', error);
    }
  }

  public forceHydrate(): void {
    this.initialized = false;
    this.init();
  }

  private persist(): void {
    try {
      const list = Object.values(this.tallies);
      const serialized = JSON.stringify(list, null, 2);
      fs.writeFileSync(ANALYTICS_FILE, serialized, 'utf-8');

      // Standalone double-write caching support (production Docker container mapping helper)
      const standaloneDataDir = path.join(process.cwd(), '.next', 'standalone', '.data');
      if (fs.existsSync(standaloneDataDir)) {
        const standaloneDataFile = path.join(standaloneDataDir, 'discovery-analytics.json');
        fs.writeFileSync(standaloneDataFile, serialized, 'utf-8');
      }
    } catch (error) {
      console.error('[DISCOVERY-ANALYTICS] Failed to write analytics to disk:', error);
    }
  }

  /**
   * Seed realistic telemetry to demonstrate the discovery performance model immediately
   */
  private seedInitialMetrics(): void {
    const now = new Date().toISOString();
    const seedData: Omit<DiscoveryClickTally, 'updatedAt'>[] = [
      // Concepts - Sabr (High Performing Winner)
      { sourceType: 'concept', sourceSlug: 'sabr', actionType: 'page_view', count: 1250 },
      { sourceType: 'concept', sourceSlug: 'sabr', actionType: 'video_click', count: 184 },
      { sourceType: 'concept', sourceSlug: 'sabr', actionType: 'playlist_click', count: 42 },
      { sourceType: 'concept', sourceSlug: 'sabr', actionType: 'subscribe_click', count: 15 },
      
      // Concepts - Fana (Winner)
      { sourceType: 'concept', sourceSlug: 'fana', actionType: 'page_view', count: 1500 },
      { sourceType: 'concept', sourceSlug: 'fana', actionType: 'video_click', count: 245 },
      { sourceType: 'concept', sourceSlug: 'fana', actionType: 'playlist_click', count: 68 },
      { sourceType: 'concept', sourceSlug: 'fana', actionType: 'subscribe_click', count: 29 },

      // Concepts - Ishq (Winner)
      { sourceType: 'concept', sourceSlug: 'ishq', actionType: 'page_view', count: 1800 },
      { sourceType: 'concept', sourceSlug: 'ishq', actionType: 'video_click', count: 320 },
      { sourceType: 'concept', sourceSlug: 'ishq', actionType: 'playlist_click', count: 95 },
      { sourceType: 'concept', sourceSlug: 'ishq', actionType: 'subscribe_click', count: 47 },

      // Concepts - Tawakkul (Loser: Traffic with zero clicks)
      { sourceType: 'concept', sourceSlug: 'tawakkul', actionType: 'page_view', count: 480 },
      { sourceType: 'concept', sourceSlug: 'tawakkul', actionType: 'video_click', count: 0 },
      { sourceType: 'concept', sourceSlug: 'tawakkul', actionType: 'playlist_click', count: 0 },
      { sourceType: 'concept', sourceSlug: 'tawakkul', actionType: 'subscribe_click', count: 0 },

      // Concepts - Dhikr (Loser: Has clicks but no playlist continuation)
      { sourceType: 'concept', sourceSlug: 'dhikr', actionType: 'page_view', count: 620 },
      { sourceType: 'concept', sourceSlug: 'dhikr', actionType: 'video_click', count: 92 },
      { sourceType: 'concept', sourceSlug: 'dhikr', actionType: 'playlist_click', count: 0 },
      { sourceType: 'concept', sourceSlug: 'dhikr', actionType: 'subscribe_click', count: 12 },

      // Themes - Spiritual Journey
      { sourceType: 'theme', sourceSlug: 'spiritual-journey', actionType: 'page_view', count: 1100 },
      { sourceType: 'theme', sourceSlug: 'spiritual-journey', actionType: 'video_click', count: 198 },
      { sourceType: 'theme', sourceSlug: 'spiritual-journey', actionType: 'playlist_click', count: 54 },
      { sourceType: 'theme', sourceSlug: 'spiritual-journey', actionType: 'subscribe_click', count: 22 },

      // Themes - Divine Union
      { sourceType: 'theme', sourceSlug: 'divine-union', actionType: 'page_view', count: 950 },
      { sourceType: 'theme', sourceSlug: 'divine-union', actionType: 'video_click', count: 150 },
      { sourceType: 'theme', sourceSlug: 'divine-union', actionType: 'playlist_click', count: 35 },
      { sourceType: 'theme', sourceSlug: 'divine-union', actionType: 'subscribe_click', count: 14 },

      // Regions - Kashmir
      { sourceType: 'region', sourceSlug: 'kashmir', actionType: 'page_view', count: 3100 },
      { sourceType: 'region', sourceSlug: 'kashmir', actionType: 'video_click', count: 412 },
      { sourceType: 'region', sourceSlug: 'kashmir', actionType: 'playlist_click', count: 120 },
      { sourceType: 'region', sourceSlug: 'kashmir', actionType: 'subscribe_click', count: 58 },

      // Regions - Punjab
      { sourceType: 'region', sourceSlug: 'punjab', actionType: 'page_view', count: 2200 },
      { sourceType: 'region', sourceSlug: 'punjab', actionType: 'video_click', count: 289 },
      { sourceType: 'region', sourceSlug: 'punjab', actionType: 'playlist_click', count: 76 },
      { sourceType: 'region', sourceSlug: 'punjab', actionType: 'subscribe_click', count: 31 },

      // Regions - Sindh (Loser: High page views but extremely low conversion)
      { sourceType: 'region', sourceSlug: 'sindh', actionType: 'page_view', count: 920 },
      { sourceType: 'region', sourceSlug: 'sindh', actionType: 'video_click', count: 3 },
      { sourceType: 'region', sourceSlug: 'sindh', actionType: 'playlist_click', count: 1 },
      { sourceType: 'region', sourceSlug: 'sindh', actionType: 'subscribe_click', count: 0 },

      // Releases - Aahista Aahista
      { sourceType: 'release', sourceSlug: 'aahista-aahista', actionType: 'page_view', count: 2500 },
      { sourceType: 'release', sourceSlug: 'aahista-aahista', actionType: 'video_click', count: 512 },
      { sourceType: 'release', sourceSlug: 'aahista-aahista', actionType: 'subscribe_click', count: 88 },

      // Releases - Ya Ali
      { sourceType: 'release', sourceSlug: 'ya-ali', actionType: 'page_view', count: 1900 },
      { sourceType: 'release', sourceSlug: 'ya-ali', actionType: 'video_click', count: 384 },
      { sourceType: 'release', sourceSlug: 'ya-ali', actionType: 'subscribe_click', count: 62 },

      // Playlists - Sufi Classics
      { sourceType: 'playlist', sourceSlug: 'sufi-classics', actionType: 'page_view', count: 1400 },
      { sourceType: 'playlist', sourceSlug: 'sufi-classics', actionType: 'playlist_click', count: 310 },
      { sourceType: 'playlist', sourceSlug: 'sufi-classics', actionType: 'subscribe_click', count: 52 },

      // Playlists - Kashmiri Spirituals
      { sourceType: 'playlist', sourceSlug: 'kashmiri-spirituals', actionType: 'page_view', count: 980 },
      { sourceType: 'playlist', sourceSlug: 'kashmiri-spirituals', actionType: 'playlist_click', count: 215 },
      { sourceType: 'playlist', sourceSlug: 'kashmiri-spirituals', actionType: 'subscribe_click', count: 34 }
    ];

    seedData.forEach(d => {
      const key = `${d.sourceType}_${d.sourceSlug}_${d.actionType}`;
      this.tallies[key] = {
        ...d,
        updatedAt: now
      };
    });
  }

  /**
   * Log click event and increment tally
   */
  public recordClick(
    sourceType: DiscoverySourceType,
    sourceSlug: string,
    actionType: DiscoveryActionType,
    metadata?: {
      assetType?: string;
      assetName?: string;
      sourcePage?: string;
    }
  ): void {
    this.init();
    let key = `${sourceType}_${sourceSlug.trim().toLowerCase()}_${actionType}`;
    
    // For brand asset clicks, differentiate the telemetry registry key by assetType/assetName
    if (actionType === 'brand_asset_click' && metadata) {
      key += `_${metadata.assetType}_${metadata.assetName}`;
    }

    const now = new Date().toISOString();

    if (this.tallies[key]) {
      this.tallies[key].count++;
      this.tallies[key].updatedAt = now;
      if (metadata) {
        this.tallies[key].assetType = metadata.assetType || this.tallies[key].assetType;
        this.tallies[key].assetName = metadata.assetName || this.tallies[key].assetName;
        this.tallies[key].sourcePage = metadata.sourcePage || this.tallies[key].sourcePage;
      }
    } else {
      this.tallies[key] = {
        sourceType,
        sourceSlug: sourceSlug.trim().toLowerCase(),
        actionType,
        count: 1,
        updatedAt: now,
        ...metadata
      };
    }
    this.persist();
  }

  /**
   * Retrieve tallies filtered by source type
   */
  public getTalliesForType(sourceType: DiscoverySourceType): DiscoveryClickTally[] {
    this.init();
    return Object.values(this.tallies).filter(t => t.sourceType === sourceType);
  }

  /**
   * Aggregate totals for high-level dashboard summaries
   */
  public getActionTotals(): Record<DiscoveryActionType, number> {
    this.init();
    const totals: Record<DiscoveryActionType, number> = {
      video_click: 0,
      playlist_click: 0,
      subscribe_click: 0,
      page_view: 0,
      brand_asset_click: 0
    };

    Object.values(this.tallies).forEach(t => {
      totals[t.actionType] += t.count;
    });

    return totals;
  }
}

export const discoveryAnalytics = new DiscoveryAnalytics();
