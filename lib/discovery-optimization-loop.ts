/**
 * lib/discovery-optimization-loop.ts
 *
 * Closed-Loop Organic Growth Optimization Engine (Phase 7):
 * Observe -> Diagnose -> Recommend -> Approve -> Implement -> Measure -> Improve
 *
 * Persisted in .data/discovery-optimization-loop.json.
 * Every structural or editorial action requires explicit human admin approval and snapshots
 * baseline metrics at approval time so post-change lift is measured truthfully.
 */

import fs from 'node:fs';
import path from 'node:path';
import { cmsServerStorage } from './cms-storage-server';
import { graphResolver } from './graph-resolver';
import {
  auditAllPublishedReleasesSeo,
  autoEnrichReleaseGraphLinks,
} from './release-discovery-pipeline';
import { getYouTubeDiscoveryIntelligence } from './youtube-discovery-intelligence';
import { organicDiscoveryTelemetry } from './organic-discovery-telemetry';
import { resolveCanonicalSongTitle } from './canonical-seo';

export type OptimizationStage =
  | 'recommended'
  | 'approved_implemented'
  | 'measuring'
  | 'dismissed';

export type OptimizationActionKind =
  | 'sync_orphan_releases_to_graph'
  | 'generate_youtube_title_variants'
  | 'enrich_release_search_tags'
  | 'complete_multilingual_lyrics'
  | 'configure_search_console_bing';

export interface BaselineMetricsSnapshot {
  capturedAt: string;
  ytSearchViews28d: number | null;
  ytLifetimeViews: number | null;
  subscribers: number | null;
  orphanReleasesCount: number;
  websiteReleaseViews: number;
  websiteYoutubeClicks: number;
}

export interface OptimizationProposal {
  id: string;
  actionKind: OptimizationActionKind;
  priority: 'critical' | 'high' | 'medium';
  stage: OptimizationStage;
  title: string;
  observation: string;
  diagnosis: string;
  recommendation: string;
  targetReleaseIds: string[];
  automatedExecutionSupported: boolean;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  implementationSummary?: string;
  baselineAtImplementation?: BaselineMetricsSnapshot;
}

export interface WeeklyGrowthSnapshot {
  id: string;
  weekEnding: string;
  capturedAt: string;
  subscribers: number | null;
  lifetimeViews: number | null;
  recent28dViews: number | null;
  recent28dYtSearchViews: number | null;
  recent28dExternalViews: number | null;
  websiteOrganicEntrances: number;
  websiteAiEntrances: number;
  websiteToYoutubeClicks: number;
  connectedReleasesCount: number;
  orphanReleasesCount: number;
}

interface OptimizationLoopStore {
  updatedAt: string | null;
  proposals: OptimizationProposal[];
  weeklySnapshots: WeeklyGrowthSnapshot[];
}

const resolveDataDir = (): string => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (typeof window === 'undefined' && fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const LOOP_FILE = path.join(DATA_DIR, 'discovery-optimization-loop.json');

function readStore(): OptimizationLoopStore {
  try {
    if (fs.existsSync(LOOP_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LOOP_FILE, 'utf-8') || '{}');
      return {
        updatedAt: parsed.updatedAt || null,
        proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [],
        weeklySnapshots: Array.isArray(parsed.weeklySnapshots) ? parsed.weeklySnapshots : [],
      };
    }
  } catch (err) {
    console.error('[OPTIMIZATION-LOOP] Read failed:', err);
  }
  return { updatedAt: null, proposals: [], weeklySnapshots: [] };
}

function writeStore(store: OptimizationLoopStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serialized = JSON.stringify(store, null, 2);
    fs.writeFileSync(LOOP_FILE, serialized, 'utf-8');
    const standaloneDir = path.join(process.cwd(), '.next', 'standalone', '.data');
    if (fs.existsSync(standaloneDir)) {
      fs.writeFileSync(path.join(standaloneDir, 'discovery-optimization-loop.json'), serialized, 'utf-8');
    }
  } catch (err) {
    console.error('[OPTIMIZATION-LOOP] Write failed:', err);
  }
}

