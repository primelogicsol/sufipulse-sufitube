import { NextRequest, NextResponse } from 'next/server';
import { discoveryAnalytics, type DiscoverySourceType, type DiscoveryActionType } from '@/lib/discovery-analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceType, sourceSlug, actionType } = body;

    const validSourceTypes: DiscoverySourceType[] = ['concept', 'theme', 'region', 'release', 'playlist'];
    const validActionTypes: DiscoveryActionType[] = ['video_click', 'playlist_click', 'subscribe_click'];

    if (!validSourceTypes.includes(sourceType) || !validActionTypes.includes(actionType) || !sourceSlug) {
      return NextResponse.json({ error: 'Invalid click telemetry payload.' }, { status: 400 });
    }

    discoveryAnalytics.recordClick(sourceType, sourceSlug, actionType);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
