import { DatabaseTable } from '../database';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface TelemetrySession {
  id: string; // Session ID (e.g. 'usr_123')
  createdAt: string;
  userAgent?: string;
  referrer?: string; // Track AI referrers (e.g., chatgpt, perplexity)
  entryPage: string; // The first page hit
}

export interface TelemetryPageview {
  id: string; // Event ID
  sessionId: string;
  timestamp: string;
  path: string; // e.g., '/discovery/artist/nusrat-fateh-ali-khan'
  entitySlug?: string; // Extracted slug if applicable
}

export interface TelemetryEvent {
  id: string; // Event ID
  sessionId: string;
  timestamp: string;
  eventType: 'click_youtube_play' | 'click_outbound_youtube' | 'graph_traversal' | 'subscription_intent';
  sourcePage: string;
  destinationUrl?: string; // Where did they go?
  metadata?: any; // Additional context
}

// ─── Stores ─────────────────────────────────────────────────────────────────

export const sessionStore = new DatabaseTable<TelemetrySession>('telemetry_sessions');
export const pageviewStore = new DatabaseTable<TelemetryPageview>('telemetry_pageviews');
export const eventStore = new DatabaseTable<TelemetryEvent>('telemetry_events');

// ─── Analytical Helper Functions ────────────────────────────────────────────

/**
 * Audit #2 & #3: Graph Depth & Transfers
 * Calculate how many users start at a specific cluster and move through the funnel.
 */
export function getClusterFunnel(clusterSlug: string) {
  // 1. Find all sessions that viewed the cluster entity
  const allPageviews = pageviewStore.findAll();
  const allEvents = eventStore.findAll();
  
  const entityViews = allPageviews.filter(pv => pv.entitySlug === clusterSlug);
  const sessionIds = new Set(entityViews.map(pv => pv.sessionId));
  
  // Volume Metrics
  let publicationReads = 0;
  let releaseOpens = 0;
  let videoPlays = 0;
  let youtubeTransfers = 0;

  // Graph Traversal Metrics
  let totalDepth = 0;
  let orphanExits = 0;

  const routes: Record<string, number> = {};

  sessionIds.forEach(sid => {
    // Session-specific events
    const sViews = allPageviews.filter(pv => pv.sessionId === sid).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const sEvents = allEvents.filter(e => e.sessionId === sid);

    // Funnel Boolean Flags per Session
    let readPub = false;
    let openedRelease = false;
    let playedVideo = false;
    let transferred = false;

    // Depth = number of unique pages visited
    const uniquePaths = new Set(sViews.map(v => v.path));
    totalDepth += uniquePaths.size;

    // Track Routes (From A -> B)
    for (let i = 0; i < sViews.length - 1; i++) {
      const from = sViews[i].entitySlug;
      const to = sViews[i+1].entitySlug;
      if (from && to && from !== to) {
        const route = `${from} → ${to}`;
        routes[route] = (routes[route] || 0) + 1;
      }
    }

    sViews.forEach(v => {
      if (v.path.includes('/publication/')) readPub = true;
      if (v.path.includes('/release/')) openedRelease = true;
    });

    sEvents.forEach(e => {
      if (e.eventType === 'click_youtube_play') playedVideo = true;
      if (e.eventType === 'click_outbound_youtube') transferred = true;
    });

    if (readPub) publicationReads++;
    if (openedRelease) releaseOpens++;
    if (playedVideo) videoPlays++;
    if (transferred) youtubeTransfers++;

    // Orphan Exit: If they only visited the entity and left without exploring other nodes or converting
    if (uniquePaths.size === 1 && !transferred && !playedVideo) {
      orphanExits++;
    }
  });

  // Calculate AI Referrals (Audit #4)
  const sessionsList = sessionStore.findAll().filter(s => sessionIds.has(s.id));
  let aiReferrals = 0;
  let searchEntrances = 0;

  sessionsList.forEach(s => {
    const ref = (s.referrer || '').toLowerCase();
    if (ref.includes('chatgpt') || ref.includes('perplexity') || ref.includes('claude')) {
      aiReferrals++;
    } else if (ref.includes('google') || ref.includes('bing')) {
      searchEntrances++;
    }
  });

  // Top Routes sorting
  const topPaths = Object.entries(routes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);

  return {
    trafficSources: {
      organicSearch: searchEntrances,
      aiReferrals: aiReferrals,
      internalGraph: Math.max(0, sessionIds.size - searchEntrances - aiReferrals),
    },
    funnel: {
      entityViews: sessionIds.size,
      publicationReads,
      releaseOpens,
      videoPlays,
      youtubeTransfers
    },
    graphDepth: {
      averageDepth: sessionIds.size > 0 ? parseFloat((totalDepth / sessionIds.size).toFixed(1)) : 0,
      orphanExits: sessionIds.size > 0 ? parseFloat(((orphanExits / sessionIds.size) * 100).toFixed(1)) : 0,
      topPaths
    }
  };
}
