import { NextRequest, NextResponse } from 'next/server';
import {
  getGoogleAdsUserOAuth,
  getValidUserAccessToken,
} from '@/app/lib/server/google-ads-oauth-store';
import {
  getAdoptionGoogleOAuthRecord,
  upsertAdoptionGoogleOAuthRecord,
} from '@/app/lib/server/adoption-google-oauth-store';
import { upsertGoogleAdsCampaign } from '@/app/lib/server/google-ads-campaign-store';
import { requireAuth } from '@/server/middleware/authenticate';

/**
 * POST /api/google-ads/campaigns/create
 *
 * User-accessible (not admin-only) Google Ads campaign creation.
 * Builds the full campaign structure in the sponsor's own Google Ads account:
 *   Budget → Campaign → Ad Group → Video Ad → Geo Targeting
 *
 * Token lookup: prefers user-level OAuth (by userId), falls back to adoption-level.
 *
 * Controlled by GOOGLE_ADS_CREATE_MODE env var:
 *   draft         → save intent, no API call
 *   manual_review → create campaign in PAUSED state (default, safest)
 *   live          → create campaign in ENABLED state immediately
 */

const ADS_API_VERSION = 'v17';
const CREATE_MODE = (process.env.GOOGLE_ADS_CREATE_MODE || 'manual_review') as
  | 'draft'
  | 'manual_review'
  | 'live';

interface CreateCampaignBody {
  adoptionId: string;
  releaseId: string;
  userId: string;
  youtubeVideoId: string;
  releaseTitle: string;
  budgetAmount: number;
  selectedCustomerId: string;
  targetRegions?: string[];
  targetLanguages?: string[];
  campaignObjective?: string;
  durationDays?: number;
}

const GEO_IDS: Record<string, number> = {
  US: 2840, GB: 2826, CA: 2124, AU: 2036, PK: 2586, IN: 2356,
  AE: 2784, SA: 2682, DE: 2276, FR: 2250, NL: 2528, SE: 2752,
  BD: 2050, NG: 2566, ZA: 2710, MY: 2458, ID: 2360, TR: 2792,
};

const CTA_MAP: Record<string, string> = {
  awareness: 'Discover',
  devotional_reach: 'Feel',
  community_engagement: 'Share',
  event_support: 'Join us',
  release_launch_support: 'Watch now',
};

function buildHeaders(
  accessToken: string,
  developerToken: string,
  loginCustomerId?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'developer-token': developerToken,
  };
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId.replace(/-/g, '');
  }
  return headers;
}

async function adsRequest(
  customerId: string,
  resourcePath: string,
  body: unknown,
  headers: Record<string, string>
) {
  const cid = customerId.replace(/-/g, '');
  const url = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${cid}/${resourcePath}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json?.error?.message ||
        JSON.stringify(json?.error?.details?.[0]) ||
        `Google Ads API error ${res.status}`
    );
  }
  return json;
}

