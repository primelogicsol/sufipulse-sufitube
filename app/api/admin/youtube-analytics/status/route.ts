import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  getValidYTAnalyticsAccessToken,
  getYTAnalyticsToken,
} from '@/app/lib/server/youtube-analytics-oauth-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const stored = await getYTAnalyticsToken();
  if (!stored?.refreshToken) {
    return NextResponse.json({
      connected: false,
      reconnectRequired: false,
      updatedAt: null,
    });
  }

  const accessToken = await getValidYTAnalyticsAccessToken();
  return NextResponse.json({
    connected: !!accessToken,
    reconnectRequired: !accessToken,
    updatedAt: stored.updatedAt ?? null,
  });
}
