/**
 * lib/organic-discovery-telemetry.ts
 *
 * Verified First-Party Organic Entrance, AI Referral, and Website-to-YouTube
 * Conversion Telemetry Store (.data/organic-discovery-events.json).
 *
 * STRICT DATA INTEGRITY INVARIANT:
 * - Zero seeded, synthetic, mocked, or demo events are ever generated.
 * - Bot/crawler user agents are strictly excluded from human funnel counts.
 */

import fs from 'node:fs';
import path from 'node:path';

export type ReferrerChannel =
  | 'google_search'
  | 'bing_search'
  | 'duckduckgo_search'
  | 'yahoo_search'
  | 'other_search'
  | 'ai_chatgpt'
  | 'ai_perplexity'
  | 'ai_claude'
  | 'ai_gemini'
  | 'ai_copilot'
  | 'youtube_referral'
  | 'social_referral'
  | 'internal'
  | 'direct';

export type OrganicEventType =
  | 'organic_entrance'
  | 'discovery_page_view'
  | 'release_page_view'
  | 'embedded_video_play'
  | 'outbound_youtube_click'
  | 'subscribe_intent';

export interface OrganicDiscoveryEvent {
  id: string;
  timestamp: string;
  sessionHash: string;
  isReturningVisitor?: boolean;
  eventType: OrganicEventType;
  path: string;
  releaseSlug?: string;
  youtubeId?: string;
  entityType?: string;
  entitySlug?: string;
  referrerHost?: string;
  referrerChannel: ReferrerChannel;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  destinationUrl?: string;
}

interface OrganicTelemetryStoreData {
  updatedAt: string | null;
  events: OrganicDiscoveryEvent[];
}

