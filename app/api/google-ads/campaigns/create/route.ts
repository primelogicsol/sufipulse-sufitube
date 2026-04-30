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
import { getValidStudioAccessToken } from '@/app/lib/server/google-ads-studio-oauth-store';
import { requireAuth } from '@/server/middleware/authenticate';

/**
 * POST /api/google-ads/campaigns/create
 *
 * Creates a Google Ads campaign. Handles both methods:
 *
 *   managed_sufitube   — uses the SufiTube studio account (server-side OAuth token
 *                        from .data/google-ads-studio-oauth.json). Customer ID from
 *                        STUDIO_GOOGLE_ADS_CUSTOMER_ID env var only — never NEXT_PUBLIC_.
 *
 *   use_my_google_ads  — uses the sponsor's own account (sponsor OAuth token stored
 *                        per-user or per-adoption). Unchanged from before.
 *
 * Controlled by GOOGLE_ADS_CREATE_MODE:
 *   draft         → save intent, no API call
 *   manual_review → create campaign in PAUSED state (VPS default)
 *   live          → create campaign in ENABLED state immediately
 */

const ADS_API_VERSION = 'v22';
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
  methodType?: 'managed_sufitube' | 'use_my_google_ads';
  selectedCustomerId?: string;
  targetRegions?: string[];
  targetLanguages?: string[];
  campaignObjective?: string;
  durationDays?: number;
}

// Full region name → Google Ads geo target constant IDs (from UI chip values)
const REGION_GEO_MAP: Record<string, number[]> = {
  'global':         [],                                              // no restriction
  'south asia':     [2586, 2356, 2050, 2144, 2524, 2004],           // PK IN BD LK NP AF
  'india':          [2356],
  'pakistan':       [2586],
  'united kingdom': [2826],
  'united states':  [2840],
  'canada':         [2124],
  'australia':      [2036],
  'mena':           [2784, 2682, 2818, 2368, 2400, 2414, 2422, 2434, 2504, 2512, 2634, 2788, 2887],
  'europe':         [2276, 2250, 2528, 2752, 2380, 2724, 2616, 2056, 2040, 2756],
  'east africa':    [2404, 2834, 2800, 2231, 2646],
  'southeast asia': [2458, 2360, 2702, 2608, 2764, 2704],
};
// 2-letter country code fallback (legacy / managed_sufitube)
const GEO_IDS: Record<string, number> = {
  US: 2840, GB: 2826, CA: 2124, AU: 2036, PK: 2586, IN: 2356,
  AE: 2784, SA: 2682, DE: 2276, FR: 2250, NL: 2528, SE: 2752,
  BD: 2050, NG: 2566, ZA: 2710, MY: 2458, ID: 2360, TR: 2792,
};
function resolveGeoIds(regions: string[]): number[] {
  const ids = new Set<number>();
  for (const region of regions) {
    const key = region.toLowerCase().trim();
    if (key === 'global' || key === 'all') continue;
    const mapped = REGION_GEO_MAP[key];
    if (mapped) { mapped.forEach(id => ids.add(id)); continue; }
    const fallback = GEO_IDS[region.toUpperCase()];
    if (fallback) ids.add(fallback);
  }
  return Array.from(ids);
}

// Google Ads language criterion IDs
const LANGUAGE_IDS: Record<string, number> = {
  'english': 1000, 'urdu': 1031, 'hindi': 1023, 'arabic': 1019,
  'punjabi': 1102, 'kashmiri': 1038, 'persian': 1065, 'bengali': 1056,
  'turkish': 1037,
};
function resolveLanguageIds(languages: string[]): number[] {
  const ids: number[] = [];
  for (const lang of languages) {
    const key = lang.toLowerCase().trim();
    if (key === 'all') continue;
    const id = LANGUAGE_IDS[key];
    if (id) ids.push(id);
  }
  return ids;
}

function budgetToDurationDays(amount: number): number {
  if (amount < 50)  return 5;
  if (amount < 100) return 10;
  if (amount < 300) return 14;
  return 21;
}

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

