import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getStudioOAuthRecord } from '@/app/lib/server/google-ads-studio-oauth-store';

/**
 * GET /api/admin/google-ads/studio-status
 *
 * Returns the SufiTube managed account connection state for the admin panel.
 * Never exposes the access token or refresh token.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const record = await getStudioOAuthRecord();
  const customerId = process.env.STUDIO_GOOGLE_ADS_CUSTOMER_ID ?? null;

  if (!record) {
    return NextResponse.json({
      connected: false,
      customerId,
      expiresAt: null,
      updatedAt: null,
    });
  }

  return NextResponse.json({
    connected: true,
    customerId,
    expiresAt: record.expiresAt,
    updatedAt: record.updatedAt,
  });
}
