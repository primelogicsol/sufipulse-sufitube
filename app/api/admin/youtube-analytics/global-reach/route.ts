import { NextRequest, NextResponse } from 'next/server';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

// GET /api/admin/youtube-analytics/global-reach
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const analytics = await youtubeAnalyticsService.getLifetimeGlobalReachAnalytics();
    
    // Include extra admin info
    return NextResponse.json({
      ...analytics,
      adminInfo: {
        checkedAt: analytics.apiStatus.lastCheck,
        nextRefreshAt: analytics.nextRefreshAt,
        status: 'cached'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