async function resolveUserAccessToken(
  userId: string,
  adoptionId: string
): Promise<string | null> {
  if (userId) {
    const userRecord = await getGoogleAdsUserOAuth(userId);
    if (userRecord?.accessToken) {
      return getValidUserAccessToken(userId, userRecord);
    }
  }
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
    methodType = 'use_my_google_ads',
    selectedCustomerId,
    targetRegions = ['US', 'GB', 'CA', 'AU', 'PK', 'IN'],
    targetLanguages = ['en', 'ur'],
    campaignObjective = 'awareness',
    durationDays,
  } = body;

  const resolvedDuration = durationDays && durationDays > 0
    ? durationDays
    : budgetToDurationDays(budgetAmount);

  if (!adoptionId || !youtubeVideoId) {
    return NextResponse.json(
      { error: 'adoptionId and youtubeVideoId are required.' },
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

  // ── Draft mode ────────────────────────────────────────────────────────────
  if (CREATE_MODE === 'draft') {
    const record = await upsertGoogleAdsCampaign({
      adoptionId,
      releaseId,
      userId,
      selectedCustomerId: selectedCustomerId ?? '',
      youtubeVideoId,
      budgetAmount,
      campaignStatus: 'PAUSED',
    });
    return NextResponse.json({
      success: true,
      status: 'draft_saved',
      note: 'GOOGLE_ADS_CREATE_MODE=draft — no Google Ads API call made.',
      adoption_id: adoptionId,
      release_id: releaseId,
      campaign: record,
    });
  }

  // ── Resolve credentials by method ────────────────────────────────────────
  let accessToken: string;
  let customerId: string;
  let loginCustomerId: string | undefined;

  if (methodType === 'managed_sufitube') {
    const studioCustomerId = process.env.STUDIO_GOOGLE_ADS_CUSTOMER_ID;
    if (!studioCustomerId) {
      return NextResponse.json(
        { error: 'STUDIO_GOOGLE_ADS_CUSTOMER_ID is not configured.' },
        { status: 503 }
      );
    }

    const token = await getValidStudioAccessToken();
    if (!token) {
      return NextResponse.json(
        { error: 'SufiTube managed account is not connected. An admin must complete the OAuth setup at /admin/google-ads.' },
        { status: 503 }
      );
    }

    accessToken = token;
    customerId = studioCustomerId;
    loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  } else {
    // use_my_google_ads — sponsor's own account
    if (!selectedCustomerId) {
      return NextResponse.json(
        { error: 'selectedCustomerId is required for use_my_google_ads.' },
        { status: 400 }
      );
    }

    const token = await resolveUserAccessToken(userId, adoptionId);
    if (!token) {
      return NextResponse.json(
        { error: 'Google OAuth token not found. Complete the Google Ads connection step first.' },
        { status: 400 }
      );
    }

    accessToken = token;
    customerId = selectedCustomerId;
  }

  const campaignStatus = CREATE_MODE === 'live' ? 'ENABLED' : 'PAUSED';
  const headers = buildHeaders(accessToken, developerToken, loginCustomerId);

  try {
    // ── Step 1: Campaign Budget ───────────────────────────────────────────────
    const budgetMicros = Math.round(budgetAmount * 1_000_000);
    const budgetResult = await adsRequest(customerId, 'campaignBudgets:mutate', {
      operations: [{
        create: {
          name: `SufiPulse ${adoptionId.slice(-8)} Budget`,
          deliveryMethod: 'STANDARD',
          amountMicros: budgetMicros,
        },
      }],
    }, headers);
    const budgetResourceName: string = budgetResult.results[0].resourceName;

    // ── Step 2: Campaign ──────────────────────────────────────────────────────
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + resolvedDuration * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

    const campaignResult = await adsRequest(customerId, 'campaigns:mutate', {
      operations: [{
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
      }],
    }, headers);
    const campaignResourceName: string = campaignResult.results[0].resourceName;

    // ── Step 3: Ad Group ──────────────────────────────────────────────────────
    const adGroupResult = await adsRequest(customerId, 'adGroups:mutate', {
      operations: [{
        create: {
          name: `${releaseTitle.slice(0, 40)} – AdGroup`,
          campaign: campaignResourceName,
          status: 'ENABLED',
          adGroupType: 'VIDEO_TRUE_VIEW_IN_STREAM',
        },
      }],
    }, headers);
    const adGroupResourceName: string = adGroupResult.results[0].resourceName;

    // ── Step 4: Video Ad ──────────────────────────────────────────────────────
    const cta = CTA_MAP[campaignObjective] || 'Watch now';
    await adsRequest(customerId, 'adGroupAds:mutate', {
      operations: [{
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
      }],
    }, headers);

    // ── Step 5: Geo Targeting ─────────────────────────────────────────────────
    const geoIds = resolveGeoIds(targetRegions);
    if (geoIds.length > 0) {
      await adsRequest(customerId, 'campaignCriteria:mutate', {
        operations: geoIds.map((geoId) => ({
          create: {
            campaign: campaignResourceName,
            location: { geoTargetConstant: `geoTargetConstants/${geoId}` },
          },
        })),
      }, headers);
    }

    // ── Step 6: Language Targeting ────────────────────────────────────────────
    const langIds = resolveLanguageIds(targetLanguages);
    if (langIds.length > 0) {
      await adsRequest(customerId, 'campaignCriteria:mutate', {
        operations: langIds.map((langId) => ({
          create: {
            campaign: campaignResourceName,
            language: { languageConstant: `languageConstants/${langId}` },
          },
        })),
      }, headers);
    }

    // ── Persist campaign record ───────────────────────────────────────────────
    const campaignRecord = await upsertGoogleAdsCampaign({
      adoptionId,
      releaseId,
      userId,
      selectedCustomerId: customerId,
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
      customer_id: customerId,
      adoption_id: adoptionId,
      release_id: releaseId,
      method_type: methodType,
      note: campaignStatus === 'PAUSED'
        ? 'Campaign created in PAUSED state. It will be reviewed before activation.'
        : 'Campaign created in ENABLED state and is now live.',
      campaign: campaignRecord,
    });
  } catch (error: any) {
    await upsertGoogleAdsCampaign({
      adoptionId,
      releaseId,
      userId,
      selectedCustomerId: customerId,
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