async function resolveAccessToken(
  userId: string,
  adoptionId: string
): Promise<string | null> {
  // 1. Try user-level token (global per sponsor)
  if (userId) {
    const userRecord = await getGoogleAdsUserOAuth(userId);
    if (userRecord?.accessToken) {
      return getValidUserAccessToken(userId, userRecord);
    }
  }

  // 2. Fall back to adoption-level token
  if (adoptionId) {
    const adoptionRecord = await getAdoptionGoogleOAuthRecord(adoptionId);
    if (!adoptionRecord?.accessToken) return null;

    const isExpiring =
      adoptionRecord.expiresAt
        ? Date.now() + 5 * 60 * 1000 >= new Date(adoptionRecord.expiresAt).getTime()
        : false;

    if (!isExpiring) return adoptionRecord.accessToken;
    if (!adoptionRecord.refreshToken) return adoptionRecord.accessToken;

    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    if (!clientId || !clientSecret) return adoptionRecord.accessToken;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: adoptionRecord.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const tokens = await res.json();
    if (res.ok && tokens.access_token) {
      await upsertAdoptionGoogleOAuthRecord({
        adoptionId,
        accessToken: tokens.access_token,
        refreshToken: adoptionRecord.refreshToken,
        tokenType: tokens.token_type || adoptionRecord.tokenType,
        expiresInSeconds: Number(tokens.expires_in || 3600),
        accessibleCustomerIds: adoptionRecord.accessibleCustomerIds,
      });
      return tokens.access_token;
    }
    return adoptionRecord.accessToken;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body: CreateCampaignBody = await request.json();
  const {
    adoptionId,
    releaseId,
    userId,
    youtubeVideoId,
    releaseTitle,
    budgetAmount,
    selectedCustomerId,
    targetRegions = ['US', 'GB', 'CA', 'AU', 'PK', 'IN'],
    targetLanguages = ['en', 'ur'],
    campaignObjective = 'awareness',
    durationDays = 14,
  } = body;

  if (!adoptionId || !youtubeVideoId || !selectedCustomerId) {
    return NextResponse.json(
      { error: 'adoptionId, youtubeVideoId, and selectedCustomerId are required.' },
      { status: 400 }
    );
  }
  if (!budgetAmount || budgetAmount < 1) {
    return NextResponse.json(
      { error: 'budgetAmount must be at least 1.' },
      { status: 400 }
    );
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    return NextResponse.json(
      { error: 'GOOGLE_ADS_DEVELOPER_TOKEN is not configured on this server.' },
      { status: 503 }
    );
  }

  // Draft mode — record intent, skip Google Ads API
  if (CREATE_MODE === 'draft') {
    const record = await upsertGoogleAdsCampaign({
      adoptionId,
      releaseId,
      userId,
      selectedCustomerId,
      youtubeVideoId,
      budgetAmount,
      campaignStatus: 'PAUSED',
    });
    return NextResponse.json({
      success: true,
      status: 'draft_saved',
      note: 'GOOGLE_ADS_CREATE_MODE=draft — campaign intent saved. No Google Ads API call was made. Change to manual_review or live for real campaigns.',
      adoption_id: adoptionId,
      release_id: releaseId,
      campaign: record,
    });
  }

  // Resolve OAuth access token
  const accessToken = await resolveAccessToken(userId, adoptionId);
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          'Google OAuth token not found for this adoption. Complete the Google Ads connection step first.',
      },
      { status: 400 }
    );
  }

  const campaignStatus = CREATE_MODE === 'live' ? 'ENABLED' : 'PAUSED';
  const headers = buildHeaders(accessToken, developerToken);

  try {
    // ── Step 1: Campaign Budget ───────────────────────────────────────────────
    const budgetMicros = Math.round(budgetAmount * 1_000_000);
    const budgetResult = await adsRequest(
      selectedCustomerId,
      'campaignBudgets:mutate',
      {
        operations: [
          {
            create: {
              name: `SufiPulse ${adoptionId.slice(-8)} Budget`,
              deliveryMethod: 'STANDARD',
              amountMicros: budgetMicros,
            },
          },
        ],
      },
      headers
    );
    const budgetResourceName: string = budgetResult.results[0].resourceName;

    // ── Step 2: Campaign ──────────────────────────────────────────────────────
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

    const campaignResult = await adsRequest(
      selectedCustomerId,
      'campaigns:mutate',
      {
        operations: [
          {
            create: {
              name: `SufiPulse – ${releaseTitle.slice(0, 40)} [${adoptionId.slice(-6)}]`,
              advertisingChannelType: 'VIDEO',
              biddingStrategyType: 'TARGET_CPM',
              campaignBudget: budgetResourceName,
              status: campaignStatus,
              startDate: fmt(startDate),
              endDate: fmt(endDate),
              networkSettings: {
                targetYoutube: true,
                targetContentNetwork: false,
              },
            },
          },
        ],
      },
      headers
    );
    const campaignResourceName: string = campaignResult.results[0].resourceName;

    // ── Step 3: Ad Group ──────────────────────────────────────────────────────
    const adGroupResult = await adsRequest(
      selectedCustomerId,
      'adGroups:mutate',
      {
        operations: [
          {
            create: {
              name: `${releaseTitle.slice(0, 40)} – AdGroup`,
              campaign: campaignResourceName,
              status: 'ENABLED',
              adGroupType: 'VIDEO_TRUE_VIEW_IN_STREAM',
            },
          },
        ],
      },
      headers
    );
    const adGroupResourceName: string = adGroupResult.results[0].resourceName;

    // ── Step 4: Video Ad ──────────────────────────────────────────────────────
    const cta = CTA_MAP[campaignObjective] || 'Watch now';
    await adsRequest(
      selectedCustomerId,
      'adGroupAds:mutate',
      {
        operations: [
          {
            create: {
              adGroup: adGroupResourceName,
              status: 'ENABLED',
              ad: {
                finalUrls: [`https://www.youtube.com/watch?v=${youtubeVideoId}`],
                videoAd: {
                  inStream: {
                    actionButtonLabel: cta,
                    actionHeadline: releaseTitle.slice(0, 25),
                    video: { youtubeVideoId },
                  },
                },
              },
            },
          },
        ],
      },
      headers
    );

    // ── Step 5: Geo Targeting ─────────────────────────────────────────────────
    const geoIds = targetRegions
      .map((c) => GEO_IDS[c.toUpperCase()])
      .filter((id): id is number => Boolean(id));

    if (geoIds.length > 0) {
      await adsRequest(
        selectedCustomerId,
        'campaignCriteria:mutate',
        {
          operations: geoIds.map((geoId) => ({
            create: {
              campaign: campaignResourceName,
              location: { geoTargetConstant: `geoTargetConstants/${geoId}` },
            },
          })),
        },
        headers
      );
    }

    // ── Persist campaign record ───────────────────────────────────────────────
    const campaignRecord = await upsertGoogleAdsCampaign({
      adoptionId,
      releaseId,
      userId,
      selectedCustomerId,
      youtubeVideoId,
      budgetAmount,
      campaignResourceName,
      budgetResourceName,
      adGroupResourceName,
      campaignStatus: campaignStatus as 'PAUSED' | 'ENABLED',
    });

    return NextResponse.json({
      success: true,
      campaign_resource_name: campaignResourceName,
      budget_resource_name: budgetResourceName,
      ad_group_resource_name: adGroupResourceName,
      campaign_status: campaignStatus,
      customer_id: selectedCustomerId,
      adoption_id: adoptionId,
      release_id: releaseId,
      note:
        campaignStatus === 'PAUSED'
          ? 'Campaign created in PAUSED state. It will be reviewed before activation.'
          : 'Campaign created in ENABLED state and is now live.',
      campaign: campaignRecord,
    });
  } catch (error: any) {
    // Record failure reason in campaign store so admin can diagnose
    await upsertGoogleAdsCampaign({
      adoptionId,
      releaseId,
      userId,
      selectedCustomerId,
      youtubeVideoId,
      budgetAmount,
      apiFailureReason: error?.message || 'Unknown Google Ads API error',
    });

    console.error('[google-ads/campaigns/create] API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Google Ads campaign creation failed.' },
      { status: 500 }
    );
  }
}
