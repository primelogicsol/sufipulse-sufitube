import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/server/middleware/authenticate';
import {
  getGoogleAdsUserOAuth,
} from '@/app/lib/server/google-ads-oauth-store';
import { getGoogleAdsCampaign } from '@/app/lib/server/google-ads-campaign-store';
import { getGoogleAdsAvailability } from '@/lib/google-ads/config';

/**
 * GET /api/google-ads/status
 * Returns connection status and availability.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  const isAdmin = auth?.role === 'admin';
  const availability = getGoogleAdsAvailability(isAdmin);

  if (!auth) {
    return NextResponse.json({
      ...availability,
      connected: false,
      message: availability.available 
        ? 'Sign in to connect your Google Ads account.' 
        : availability.message
    });
  }

  const userId = auth.id;
  const userRecord = await getGoogleAdsUserOAuth(userId);
  const { searchParams } = new URL(request.url);
  const adoptionId = searchParams.get('adoptionId') || '';
  const campaign = adoptionId ? await getGoogleAdsCampaign(adoptionId) : null;

  return NextResponse.json({
    ...availability,
    connected: !!userRecord,
    userId,
    googleEmail: userRecord?.googleEmail || null,
    verifiedCustomerId: userRecord?.verifiedCustomerId || null,
    accessibleCustomerIds: userRecord?.accessibleCustomerIds || [],
    selectedCustomerId: campaign?.selectedCustomerId || userRecord?.verifiedCustomerId || null,
    campaignStatus: campaign?.campaignStatus || null,
    updatedAt: userRecord?.updatedAt || null,
  });
}
