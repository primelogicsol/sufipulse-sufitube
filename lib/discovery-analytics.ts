import fs from 'node:fs';
import path from 'node:path';

export type DiscoverySourceType =
  | 'concept'
  | 'theme'
  | 'mood'
  | 'region'
  | 'language'
  | 'diasporaMarket'
  | 'release'
  | 'playlist'
  | 'discovery_entity'
  | 'knowledge'
  | 'article';

export type DiscoveryActionType =
  | 'video_click'
  | 'playlist_click'
  | 'subscribe_click'
  | 'page_view'
  | 'brand_asset_click';

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

// Exact timestamp of the historical synthetic demo seed batch from 2026-06-07
const SYNTHETIC_SEED_TIMESTAMP = '2026-06-07T08:17:44.925Z';

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
        let removedSeededRows = false;
        if (Array.isArray(list)) {
          list.forEach((tally: DiscoveryClickTally) => {
            if (tally.updatedAt === SYNTHETIC_SEED_TIMESTAMP) {
              removedSeededRows = true;
              return;
            }
            let key = `${tally.sourceType}_${tally.sourceSlug}_${tally.actionType}`;
            if (tally.actionType === 'brand_asset_click' && (tally.assetType || tally.assetName)) {
              key += `_${tally.assetType || ''}_${tally.assetName || ''}`;
            }
            this.tallies[key] = tally;
          });
        }
        if (removedSeededRows) {
          this.persist();
        }
      }
      // STRICT GOVERNANCE: Do NOT seed synthetic demo metrics when file is empty or created.
      this.initialized = true;
    } catch (error) {
      console.error('[DISCOVERY-ANALYTICS] Initialization failed:', error);
      this.initialized = true;
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

      const standaloneDataDir = path.join(process.cwd(), '.next', 'standalone', '.data');
      if (fs.existsSync(standaloneDataDir)) {
        const standaloneDataFile = path.join(standaloneDataDir, 'discovery-analytics.json');
        fs.writeFileSync(standaloneDataFile, serialized, 'utf-8');
      }
    } catch (error) {
      console.error('[DISCOVERY-ANALYTICS] Failed to write analytics to disk:', error);
    }
  }

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
    this.forceHydrate();
    let key = `${sourceType}_${sourceSlug.trim().toLowerCase()}_${actionType}`;

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
        ...metadata,
      };
    }
    this.persist();
  }

  public getTalliesForType(sourceType: DiscoverySourceType): DiscoveryClickTally[] {
    this.forceHydrate();
    return Object.values(this.tallies).filter((t) => t.sourceType === sourceType);
  }

  public getAllTallies(): DiscoveryClickTally[] {
    this.forceHydrate();
    return Object.values(this.tallies);
  }

  public getActionTotals(): Record<DiscoveryActionType, number> {
    this.forceHydrate();
    const totals: Record<DiscoveryActionType, number> = {
      video_click: 0,
      playlist_click: 0,
      subscribe_click: 0,
      page_view: 0,
      brand_asset_click: 0,
    };

    Object.values(this.tallies).forEach((t) => {
      if (t.actionType in totals) {
        totals[t.actionType] += t.count;
      }
    });

    return totals;
  }
}

export const discoveryAnalytics = new DiscoveryAnalytics();
