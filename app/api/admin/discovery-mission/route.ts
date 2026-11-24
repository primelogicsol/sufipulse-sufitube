import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import { organicDiscoveryTelemetry } from '@/lib/organic-discovery-telemetry';
import { discoveryAnalytics } from '@/lib/discovery-analytics';
import { graphResolver } from '@/lib/graph-resolver';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { syncOptimizationProposals } from '@/lib/discovery-optimization-loop';

export const dynamic = 'force-dynamic';

function countRealNewsletterSubscribers(): number {
  try {
    const file = path.join(process.cwd(), '.data', 'subscribers.json');
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(parsed)) return parsed.filter((s: any) => s?.active !== false).length;
    }
  } catch {}
  return 0;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const funnel = organicDiscoveryTelemetry.getFunnelSummary();
  const actionTotals = discoveryAnalytics.getActionTotals();
  const loop = await syncOptimizationProposals();

  graphResolver.init();
  const joins = graphResolver.getRawJoins();
  const publicReleases = cmsServerStorage
    .getPublicReleases()
    .filter((r) => r.status === 'published' && (r.visibility || 'public') === 'public');
  const connectedIds = new Set(joins.map((j) => j.releaseId).filter(Boolean));
  const orphanReleasesCount = publicReleases.filter((r) => !connectedIds.has(r.id)).length;
  const orphanRate =
    publicReleases.length > 0
      ? Number(((orphanReleasesCount / publicReleases.length) * 100).toFixed(1))
      : 0;

  // Entity & article tallies strictly from first-party runtime events (zero seeded demo numbers)
  const entityTallies = discoveryAnalytics
    .getAllTallies()
    .filter((t) => t.actionType === 'page_view' && t.sourceType !== 'release')
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((t) => ({
      name: `${t.sourceType}: ${t.sourceSlug}`,
      views: t.count,
    }));

  const articleTallies = discoveryAnalytics
    .getTalliesForType('article')
    .filter((t) => t.actionType === 'page_view')
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((t) => ({
      name: t.sourceSlug,
      reads: t.count,
    }));

  const releaseOpens = actionTotals.page_view + funnel.releasePageViews;
  const videoClicks = actionTotals.video_click + funnel.embeddedVideoPlays;
  const youtubeTransfers =
    actionTotals.subscribe_click + actionTotals.playlist_click + funnel.outboundYoutubeClicks;

  const returningPercent =
    funnel.uniqueSessions > 0
      ? Number(((funnel.multiTouchSessions / funnel.uniqueSessions) * 100).toFixed(1))
      : 0;

  // Compute transparent readiness/conversion score (0..100) from real measured counts
  const graphCoveragePts =
    publicReleases.length > 0
      ? Math.round(((publicReleases.length - orphanReleasesCount) / publicReleases.length) * 40)
      : 0;
  const searchEntrancePts = Math.min(20, funnel.organicSearchEntrances + funnel.aiSearchEntrances);
  const releaseEngagementPts = Math.min(20, Math.round(releaseOpens / 5));
  const youtubeTransferPts = Math.min(20, youtubeTransfers * 2);
  const currentScore = Math.min(
    100,
    graphCoveragePts + searchEntrancePts + releaseEngagementPts + youtubeTransferPts
  );

  const weeklyHistory = loop.weeklySnapshots
    .slice(0, 6)
    .reverse()
    .map((snap) => ({
      week: snap.weekEnding,
      score:
        snap.connectedReleasesCount > 0
          ? Math.min(
              100,
              Math.round(
                (snap.connectedReleasesCount /
                  Math.max(1, snap.connectedReleasesCount + snap.orphanReleasesCount)) *
                  40
              ) + Math.min(60, snap.websiteToYoutubeClicks)
            )
          : currentScore,
    }));

  return NextResponse.json({
    provenance: 'verified_first_party_telemetry_only',
    discoveryScore: {
      current: currentScore,
      weeklyHistory:
        weeklyHistory.length > 0 ? weeklyHistory : [{ week: new Date().toISOString().split('T')[0], score: currentScore }],
    },
    acquisition: {
      searchEntrances: funnel.organicSearchEntrances,
      aiReferrals: funnel.aiSearchEntrances,
      directEntrances: funnel.entrancesByChannel.direct,
    },
    authority: {
      mostVisitedEntities: entityTallies,
      mostReadPublications: articleTallies,
    },
    exploration: {
      averageGraphDepth:
        funnel.uniqueSessions > 0
          ? Number((funnel.totalEvents / funnel.uniqueSessions).toFixed(1))
          : 0,
      topRoutes: funnel.perReleaseConversion.slice(0, 5).map((r) => ({
        path: `/release-detail/${r.slug}`,
        count: r.releaseViews + r.embeddedPlays + r.outboundClicks,
      })),
      orphanExits: orphanRate,
    },
    conversion: {
      releaseOpens,
      videoClicks,
      youtubeTransfers,
    },
    growth: {
      returningVisitors: returningPercent,
      emailSignups: countRealNewsletterSubscribers(),
      channelTransfers: youtubeTransfers,
    },
  });
}
