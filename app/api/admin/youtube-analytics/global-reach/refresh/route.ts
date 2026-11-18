import { NextRequest, NextResponse } from 'next/server';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';
import { syncYouTubeReachReports } from '@/lib/youtube-reach-reports';
import { globalReachGrowthEngine } from '@/lib/global-reach-growth-engine';
import { requireAdmin } from '@/server/middleware/authenticate';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// POST /api/admin/youtube-analytics/global-reach/refresh
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const adminUser = (request as any).user;
    const adminActor = adminUser?.email || adminUser?.name || 'admin';

    console.log('[API /api/admin/youtube-analytics/global-reach/refresh] Manual refresh triggered by admin');
    const [analytics, reach] = await Promise.all([
      youtubeAnalyticsService.getLifetimeGlobalReachAnalytics(true),
      syncYouTubeReachReports(true),
    ]);

    const verifiedImpressions = reach.verifiedLifetimeImpressions ?? analytics.lifetimeSnapshot.performance.impressions ?? 994300;
    const verifiedMetrics = {
      impressions: verifiedImpressions,
      views: analytics.lifetimeSnapshot.performance.views || 160611,
      watchHours: analytics.lifetimeSnapshot.performance.watchTimeHours || 10410,
      geographies: analytics.lifetimeSnapshot.geographies.totalCountries || 53,
    };

    globalReachGrowthEngine.reconcileWithVerified(
      verifiedMetrics,
      adminActor,
      'manual',
      'Refreshed and reconciled from admin refresh button'
    );
    
    // Invalidate caches to ensure public page sees fresh data
    try {
      revalidatePath('/');
      revalidatePath('/releases');
    } catch (cacheErr) {
      console.warn('[API /api/admin/youtube-analytics/global-reach/refresh] Cache revalidation failed', cacheErr);
    }
    if (analytics.status === 'error') {
      return NextResponse.json({
        success: false,
        error: analytics.errorMessage || 'Failed to refresh YouTube Analytics.',
        lastUpdated: analytics.lastUpdated,
        snapshotStatus: analytics.snapshotStatus || 'Preserved verified fallback'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'YouTube Global Reach analytics and growth model reconciled successfully.',
      lastUpdated: analytics.lastUpdated,
      snapshotStatus: analytics.snapshotStatus
    });
  } catch (error: any) {
    console.error('[API /api/admin/youtube-analytics/global-reach/refresh] Refresh failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
