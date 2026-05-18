import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getGoogleAdsAvailability } from '@/lib/google-ads/config';
import { getStudioOAuthRecord } from '@/app/lib/server/google-ads-studio-oauth-store';
import { runInternalVerification } from '@/lib/google-ads/verification-matrix';

/**
 * GET /api/admin/google-ads/status
 * Returns detailed diagnostics for admins regarding the managed infrastructure.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const availability = getGoogleAdsAvailability(true);
  
  // Check "Studio" account (used for managed_sufitube)
  const studioRecord = await getStudioOAuthRecord();

  // Run full internal verification matrix for the studio account
  const verification = studioRecord ? await runInternalVerification({
    targetCustomerId: process.env.STUDIO_GOOGLE_ADS_CUSTOMER_ID || undefined
  }) : null;

  // Manual signal extraction for the dashboard
  const signals = {
    oauthActive: !!verification?.oauth.valid,
    tokenExpired: !!verification?.oauth.tokenExpired,
    tokenExpiring: false,
    mccAccessible: !!verification?.account.accessible && !!verification?.account.viaMcc,
    accountSuspended: !!verification?.suspension?.isSuspended,
    infrastructureHealthy: !!verification?.oauth.valid && !!verification?.account.accessible,
  };

  // Check if token expires in less than 1 hour
  if (studioRecord?.expiresAt) {
    const expires = new Date(studioRecord.expiresAt).getTime();
    signals.tokenExpiring = (expires - Date.now()) < 3600000 && (expires - Date.now()) > 0;
  }

  return NextResponse.json({
    ...availability,
    studioAccount: studioRecord ? {
      connected: true,
      googleEmail: null, // Studio record currently does not store email
      customerId: process.env.STUDIO_GOOGLE_ADS_CUSTOMER_ID,
      expiresAt: studioRecord.expiresAt,
      updatedAt: studioRecord.updatedAt,
      verification: verification,
    } : { connected: false },
    signals,
    lastCheck: new Date().toISOString(),
  });
}
