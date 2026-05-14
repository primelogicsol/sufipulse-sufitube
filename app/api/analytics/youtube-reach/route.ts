import { NextResponse } from 'next/server';
import { youtubeAnalyticsService } from '@/lib/youtube-analytics-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analytics = await youtubeAnalyticsService.getLifetimeGlobalReachAnalytics();
    return NextResponse.json(analytics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
