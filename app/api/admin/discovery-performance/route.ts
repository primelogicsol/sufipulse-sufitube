import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { discoveryAnalytics } from '@/lib/discovery-analytics';
import { graphResolver } from '@/lib/graph-resolver';
import { registriesStorage } from '@/lib/registries-storage';
import { cmsStorage } from '@/lib/cms-storage';
import { crawlerRegistry } from '@/lib/crawler-registry';
import { calculateEcosystemVisibilityScore, calculateEcosystemAuthorityScore } from '@/lib/brand-governance';
import { brandRegistry } from '@/lib/brand-registry';
import { analyticsStorage } from '@/lib/analytics-storage';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    discoveryAnalytics.forceHydrate();
    registriesStorage.init();
    graphResolver.init();
    crawlerRegistry.init();
    brandRegistry.init();

    // 1. Get raw tallies grouped by slug for each source type
    const getGroupedMetrics = (type: 'concept' | 'theme' | 'region' | 'release' | 'playlist') => {
      const tallies = discoveryAnalytics.getTalliesForType(type);
      const groups: Record<string, { 
        slug: string; 
        video_clicks: number; 
        playlist_clicks: number; 
        subscribe_clicks: number; 
        page_views: number;
        total: number;
        conversion_rate: number;
      }> = {};

      tallies.forEach(t => {
        if (!groups[t.sourceSlug]) {
          groups[t.sourceSlug] = {
            slug: t.sourceSlug,
            video_clicks: 0,
            playlist_clicks: 0,
            subscribe_clicks: 0,
            page_views: 0,
            total: 0,
            conversion_rate: 0
          };
        }

        if (t.actionType === 'video_click') {
          groups[t.sourceSlug].video_clicks += t.count;
          groups[t.sourceSlug].total += t.count;
        } else if (t.actionType === 'playlist_click') {
          groups[t.sourceSlug].playlist_clicks += t.count;
          groups[t.sourceSlug].total += t.count;
        } else if (t.actionType === 'subscribe_click') {
          groups[t.sourceSlug].subscribe_clicks += t.count;
          groups[t.sourceSlug].total += t.count;
        } else if (t.actionType === 'page_view') {
          groups[t.sourceSlug].page_views += t.count;
        }
      });

      // Calculate conversion rates
      Object.values(groups).forEach(g => {
        if (g.page_views > 0) {
          g.conversion_rate = parseFloat(((g.total / g.page_views) * 100).toFixed(1));
        } else {
          g.conversion_rate = 0;
        }
      });

      return Object.values(groups).sort((a, b) => b.total - a.total);
    };

    // Fetch lists
    const concepts = getGroupedMetrics('concept');
    const themes = getGroupedMetrics('theme');
    const regions = getGroupedMetrics('region');
    const releases = getGroupedMetrics('release');
    const playlists = getGroupedMetrics('playlist');

    // Aggregate overall totals
    const totals = discoveryAnalytics.getActionTotals();

    // 2. Identify Winners (Top performing nodes in each category)
    const winners = {
      concepts: concepts.slice(0, 3).filter(x => x.total > 0),
      themes: themes.slice(0, 3).filter(x => x.total > 0),
      regions: regions.slice(0, 3).filter(x => x.total > 0),
      playlists: playlists.slice(0, 3).filter(x => x.total > 0),
      releases: releases.slice(0, 3).filter(x => x.total > 0)
    };

    // 3. Identify Losers (Underperforming segments)
    const losers = {
      // High page views (traffic) but zero total conversion clicks
      no_clicks: [
        ...concepts.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'concept' })),
        ...themes.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'theme' })),
        ...regions.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'region' })),
        ...releases.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'release' })),
        ...playlists.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'playlist' }))
      ],
      // Traffic but conversion rate is less than 10%
      low_conversion: [
        ...concepts.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'concept' })),
        ...themes.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'theme' })),
        ...regions.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'region' })),
        ...releases.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'release' })),
        ...playlists.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'playlist' }))
      ].sort((a, b) => a.conversion_rate - b.conversion_rate),
      // Clicks driving video views but zero playlist continuation clicks
      no_continuation: [
        ...concepts.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'concept' })),
        ...themes.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'theme' })),
        ...regions.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'region' })),
        ...releases.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'release' })),
        ...playlists.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'playlist' }))
      ]
    };

    // 4. Generate Graph-based Optimization Recommendations
    const recommendations: {
      type: 'orphan' | 'density' | 'playlist' | 'localization' | 'subscribe';
      priority: 'high' | 'medium' | 'low';
      title: string;
      message: string;
      actionUrl: string;
    }[] = [];

    // Rule A: Detect Orphan Releases
    const orphans = graphResolver.getOrphanReleases() || [];
    orphans.forEach(o => {
      recommendations.push({
        type: 'orphan',
        priority: 'high',
        title: `Orphan Release: ${o.title}`,
        message: `This release is not linked to any concepts, regions, or playlists. Associate it inside the Discovery Graph Manager to drive traffic.`,
        actionUrl: `/admin/discovery-graph?releaseId=${o.id}`
      });
    });

    // Rule B: Detect Concepts with 0 connected releases or low density under high traffic
    const activeConcepts = registriesStorage.getItems('concepts').filter(c => c.isActive && c.isPublic);
    activeConcepts.forEach(c => {
      const conn = graphResolver.getReleasesForRegistry(c.slug, 'concept') || [];
      const telemetry = concepts.find(x => x.slug === c.slug);
      const pageViews = telemetry ? telemetry.page_views : 0;

      if (conn.length === 0) {
        recommendations.push({
          type: 'density',
          priority: 'high',
          title: `Empty Concept: ${c.title}`,
          message: `Concept "${c.title}" has 0 connected releases. Link at least one release to make this SEO page functional.`,
          actionUrl: `/admin/discovery-graph`
        });
      } else if (conn.length < 2 && pageViews > 100) {
        recommendations.push({
          type: 'density',
          priority: 'medium',
          title: `Low Density Concept: ${c.title}`,
          message: `"${c.title}" has high page views (${pageViews}) but only 1 connected release. Connect more releases to capture continuation.`,
          actionUrl: `/admin/discovery-graph`
        });
      }
    });

    // Rule C: Detect Regions with high traffic but poor conversion rates
    regions.forEach(r => {
      if (r.page_views > 100 && r.conversion_rate < 8) {
        const item = registriesStorage.getItem('regions', r.slug);
        const name = item ? item.title : r.slug;
        recommendations.push({
          type: 'localization',
          priority: 'medium',
          title: `Region Optimization: ${name}`,
          message: `Region "${name}" has low click conversion (${r.conversion_rate}%). Add localized subtitles, description language, or custom metadata to connected releases.`,
          actionUrl: `/admin/registries`
        });
      }
    });

    // Rule D: Detect High-view Releases with low subscriber conversion
    releases.forEach(rel => {
      if (rel.video_clicks > 100 && rel.subscribe_clicks < 5) {
        const item = cmsStorage.exportReleases()?.find(x => x.slug === rel.slug);
        const title = item ? item.title : rel.slug;
        recommendations.push({
          type: 'subscribe',
          priority: 'medium',
          title: `Subscriber Catalyst: ${title}`,
          message: `Release "${title}" drives high video clicks (${rel.video_clicks}) but low subscription clicks (${rel.subscribe_clicks}). Add an on-page subscribe CTA or channel promotion card.`,
          actionUrl: `/admin/cms-releases`
        });
      }
    });

    // Rule E: Curated Playlists that have traffic but 0 playlist continuations
    playlists.forEach(pl => {
      if (pl.page_views > 100 && pl.playlist_clicks === 0) {
        const item = registriesStorage.getItem('playlists', pl.slug);
        const title = item ? item.title : pl.slug;
        recommendations.push({
          type: 'playlist',
          priority: 'high',
          title: `Playlist Continuation Gap: ${title}`,
          message: `Playlist "${title}" is visited but receives 0 clicks. Verify the playlist ID matches a valid public YouTube playlist feed.`,
          actionUrl: `/admin/registries`
        });
      }
    });

    // Sort recommendations: High priority first
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    // 5. Crawler registry records
    const crawlerStats = crawlerRegistry.getRecords() || [];

    // 6. Ecosystem Visibility Score & Authority Score calculations
    const ecosystemVisibility = calculateEcosystemVisibilityScore();
    const ecosystemAuthority = calculateEcosystemAuthorityScore();

    // 7. Brand Asset Clicks logs
    const brandAssetClicks = Object.values(discoveryAnalytics.getTalliesForType('playlist'))
      .concat(discoveryAnalytics.getTalliesForType('release'))
      .filter(t => t.actionType === 'brand_asset_click')
      .map(t => ({
        slug: t.sourceSlug,
        assetType: t.assetType || 'playlist',
        assetName: t.assetName || t.sourceSlug,
        sourcePage: t.sourcePage || 'direct',
        count: t.count,
        updatedAt: t.updatedAt
      }));

    // 8. Additive Brand Registry data items
    const brandAssets = brandRegistry.getAssets();
    const searchOwnership = brandRegistry.getSearchOwnership();
    const aiCitations = brandRegistry.getCitations();
    const authorityGaps = brandRegistry.getGapTasks();

    // 9. Production readiness checks
    const syncStatus = brandRegistry.getApiSyncStatus();
    let lastSuccessfulApiResponseAtGsc = syncStatus.lastSuccessfulApiResponseAtGsc;
    let lastSuccessfulApiResponseAtYoutube = syncStatus.lastSuccessfulApiResponseAtYoutube;

    // Check if the actual youtube analytics storage has been successfully queried recently
    const ytSnapshot = analyticsStorage.getSnapshot();
    if (ytSnapshot && ytSnapshot.apiStatus && ytSnapshot.apiStatus.connected) {
      const checkTime = ytSnapshot.apiStatus.lastCheck || ytSnapshot.lastUpdated;
      if (!lastSuccessfulApiResponseAtYoutube || new Date(checkTime).getTime() > new Date(lastSuccessfulApiResponseAtYoutube).getTime()) {
        lastSuccessfulApiResponseAtYoutube = checkTime;
        brandRegistry.setLastSuccessfulApiResponseAtYoutube(lastSuccessfulApiResponseAtYoutube);
      }
    }

    // GSC Checks (using requirements)
    const gscProperty = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
    const gscCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GSC_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
    const gscChecks = {
      oauthConfigured: !!gscCreds,
      propertyVerified: !!gscProperty,
      lastSyncSuccessful: !!lastSuccessfulApiResponseAtGsc
    };
    
    let gscStatus: 'Connected' | 'Configured' | 'Warning' | 'Error' = 'Error';
    if (!gscChecks.oauthConfigured) {
      gscStatus = 'Error';
    } else if (!gscChecks.propertyVerified) {
      gscStatus = 'Warning';
    } else if (!gscChecks.lastSyncSuccessful) {
      gscStatus = 'Configured';
    } else {
      gscStatus = 'Connected';
    }

    // YouTube Checks (using requirements)
    const ytApiKey = process.env.YOUTUBE_API_KEY;
    const ytClientId = process.env.YOUTUBE_CLIENT_ID;
    const ytClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const ytRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_OAUTH_REFRESH_TOKEN;
    const youtubeChecks = {
      oauthTokenValid: !!(ytApiKey || (ytClientId && ytClientSecret)),
      refreshTokenValid: !!ytRefreshToken,
      lastSyncSuccessful: !!lastSuccessfulApiResponseAtYoutube
    };
    
    let youtubeStatus: 'Connected' | 'Configured' | 'Warning' | 'Error' = 'Error';
    if (!youtubeChecks.oauthTokenValid) {
      youtubeStatus = 'Error';
    } else if (!youtubeChecks.refreshTokenValid) {
      youtubeStatus = 'Warning';
    } else if (!youtubeChecks.lastSyncSuccessful) {
      youtubeStatus = 'Configured';
    } else {
      youtubeStatus = 'Connected';
    }

    // Environment detection
    const host = request.headers.get('host') || '';
    let environment: 'Local Development' | 'Staging' | 'Production' = 'Local Development';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      environment = 'Local Development';
    } else if (host.includes('staging') || host.includes('netlify') || host.includes('vercel.app')) {
      environment = 'Staging';
    } else if (host.includes('sufipulse.com')) {
      environment = 'Production';
    } else {
      const nodeEnv = process.env.NODE_ENV;
      const vercelEnv = process.env.VERCEL_ENV;
      if (vercelEnv === 'production' || nodeEnv === 'production') {
        environment = 'Production';
      } else if (vercelEnv === 'preview') {
        environment = 'Staging';
      }
    }

    // Sitemap check
    const sitemapPath = path.join(process.cwd(), 'app', 'sitemap.ts');
    const sitemapExists = fs.existsSync(sitemapPath);
    const sitemapStatus = sitemapExists ? 'Healthy' : 'Error';

    // Telemetry status
    const telemetryActive = totals.page_view > 0 || totals.video_click > 0;
    const telemetryStatus = telemetryActive ? 'Active' : 'Inactive';

    // AI Audit status
    const aiAuditActive = aiCitations.length > 0;
    const aiAuditStatus = aiAuditActive ? 'Active' : 'Inactive';

    // Authority Observation Window
    const observationStart = '2026-06-03T00:00:00.000Z';
    const start = new Date(observationStart).getTime();
    const nowMs = Date.now();
    const elapsedDays = Math.floor((nowMs - start) / (1000 * 60 * 60 * 24)) + 1;
    let observationWindow = 'Not Started';
    if (elapsedDays > 0) {
      observationWindow = `Day ${elapsedDays} of 90`;
    }

    const formatUtc = (d: Date) => {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
    };

    const productionReadiness = {
      environment,
      gscStatus,
      gscChecks,
      youtubeStatus,
      youtubeChecks,
      sitemapStatus,
      telemetryStatus,
      aiAuditStatus,
      observationWindow,
      lastGscSync: lastSuccessfulApiResponseAtGsc ? formatUtc(new Date(lastSuccessfulApiResponseAtGsc)) : 'None',
      lastYoutubeSync: lastSuccessfulApiResponseAtYoutube ? formatUtc(new Date(lastSuccessfulApiResponseAtYoutube)) : 'None',
      lastSuccessfulSync: lastSuccessfulApiResponseAtYoutube ? formatUtc(new Date(lastSuccessfulApiResponseAtYoutube)) : (lastSuccessfulApiResponseAtGsc ? formatUtc(new Date(lastSuccessfulApiResponseAtGsc)) : 'None'),
      lastSuccessfulApiResponseAtGsc,
      lastSuccessfulApiResponseAtYoutube,
      // Fallback fields for compatibility
      gscConnected: gscStatus === 'Connected',
      youtubeConnected: youtubeStatus === 'Connected',
      telemetryActive,
      lastSync: lastSuccessfulApiResponseAtYoutube ? formatUtc(new Date(lastSuccessfulApiResponseAtYoutube)) : 'None',
      observationStart
    };

    return NextResponse.json({
      totals,
      concepts,
      themes,
      regions,
      releases,
      playlists,
      winners,
      losers,
      recommendations,
      crawlerStats,
      ecosystemVisibility,
      ecosystemAuthority,
      brandAssetClicks,
      brandAssets,
      searchOwnership,
      aiCitations,
      authorityGaps,
      productionReadiness
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
      const nowStr = new Date().toISOString();
      brandRegistry.setLastSuccessfulApiResponseAtGsc(nowStr);
      brandRegistry.setLastSuccessfulApiResponseAtYoutube(nowStr);
      
      // Also update YouTube snapshot to simulated active
      const current = analyticsStorage.getSnapshot();
      analyticsStorage.saveSnapshot({
        ...current,
        status: 'active',
        apiStatus: {
          connected: true,
          lastCheck: nowStr,
          availableLiveMetrics: ["views", "watchTime", "averageDuration", "trafficSource"],
          restrictedMetrics: ["impressions", "ctr", "demographics", "geography"]
        }
      });

      return NextResponse.json({ success: true, message: 'Simulated connection success.' });
    }

    let gscError: string | null = null;
    let ytError: string | null = null;

    // 1. Run GSC Diagnostic
    const property = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
    const credsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credsFile && property) {
      try {
        const { google } = require('googleapis');
        const auth = new google.auth.GoogleAuth({
          keyFile: credsFile,
          scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
        });
        const client = await auth.getClient();
        const webmasters = google.webmasters({ version: 'v3', auth: client });
        const res = await webmasters.sites.list();
        if (res.data) {
          brandRegistry.setLastSuccessfulApiResponseAtGsc(new Date().toISOString());
        }
      } catch (err: any) {
        gscError = err.message || 'Unknown GSC error';
        console.error('[GSC-DIAGNOSTIC] Error:', err);
      }
    } else {
      gscError = 'GSC Credentials or Property not configured in environment.';
    }

    // 2. Run YouTube Diagnostic
    try {
      const { youtubeAnalyticsService } = require('@/lib/youtube-analytics-service');
      const snapshot = await youtubeAnalyticsService.getLifetimeGlobalReachAnalytics(true);
      if (snapshot.apiStatus?.connected) {
        brandRegistry.setLastSuccessfulApiResponseAtYoutube(snapshot.apiStatus.lastCheck || new Date().toISOString());
      } else {
        ytError = snapshot.errorMessage || 'YouTube Analytics API not connected.';
      }
    } catch (err: any) {
      ytError = err.message || 'Unknown YouTube Analytics error';
      console.error('[YOUTUBE-DIAGNOSTIC] Error:', err);
    }

    return NextResponse.json({
      success: !gscError && !ytError,
      gscError,
      ytError,
      lastSuccessfulApiResponseAtGsc: brandRegistry.getApiSyncStatus().lastSuccessfulApiResponseAtGsc,
      lastSuccessfulApiResponseAtYoutube: brandRegistry.getApiSyncStatus().lastSuccessfulApiResponseAtYoutube
    });

  } catch (error: any) {
    console.error('[DISCOVERY-PERFORMANCE-DIAGNOSTICS-POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