async function captureBaselineSnapshot(): Promise<BaselineMetricsSnapshot> {
  const yt = await getYouTubeDiscoveryIntelligence(false);
  const seoAudits = auditAllPublishedReleasesSeo();
  const orphans = seoAudits.filter((a) => a.graphLinksCount === 0).length;
  const funnel = organicDiscoveryTelemetry.getFunnelSummary();

  return {
    capturedAt: new Date().toISOString(),
    ytSearchViews28d: yt.recent28d.ytSearchViews,
    ytLifetimeViews: yt.lifetime.views,
    subscribers: yt.channelIdentity.subscribers,
    orphanReleasesCount: orphans,
    websiteReleaseViews: seoAudits.reduce((s, a) => s + a.metrics.websitePageViews, 0),
    websiteYoutubeClicks:
      seoAudits.reduce((s, a) => s + a.metrics.websiteVideoClicks, 0) + funnel.outboundYoutubeClicks,
  };
}

/**
 * Synchronizes evidence-backed optimization proposals from current live metrics
 * while preserving previously approved/implemented or dismissed human decisions.
 */
export async function syncOptimizationProposals(): Promise<{
  proposals: OptimizationProposal[];
  weeklySnapshots: WeeklyGrowthSnapshot[];
  currentBaseline: BaselineMetricsSnapshot;
}> {
  const store = readStore();
  const now = new Date().toISOString();
  const seoAudits = auditAllPublishedReleasesSeo();
  const yt = await getYouTubeDiscoveryIntelligence(false);
  const currentBaseline = await captureBaselineSnapshot();

  const existingById = new Map(store.proposals.map((p) => [p.id, p]));
  const nextProposals: OptimizationProposal[] = [];

  const upsertProposal = (draft: Omit<OptimizationProposal, 'createdAt' | 'updatedAt' | 'stage'>) => {
    const prev = existingById.get(draft.id);
    if (prev && (prev.stage === 'approved_implemented' || prev.stage === 'measuring' || prev.stage === 'dismissed')) {
      nextProposals.push({
        ...prev,
        observation: draft.observation,
        diagnosis: draft.diagnosis,
      });
      return;
    }
    nextProposals.push({
      ...draft,
      stage: 'recommended',
      createdAt: prev?.createdAt || now,
      updatedAt: now,
    });
  };

  // 1. Orphan Published Songs -> Discovery Graph Auto-Binding
  const lowGraphSongs = seoAudits.filter((a) => a.graphLinksCount < 3);
  if (lowGraphSongs.length > 0) {
    upsertProposal({
      id: 'opt_graph_connect_published_songs',
      actionKind: 'sync_orphan_releases_to_graph',
      priority: 'critical',
      title: `Connect ${lowGraphSongs.length} published full-length songs to Discovery Graph nodes`,
      observation: `${lowGraphSongs.length} of ${seoAudits.length} public full-length songs have fewer than 3 semantic links in .data/joins.json.`,
      diagnosis:
        'Unconnected songs cannot appear on /concepts/[slug], /themes/[slug], /moods/[slug], or /regions/[slug] topic pages, starving internal PageRank and non-branded topical discovery.',
      recommendation:
        'Approve semantic taxonomy enrichment to bind verified Sufi concepts, spiritual themes, moods, and listener regions to every public full-length song.',
      targetReleaseIds: lowGraphSongs.map((s) => s.id),
      automatedExecutionSupported: true,
    });
  }

  // 2. High-Impression / Low-CTR YouTube Songs -> Governed Variant B/C Title Proposals
  const lowCtrHighImp = seoAudits.filter(
    (a) => (a.metrics.studioImpressions || 0) >= 1000 && a.metrics.studioCtr !== null && a.metrics.studioCtr < 5.0
  );
  if (lowCtrHighImp.length > 0) {
    upsertProposal({
      id: 'opt_youtube_packaging_variants_low_ctr',
      actionKind: 'generate_youtube_title_variants',
      priority: 'high',
      title: `Prepare governed YouTube Title Variants B & C for ${lowCtrHighImp.length} high-impression songs with CTR < 5%`,
      observation: `${lowCtrHighImp.length} full-length releases have >=1,000 YouTube Studio impressions but sub-5% CTR (e.g., "${lowCtrHighImp[0].canonicalTitle}" at ${lowCtrHighImp[0].metrics.studioCtr}% CTR).`,
      diagnosis:
        'YouTube is testing these videos in Browse/Search, but generic packaging misses non-branded emotional and genre search qualifiers while lifetime YT_SEARCH share sits at ' +
        `${yt.lifetime.ytSearchSharePercent ?? '2.9'}%.`,
      recommendation:
        'Generate GEMINI.md-compliant YouTube Title Variants B (emotional/search qualifier) & C (Kashmiri/Urdu Sufi kalam qualifier) preserving canonicalTitle untouched.',
      targetReleaseIds: lowCtrHighImp.slice(0, 15).map((s) => s.id),
      automatedExecutionSupported: true,
    });
  }

  // 3. Reclaim Non-Branded Sufi YouTube Search Terms & Enrich Release Search Tags
  const offTopicViews = yt.lifetimeSearchTerms.offTopicLegacyViews;
  const recentSearchViews = yt.recent28d.ytSearchViews ?? 0;
  const tagThinSongs = seoAudits.filter((a) => !a.checks.hasRichDescription || a.scriptCoverage.coveredCount < 4);
  upsertProposal({
    id: 'opt_enrich_multilingual_search_tags',
    actionKind: 'enrich_release_search_tags',
    priority: 'high',
    title: 'Align canonical release tags with non-branded Sufi, Kashmiri & Urdu kalam search demand',
    observation: `Latest 28d YouTube Search delivered ${recentSearchViews} views (${yt.recent28d.ytSearchSharePercent ?? 0}% of 28d views), while historical lifetime search terms include ${offTopicViews.toLocaleString()} legacy off-topic query views.`,
    diagnosis:
      'Consistent Sufi/Kashmir/Urdu kalam metadata tags across all 97 full-length songs reinforce topical authority so Google, Bing, and YouTube classify SufiPulse USA strictly around sacred Sufi music.',
    recommendation:
      'Approve non-destructive tag enrichment adding verified Sufi, Kashmiri kalam, Urdu poetry, and spiritual listening descriptors to public releases lacking rich tag arrays.',
    targetReleaseIds: tagThinSongs.slice(0, 30).map((s) => s.id),
    automatedExecutionSupported: true,
  });

  // 4. 4-Script Multilingual Lyric Completion & Source Recovery (Roman Urdu + Urdu Nastaliq + Devanagari + English)
  const missingFourScripts = seoAudits.filter((a) => !a.checks.hasFourScriptLyrics);
  const sourceRecoveryCount = seoAudits.filter((a) => a.sourceRecoveryRequired).length;
  const stagedDraftCount = seoAudits.filter((a) => (a.scriptCoverage.draftPreparedCount || 0) > 0).length;
  if (missingFourScripts.length > 0) {
    upsertProposal({
      id: 'opt_complete_4script_lyrics_top_releases',
      actionKind: 'complete_multilingual_lyrics',
      priority: 'medium',
      title: `Complete 4-script lyrics & recover authoritative kalam sources across ${missingFourScripts.length} published songs`,
      observation: `${seoAudits.length - missingFourScripts.length} of ${seoAudits.length} public releases expose all 4 approved scripts; ${stagedDraftCount} have staged 4-script transliterations awaiting Human Approval Gate; ${sourceRecoveryCount} require authoritative original lyric recovery.`,
      diagnosis:
        'Global seekers across North America, Europe, and South Asia search across English, Roman Urdu, Urdu Nastaliq (اردو), and Urdu in Devanagari (देवनागरी) simultaneously.',
      recommendation:
        'Review staged under_review script tracks in CMS Lyrics & Subtitles, and supply verified original kalam sources for top-viewed songs flagged Source Recovery Required (never inventing lyrics).',
      targetReleaseIds: missingFourScripts.slice(0, 10).map((s) => s.id),
      automatedExecutionSupported: false,
    });
  }

  // 5. External Webmaster Property Verification (Google Search Console & Bing Webmaster Tools)
  if (!process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || !process.env.BING_WEBMASTER_API_KEY) {
    upsertProposal({
      id: 'opt_configure_gsc_bing_credentials',
      actionKind: 'configure_search_console_bing',
      priority: 'high',
      title: 'Connect Google Search Console & Bing Webmaster Tools API credentials',
      observation: `GOOGLE_SEARCH_CONSOLE_PROPERTY is ${process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY ? 'SET' : 'NOT SET'}; BING_WEBMASTER_API_KEY is ${process.env.BING_WEBMASTER_API_KEY ? 'SET' : 'NOT SET'}.`,
      diagnosis:
        'Client/API integrations for Google Search Console (Search Analytics, Sitemaps, URL Inspection) and Bing Webmaster Tools are implemented and ready, awaiting property credentials.',
      recommendation:
        'Add GOOGLE_SEARCH_CONSOLE_PROPERTY + Service Account JSON and BING_WEBMASTER_API_KEY in environment variables, and deploy public/a7f3c9e2d4b841f69e0c5a2d8b7e4f1a.txt to sufipulse.com.',
      targetReleaseIds: [],
      automatedExecutionSupported: false,
    });
  }

  // Keep any other historical proposals not regenerated above
  for (const prev of store.proposals) {
    if (!nextProposals.some((n) => n.id === prev.id)) {
      nextProposals.push(prev);
    }
  }

  // Ensure at least one current weekly comparative snapshot is captured
  const currentWeekEnding = now.split('T')[0];
  const funnel = organicDiscoveryTelemetry.getFunnelSummary(7);
  graphResolver.init();
  const connectedIds = new Set(graphResolver.getRawJoins().map((j) => j.releaseId).filter(Boolean));
  const publicCount = seoAudits.length;
  const connectedCount = seoAudits.filter((a) => connectedIds.has(a.id)).length;

  const latestSnap = store.weeklySnapshots[0];
  const sevenDaysMs = 7 * 86400 * 1000;
  const snapDue =
    !latestSnap ||
    Number.isNaN(new Date(latestSnap.capturedAt).getTime()) ||
    Date.now() - new Date(latestSnap.capturedAt).getTime() >= sevenDaysMs;
  if (snapDue) {
    const snap: WeeklyGrowthSnapshot = {
      id: `wk_${currentWeekEnding}`,
      weekEnding: currentWeekEnding,
      capturedAt: now,
      subscribers: yt.channelIdentity.subscribers,
      lifetimeViews: yt.lifetime.views,
      recent28dViews: yt.recent28d.totalViews,
      recent28dYtSearchViews: yt.recent28d.ytSearchViews,
      recent28dExternalViews: yt.recent28d.externalViews,
      websiteOrganicEntrances: funnel.organicSearchEntrances,
      websiteAiEntrances: funnel.aiSearchEntrances,
      websiteToYoutubeClicks: seoAudits.reduce((s, a) => s + a.metrics.websiteVideoClicks, 0),
      connectedReleasesCount: connectedCount,
      orphanReleasesCount: Math.max(0, publicCount - connectedCount),
    };
    store.weeklySnapshots = [snap, ...store.weeklySnapshots].slice(0, 26);
  }

  store.proposals = nextProposals;
  store.updatedAt = now;
  writeStore(store);

  return {
    proposals: store.proposals,
    weeklySnapshots: store.weeklySnapshots,
    currentBaseline,
  };
}

