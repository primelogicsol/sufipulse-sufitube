import { NextRequest, NextResponse } from 'next/server';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';
import { syncYouTubeReachReports } from '@/lib/youtube-reach-reports';
import { globalReachGrowthEngine } from '@/lib/global-reach-growth-engine';
import { getYouTubeGeographySnapshot } from '@/lib/youtube-geography-import';
import { getAuthUser, checkIsAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600',
};

// GET /api/public/youtube/global-reach
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedRefresh = searchParams.get('refresh') === '1';
  const user = requestedRefresh ? await getAuthUser(request) : null;
  const refresh = requestedRefresh && checkIsAdmin(user);

  try {
    const [analytics, reach] = await Promise.all([
      youtubeAnalyticsService.getLifetimeGlobalReachAnalytics(refresh),
      syncYouTubeReachReports(refresh),
    ]);
    if (reach.verifiedLifetimeImpressions !== null) {
      analytics.lifetimeSnapshot.performance.impressions = reach.verifiedLifetimeImpressions;
    }

    const verifiedMetrics = {
      impressions: analytics.lifetimeSnapshot.performance.impressions || 994300,
      views: analytics.lifetimeSnapshot.performance.views || 160611,
      watchHours: analytics.lifetimeSnapshot.performance.watchTimeHours || 10410,
      geographies: analytics.lifetimeSnapshot.geographies.totalCountries || 53,
    };

    if (refresh) {
      globalReachGrowthEngine.reconcileWithVerified(
        verifiedMetrics,
        'refresh_query',
        'sync',
        'Reconciled via public endpoint refresh trigger'
      );
    }

    const globalReachIndex = globalReachGrowthEngine.getPublicPayload(verifiedMetrics);
    const rawGeography = getYouTubeGeographySnapshot();
    const geographyIntelligence = rawGeography
      ? (() => {
          const { importHistory: _history, ...publicGeo } = rawGeography;
          return publicGeo;
        })()
      : null;
    
    // Return only public-safe fields from the Lifetime Snapshot
    const publicSafe = {
      title: analytics.title,
      subtitle: analytics.subtitle,
      // Map new nested structure to flat structure expected by the UI
      ageGender: analytics.lifetimeSnapshot.ageGender,
      performance: analytics.lifetimeSnapshot.performance,
      recommendationEngine: analytics.lifetimeSnapshot.recommendationEngine,
      geographies: analytics.lifetimeSnapshot.geographies,
      geographyIntelligence,
      
      snapshotStatus: reach.isLifetimeReconciled
        ? 'Reconciled official YouTube daily thumbnail impressions'
        : 'Historical Studio lifetime baseline; newer daily reports shown separately',
      reach,

      // Three-Value Global Reach Index (modeled composite without leaking internal config/seeds)
      globalReachIndex,
      
      lastUpdated: analytics.lastUpdated,
      nextRefreshAt: analytics.nextRefreshAt,
      status: analytics.status,
      errorMessage: analytics.errorMessage // useful for debugging
    };

    const headers: Record<string, string> = refresh 
      ? { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
      : { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60' };

    return NextResponse.json(publicSafe, { headers });
  } catch (error: any) {
    console.error('[API /api/public/youtube/global-reach] ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch global reach analytics' }, { status: 500 });
  }
}
