import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getGoogleAdsAvailability } from '@/lib/google-ads/config';
import { getGoogleAdsUserOAuth } from '@/app/lib/server/google-ads-oauth-store';

/**
 * GET /api/admin/google-ads/status
 * Returns detailed diagnostics for admins.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const availability = getGoogleAdsAvailability(true);
  
  // Check "Studio" account (used for managed_sufitube)
  // In this project, the Studio account is often the same as an admin's account 
  // or a specific fixed userId. Let's check for a common admin record.
  const studioRecord = await getGoogleAdsUserOAuth('admin') || await getGoogleAdsUserOAuth(auth.id);

  return NextResponse.json({
    ...availability,
    studioAccount: studioRecord ? {
      connected: true,
      googleEmail: studioRecord.googleEmail,
      customerId: studioRecord.verifiedCustomerId,
      expiresAt: studioRecord.expiresAt,
      updatedAt: studioRecord.updatedAt,
    } : { connected: false },
    tokenRefreshWorking: !!studioRecord?.refreshToken,
    accessibleCustomersTestAvailable: !!studioRecord?.accessToken,
  });
}
