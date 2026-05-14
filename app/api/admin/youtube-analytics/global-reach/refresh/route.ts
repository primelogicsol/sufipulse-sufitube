import { NextRequest, NextResponse } from 'next/server';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';
import { requireAdmin } from '@/server/middleware/authenticate';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// POST /api/admin/youtube-analytics/global-reach/refresh
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    console.log('[API /api/admin/youtube-analytics/global-reach/refresh] Manual refresh triggered by admin');
    const analytics = await youtubeAnalyticsService.getLifetimeGlobalReachAnalytics(true);
    
    // Invalidate caches to ensure public page sees fresh data
    try {
      revalidatePath('/');
      revalidatePath('/releases');
    } catch (cacheErr) {
      console.warn('[API /api/admin/youtube-analytics/global-reach/refresh] Cache revalidation failed', cacheErr);
    }
    
    return NextResponse.json({
      success: true,
      message: 'YouTube Global Reach analytics refreshed successfully.',
      lastUpdated: analytics.lastUpdated
    });
  } catch (error: any) {
    console.error('[API /api/admin/youtube-analytics/global-reach/refresh] Refresh failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
