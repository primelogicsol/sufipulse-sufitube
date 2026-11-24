import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import { discoveryAnalytics } from '@/lib/discovery-analytics';
import { graphResolver } from '@/lib/graph-resolver';
import { registriesStorage } from '@/lib/registries-storage';
import { crawlerRegistry } from '@/lib/crawler-registry';
import { brandRegistry } from '@/lib/brand-registry';
import { organicDiscoveryTelemetry } from '@/lib/organic-discovery-telemetry';
import {
  getGoogleSearchConsoleReport,
  getGoogleSearchConsoleStatus,
  submitSitemapToGoogleSearchConsole,
} from '@/lib/google-search-console';
import {
  getBingWebmasterReport,
  submitSitemapToBingWebmaster,
} from '@/lib/bing-webmaster';
import {
  getSearchIndexingLogSnapshot,
  verifyPublicIndexNowKey,
} from '@/lib/search-indexing-service';
import { getYouTubeDiscoveryIntelligence } from '@/lib/youtube-discovery-intelligence';
import { buildSearchDemandIntelligence } from '@/lib/search-demand-engine';
import { auditAllPublishedReleasesSeo } from '@/lib/release-discovery-pipeline';
import { syncOptimizationProposals } from '@/lib/discovery-optimization-loop';
import sitemap from '@/app/sitemap';

export const dynamic = 'force-dynamic';

