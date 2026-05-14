import { NextResponse } from 'next/server';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600',
};

// GET /api/public/youtube/global-reach
export async function GET() {
  try {
    const analytics = await youtubeAnalyticsService.getLifetimeGlobalReachAnalytics();
    
    // Return only public-safe fields as requested
    const publicSafe = {
      period: analytics.period,
      title: analytics.title,
      subtitle: analytics.subtitle,
      ageGender: analytics.ageGender,
      performance: analytics.performance,
      recommendationEngine: analytics.recommendationEngine,
      geographies: analytics.geographies,
      lastUpdated: analytics.lastUpdated,
      nextRefreshAt: analytics.nextRefreshAt,
      status: analytics.status
    };

    return NextResponse.json(publicSafe, { headers: cacheHeaders });
  } catch (error: any) {
    console.error('[API /api/public/youtube/global-reach] ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch global reach analytics' }, { status: 500 });
  }
}
