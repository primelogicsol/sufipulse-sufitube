import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getGoogleAdsAvailability } from '@/lib/google-ads/config';
import { getGoogleAdsUserOAuth } from '@/app/lib/server/google-ads-oauth-store';
import { runInternalVerification } from '@/lib/google-ads/verification-matrix';

/**
 * GET /api/admin/google-ads/status
 * Returns detailed diagnostics for admins.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const availability = getGoogleAdsAvailability(true);
  
  // Check "Studio" account (used for managed_sufitube)
  const studioRecord = await getGoogleAdsUserOAuth('admin') || await getGoogleAdsUserOAuth(auth.id);

  // Run full internal verification matrix for the studio account
  const verification = studioRecord ? await runInternalVerification({
    userId: studioRecord.userId,
    targetCustomerId: studioRecord.verifiedCustomerId || undefined
  }) : null;

  return NextResponse.json({
    ...availability,
    studioAccount: studioRecord ? {
      connected: true,
      googleEmail: studioRecord.googleEmail,
      customerId: studioRecord.verifiedCustomerId,
      expiresAt: studioRecord.expiresAt,
      updatedAt: studioRecord.updatedAt,
      verification: verification,
    } : { connected: false },
    tokenRefreshWorking: !!studioRecord?.refreshToken,
    accessibleCustomersTestAvailable: !!studioRecord?.accessToken,
    infrastructureStatus: verification?.oauth.valid ? 'HEALTHY' : 'DEGRADED',
    lastCheck: new Date().toISOString(),
  });
}
