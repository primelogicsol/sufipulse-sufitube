import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_ORIGIN } from './canonical-seo';

// 1. Official Brand Asset Interface
export interface BrandAssetRecord {
  id: string;
  name: string;
  type:
    | 'master_brand'
    | 'website'
    | 'youtube_channel'
    | 'production_brand'
    | 'media_brand'
    | 'release_brand'
    | 'knowledge_brand';
  url: string;
  description: string;
  status: 'verified' | 'monitoring' | 'pending';
}

// 2. SERP Search Ownership Interface (Manual Observation Only — never conflated with API metrics)
export interface SearchOwnershipRecord {
  keyword: string;
  platform: 'google' | 'bing' | 'youtube';
  ownedResultsCount: number;
  rankingUrls: string[];
  occupancyPercent: number;
  lastChecked: string;
  source?: 'manual_observation' | 'verified_api';
}

// 3. AI Citation Observation Interface (Manual Observation Only — strictly separated from crawler/referrer logs)
export interface AiCitationRecord {
  engine: 'ChatGPT' | 'Gemini' | 'Claude' | 'Perplexity';
  citationCount: number;
  lastCitedDate: string;
  sampleQuery: string;
  citationConfidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  source?: 'manual_observation';
  verifiedBy?: string;
}

// 4. Authority Gap Task Interface
export interface AuthorityGapTask {
  id: string;
  targetAsset: string;
  gapType: 'missing_page' | 'missing_schema' | 'missing_faq' | 'missing_capture';
  message: string;
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
  actionUrl: string;
}