const resolveDataDir = (): string => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (typeof window === 'undefined' && fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const EVENTS_FILE = path.join(DATA_DIR, 'organic-discovery-events.json');
const MAX_STORED_EVENTS = 5000;

export function classifyReferrerChannel(referrer?: string | null, utmSource?: string | null): {
  channel: ReferrerChannel;
  referrerHost: string;
} {
  const utm = (utmSource || '').trim().toLowerCase();
  let host = '';
  if (referrer) {
    try {
      host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      host = referrer.toLowerCase();
    }
  }

  if (host === 'sufipulse.com' || host.endsWith('.sufipulse.com') || host.startsWith('localhost')) {
    return { channel: 'internal', referrerHost: host };
  }

  const combined = `${host} ${utm}`;
  if (combined.includes('chatgpt.com') || combined.includes('chat.openai.com') || utm === 'chatgpt.com') {
    return { channel: 'ai_chatgpt', referrerHost: host || utm };
  }
  if (combined.includes('perplexity.ai')) {
    return { channel: 'ai_perplexity', referrerHost: host || utm };
  }
  if (combined.includes('claude.ai') || combined.includes('anthropic.com')) {
    return { channel: 'ai_claude', referrerHost: host || utm };
  }
  if (combined.includes('gemini.google.com') || combined.includes('bard.google.com')) {
    return { channel: 'ai_gemini', referrerHost: host || utm };
  }
  if (combined.includes('copilot.microsoft.com')) {
    return { channel: 'ai_copilot', referrerHost: host || utm };
  }
  if (combined.includes('google.')) {
    return { channel: 'google_search', referrerHost: host || utm };
  }
  if (combined.includes('bing.com')) {
    return { channel: 'bing_search', referrerHost: host || utm };
  }
  if (combined.includes('duckduckgo.com')) {
    return { channel: 'duckduckgo_search', referrerHost: host || utm };
  }
  if (combined.includes('yahoo.com') || combined.includes('search.yahoo')) {
    return { channel: 'yahoo_search', referrerHost: host || utm };
  }
  if (combined.includes('yandex.') || combined.includes('baidu.com') || combined.includes('ecosia.org') || combined.includes('seznam.cz')) {
    return { channel: 'other_search', referrerHost: host || utm };
  }
  if (combined.includes('youtube.com') || combined.includes('youtu.be')) {
    return { channel: 'youtube_referral', referrerHost: host || utm };
  }
  if (
    combined.includes('facebook.com') ||
    combined.includes('instagram.com') ||
    combined.includes('t.co') ||
    combined.includes('x.com') ||
    combined.includes('whatsapp.com') ||
    combined.includes('telegram.org') ||
    combined.includes('t.me') ||
    combined.includes('linkedin.com') ||
    combined.includes('reddit.com')
  ) {
    return { channel: 'social_referral', referrerHost: host || utm };
  }

  return { channel: 'direct', referrerHost: host };
}

class OrganicDiscoveryTelemetry {
  private store: OrganicTelemetryStoreData = { updatedAt: null, events: [] };
  private initialized = false;

  public init(): void {
    if (typeof window !== 'undefined') return;
    if (this.initialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(EVENTS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8') || '{}');
        this.store = {
          updatedAt: parsed.updatedAt || null,
          events: Array.isArray(parsed.events) ? parsed.events : [],
        };
      }
      this.initialized = true;
    } catch (err) {
      console.error('[ORGANIC-DISCOVERY-TELEMETRY] Init error:', err);
      this.store = { updatedAt: null, events: [] };
      this.initialized = true;
    }
  }

  public forceHydrate(): void {
    this.initialized = false;
    this.init();
  }

  private persist(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const payload = JSON.stringify(this.store, null, 2);
      fs.writeFileSync(EVENTS_FILE, payload, 'utf-8');
      const standaloneDir = path.join(process.cwd(), '.next', 'standalone', '.data');
      if (fs.existsSync(standaloneDir)) {
        fs.writeFileSync(path.join(standaloneDir, 'organic-discovery-events.json'), payload, 'utf-8');
      }
    } catch (err) {
      console.error('[ORGANIC-DISCOVERY-TELEMETRY] Persist error:', err);
    }
  }

  public recordEvent(input: Omit<OrganicDiscoveryEvent, 'id' | 'timestamp'>): OrganicDiscoveryEvent {
    this.forceHydrate();
    const now = new Date().toISOString();
    const event: OrganicDiscoveryEvent = {
      ...input,
      id: `ode_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: now,
    };

    this.store.events.unshift(event);
    if (this.store.events.length > MAX_STORED_EVENTS) {
      this.store.events = this.store.events.slice(0, MAX_STORED_EVENTS);
    }
    this.store.updatedAt = now;
    this.persist();
    return event;
  }

  public getEvents(daysWindow?: number): OrganicDiscoveryEvent[] {
    this.forceHydrate();
    if (!daysWindow || daysWindow <= 0) return this.store.events;
    const cutoff = Date.now() - daysWindow * 86400 * 1000;
    return this.store.events.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
  }

  public getFunnelSummary(daysWindow?: number) {
    const events = this.getEvents(daysWindow);

    const entrancesByChannel: Record<ReferrerChannel, number> = {
      google_search: 0,
      bing_search: 0,
      duckduckgo_search: 0,
      yahoo_search: 0,
      other_search: 0,
      ai_chatgpt: 0,
      ai_perplexity: 0,
      ai_claude: 0,
      ai_gemini: 0,
      ai_copilot: 0,
      youtube_referral: 0,
      social_referral: 0,
      internal: 0,
      direct: 0,
    };

    let organicSearchEntrances = 0;
    let aiSearchEntrances = 0;
    let returningEntrances = 0;
    let discoveryPageViews = 0;
    let releasePageViews = 0;
    let embeddedVideoPlays = 0;
    let outboundYoutubeClicks = 0;
    let subscribeIntents = 0;

    const sessionTouchCounts = new Map<string, number>();
    const perReleaseConversion = new Map<
      string,
      { slug: string; releaseViews: number; embeddedPlays: number; outboundClicks: number; subscribeIntents: number }
    >();

    for (const ev of events) {
      sessionTouchCounts.set(ev.sessionHash, (sessionTouchCounts.get(ev.sessionHash) || 0) + 1);

      if (ev.eventType === 'organic_entrance') {
        if (ev.isReturningVisitor) returningEntrances++;
        entrancesByChannel[ev.referrerChannel] = (entrancesByChannel[ev.referrerChannel] || 0) + 1;
        if (
          ev.referrerChannel === 'google_search' ||
          ev.referrerChannel === 'bing_search' ||
          ev.referrerChannel === 'duckduckgo_search' ||
          ev.referrerChannel === 'yahoo_search' ||
          ev.referrerChannel === 'other_search'
        ) {
          organicSearchEntrances++;
        } else if (ev.referrerChannel.startsWith('ai_')) {
          aiSearchEntrances++;
        }
      } else if (ev.eventType === 'discovery_page_view') {
        discoveryPageViews++;
      } else if (ev.eventType === 'release_page_view') {
        releasePageViews++;
      } else if (ev.eventType === 'embedded_video_play') {
        embeddedVideoPlays++;
      } else if (ev.eventType === 'outbound_youtube_click') {
        outboundYoutubeClicks++;
      } else if (ev.eventType === 'subscribe_intent') {
        subscribeIntents++;
      }

      if (ev.releaseSlug) {
        const current = perReleaseConversion.get(ev.releaseSlug) || {
          slug: ev.releaseSlug,
          releaseViews: 0,
          embeddedPlays: 0,
          outboundClicks: 0,
          subscribeIntents: 0,
        };
        if (ev.eventType === 'release_page_view') current.releaseViews++;
        if (ev.eventType === 'embedded_video_play') current.embeddedPlays++;
        if (ev.eventType === 'outbound_youtube_click') current.outboundClicks++;
        if (ev.eventType === 'subscribe_intent') current.subscribeIntents++;
        perReleaseConversion.set(ev.releaseSlug, current);
      }
    }

    const uniqueSessions = sessionTouchCounts.size;
    const multiTouchSessions = Array.from(sessionTouchCounts.values()).filter((c) => c > 1).length;

    return {
      updatedAt: this.store.updatedAt,
      totalEvents: events.length,
      uniqueSessions,
      multiTouchSessions,
      returningEntrances,
      entrancesByChannel,
      organicSearchEntrances,
      aiSearchEntrances,
      discoveryPageViews,
      releasePageViews,
      embeddedVideoPlays,
      outboundYoutubeClicks,
      subscribeIntents,
      perReleaseConversion: Array.from(perReleaseConversion.values()).sort(
        (a, b) => b.embeddedPlays + b.outboundClicks - (a.embeddedPlays + a.outboundClicks)
      ),
    };
  }
}

export const organicDiscoveryTelemetry = new OrganicDiscoveryTelemetry();
