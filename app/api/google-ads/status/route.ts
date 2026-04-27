import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/server/middleware/authenticate';
import { getGoogleAdsUserOAuth } from '@/app/lib/server/google-ads-oauth-store';
import { getAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';
import { getGoogleAdsCampaign } from '@/app/lib/server/google-ads-campaign-store';

/**
 * GET /api/google-ads/status?adoptionId=...
 *
 * Returns the Google Ads connection status for the authenticated user.
 *
 * Unauthenticated: returns only { configured } — safe for server-config checks.
 * Authenticated: returns full OAuth state scoped to auth.id (ignores userId query param).
 *
 * Token lookup priority:
 *   1. User-level record (google-ads-oauth.json, keyed by userId) — global per sponsor
 *   2. Adoption-level record (adoption-google-oauth.json, keyed by adoptionId) — legacy fallback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adoptionId = searchParams.get('adoptionId') || '';

  const configured = !!(
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  );

  const authUser = await getAuthUser(request);

  if (!authUser) {
    return NextResponse.json({
      configured,
      connected: false,
      accessible_customer_ids: [],
      campaign: null,
    });
  }

  const userId = authUser.id;

  const userRecord = await getGoogleAdsUserOAuth(userId);
  const adoptionRecord = adoptionId ? await getAdoptionGoogleOAuthRecord(adoptionId) : null;
  const activeRecord = userRecord || adoptionRecord;

  const campaign = adoptionId ? await getGoogleAdsCampaign(adoptionId) : null;

  if (!activeRecord) {
    return NextResponse.json({
      configured,
      connected: false,
      adoption_id: adoptionId || null,
      user_id: userId,
      accessible_customer_ids: [],
      campaign: null,
      message: 'No OAuth token found. Connect a Google Ads account to continue.',
    });
  }

  return NextResponse.json({
    configured,
    connected: true,
    adoption_id: adoptionId || null,
    user_id: userId,
    token_type: activeRecord.tokenType,
    expires_at: activeRecord.expiresAt,
    accessible_customer_ids: activeRecord.accessibleCustomerIds,
    updated_at: activeRecord.updatedAt,
    campaign: campaign
      ? {
          campaign_resource_name: campaign.campaignResourceName,
          budget_resource_name: campaign.budgetResourceName,
          ad_group_resource_name: campaign.adGroupResourceName,
          selected_customer_id: campaign.selectedCustomerId,
          campaign_status: campaign.campaignStatus,
          api_failure_reason: campaign.apiFailureReason,
          youtube_video_id: campaign.youtubeVideoId,
          budget_amount: campaign.budgetAmount,
          release_id: campaign.releaseId,
          created_at: campaign.createdAt,
          updated_at: campaign.updatedAt,
        }
      : null,
  });
}
