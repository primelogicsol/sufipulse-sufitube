import { NextRequest, NextResponse } from 'next/server';
import { getAdoptionGoogleOAuthRecord, upsertAdoptionGoogleOAuthRecord, AdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';
import { getValidStudioAccessToken } from '@/app/lib/server/google-ads-studio-oauth-store';
import { requireAdmin } from '@/server/middleware/authenticate';

/**
 * POST /api/admin/google-ads/create-campaign
 *
 * Creates a YouTube video promotion campaign in Google Ads.
 *
 * Two modes:
 *   1. method_type = 'managed_sufitube'
 *      Uses SufiTube's own Google Ads account (env vars GOOGLE_ADS_*).
 *      Budget charged to SufiTube — sponsor already paid via Stripe.
 *
 *   2. method_type = 'use_my_google_ads'
 *      Uses the SPONSOR's Google Ads account.
 *      Requires the sponsor to have completed the OAuth2 flow
 *      (/api/adoptions/[id]/google-oauth/callback) so their access_token
 *      is stored in the adoption record.
 *
 * Google Ads API reference:
 *   https://developers.google.com/google-ads/api/docs/campaign-management/overview
 */

const ADS_API_VERSION = 'v17';

// Safety flag: 'draft' | 'manual_review' (default) | 'live'
// draft         → log intent, no Google Ads API call
// manual_review → create campaign in PAUSED state (admin activates manually)
// live          → create campaign in ENABLED state immediately
const CREATE_MODE = (process.env.GOOGLE_ADS_CREATE_MODE || 'manual_review') as 'draft' | 'manual_review' | 'live';

function isTokenExpiringSoon(record: AdoptionGoogleOAuthRecord): boolean {
  if (!record.expiresAt) return false;
  const bufferMs = 5 * 60 * 1000; // refresh if within 5 minutes of expiry
  return Date.now() + bufferMs >= new Date(record.expiresAt).getTime();
}

async function getValidAccessToken(adoptionId: string, record: AdoptionGoogleOAuthRecord): Promise<string> {
  if (!isTokenExpiringSoon(record)) return record.accessToken;
  if (!record.refreshToken) return record.accessToken; // can't refresh, try existing

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return record.accessToken; // no creds to refresh with

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: record.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await res.json();
  if (!res.ok || !tokens.access_token) {
    console.error('Google Ads token refresh failed:', tokens);
    return record.accessToken; // fall back to existing token
  }

  await upsertAdoptionGoogleOAuthRecord({
    adoptionId,
    accessToken: tokens.access_token,
    refreshToken: record.refreshToken,
    tokenType: tokens.token_type || record.tokenType,
    expiresInSeconds: Number(tokens.expires_in || 3600),
    accessibleCustomerIds: record.accessibleCustomerIds,
  });

  return tokens.access_token;
}

interface CreateCampaignBody {
  adoption_id: string;
  method_type: 'managed_sufitube' | 'use_my_google_ads';
  // For managed_sufitube - optional override
  budget_usd?: number;
  duration_days?: number;
  // Release details for ad copy
  youtube_video_id: string;
  release_title: string;
  // Targeting
  target_regions?: string[];       // ISO country codes e.g. ['US','GB','PK']
  target_languages?: string[];     // BCP-47 e.g. ['en','ur']
  campaign_objective?: string;     // awareness | devotional_reach | etc.
  // For use_my_google_ads
  sponsor_customer_id?: string;    // format: 123-456-7890
  sponsor_access_token?: string;   // OAuth2 access token from the sponsor
}

function buildHeaders(accessToken: string, developerToken: string, loginCustomerId?: string) {
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
  path: string,
  body: any,
  headers: Record<string, string>
) {
  const cid = customerId.replace(/-/g, '');
  const url = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${cid}/${path}`;
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

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body: CreateCampaignBody = await request.json();

  const {
    adoption_id,
    method_type,
    budget_usd = 50,
    duration_days = 14,
    youtube_video_id,
    release_title,
    target_regions = ['US', 'GB', 'CA', 'AU', 'PK', 'IN'],
    target_languages = ['en', 'ur'],
    campaign_objective = 'awareness',
    sponsor_customer_id,
    sponsor_access_token,
  } = body;

  if (!adoption_id || !youtube_video_id) {
    return NextResponse.json({ error: 'adoption_id and youtube_video_id are required' }, { status: 400 });
  }

  // Draft mode: record intent without calling Google Ads API
  if (CREATE_MODE === 'draft') {
    return NextResponse.json({
      success: true,
      status: 'draft_saved',
      note: 'GOOGLE_ADS_CREATE_MODE=draft — campaign intent saved but not submitted to Google Ads. Change to manual_review or live to create real campaigns.',
      adoption_id,
      youtube_video_id,
    });
  }

  // Resolve credentials
  let accessToken: string;
  let developerToken: string;
  let loginCustomerId: string | undefined;
  let customerId: string;

  const studioDevToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const studioLoginCid = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const studioCustomerId = process.env.STUDIO_GOOGLE_ADS_CUSTOMER_ID;

  if ((method_type as string) === 'managed_sufitube') {
    if (!studioDevToken || !studioCustomerId) {
      return NextResponse.json(
        {
          error:
            'SufiTube Google Ads credentials not configured. Set GOOGLE_ADS_DEVELOPER_TOKEN and STUDIO_GOOGLE_ADS_CUSTOMER_ID.',
        },
        { status: 503 }
      );
    }
    const studioToken = await getValidStudioAccessToken();
    if (!studioToken) {
      return NextResponse.json(
        { error: 'SufiTube managed account is not connected. Complete OAuth setup at /admin/google-ads.' },
        { status: 503 }
      );
    }
    accessToken = studioToken;
    developerToken = studioDevToken;
    loginCustomerId = studioLoginCid;
    customerId = studioCustomerId;
  } else {
    // use_my_google_ads
    if (!sponsor_customer_id) {
      return NextResponse.json(
        {
          error:
            "Sponsor's Google Ads customer ID is required.",
        },
        { status: 400 }
      );
    }
    if (!studioDevToken) {
      return NextResponse.json(
        { error: 'GOOGLE_ADS_DEVELOPER_TOKEN is required even for sponsor-managed campaigns.' },
        { status: 503 }
      );
    }

    // Prefer server-stored OAuth token bound to adoption_id; do not trust browser token payload.
    const oauthRecord = await getAdoptionGoogleOAuthRecord(adoption_id);
    if (!oauthRecord?.accessToken && !sponsor_access_token) {
      return NextResponse.json(
        { error: 'Sponsor Google OAuth token not found. Complete the Google OAuth connection step first.' },
        { status: 400 }
      );
    }

    // If we have discovered accessible customer IDs for this OAuth token, enforce membership.
    if (oauthRecord?.accessibleCustomerIds?.length) {
      const normalized = sponsor_customer_id.replace(/-/g, '');
      const allowed = oauthRecord.accessibleCustomerIds.some((cid) => cid.replace(/-/g, '') === normalized);
      if (!allowed) {
        return NextResponse.json(
          {
            error: `The provided customer ID (${sponsor_customer_id}) is not in the authorized Google Ads accounts for this adoption OAuth connection.`,
          },
          { status: 400 }
        );
      }
    }

    // Refresh token if it is expiring soon
    const freshToken = oauthRecord
      ? await getValidAccessToken(adoption_id, oauthRecord)
      : sponsor_access_token!;

    accessToken = freshToken;
    developerToken = studioDevToken;
    customerId = sponsor_customer_id;
    // No login-customer-id needed when acting as the account owner
  }

  const headers = buildHeaders(accessToken, developerToken, loginCustomerId);
  // Campaign activation state — PAUSED for manual_review, ENABLED for live
  const campaignStatus = CREATE_MODE === 'live' ? 'ENABLED' : 'PAUSED';

  try {
    // ── Step 1: Create Campaign Budget ────────────────────────────────────────
    const budgetMicros = Math.round(budget_usd * 1_000_000);
    const budgetResult = await adsRequest(customerId, 'campaignBudgets:mutate', {
      operations: [
        {
          create: {
            name: `SufiPulse Adoption ${adoption_id} Budget`,
            deliveryMethod: 'STANDARD',
            amountMicros: budgetMicros,
          },
        },
      ],
    }, headers);
    const budgetResourceName: string = budgetResult.results[0].resourceName;

    // ── Step 2: Create Campaign ───────────────────────────────────────────────
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration_days * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

    const campaignResult = await adsRequest(customerId, 'campaigns:mutate', {
      operations: [
        {
          create: {
            name: `SufiPulse – ${release_title} [${adoption_id.slice(-6)}]`,
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
    }, headers);
    const campaignResourceName: string = campaignResult.results[0].resourceName;

    // ── Step 3: Create Ad Group ────────────────────────────────────────────────
    const adGroupResult = await adsRequest(customerId, 'adGroups:mutate', {
      operations: [
        {
          create: {
            name: `${release_title} – AdGroup`,
            campaign: campaignResourceName,
            status: 'ENABLED',
            adGroupType: 'VIDEO_TRUE_VIEW_IN_STREAM',
          },
        },
      ],
    }, headers);
    const adGroupResourceName: string = adGroupResult.results[0].resourceName;

    // ── Step 4: Create Video Ad ────────────────────────────────────────────────
    const objectiveLabel: Record<string, string> = {
      awareness: 'Discover',
      devotional_reach: 'Feel',
      community_engagement: 'Share',
      event_support: 'Join us',
      release_launch_support: 'Watch now',
    };
    const cta = objectiveLabel[campaign_objective] || 'Watch now';

    await adsRequest(customerId, 'adGroupAds:mutate', {
      operations: [
        {
          create: {
            adGroup: adGroupResourceName,
            status: 'ENABLED',
            ad: {
              finalUrls: [`https://www.youtube.com/watch?v=${youtube_video_id}`],
              videoAd: {
                inStream: {
                  actionButtonLabel: cta,
                  actionHeadline: release_title.slice(0, 25),
                  video: {
                    youtubeVideoId: youtube_video_id,
                  },
                },
              },
            },
          },
        },
      ],
    }, headers);

    // ── Step 5: Geo Targeting ─────────────────────────────────────────────────
    // Map country codes to Google Ads Geo Target Constant IDs
    // Full list: https://developers.google.com/google-ads/api/data/geotargets
    const GEO_IDS: Record<string, number> = {
      US: 2840, GB: 2826, CA: 2124, AU: 2036,
      PK: 2586, IN: 2356, AE: 2784, SA: 2682,
      DE: 2276, FR: 2250, NL: 2528, SE: 2752,
    };
    const geoIds = target_regions
      .map((code) => GEO_IDS[code.toUpperCase()])
      .filter(Boolean);

    if (geoIds.length > 0) {
      await adsRequest(customerId, 'campaignCriteria:mutate', {
        operations: geoIds.map((geoId) => ({
          create: {
            campaign: campaignResourceName,
            location: {
              geoTargetConstant: `geoTargetConstants/${geoId}`,
            },
          },
        })),
      }, headers);
    }

    return NextResponse.json({
      success: true,
      campaign_resource_name: campaignResourceName,
      ad_group_resource_name: adGroupResourceName,
      status: campaignStatus,
      note: campaignStatus === 'PAUSED'
        ? 'Campaign created in PAUSED state. Activate it in Google Ads Manager after final review.'
        : 'Campaign created in ENABLED state and is now live.',
      customer_id: customerId,
      adoption_id,
    });
  } catch (error: any) {
    console.error('Google Ads campaign creation failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Google Ads campaign creation failed' },
      { status: 500 }
    );
  }
}