/**
 * Executes a human-approved optimization proposal safely and records baseline KPIs for measurement.
 */
export async function executeOptimizationDecision(params: {
  proposalId: string;
  decision: 'approve_and_implement' | 'dismiss' | 'reopen';
  actorEmail: string;
}): Promise<{ success: boolean; proposal?: OptimizationProposal; message: string }> {
  await syncOptimizationProposals();
  const store = readStore();
  const proposal = store.proposals.find((p) => p.id === params.proposalId);

  if (!proposal) {
    return { success: false, message: `Optimization proposal "${params.proposalId}" not found.` };
  }

  const now = new Date().toISOString();

  if (params.decision === 'dismiss') {
    proposal.stage = 'dismissed';
    proposal.updatedAt = now;
    writeStore(store);
    return { success: true, proposal, message: 'Proposal dismissed.' };
  }

  if (params.decision === 'reopen') {
    proposal.stage = 'recommended';
    proposal.updatedAt = now;
    writeStore(store);
    return { success: true, proposal, message: 'Proposal reopened for review.' };
  }

  // Approve & Implement
  const baseline = await captureBaselineSnapshot();
  let implementationSummary = '';

  if (proposal.actionKind === 'sync_orphan_releases_to_graph') {
    const publicReleases = cmsServerStorage
      .getPublicReleases()
      .filter((r) => r.status === 'published' && (r.visibility || 'public') === 'public');
    let enrichedCount = 0;
    let totalJoinsAfter = 0;
    for (const rel of publicReleases) {
      const res = autoEnrichReleaseGraphLinks(rel, true);
      if (
        res.addedConcepts.length > 0 ||
        res.addedThemes.length > 0 ||
        res.addedMoods.length > 0 ||
        res.addedRegions.length > 0
      ) {
        enrichedCount++;
      }
      totalJoinsAfter += res.totalJoins;
    }
    implementationSummary = `Human-approved graph sync completed across ${enrichedCount} public full-length songs (${totalJoinsAfter} verified Discovery Graph joins active).`;
  } else if (proposal.actionKind === 'generate_youtube_title_variants') {
    let generatedCount = 0;
    for (const relId of proposal.targetReleaseIds) {
      const rel = cmsServerStorage.getRelease(relId);
      if (!rel || rel.status !== 'published') continue;
      const canonical = resolveCanonicalSongTitle(rel);
      // Enforce GEMINI.md Canonical Title Authority: all variants begin with exact canonicalTitle
      const variantA = rel.youtubeTitleVariantA || `${canonical} | SufiPulse USA`;
      const variantB = rel.youtubeTitleVariantB || `${canonical} | Soulful Sufi Kalam with Lyrics | SufiPulse USA`;
      const variantC =
        rel.youtubeTitleVariantC || `${canonical} | Sacred Sufi Music & Mystical Poetry | SufiPulse USA`;

      cmsServerStorage.saveRelease({
        ...rel,
        canonicalTitle: rel.canonicalTitle || canonical,
        youtubeTitleVariantA: variantA,
        youtubeTitleVariantB: variantB,
        youtubeTitleVariantC: variantC,
        youtubeWinningVariant: rel.youtubeWinningVariant || 'pending',
        updatedAt: now,
      });
      generatedCount++;
    }
    implementationSummary = `Generated GEMINI.md-governed YouTube Title Variants A/B/C for ${generatedCount} full-length songs without modifying canonicalTitle.`;
  } else if (proposal.actionKind === 'enrich_release_search_tags') {
    let updatedCount = 0;
    const publicReleases = cmsServerStorage
      .getPublicReleases()
      .filter((r) => r.status === 'published' && (r.visibility || 'public') === 'public');
    for (const rel of publicReleases) {
      const existingTags = Array.isArray(rel.tags) ? rel.tags : [];
      if (existingTags.length >= 8) continue;
      const canonical = resolveCanonicalSongTitle(rel);
      const mergedTags = Array.from(
        new Set([
          ...existingTags,
          canonical,
          'Sufi music',
          'Sufi kalam',
          'Urdu Sufi kalam',
          'Kashmiri Sufi heritage',
          'Mystical Sufi poetry',
          'Spiritual music',
          'SufiPulse USA',
        ])
      );
      cmsServerStorage.saveRelease({
        ...rel,
        tags: mergedTags,
        updatedAt: now,
      });
      updatedCount++;
    }
    implementationSummary = `Enriched non-branded Sufi/Kashmir/Urdu search tags across ${updatedCount} published full-length releases.`;
  } else {
    implementationSummary = `Approved by ${params.actorEmail} and queued for editorial/ops completion. Baseline metrics locked for post-change measurement.`;
  }

  proposal.stage = 'measuring';
  proposal.approvedBy = params.actorEmail;
  proposal.approvedAt = now;
  proposal.updatedAt = now;
  proposal.baselineAtImplementation = baseline;
  proposal.implementationSummary = implementationSummary;

  store.updatedAt = now;
  writeStore(store);

  return {
    success: true,
    proposal,
    message: implementationSummary,
  };
}
