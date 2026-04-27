import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/middleware/authenticate';
import { getGoogleAdsUserOAuth } from '@/app/lib/server/google-ads-oauth-store';
import { getAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';
import { getGoogleAdsCampaign } from '@/app/lib/server/google-ads-campaign-store';

/**
 * GET /api/google-ads/status?adoptionId=...
 *
 * Returns the Google Ads connection status for the authenticated user.
 * Requires authentication — unauthenticated requests receive 401.
 * OAuth data is scoped to auth.id (ignores userId query param).
 *
 * Token lookup priority:
 *   1. User-level record (google-ads-oauth.json, keyed by userId) — global per sponsor
 *   2. Adoption-level record (adoption-google-oauth.json, keyed by adoptionId) — legacy fallback
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const adoptionId = searchParams.get('adoptionId') || '';

  // Report exactly which env vars are missing so the UI can be specific.
  const REQUIRED_VARS = ['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_DEVELOPER_TOKEN'] as const;
  const missingVars = REQUIRED_VARS.filter((v) => !process.env[v]);
  const configured = missingVars.length === 0;

  const userId = auth.id;

  const userRecord = await getGoogleAdsUserOAuth(userId);
  const adoptionRecord = adoptionId ? await getAdoptionGoogleOAuthRecord(adoptionId) : null;
  const activeRecord = userRecord || adoptionRecord;

  const campaign = adoptionId ? await getGoogleAdsCampaign(adoptionId) : null;

  if (!activeRecord) {
    return NextResponse.json({
      configured,
      missing_vars: missingVars,
      connected: false,
      adoption_id: adoptionId || null,
      user_id: userId,
      accessible_customer_ids: [],
      campaign: null,
      message: configured
        ? 'No OAuth token found. Connect a Google Ads account to continue.'
        : `Google Ads not configured. Missing: ${missingVars.join(', ')}.`,
    });
  }

  return NextResponse.json({
    configured,
    missing_vars: missingVars,
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
