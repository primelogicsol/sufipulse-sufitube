import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/middleware/authenticate';
import {
  getGoogleAdsUserOAuth,
  getValidUserAccessToken,
  upsertGoogleAdsUserOAuth,
} from '@/app/lib/server/google-ads-oauth-store';
import { getAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';
import { getGoogleAdsCampaign } from '@/app/lib/server/google-ads-campaign-store';

const ADS_API_VERSION = 'v17';

/**
 * GET /api/google-ads/status?adoptionId=...&recheck=1
 *
 * Returns the Google Ads connection status for the authenticated user.
 * Requires authentication — unauthenticated requests receive 401.
 *
 * With ?recheck=1: makes a live call to customers:listAccessibleCustomers to
 * detect accounts added after the original OAuth flow (e.g. newly set-up accounts).
 * Updates the stored record with the fresh list before returning.
 *
 * Token lookup priority:
 *   1. User-level record (google-ads-oauth.json, keyed by userId)
 *   2. Adoption-level record (adoption-google-oauth.json, keyed by adoptionId) — legacy
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const adoptionId = searchParams.get('adoptionId') || '';
  const recheck = searchParams.get('recheck') === '1';

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

  // Live re-fetch of accessible customer IDs when ?recheck=1.
  // Needed when the user creates a new Google Ads account after the initial OAuth flow —
  // the stored accessibleCustomerIds is stale in that case.
  let accessibleCustomerIds = activeRecord.accessibleCustomerIds ?? [];
  if (recheck && configured) {
    try {
      const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
      const accessToken = userRecord
        ? await getValidUserAccessToken(userId, userRecord)
        : activeRecord.accessToken;

      const res = await fetch(
        `https://googleads.googleapis.com/${ADS_API_VERSION}/customers:listAccessibleCustomers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': developerToken,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawIds: string[] = (data.resourceNames ?? []).map((rn: string) =>
          rn.replace('customers/', '')
        );
        // Format as XXX-XXX-XXXX
        const freshIds = rawIds.map((id) =>
          id.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')
        );
        accessibleCustomerIds = freshIds;

        // Persist the refreshed list so subsequent status calls are up-to-date
        if (userRecord) {
          await upsertGoogleAdsUserOAuth({
            userId,
            accessToken: userRecord.accessToken,
            refreshToken: userRecord.refreshToken,
            tokenType: userRecord.tokenType,
            accessibleCustomerIds: freshIds,
          });
        }
      }
    } catch {
      // Non-fatal — fall back to stored list
    }
  }

  return NextResponse.json({
    configured,
    missing_vars: missingVars,
    connected: true,
    adoption_id: adoptionId || null,
    user_id: userId,
    token_type: activeRecord.tokenType,
    expires_at: activeRecord.expiresAt,
    accessible_customer_ids: accessibleCustomerIds,
    google_email: (activeRecord as any).googleEmail || null,
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
