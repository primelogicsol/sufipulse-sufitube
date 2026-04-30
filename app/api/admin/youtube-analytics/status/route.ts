import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getYTAnalyticsToken } from '@/app/lib/server/youtube-analytics-oauth-store';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const token = await getYTAnalyticsToken();
  return NextResponse.json({
    connected: !!token?.refreshToken,
    updatedAt: token?.updatedAt ?? null,
  });
}