const resolveDataDir = () => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (typeof window === 'undefined' && fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const REGISTRY_FILE = path.join(DATA_DIR, 'brand-registry.json');
const SYNTHETIC_SEED_DATE = '2026-06-07T08:17:45.299Z';

class BrandRegistryManager {
  private assets: BrandAssetRecord[] = [];
  private searchOwnership: SearchOwnershipRecord[] = [];
  private citations: AiCitationRecord[] = [];
  private gapTasks: AuthorityGapTask[] = [];
  private lastSuccessfulApiResponseAtGsc: string | null = null;
  private lastSuccessfulApiResponseAtYoutube: string | null = null;
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

      if (fs.existsSync(REGISTRY_FILE)) {
        const content = fs.readFileSync(REGISTRY_FILE, 'utf-8');
        const parsed = JSON.parse(content || '{}');
        let dirty = false;

        this.assets = (parsed.assets || []).map((a: BrandAssetRecord) => {
          const normalizedUrl = a.url ? a.url.replace('https://www.sufipulse.com', CANONICAL_ORIGIN) : a.url;
          if (normalizedUrl !== a.url) dirty = true;
          return { ...a, url: normalizedUrl };
        });

        // Quarantine historical synthetic June 2026 SERP/AI citation counts
        this.searchOwnership = (parsed.searchOwnership || []).filter((s: SearchOwnershipRecord) => {
          if (s.lastChecked === SYNTHETIC_SEED_DATE) {
            dirty = true;
            return false;
          }
          return true;
        });

        this.citations = (parsed.citations || []).filter((c: AiCitationRecord) => {
          if (c.lastCitedDate === SYNTHETIC_SEED_DATE) {
            dirty = true;
            return false;
          }
          return true;
        });

        this.gapTasks = parsed.gapTasks || [];
        this.lastSuccessfulApiResponseAtGsc = parsed.lastSuccessfulApiResponseAtGsc || null;
        this.lastSuccessfulApiResponseAtYoutube = parsed.lastSuccessfulApiResponseAtYoutube || null;

        if (dirty) {
          this.persist();
        }
      } else {
        this.seedAssetsOnly();
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error('[BRAND-REGISTRY] Initialization failed:', err);
      this.initialized = true;
    }
  }

  private persist(): void {
    try {
      const payload = {
        assets: this.assets,
        searchOwnership: this.searchOwnership,
        citations: this.citations,
        gapTasks: this.gapTasks,
        lastSuccessfulApiResponseAtGsc: this.lastSuccessfulApiResponseAtGsc,
        lastSuccessfulApiResponseAtYoutube: this.lastSuccessfulApiResponseAtYoutube,
      };
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[BRAND-REGISTRY] Persist failed:', err);
    }
  }

  private getSeedAsset(id: string): BrandAssetRecord | null {
    switch (id) {
      case 'sufipulse':
        return {
          id: 'sufipulse',
          name: 'SufiPulse (Sufi Pulse)',
          type: 'master_brand',
          url: CANONICAL_ORIGIN,
          description: 'Institutional & creative media identity representing SufiPulse (and spaced search designation Sufi Pulse) at SufiPulse.com.',
          status: 'verified',
        };
      case 'sufipulse-com':
        return {
          id: 'sufipulse-com',
          name: 'SufiPulse.com',
          type: 'website',
          url: CANONICAL_ORIGIN,
          description: 'Authoritative canonical website, release provenance registry, and knowledge hub for SufiPulse.',
          status: 'verified',
        };
      case 'sufipulse-usa':
        return {
          id: 'sufipulse-usa',
          name: 'SufiPulse USA',
          type: 'youtube_channel',
          url: 'https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ',
          description: 'Official public music & distribution identity and primary YouTube channel (@SufiPulse-USA).',
          status: 'verified',
        };
      case 'sufipulse-studio':
        return {
          id: 'sufipulse-studio',
          name: 'SufiPulse Studio USA',
          type: 'production_brand',
          url: `${CANONICAL_ORIGIN}/studio`,
          description: 'Production & creative studio identity responsible for authorized SufiPulse recordings and release materials.',
          status: 'verified',
        };
      case 'sufitube':
        return {
          id: 'sufitube',
          name: 'SufiTube (Sufi Tube)',
          type: 'media_brand',
          url: `${CANONICAL_ORIGIN}/sufitube`,
          description: 'Official video & sacred-media publishing identity (SufiTube / Sufi Tube) of SufiPulse USA.',
          status: 'verified',
        };
      case 'sufipulse-records':
        return {
          id: 'sufipulse-records',
          name: 'SufiPulse Records',
          type: 'release_brand',
          url: `${CANONICAL_ORIGIN}/releases`,
          description: 'Official music publication, publishing, and digital distribution division.',
          status: 'verified',
        };
      case 'sufipulse-encyclopedia':
        return {
          id: 'sufipulse-encyclopedia',
          name: 'SufiPulse Discovery',
          type: 'knowledge_brand',
          url: `${CANONICAL_ORIGIN}/discovery`,
          description: 'Ecosystem semantic discovery hub, Sufi terminology nodes, and knowledge graph.',
          status: 'verified',
        };
      default:
        return null;
    }
  }

  private seedAssetsOnly(): void {
    const ids = [
      'sufipulse',
      'sufipulse-com',
      'sufipulse-usa',
      'sufipulse-studio',
      'sufitube',
      'sufipulse-records',
      'sufipulse-encyclopedia',
    ];
    this.assets = ids.map((id) => this.getSeedAsset(id)!).filter(Boolean);
    // STRICT GOVERNANCE: Do NOT pre-seed synthetic SERP occupancy or fabricated AI citation counts.
    this.searchOwnership = [];
    this.citations = [];
    this.gapTasks = this.detectDynamicGaps();
  }

  public detectDynamicGaps(): AuthorityGapTask[] {
    const gaps: AuthorityGapTask[] = [];

    try {
      const studioPagePath = path.join(process.cwd(), 'app', '(public)', 'studio', 'page.tsx');
      const hasStudioPage = fs.existsSync(studioPagePath);
      gaps.push({
        id: 'gap-studio-page',
        targetAsset: 'SufiPulse Studio',
        gapType: 'missing_page',
        message: hasStudioPage
          ? 'Studio page is active at /studio with canonical metadata.'
          : 'SufiPulse Studio has no dedicated indexable authority subpage on SufiPulse.com.',
        priority: 'high',
        resolved: hasStudioPage,
        actionUrl: '/studio',
      });

      const sufitubePath = path.join(process.cwd(), 'app', '(public)', 'sufitube', 'page.tsx');
      const hasSufiTubePage = fs.existsSync(sufitubePath);
      gaps.push({
        id: 'gap-sufitube-faq',
        targetAsset: 'SufiTube',
        gapType: 'missing_faq',
        message: hasSufiTubePage
          ? 'SufiTube dedicated authority page & BroadcastChannel schema active at /sufitube.'
          : 'SufiTube has no dedicated schema-marked authority page.',
        priority: 'medium',
        resolved: hasSufiTubePage,
        actionUrl: '/sufitube',
      });

      const channelPagePath = path.join(process.cwd(), 'app', '(public)', 'official-channels', 'page.tsx');
      const channelLayoutPath = path.join(process.cwd(), 'app', '(public)', 'official-channels', 'layout.tsx');
      let hasMusicChannelSchema = false;
      for (const p of [channelPagePath, channelLayoutPath]) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf-8');
          if (content.includes('BroadcastChannel') || content.includes('MusicGroup') || content.includes('CollectionPage')) {
            hasMusicChannelSchema = true;
          }
        }
      }
      gaps.push({
        id: 'gap-channel-schema',
        targetAsset: 'Official Channel',
        gapType: 'missing_schema',
        message: hasMusicChannelSchema
          ? 'Official channels page structured data bindings verified.'
          : 'Official channels page lacks structured data markup bindings.',
        priority: 'high',
        resolved: hasMusicChannelSchema,
        actionUrl: '/official-channels',
      });

      const capturePagePath = path.join(process.cwd(), 'app', '(public)', 'official-channels', 'page.tsx');
      const hasCapturePage = fs.existsSync(capturePagePath);
      gaps.push({
        id: 'gap-capture-page',
        targetAsset: 'Keyword: Official SufiPulse',
        gapType: 'missing_capture',
        message: hasCapturePage
          ? 'Capture page for official ecosystem queries is active at /official-channels.'
          : 'No capture or landing page exists to intercept branded queries.',
        priority: 'medium',
        resolved: hasCapturePage,
        actionUrl: '/official-channels',
      });
    } catch (err) {
      console.error('[BRAND-REGISTRY] Dynamic gap detection failed:', err);
    }

    return gaps;
  }

  public getAssets(): BrandAssetRecord[] {
    this.init();
    const requiredSlugs = [
      'sufipulse',
      'sufipulse-com',
      'sufipulse-usa',
      'sufipulse-studio',
      'sufitube',
      'sufipulse-records',
      'sufipulse-encyclopedia',
    ];
    let modified = false;
    requiredSlugs.forEach((slug) => {
      if (!this.assets.some((a) => a.id === slug)) {
        const seeded = this.getSeedAsset(slug);
        if (seeded) {
          this.assets.push(seeded);
          modified = true;
        }
      }
    });
    if (modified) this.persist();
    return this.assets;
  }

  public getSearchOwnership(): SearchOwnershipRecord[] {
    this.init();
    return this.searchOwnership;
  }

  public getCitations(): AiCitationRecord[] {
    this.init();
    return this.citations;
  }

  public recordManualAiCitation(record: Omit<AiCitationRecord, 'source' | 'lastCitedDate'> & { lastCitedDate?: string }): void {
    this.init();
    const now = record.lastCitedDate || new Date().toISOString();
    const existingIdx = this.citations.findIndex((c) => c.engine === record.engine);
    const updated: AiCitationRecord = {
      ...record,
      lastCitedDate: now,
      source: 'manual_observation',
    };
    if (existingIdx >= 0) {
      this.citations[existingIdx] = updated;
    } else {
      this.citations.push(updated);
    }
    this.persist();
  }

  public getGapTasks(): AuthorityGapTask[] {
    this.init();
    try {
      const dynamicGaps = this.detectDynamicGaps();
      this.gapTasks = dynamicGaps.map((d) => {
        const found = this.gapTasks.find((g) => g.id === d.id);
        return {
          ...d,
          resolved: d.resolved || (found ? found.resolved : false),
        };
      });
      this.persist();
    } catch (err) {
      console.error('[BRAND-REGISTRY] getGapTasks sync failed:', err);
    }
    return this.gapTasks;
  }

  public resolveGapTask(id: string): void {
    this.init();
    const task = this.gapTasks.find((t) => t.id === id);
    if (task) {
      task.resolved = true;
      this.persist();
    }
  }

  public getApiSyncStatus() {
    this.init();
    return {
      lastSuccessfulApiResponseAtGsc: this.lastSuccessfulApiResponseAtGsc,
      lastSuccessfulApiResponseAtYoutube: this.lastSuccessfulApiResponseAtYoutube,
    };
  }

  public setLastSuccessfulApiResponseAtGsc(timestamp: string | null): void {
    this.init();
    this.lastSuccessfulApiResponseAtGsc = timestamp;
    this.persist();
  }

  public setLastSuccessfulApiResponseAtYoutube(timestamp: string | null): void {
    this.init();
    this.lastSuccessfulApiResponseAtYoutube = timestamp;
    this.persist();
  }
}

export const brandRegistry = new BrandRegistryManager();
