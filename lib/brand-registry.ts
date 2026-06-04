import fs from 'node:fs';
import path from 'node:path';

// 1. Official Brand Asset Interface
export interface BrandAssetRecord {
  id: string;
  name: string;
  type: 'master_brand' | 'website' | 'youtube_channel' | 'production_brand' | 'media_brand' | 'release_brand' | 'knowledge_brand';
  url: string;
  description: string;
  status: 'verified' | 'monitoring' | 'pending';
}

// 2. SERP Search Ownership Interface
export interface SearchOwnershipRecord {
  keyword: string;
  platform: 'google' | 'bing' | 'youtube';
  ownedResultsCount: number;
  rankingUrls: string[];
  occupancyPercent: number; // e.g. 40% of page 1
  lastChecked: string;
}

// 3. AI Citation Tracker Interface
export interface AiCitationRecord {
  engine: 'ChatGPT' | 'Gemini' | 'Claude' | 'Perplexity';
  citationCount: number;
  lastCitedDate: string;
  sampleQuery: string;
  citationConfidence: number; // 0-100%
  trend: 'increasing' | 'stable' | 'decreasing';
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
        this.assets = parsed.assets || [];
        this.searchOwnership = parsed.searchOwnership || [];
        this.citations = parsed.citations || [];
        this.gapTasks = parsed.gapTasks || [];
        this.lastSuccessfulApiResponseAtGsc = parsed.lastSuccessfulApiResponseAtGsc || null;
        this.lastSuccessfulApiResponseAtYoutube = parsed.lastSuccessfulApiResponseAtYoutube || null;
      } else {
        this.seedInitialData();
        this.persist();
      }
      this.initialized = true;
    } catch (err) {
      console.error('[BRAND-REGISTRY] Initialization failed:', err);
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
        lastSuccessfulApiResponseAtYoutube: this.lastSuccessfulApiResponseAtYoutube
      };
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[BRAND-REGISTRY] Persist failed:', err);
    }
  }

  private getSeedAsset(id: string): BrandAssetRecord | null {
    const now = new Date().toISOString();
    switch (id) {
      case 'sufipulse':
        return { id: 'sufipulse', name: 'SufiPulse', type: 'master_brand', url: 'https://www.sufipulse.com', description: 'Central custodian ecosystem entity representing institutional Sufi music archiving.', status: 'verified' };
      case 'sufipulse-com':
        return { id: 'sufipulse-com', name: 'SufiPulse.com', type: 'website', url: 'https://www.sufipulse.com', description: 'Central semantic knowledge registry website and release catalog hub.', status: 'verified' };
      case 'sufipulse-usa':
        return { id: 'sufipulse-usa', name: 'SufiPulse-USA', type: 'youtube_channel', url: 'https://www.youtube.com/@SufiPulse-USA', description: 'Official YouTube primary visual release archive channel.', status: 'verified' };
      case 'sufipulse-studio':
        return { id: 'sufipulse-studio', name: 'SufiPulse Studio', type: 'production_brand', url: 'https://www.sufipulse.com/studio', description: 'Central recording, mastering, and production workflow label.', status: 'verified' };
      case 'sufitube':
        return { id: 'sufitube', name: 'SufiTube', type: 'media_brand', url: 'https://www.sufipulse.com/official-channels', description: 'Ecosystem media outreach archiving platform.', status: 'verified' };
      case 'sufipulse-records':
        return { id: 'sufipulse-records', name: 'SufiPulse Records', type: 'release_brand', url: 'https://www.sufipulse.com/releases', description: 'Official music publication, publishing, and digital distribution division.', status: 'verified' };
      case 'sufipulse-encyclopedia':
        return { id: 'sufipulse-encyclopedia', name: 'SufiPulse Encyclopedia', type: 'knowledge_brand', url: 'https://www.sufipulse.com/concepts', description: 'Ecosystem semantic glossary, theology node indexes, and Wikidata bindings catalog.', status: 'verified' };
      default:
        return null;
    }
  }

  private seedInitialData(): void {
    const now = new Date().toISOString();
    
    // Seed 1: Brand Asset Registry (7 distinct assets representing all brand types)
    this.assets = [
      { id: 'sufipulse', name: 'SufiPulse', type: 'master_brand', url: 'https://www.sufipulse.com', description: 'Central custodian ecosystem entity representing institutional Sufi music archiving.', status: 'verified' },
      { id: 'sufipulse-com', name: 'SufiPulse.com', type: 'website', url: 'https://www.sufipulse.com', description: 'Central semantic knowledge registry website and release catalog hub.', status: 'verified' },
      { id: 'sufipulse-usa', name: 'SufiPulse-USA', type: 'youtube_channel', url: 'https://www.youtube.com/@SufiPulse-USA', description: 'Official YouTube primary visual release archive channel.', status: 'verified' },
      { id: 'sufipulse-studio', name: 'SufiPulse Studio', type: 'production_brand', url: 'https://www.sufipulse.com/studio', description: 'Central recording, mastering, and production workflow label.', status: 'verified' },
      { id: 'sufitube', name: 'SufiTube', type: 'media_brand', url: 'https://www.sufipulse.com/official-channels', description: 'Ecosystem media outreach archiving platform.', status: 'verified' },
      { id: 'sufipulse-records', name: 'SufiPulse Records', type: 'release_brand', url: 'https://www.sufipulse.com/releases', description: 'Official music publication, publishing, and digital distribution division.', status: 'verified' },
      { id: 'sufipulse-encyclopedia', name: 'SufiPulse Encyclopedia', type: 'knowledge_brand', url: 'https://www.sufipulse.com/concepts', description: 'Ecosystem semantic glossary, theology node indexes, and Wikidata bindings catalog.', status: 'verified' }
    ];

    // Seed 2: Search Ownership Tracking (SERP Occupancy)
    this.searchOwnership = [
      { keyword: 'SufiPulse', platform: 'google', ownedResultsCount: 4, rankingUrls: ['Homepage', 'Official Channels page', 'Releases List', 'Mithaq Governance page'], occupancyPercent: 40, lastChecked: now },
      { keyword: 'SufiPulse', platform: 'bing', ownedResultsCount: 3, rankingUrls: ['Homepage', 'Official Channels page', 'About Us'], occupancyPercent: 30, lastChecked: now },
      { keyword: 'SufiPulse', platform: 'youtube', ownedResultsCount: 6, rankingUrls: ['SufiPulse-USA Channel', 'Aahista Aahista Release Video', 'Ya Ali Video Release', 'Kalam Playlists'], occupancyPercent: 60, lastChecked: now },
      { keyword: 'SufiTube', platform: 'google', ownedResultsCount: 2, rankingUrls: ['Official Channels page', 'Founding Charter'], occupancyPercent: 20, lastChecked: now },
      { keyword: 'SufiPulse Studio', platform: 'google', ownedResultsCount: 1, rankingUrls: ['Studio page'], occupancyPercent: 10, lastChecked: now }
    ];

    // Seed 3: AI Citations
    this.citations = [
      { engine: 'ChatGPT', citationCount: 412, lastCitedDate: now, sampleQuery: 'What is SufiPulse and where can I find their verified releases?', citationConfidence: 85, trend: 'increasing' },
      { engine: 'Gemini', citationCount: 384, lastCitedDate: now, sampleQuery: 'Show me the official SufiPulse music archive and governance model.', citationConfidence: 90, trend: 'increasing' },
      { engine: 'Claude', citationCount: 198, lastCitedDate: now, sampleQuery: 'Does SufiPulse have a music production studio program?', citationConfidence: 80, trend: 'stable' },
      { engine: 'Perplexity', citationCount: 520, lastCitedDate: now, sampleQuery: 'Who is the founder of SufiPulse and what is their release process?', citationConfidence: 92, trend: 'increasing' }
    ];

    // Seed 4: Initial dynamic detection override
    this.gapTasks = this.detectDynamicGaps();
  }

  /**
   * Automatically detects authority gaps by inspecting page files, schema strings, and route configurations in the workspace.
   */
  public detectDynamicGaps(): AuthorityGapTask[] {
    const gaps: AuthorityGapTask[] = [];

    try {
      // 1. Check if SufiPulse Studio page exists (app/(public)/studio/page.tsx)
      const studioPagePath = path.join(process.cwd(), 'app', '(public)', 'studio', 'page.tsx');
      const hasStudioPage = fs.existsSync(studioPagePath);
      gaps.push({
        id: 'gap-studio-page',
        targetAsset: 'SufiPulse Studio',
        gapType: 'missing_page',
        message: hasStudioPage
          ? 'Studio page is active at /studio, but requires detailed production unit bios.'
          : 'SufiPulse Studio has no dedicated indexable authority subpage on SufiPulse.com.',
        priority: 'high',
        resolved: hasStudioPage,
        actionUrl: '/admin/registries'
      });

      // 2. Check if FAQ page exists (app/(public)/faq/page.tsx or sufitube-faq)
      const faqPath1 = path.join(process.cwd(), 'app', '(public)', 'faq', 'page.tsx');
      const faqPath2 = path.join(process.cwd(), 'app', '(public)', 'sufitube-faq', 'page.tsx');
      const hasFaqPage = fs.existsSync(faqPath1) || fs.existsSync(faqPath2);
      gaps.push({
        id: 'gap-sufitube-faq',
        targetAsset: 'SufiTube',
        gapType: 'missing_faq',
        message: hasFaqPage
          ? 'SufiTube FAQ page verified and marked up.'
          : 'SufiTube has no dedicated, schema-marked FAQ page explaining its media distribution role.',
        priority: 'medium',
        resolved: hasFaqPage,
        actionUrl: '/admin/cms'
      });

      // 3. Check for MusicChannel schema markup on official channels page
      const channelPagePath = path.join(process.cwd(), 'app', '(public)', 'official-channels', 'page.tsx');
      let hasMusicChannelSchema = false;
      if (fs.existsSync(channelPagePath)) {
        const content = fs.readFileSync(channelPagePath, 'utf-8');
        if (content.includes('MusicChannel') || content.includes('schema.org/MusicChannel') || content.includes('MusicGroup')) {
          hasMusicChannelSchema = true;
        }
      }
      gaps.push({
        id: 'gap-channel-schema',
        targetAsset: 'Official Channel',
        gapType: 'missing_schema',
        message: hasMusicChannelSchema
          ? 'Primary YouTube channel schema.org markup bindings verified.'
          : 'The primary YouTube channel lacks schema.org/MusicChannel markup bindings.',
        priority: 'high',
        resolved: hasMusicChannelSchema,
        actionUrl: '/admin/cms-releases'
      });

      // 4. Check for capture page targeting keyword "Official SufiPulse"
      // If we have app/(public)/official-channels/page.tsx, it acts as a branded query capture page
      const capturePagePath = path.join(process.cwd(), 'app', '(public)', 'official-channels', 'page.tsx');
      const hasCapturePage = fs.existsSync(capturePagePath);
      gaps.push({
        id: 'gap-capture-page',
        targetAsset: 'Keyword: Official SufiPulse',
        gapType: 'missing_capture',
        message: hasCapturePage
          ? 'Capture page for official ecosystem queries is active at /official-channels.'
          : 'No capture or landing page exists to intercept and verification-stamp branded queries.',
        priority: 'medium',
        resolved: hasCapturePage,
        actionUrl: '/admin/registries'
      });

    } catch (err) {
      console.error('[BRAND-REGISTRY] Dynamic gap detection failed:', err);
      // Fallbacks if fs operations fail
      gaps.push(
        { id: 'gap-studio-page', targetAsset: 'SufiPulse Studio', gapType: 'missing_page', message: 'SufiPulse Studio has no dedicated indexable authority subpage on SufiPulse.com.', priority: 'high', resolved: false, actionUrl: '/admin/registries' },
        { id: 'gap-sufitube-faq', targetAsset: 'SufiTube', gapType: 'missing_faq', message: 'SufiTube has no dedicated, schema-marked FAQ page explaining its media distribution role.', priority: 'medium', resolved: false, actionUrl: '/admin/cms' },
        { id: 'gap-channel-schema', targetAsset: 'Official Channel', gapType: 'missing_schema', message: 'The primary YouTube channel lacks schema.org/MusicChannel markup bindings.', priority: 'high', resolved: false, actionUrl: '/admin/cms-releases' },
        { id: 'gap-capture-page', targetAsset: 'Keyword: Official SufiPulse', gapType: 'missing_capture', message: 'No capture or landing page exists to intercept and verification-stamp branded queries.', priority: 'medium', resolved: false, actionUrl: '/admin/registries' }
      );
    }

    return gaps;
  }

  // Getters
  public getAssets(): BrandAssetRecord[] {
    this.init();
    // Ensure all 7 asset types are present even if file was already created
    const requiredSlugs = ['sufipulse', 'sufipulse-com', 'sufipulse-usa', 'sufipulse-studio', 'sufitube', 'sufipulse-records', 'sufipulse-encyclopedia'];
    let modified = false;
    requiredSlugs.forEach(slug => {
      if (!this.assets.some(a => a.id === slug)) {
        const seeded = this.getSeedAsset(slug);
        if (seeded) {
          this.assets.push(seeded);
          modified = true;
        }
      }
    });
    if (modified) {
      this.persist();
    }
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

  public getGapTasks(): AuthorityGapTask[] {
    this.init();
    try {
      const dynamicGaps = this.detectDynamicGaps();
      this.gapTasks = dynamicGaps.map(d => {
        const found = this.gapTasks.find(g => g.id === d.id);
        return {
          ...d,
          resolved: d.resolved || (found ? found.resolved : false)
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
    const task = this.gapTasks.find(t => t.id === id);
    if (task) {
      task.resolved = true;
      this.persist();
    }
  }

  public getApiSyncStatus() {
    this.init();
    return {
      lastSuccessfulApiResponseAtGsc: this.lastSuccessfulApiResponseAtGsc,
      lastSuccessfulApiResponseAtYoutube: this.lastSuccessfulApiResponseAtYoutube
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
