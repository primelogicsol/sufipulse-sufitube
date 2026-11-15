import { NextRequest, NextResponse } from 'next/server';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';
import { syncYouTubeReachReports } from '@/lib/youtube-reach-reports';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600',
};

// GET /api/public/youtube/global-reach
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh') === '1';

  try {
    const [analytics, reach] = await Promise.all([
      youtubeAnalyticsService.getLifetimeGlobalReachAnalytics(refresh),
      syncYouTubeReachReports(refresh),
    ]);
    if (reach.verifiedLifetimeImpressions !== null) {
      analytics.lifetimeSnapshot.performance.impressions = reach.verifiedLifetimeImpressions;
    }
    
    // Return only public-safe fields from the Lifetime Snapshot
    const publicSafe = {
      title: analytics.title,
      subtitle: analytics.subtitle,
      // Map new nested structure to flat structure expected by the UI
      ageGender: analytics.lifetimeSnapshot.ageGender,
      performance: analytics.lifetimeSnapshot.performance,
      recommendationEngine: analytics.lifetimeSnapshot.recommendationEngine,
      geographies: analytics.lifetimeSnapshot.geographies,
      
      snapshotStatus: reach.isLifetimeReconciled
        ? 'Reconciled official YouTube daily thumbnail impressions'
        : 'Historical Studio lifetime baseline; newer daily reports shown separately',
      reach,
      
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
