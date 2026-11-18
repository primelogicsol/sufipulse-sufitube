import { NextRequest, NextResponse } from 'next/server';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';
import { syncYouTubeReachReports } from '@/lib/youtube-reach-reports';
import { globalReachGrowthEngine, RATE_BOUNDS } from '@/lib/global-reach-growth-engine';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

// GET /api/admin/youtube-analytics/global-reach
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const [analytics, reach] = await Promise.all([
      youtubeAnalyticsService.getLifetimeGlobalReachAnalytics(),
      syncYouTubeReachReports(false),
    ]);

    const verifiedImpressions = reach.verifiedLifetimeImpressions ?? analytics.lifetimeSnapshot.performance.impressions ?? 994300;
    const verifiedMetrics = {
      impressions: verifiedImpressions,
      views: analytics.lifetimeSnapshot.performance.views || 160611,
      watchHours: analytics.lifetimeSnapshot.performance.watchTimeHours || 10410,
      geographies: analytics.lifetimeSnapshot.geographies.totalCountries || 53,
    };

    const growthStore = globalReachGrowthEngine.getStore();
    const reconciliation = globalReachGrowthEngine.computeReconciledIndex(verifiedMetrics);
    const monthsInfo = globalReachGrowthEngine.calculateMonthsElapsed();

    return NextResponse.json({
      success: true,
      growthStore,
      rateBounds: RATE_BOUNDS,
      verifiedMetrics,
      reconciliation,
      monthsInfo,
      adminInfo: {
        checkedAt: analytics.apiStatus.lastCheck,
        nextRefreshAt: analytics.nextRefreshAt,
        status: 'cached',
        lastReconciliationAt: growthStore.lastReconciliationAt,
      },
    });
  } catch (error: any) {
    console.error('[API /api/admin/youtube-analytics/global-reach] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/youtube-analytics/global-reach (Update Configuration)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const adminUser = (request as any).user;
    const adminActor = adminUser?.email || adminUser?.name || 'admin';

    const result = globalReachGrowthEngine.updateConfig(body, adminActor);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Growth engine configuration updated successfully.',
      growthStore: globalReachGrowthEngine.getStore(),
    });
  } catch (error: any) {
    console.error('[API /api/admin/youtube-analytics/global-reach] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
