import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getYTAnalyticsToken } from '@/app/lib/server/youtube-analytics-oauth-store';
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
            conversion_rate: 0,
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

      Object.values(groups).forEach(g => {
        g.conversion_rate = g.page_views > 0
          ? parseFloat(((g.total / g.page_views) * 100).toFixed(1))
          : 0;
      });

      return Object.values(groups).sort((a, b) => b.total - a.total);
    };

    const concepts = getGroupedMetrics('concept');
    const themes = getGroupedMetrics('theme');
    const regions = getGroupedMetrics('region');
    const releases = getGroupedMetrics('release');
    const playlists = getGroupedMetrics('playlist');
    const totals = discoveryAnalytics.getActionTotals();

    const winners = {
      concepts: concepts.slice(0, 3).filter(x => x.total > 0),
      themes: themes.slice(0, 3).filter(x => x.total > 0),
      regions: regions.slice(0, 3).filter(x => x.total > 0),
      playlists: playlists.slice(0, 3).filter(x => x.total > 0),
      releases: releases.slice(0, 3).filter(x => x.total > 0),
    };

    const losers = {
      no_clicks: [
        ...concepts.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'concept' })),
        ...themes.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'theme' })),
        ...regions.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'region' })),
        ...releases.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'release' })),
        ...playlists.filter(x => x.page_views >= 50 && x.total === 0).map(x => ({ ...x, type: 'playlist' })),
      ],
      low_conversion: [
        ...concepts.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'concept' })),
        ...themes.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'theme' })),
        ...regions.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'region' })),
        ...releases.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'release' })),
        ...playlists.filter(x => x.page_views >= 50 && x.total > 0 && x.conversion_rate < 10).map(x => ({ ...x, type: 'playlist' })),
      ].sort((a, b) => a.conversion_rate - b.conversion_rate),
      no_continuation: [
        ...concepts.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'concept' })),
        ...themes.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'theme' })),
        ...regions.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'region' })),
        ...releases.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'release' })),
        ...playlists.filter(x => x.video_clicks > 15 && x.playlist_clicks === 0).map(x => ({ ...x, type: 'playlist' })),
      ],
    };

    const recommendations: {
      type: 'orphan' | 'density' | 'playlist' | 'localization' | 'subscribe';
      priority: 'high' | 'medium' | 'low';
      title: string;
      message: string;
      actionUrl: string;
    }[] = [];

    const orphans = graphResolver.getOrphanReleases() || [];
    orphans.forEach(o => {
      recommendations.push({
        type: 'orphan',
        priority: 'high',
        title: `Orphan Release: ${o.title}`,
        message: 'This release is not linked to any concepts, regions, or playlists. Associate it inside the Discovery Graph Manager to drive traffic.',
        actionUrl: `/admin/discovery-graph?releaseId=${o.id}`,
      });
    });

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
          actionUrl: '/admin/discovery-graph',
        });
      } else if (conn.length < 2 && pageViews > 100) {
        recommendations.push({
          type: 'density',
          priority: 'medium',
          title: `Low Density Concept: ${c.title}`,
          message: `"${c.title}" has high page views (${pageViews}) but only 1 connected release. Connect more releases to capture continuation.`,
          actionUrl: '/admin/discovery-graph',
        });
      }
    });

    regions.forEach(r => {
      if (r.page_views > 100 && r.conversion_rate < 8) {
        const item = registriesStorage.getItem('regions', r.slug);
        const name = item ? item.title : r.slug;
        recommendations.push({
          type: 'localization',
          priority: 'medium',
          title: `Region Optimization: ${name}`,
          message: `Region "${name}" has low click conversion (${r.conversion_rate}%). Add localized subtitles, description language, or custom metadata to connected releases.`,
          actionUrl: '/admin/registries',
        });
      }
    });

    releases.forEach(rel => {
      if (rel.video_clicks > 100 && rel.subscribe_clicks < 5) {
        const item = cmsStorage.exportReleases()?.find(x => x.slug === rel.slug);
        const title = item ? item.title : rel.slug;
        recommendations.push({
          type: 'subscribe',
          priority: 'medium',
          title: `Subscriber Catalyst: ${title}`,
          message: `Release "${title}" drives high video clicks (${rel.video_clicks}) but low subscription clicks (${rel.subscribe_clicks}). Add an on-page subscribe CTA or channel promotion card.`,
          actionUrl: '/admin/cms-releases',
        });
      }
    });

    playlists.forEach(pl => {
      if (pl.page_views > 100 && pl.playlist_clicks === 0) {
        const item = registriesStorage.getItem('playlists', pl.slug);
        const title = item ? item.title : pl.slug;
        recommendations.push({
          type: 'playlist',
          priority: 'high',
          title: `Playlist Continuation Gap: ${title}`,
          message: `Playlist "${title}" is visited but receives 0 clicks. Verify the playlist ID matches a valid public YouTube playlist feed.`,
          actionUrl: '/admin/registries',
        });
      }
    });

    const priorityWeight = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    const crawlerStats = crawlerRegistry.getRecords() || [];
    const ecosystemVisibility = calculateEcosystemVisibilityScore();
    const ecosystemAuthority = calculateEcosystemAuthorityScore();

    const brandAssetClicks = Object.values(discoveryAnalytics.getTalliesForType('playlist'))
      .concat(discoveryAnalytics.getTalliesForType('release'))
      .filter(t => t.actionType === 'brand_asset_click')
      .map(t => ({
        slug: t.sourceSlug,
        assetType: t.assetType || 'playlist',
        assetName: t.assetName || t.sourceSlug,
        sourcePage: t.sourcePage || 'direct',
        count: t.count,
        updatedAt: t.updatedAt,
      }));

    const brandAssets = brandRegistry.getAssets();
    const searchOwnership = brandRegistry.getSearchOwnership();
    const aiCitations = brandRegistry.getCitations();
    const authorityGaps = brandRegistry.getGapTasks();

    const syncStatus = brandRegistry.getApiSyncStatus();
    let lastSuccessfulApiResponseAtGsc = syncStatus.lastSuccessfulApiResponseAtGsc;
    let lastSuccessfulApiResponseAtYoutube = syncStatus.lastSuccessfulApiResponseAtYoutube;

    const ytSnapshot = analyticsStorage.getSnapshot();
    if (ytSnapshot?.apiStatus?.connected) {
      const checkTime = ytSnapshot.apiStatus.lastCheck || ytSnapshot.lastUpdated;
      if (!lastSuccessfulApiResponseAtYoutube || new Date(checkTime).getTime() > new Date(lastSuccessfulApiResponseAtYoutube).getTime()) {
        lastSuccessfulApiResponseAtYoutube = checkTime;
        brandRegistry.setLastSuccessfulApiResponseAtYoutube(lastSuccessfulApiResponseAtYoutube);
      }
    }

    const gscProperty = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
    const gscCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GSC_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
    const gscChecks = {
      oauthConfigured: !!gscCreds,
      propertyVerified: !!gscProperty,
      lastSyncSuccessful: !!lastSuccessfulApiResponseAtGsc,
    };

    let gscStatus: 'Connected' | 'Configured' | 'Warning' | 'Error' = 'Error';
    if (!gscChecks.oauthConfigured) gscStatus = 'Error';
    else if (!gscChecks.propertyVerified) gscStatus = 'Warning';
    else if (!gscChecks.lastSyncSuccessful) gscStatus = 'Configured';
    else gscStatus = 'Connected';

    const ytApiKey = process.env.YOUTUBE_API_KEY;
    const ytClientId = process.env.YOUTUBE_CLIENT_ID;
    const ytClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const envRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_OAUTH_REFRESH_TOKEN;
    const storedToken = await getYTAnalyticsToken().catch(() => null);
    const hasRefreshToken = !!(storedToken?.refreshToken || envRefreshToken);
    const hasOAuthClient = !!(ytClientId && ytClientSecret);

    const youtubeChecks = {
      dataApiConfigured: !!ytApiKey,
      oauthConfigured: hasOAuthClient,
      oauthTokenValid: hasOAuthClient && hasRefreshToken,
      refreshTokenValid: hasRefreshToken,
      lastSyncSuccessful: !!lastSuccessfulApiResponseAtYoutube,
    };

    let youtubeStatus: 'Connected' | 'Configured' | 'Warning' | 'Error' = 'Error';
    if (!youtubeChecks.oauthConfigured) youtubeStatus = 'Error';
    else if (!youtubeChecks.refreshTokenValid) youtubeStatus = 'Warning';
    else if (!youtubeChecks.lastSyncSuccessful) youtubeStatus = 'Configured';
    else youtubeStatus = 'Connected';

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
      if (vercelEnv === 'production' || nodeEnv === 'production') environment = 'Production';
      else if (vercelEnv === 'preview') environment = 'Staging';
    }

    const sitemapPath = path.join(process.cwd(), 'app', 'sitemap.ts');
    const sitemapStatus = fs.existsSync(sitemapPath) ? 'Healthy' : 'Error';

    const telemetryActive = totals.page_view > 0 || totals.video_click > 0;
    const telemetryStatus = telemetryActive ? 'Active' : 'Inactive';
    const aiAuditActive = aiCitations.length > 0;
    const aiAuditStatus = aiAuditActive ? 'Active' : 'Inactive';

    const observationStart = '2026-06-03T00:00:00.000Z';
    const start = new Date(observationStart).getTime();
    const elapsedDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)) + 1;
    const observationWindow = elapsedDays > 0 ? `Day ${elapsedDays} of 90` : 'Not Started';

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
      lastSuccessfulSync: lastSuccessfulApiResponseAtYoutube
        ? formatUtc(new Date(lastSuccessfulApiResponseAtYoutube))
        : (lastSuccessfulApiResponseAtGsc ? formatUtc(new Date(lastSuccessfulApiResponseAtGsc)) : 'None'),
      lastSuccessfulApiResponseAtGsc,
      lastSuccessfulApiResponseAtYoutube,
      gscConnected: gscStatus === 'Connected',
      youtubeConnected: youtubeStatus === 'Connected',
      telemetryActive,
      lastSync: lastSuccessfulApiResponseAtYoutube ? formatUtc(new Date(lastSuccessfulApiResponseAtYoutube)) : 'None',
      observationStart,
    };

    const dataProvenance = {
      discoveryTelemetry: telemetryActive ? 'first_party_runtime_telemetry' : 'unavailable',
      youtubeAnalytics: ytSnapshot?.apiStatus?.connected ? 'youtube_analytics_api' : 'unavailable',
      searchOwnership: 'manual_or_registry_observation',
      aiCitations: 'registry_observation',
      simulation: 'isolated_non_authoritative',
    } as const;

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
      productionReadiness,
      dataProvenance,
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

      // Phase 1 integrity rule: simulation never writes connection timestamps,
      // never mutates the YouTube analytics snapshot, and can never make the
      // production-readiness UI appear Connected.
      return NextResponse.json({
        success: true,
        simulation: true,
        authoritative: false,
        message: 'Simulation completed in isolation. Live GSC/YouTube readiness state was not modified.',
      });
    }

    let gscError: string | null = null;
    let ytError: string | null = null;

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
        if (res.data) brandRegistry.setLastSuccessfulApiResponseAtGsc(new Date().toISOString());
      } catch (err: any) {
        gscError = err.message || 'Unknown GSC error';
        console.error('[GSC-DIAGNOSTIC] Error:', err);
      }
    } else {
      gscError = 'GSC Credentials or Property not configured in environment.';
    }

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
      simulation: false,
      authoritative: true,
      gscError,
      ytError,
      lastSuccessfulApiResponseAtGsc: brandRegistry.getApiSyncStatus().lastSuccessfulApiResponseAtGsc,
      lastSuccessfulApiResponseAtYoutube: brandRegistry.getApiSyncStatus().lastSuccessfulApiResponseAtYoutube,
    });
  } catch (error: any) {
    console.error('[DISCOVERY-PERFORMANCE-DIAGNOSTICS-POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
