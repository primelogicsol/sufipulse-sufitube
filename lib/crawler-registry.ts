import fs from 'node:fs';
import path from 'node:path';

export interface CrawlerRecentHit {
  path: string;
  timestamp: string;
  userAgent: string;
}

export interface CrawlerRecord {
  crawler: string;
  category: 'search_engine' | 'ai_search' | 'social_preview';
  lastSeen: string;
  pagesCrawled: number;
  frequency: number; // hits per hour since firstSeen
  firstSeen: string;
  recentPaths?: CrawlerRecentHit[];
}

const resolveDataDir = () => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (typeof window === 'undefined' && fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const CRAWLER_FILE = path.join(DATA_DIR, 'crawler-registry.json');

export const BOT_MAPPING: Array<{
  name: string;
  pattern: string;
  category: CrawlerRecord['category'];
}> = [
  { name: 'Googlebot', pattern: 'googlebot', category: 'search_engine' },
  { name: 'Google-Extended', pattern: 'google-extended', category: 'ai_search' },
  { name: 'GoogleOther', pattern: 'googleother', category: 'search_engine' },
  { name: 'Bingbot', pattern: 'bingbot', category: 'search_engine' },
  { name: 'OAI-SearchBot', pattern: 'oai-searchbot', category: 'ai_search' },
  { name: 'GPTBot', pattern: 'gptbot', category: 'ai_search' },
  { name: 'ChatGPT-User', pattern: 'chatgpt-user', category: 'ai_search' },
  { name: 'ClaudeBot', pattern: 'claudebot', category: 'ai_search' },
  { name: 'Claude-Web', pattern: 'claude-web', category: 'ai_search' },
  { name: 'anthropic-ai', pattern: 'anthropic-ai', category: 'ai_search' },
  { name: 'PerplexityBot', pattern: 'perplexity', category: 'ai_search' },
  { name: 'Applebot', pattern: 'applebot', category: 'search_engine' },
  { name: 'DuckDuckBot', pattern: 'duckduckbot', category: 'search_engine' },
  { name: 'YandexBot', pattern: 'yandexbot', category: 'search_engine' },
  { name: 'FacebookExternalHit', pattern: 'facebookexternalhit', category: 'social_preview' },
  { name: 'LinkedInBot', pattern: 'linkedinbot', category: 'social_preview' },
  { name: 'Twitterbot', pattern: 'twitterbot', category: 'social_preview' },
];

class CrawlerRegistry {
  private records: Record<string, CrawlerRecord> = {};
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

      if (fs.existsSync(CRAWLER_FILE)) {
        const content = fs.readFileSync(CRAWLER_FILE, 'utf-8');
        const list = JSON.parse(content || '[]');
        this.records = {};
        if (Array.isArray(list)) {
          list.forEach((rec: CrawlerRecord) => {
            // Quarantine historical synthetic seed records stamped on 2026-06-05T08:17:45.084Z
            if (rec.firstSeen === '2026-06-05T08:17:45.084Z') return;
            const matched = BOT_MAPPING.find((b) => b.name === rec.crawler);
            this.records[rec.crawler] = {
              ...rec,
              category: rec.category || matched?.category || 'search_engine',
              recentPaths: Array.isArray(rec.recentPaths) ? rec.recentPaths : [],
            };
          });
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('[CRAWLER-REGISTRY] Initialization failed:', error);
      this.initialized = true;
    }
  }

  public forceHydrate(): void {
    this.initialized = false;
    this.init();
  }

  private persist(): void {
    try {
      const list = Object.values(this.records);
      const serialized = JSON.stringify(list, null, 2);
      fs.writeFileSync(CRAWLER_FILE, serialized, 'utf-8');

      const standaloneDataDir = path.join(process.cwd(), '.next', 'standalone', '.data');
      if (fs.existsSync(standaloneDataDir)) {
        const standaloneDataFile = path.join(standaloneDataDir, 'crawler-registry.json');
        fs.writeFileSync(standaloneDataFile, serialized, 'utf-8');
      }
    } catch (error) {
      console.error('[CRAWLER-REGISTRY] Failed to write crawler data to disk:', error);
    }
  }

  public isBot(userAgent: string): boolean {
    const ua = (userAgent || '').toLowerCase();
    return BOT_MAPPING.some((b) => ua.includes(b.pattern));
  }

  public logVisit(userAgent: string, pathUrl?: string): void {
    this.forceHydrate();
    const ua = (userAgent || '').toLowerCase();
    const matchedBot = BOT_MAPPING.find((b) => ua.includes(b.pattern));

    if (!matchedBot) return;

    const crawlerName = matchedBot.name;
    const now = new Date().toISOString();
    const cleanPath = (pathUrl || '/').split('?')[0] || '/';
    const hitEntry: CrawlerRecentHit = {
      path: cleanPath,
      timestamp: now,
      userAgent: (userAgent || '').slice(0, 180),
    };

    if (this.records[crawlerName]) {
      const record = this.records[crawlerName];
      record.pagesCrawled++;
      const hoursSinceFirstSeen = Math.max(
        1,
        (new Date(now).getTime() - new Date(record.firstSeen).getTime()) / (1000 * 60 * 60)
      );
      record.frequency = parseFloat((record.pagesCrawled / hoursSinceFirstSeen).toFixed(2));
      record.lastSeen = now;
      record.category = matchedBot.category;
      record.recentPaths = [hitEntry, ...(record.recentPaths || [])].slice(0, 50);
    } else {
      this.records[crawlerName] = {
        crawler: crawlerName,
        category: matchedBot.category,
        lastSeen: now,
        pagesCrawled: 1,
        frequency: 1,
        firstSeen: now,
        recentPaths: [hitEntry],
      };
    }

    this.persist();
  }

  public getRecords(): CrawlerRecord[] {
    this.forceHydrate();
    return Object.values(this.records).sort((a, b) => b.pagesCrawled - a.pagesCrawled);
  }
}

export const crawlerRegistry = new CrawlerRegistry();
