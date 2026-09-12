import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getYouTubeConnection } from '@/lib/youtube-connection';
import { getYTAnalyticsToken } from '@/app/lib/server/youtube-analytics-oauth-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const yt = await getYouTubeConnection();
  const health = await yt.checkHealth();
  const stored = await getYTAnalyticsToken();

  return NextResponse.json({
    connected: health.oauth === 'CONNECTED',
    reconnectRequired: health.oauth === 'REAUTH_REQUIRED',
    updatedAt: stored?.updatedAt ?? null,
    credentialSource: stored?.refreshToken ? 'interactive_oauth' : 'server_refresh_token',
  });
}