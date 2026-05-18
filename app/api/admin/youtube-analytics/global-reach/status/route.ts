import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { analyticsStorage } from '@/lib/analytics-storage';

export const dynamic = 'force-dynamic';

// GET /api/admin/youtube-analytics/global-reach/status
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const snapshot = analyticsStorage.getSnapshot();
    
    // Check environment for OAuth
    const hasOAuthClient = !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET);
    const hasRefreshToken = !!(process.env.YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_OAUTH_REFRESH_TOKEN);
    const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';

    return NextResponse.json({
      hasOAuthClient,
      hasRefreshToken,
      channelId,
      latestSnapshotAt: snapshot.lastUpdated,
      nextRefreshDueAt: snapshot.nextRefreshAt,
      snapshotStatus: snapshot.status,
      lastRefreshError: snapshot.errorMessage || null,
      
      // Data availability checks
      overviewAvailable: !!(snapshot.lifetimeSnapshot.performance.views && snapshot.lifetimeSnapshot.performance.views > 0),
      demographicsAvailable: !!(snapshot.lifetimeSnapshot.ageGender.ageGroups.length > 0),
      geographiesAvailable: !!(snapshot.lifetimeSnapshot.geographies.totalCountries > 0),
      trafficSourceAvailable: !!(snapshot.lifetimeSnapshot.recommendationEngine.viewsPercentage !== null),
      
      // Scope info
      scope: 'lifetime',
      period: 'lifetime'
    });
  } catch (error: any) {
    console.error('[API /api/admin/youtube-analytics/global-reach/status] ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