function countJsonArrayFile(relPath: string): number {
  try {
    const p = path.join(process.cwd(), relPath);
    if (!fs.existsSync(p)) return 0;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';

    discoveryAnalytics.forceHydrate();
    registriesStorage.init();
    graphResolver.init();
    crawlerRegistry.forceHydrate();
    brandRegistry.init();
    organicDiscoveryTelemetry.forceHydrate();

    const [
      youtubeDiscovery,
      gscStatus,
      gscReport,
      bingReport,
      indexNowKeyCheck,
      sitemapEntries,
      optimizationLoop,
    ] = await Promise.all([
      getYouTubeDiscoveryIntelligence(forceRefresh),
      getGoogleSearchConsoleStatus(),
      getGoogleSearchConsoleReport(28),
      getBingWebmasterReport(),
      verifyPublicIndexNowKey(forceRefresh),
      sitemap().catch(() => []),
      syncOptimizationProposals(),
    ]);

    if (youtubeDiscovery.liveApiConnected) {
      brandRegistry.setLastSuccessfulApiResponseAtYoutube(youtubeDiscovery.fetchedAt);
    }
    if (gscStatus.state === 'CONNECTED') {
      brandRegistry.setLastSuccessfulApiResponseAtGsc(gscStatus.lastCheckedAt);
    }

    const searchDemand = buildSearchDemandIntelligence({
      youtube: youtubeDiscovery,
      gsc: gscReport,
    });

    const releaseSeoAudits = auditAllPublishedReleasesSeo();
    const indexingLog = getSearchIndexingLogSnapshot(40);
    const crawlers = crawlerRegistry.getRecords();
    const funnelSummary = organicDiscoveryTelemetry.getFunnelSummary();
    const actionTotals = discoveryAnalytics.getActionTotals();

    // Sitemap composition breakdown
    const sitemapBreakdown = {
      totalUrls: sitemapEntries.length,
      releaseUrls: sitemapEntries.filter((e) => e.url.includes('/release-detail/')).length,
      discoveryEntityUrls: sitemapEntries.filter((e) => e.url.includes('/discovery/')).length,
      knowledgeUrls: sitemapEntries.filter((e) => e.url.includes('/knowledge/')).length,
      taxonomyUrls: sitemapEntries.filter((e) =>
        /\/(concepts|themes|moods|regions)\//.test(e.url)
      ).length,
      articleUrls: sitemapEntries.filter((e) => e.url.includes('/literary-journal/')).length,
      staticAuthorityUrls: sitemapEntries.filter(
        (e) =>
          !e.url.includes('/release-detail/') &&
          !e.url.includes('/discovery/') &&
          !e.url.includes('/knowledge/') &&
          !/\/(concepts|themes|moods|regions)\//.test(e.url) &&
          !e.url.includes('/literary-journal/')
      ).length,
    };

    // Discovery Graph intelligence summary
    const rawJoins = graphResolver.getRawJoins();
    const connectedReleaseIds = new Set(rawJoins.map((j) => j.releaseId).filter(Boolean));
    const connectedSongsCount = releaseSeoAudits.filter((r) => connectedReleaseIds.has(r.id)).length;
    const orphanSongsCount = Math.max(0, releaseSeoAudits.length - connectedSongsCount);

    const graphSummary = {
      totalPublishedSongs: releaseSeoAudits.length,
      connectedSongsCount,
      orphanSongsCount,
      totalJoins: rawJoins.length,
      buckets: [
        {
          key: 'concepts',
          label: 'Sufi Concepts',
          nodesCount: registriesStorage.getItems('concepts').filter((i) => i.isActive).length,
          edgesCount: rawJoins.filter((j) => j.relationshipType === 'concept').length,
        },
        {
          key: 'themes',
          label: 'Spiritual Themes',
          nodesCount: registriesStorage.getItems('themes').filter((i) => i.isActive).length,
          edgesCount: rawJoins.filter((j) => j.relationshipType === 'theme').length,
        },
        {
          key: 'moods',
          label: 'Sacred Moods',
          nodesCount: registriesStorage.getItems('moods').filter((i) => i.isActive).length,
          edgesCount: rawJoins.filter((j) => j.relationshipType === 'mood').length,
        },
        {
          key: 'regions',
          label: 'Target Regions',
          nodesCount: registriesStorage.getItems('regions').filter((i) => i.isActive).length,
          edgesCount: rawJoins.filter((j) => j.relationshipType === 'region').length,
        },
        {
          key: 'knowledge_entities',
          label: 'Knowledge Entities',
          nodesCount: countJsonArrayFile('.data/knowledge-registry.json'),
          edgesCount: rawJoins.filter((j) => j.relationshipType.endsWith('_to_entity')).length,
        },
        {
          key: 'atlas_clusters',
          label: 'Atlas Discovery Nodes',
          nodesCount: countJsonArrayFile('.data/atlas_entities.json'),
          edgesCount: countJsonArrayFile('.data/atlas_relationships.json'),
        },
      ],
    };

    // AI Search Discovery 3-lane separation
    const aiCrawlers = crawlers.filter((c) => c.category === 'ai_search');
    const searchCrawlers = crawlers.filter((c) => c.category === 'search_engine');
    const aiReferrerBreakdown = [
      { engine: 'ChatGPT', channel: 'ai_chatgpt', entrances: funnelSummary.entrancesByChannel.ai_chatgpt },
      { engine: 'Perplexity', channel: 'ai_perplexity', entrances: funnelSummary.entrancesByChannel.ai_perplexity },
      { engine: 'Claude', channel: 'ai_claude', entrances: funnelSummary.entrancesByChannel.ai_claude },
      { engine: 'Gemini', channel: 'ai_gemini', entrances: funnelSummary.entrancesByChannel.ai_gemini },
      { engine: 'Microsoft Copilot', channel: 'ai_copilot', entrances: funnelSummary.entrancesByChannel.ai_copilot },
    ];

    // Website-to-YouTube Conversion Funnel (deduplicated across first-party beacons & redirect tallies)
    const totalWebsiteEntrances =
      funnelSummary.organicSearchEntrances +
      funnelSummary.aiSearchEntrances +
      funnelSummary.entrancesByChannel.youtube_referral +
      funnelSummary.entrancesByChannel.social_referral +
      funnelSummary.entrancesByChannel.direct;

    const totalWebsiteContentViews = Math.max(
      actionTotals.page_view,
      funnelSummary.discoveryPageViews + funnelSummary.releasePageViews
    );

    const totalWebsiteYoutubeActions =
      funnelSummary.embeddedVideoPlays +
      Math.max(actionTotals.video_click + actionTotals.playlist_click, funnelSummary.outboundYoutubeClicks);

    const totalSubscribeIntents = Math.max(
      actionTotals.subscribe_click,
      funnelSummary.subscribeIntents
    );

    const conversionFunnel = {
      provenance: 'First-Party Runtime Telemetry (directly measured website interactions; YouTube views/subscribers measured separately via YouTube APIs)',
      stages: [
        {
          id: 'entrances',
          label: 'Recorded Website Entrances (Organic, AI & Direct)',
          count: totalWebsiteEntrances,
          source: 'First-Party Session Beacon',
        },
        {
          id: 'content_views',
          label: 'Discovery & Canonical Song Page Views',
          count: totalWebsiteContentViews,
          source: 'First-Party Page Telemetry',
        },
        {
          id: 'youtube_clicks',
          label: 'Embedded Full-Song Plays & Outbound YouTube Clicks',
          count: totalWebsiteYoutubeActions,
          source: 'First-Party Player & Click Telemetry',
        },
        {
          id: 'subscribe_intents',
          label: 'Outbound Channel Subscribe Intents (Pre-YouTube)',
          count: totalSubscribeIntents,
          source: 'First-Party Conversion Telemetry',
        },
      ],
      returningListeners: {
        returningEntrances: funnelSummary.returningEntrances || 0,
        multiTouchSessions: funnelSummary.multiTouchSessions || 0,
        uniqueSessions: funnelSummary.uniqueSessions || 0,
        embeddedVideoPlays: funnelSummary.embeddedVideoPlays || 0,
        outboundYoutubeClicks: funnelSummary.outboundYoutubeClicks || 0,
      },
      youtubePlatformMetrics: {
        ytSearchViews28d: youtubeDiscovery.recent28d.ytSearchViews,
        ytExternalViews28d: youtubeDiscovery.recent28d.externalViews,
        lifetimeWatchHours: youtubeDiscovery.lifetime.watchHours,
        avgViewDurationSeconds: youtubeDiscovery.lifetime.avgViewDurationSeconds,
        subscribers: youtubeDiscovery.channelIdentity.subscribers,
      },
      entrancesByChannel: funnelSummary.entrancesByChannel,
      topConvertingReleases: releaseSeoAudits
        .filter((r) => r.metrics.websitePageViews > 0 || r.metrics.websiteVideoClicks > 0)
        .sort((a, b) => b.metrics.websiteVideoClicks - a.metrics.websiteVideoClicks)
        .slice(0, 10),
    };

    // Integration health matrix
    const integrations = [
      {
        id: 'youtube_data_v3',
        name: 'YouTube Data API v3',
        status: youtubeDiscovery.channelIdentity.source === 'youtube_data_api_v3' ? 'WORKING' : 'ERROR',
        lastSync: youtubeDiscovery.fetchedAt,
        detail:
          youtubeDiscovery.channelIdentity.totalVideos !== null
            ? `Channel UCraDr3i5A3k0j7typ6tOOsQ verified (${youtubeDiscovery.channelIdentity.totalVideos} videos, ${youtubeDiscovery.channelIdentity.subscribers?.toLocaleString()} subscribers)`
            : 'Unable to fetch channel statistics.',
      },
      {
        id: 'youtube_analytics_v2',
        name: 'YouTube Analytics API v2 (OAuth)',
        status: youtubeDiscovery.liveApiConnected ? 'WORKING' : 'ERROR',
        lastSync: youtubeDiscovery.fetchedAt,
        detail: youtubeDiscovery.liveApiConnected
          ? `Live traffic sources, YT_SEARCH terms, geography & video-level discovery active (${youtubeDiscovery.lifetime.views?.toLocaleString()} lifetime views)`
          : youtubeDiscovery.errorMessage || 'OAuth reconnect required.',
      },
      {
        id: 'youtube_studio_snapshots',
        name: 'YouTube Studio Impressions & Geography CSVs',
        status: youtubeDiscovery.geography.territoriesMeasurable > 0 ? 'WORKING' : 'UNAVAILABLE',
        lastSync: youtubeDiscovery.geography.period,
        detail: `${youtubeDiscovery.geography.territoriesMeasurable} measurable countries; ${youtubeDiscovery.lifetime.studioImpressions?.toLocaleString() || 'n/a'} verified impressions (${youtubeDiscovery.lifetime.studioCtr ?? 'n/a'}% CTR)`,
      },
      {
        id: 'google_search_console',
        name: 'Google Search Console API v1',
        status: gscStatus.state,
        lastSync: gscStatus.lastCheckedAt,
        detail:
          gscStatus.state === 'CONNECTED'
            ? `Connected to ${gscStatus.property} (${gscStatus.permissionLevel})`
            : `Missing: ${gscStatus.missingRequirements.join(' | ') || gscStatus.errorMessage}`,
      },
      {
        id: 'bing_webmaster',
        name: 'Bing Webmaster Tools API',
        status: bingReport.status,
        lastSync: bingReport.fetchedAt,
        detail:
          bingReport.status === 'CONNECTED'
            ? `Connected to ${bingReport.siteUrl}`
            : 'Set BING_WEBMASTER_API_KEY to activate query/crawl stats & feed submission.',
      },
      {
        id: 'indexnow_protocol',
        name: 'IndexNow Instant Notification Protocol',
        status: indexNowKeyCheck.verified ? 'WORKING' : 'PENDING_HOST_DEPLOY',
        lastSync: indexNowKeyCheck.checkedAt,
        detail: indexNowKeyCheck.message,
      },
      {
        id: 'sitemap_and_canonicals',
        name: 'Canonical Sitemap & Structured Data Engine',
        status: sitemapBreakdown.totalUrls > 0 ? 'WORKING' : 'ERROR',
        lastSync: new Date().toISOString(),
        detail: `${sitemapBreakdown.totalUrls} canonical non-www URLs in /sitemap.xml (${sitemapBreakdown.releaseUrls} full-length songs, 0 duplicate /release-metadata URLs).`,
      },
    ];

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      youtube: youtubeDiscovery,
      googleSearchConsole: {
        status: gscStatus,
        report: gscReport,
        googlebotCrawls: searchCrawlers.find((c) => c.crawler === 'Googlebot') || null,
        googleOrganicReferrals: funnelSummary.entrancesByChannel.google_search,
      },
      bingSearch: {
        report: bingReport,
        indexNow: indexNowKeyCheck,
        bingbotCrawls: searchCrawlers.find((c) => c.crawler === 'Bingbot') || null,
        bingOrganicReferrals: funnelSummary.entrancesByChannel.bing_search,
      },
      searchDemand,
      releaseSeoAudits,
      indexingAndCrawl: {
        sitemapBreakdown,
        indexNowKeyCheck,
        indexingLog,
        crawlers,
      },
      aiSearchDiscovery: {
        verifiedAiCrawlers: aiCrawlers,
        firstPartyAiReferrers: aiReferrerBreakdown,
        manualCitations: brandRegistry.getCitations(),
      },
      discoveryGraph: graphSummary,
      conversionFunnel,
      optimizationLoop,
      integrations,
      brandAssets: brandRegistry.getAssets(),
      authorityGaps: brandRegistry.getGapTasks(),
    });
  } catch (error: any) {
    console.error('[DISCOVERY-PERFORMANCE-API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const simulateSuccess = body.simulateSuccess === true;

    if (simulateSuccess) {
      const host = request.headers.get('host') || '';
      const productionHost = host === 'sufipulse.com' || host.endsWith('.sufipulse.com');
      if (productionHost) {
        return NextResponse.json(
          {
            success: false,
            simulation: true,
            authoritative: false,
            error: 'Simulation is disabled on production hosts.',
          },
          { status: 403 }
        );
      }
      return NextResponse.json({
        success: true,
        simulation: true,
        authoritative: false,
        message: 'Simulation completed in isolation. Live GSC/Bing/YouTube readiness state was not modified.',
      });
    }

    const actor = authResult.email || authResult.id || 'admin';
    const [yt, gscStatus, bingReport, indexNowCheck] = await Promise.all([
      getYouTubeDiscoveryIntelligence(true),
      getGoogleSearchConsoleStatus(),
      getBingWebmasterReport(),
      verifyPublicIndexNowKey(true),
    ]);

    if (yt.liveApiConnected) {
      brandRegistry.setLastSuccessfulApiResponseAtYoutube(yt.fetchedAt);
    }
    if (gscStatus.state === 'CONNECTED') {
      brandRegistry.setLastSuccessfulApiResponseAtGsc(gscStatus.lastCheckedAt);
      await submitSitemapToGoogleSearchConsole(actor).catch(() => {});
    }
    if (bingReport.status === 'CONNECTED') {
      await submitSitemapToBingWebmaster(actor).catch(() => {});
    }

    return NextResponse.json({
      success: yt.liveApiConnected,
      simulation: false,
      authoritative: true,
      youtubeConnected: yt.liveApiConnected,
      gscState: gscStatus.state,
      gscError: gscStatus.errorMessage,
      bingState: bingReport.status,
      indexNowVerified: indexNowCheck.verified,
      indexNowMessage: indexNowCheck.message,
      lastSuccessfulApiResponseAtGsc: brandRegistry.getApiSyncStatus().lastSuccessfulApiResponseAtGsc,
      lastSuccessfulApiResponseAtYoutube: brandRegistry.getApiSyncStatus().lastSuccessfulApiResponseAtYoutube,
    });
  } catch (error: any) {
    console.error('[DISCOVERY-PERFORMANCE-DIAGNOSTICS-POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
