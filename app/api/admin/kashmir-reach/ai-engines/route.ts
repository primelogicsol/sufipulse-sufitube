import { NextRequest, NextResponse } from 'next/server';
import {
  runAI01DiscoveryScan,
  runAI04ReleaseMatching,
  runAI08EngagementIntelligence,
  runAI09QualityIntegrity,
  runAI10Optimization,
} from '@/server/services/kpn-ai-engines';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const releaseSlug = searchParams.get('releaseSlug') || 'footprints-behind';

    const discovery = runAI01DiscoveryScan();
    const releaseMatches = runAI04ReleaseMatching(releaseSlug);
    const engagement = runAI08EngagementIntelligence();
    const quality = runAI09QualityIntegrity(releaseSlug);
    const optimization = runAI10Optimization();

    return NextResponse.json({
      success: true,
      data: {
        discovery,
        releaseMatches,
        engagement,
        quality,
        optimization,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'AI engine execution failed' },
      { status: 500 }
    );
  }
}
