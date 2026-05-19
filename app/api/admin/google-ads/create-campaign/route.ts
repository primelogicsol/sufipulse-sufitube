import { NextRequest, NextResponse } from 'next/server';
import { getAdoptionGoogleOAuthRecord, upsertAdoptionGoogleOAuthRecord, AdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';
import { getValidStudioAccessToken } from '@/app/lib/server/google-ads-studio-oauth-store';
import { requireAdmin } from '@/server/middleware/authenticate';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/admin/google-ads/create-campaign
 */

const ADS_API_VERSION = 'v22';
const CREATE_MODE = (process.env.GOOGLE_ADS_CREATE_MODE || 'manual_review') as 'draft' | 'manual_review' | 'live';
const LOG_FILE = path.join(process.cwd(), '.data', 'google-ads-operation-logs.json');

async function logOperation(event: any) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
    };
    let logs = [];
    try {
      const data = await fs.readFile(LOG_FILE, 'utf8');
      logs = JSON.parse(data);
    } catch (e) {}
    logs.unshift(logEntry);
    if (logs.length > 1000) logs = logs.slice(0, 1000);
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('[logOperation] Failed:', e);
  }
}

function isTokenExpiringSoon(record: AdoptionGoogleOAuthRecord): boolean {
  if (!record.expiresAt) return false;
  const bufferMs = 5 * 60 * 1000;
  return Date.now() + bufferMs >= new Date(record.expiresAt).getTime();
}

async function getValidAccessToken(adoptionId: string, record: AdoptionGoogleOAuthRecord): Promise<string> {
  if (!isTokenExpiringSoon(record)) return record.accessToken;
  if (!record.refreshToken) return record.accessToken;

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return record.accessToken;

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
    return record.accessToken;
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
  budget_usd?: number;
  duration_days?: number;
  youtube_video_id: string;
  release_title: string;
  target_regions?: string[];
  target_languages?: string[];
  campaign_objective?: string;
  sponsor_customer_id?: string;
  sponsor_access_token?: string;
  dry_run?: boolean;
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
  headers: Record<string, string>,
  validateOnly: boolean = false
) {
  const cid = customerId.replace(/-/g, '');
  const requestBody = { ...body };
  if (validateOnly) {
    requestBody.validate_only = true;
  }
  
  const url = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${cid}/${path}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(requestBody) });
  const json = await res.json();
  
  if (!res.ok) {
    const errorMsg = json?.error?.message || JSON.stringify(json?.error?.details?.[0]) || `Google Ads API error ${res.status}`;
    await logOperation({
      type: 'api_error',
      path,
      customerId: cid,
      error: errorMsg,
      validateOnly
    });
    throw new Error(errorMsg);
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
    dry_run = false,
  } = body;

  const isDryRun = dry_run || CREATE_MODE === 'draft';

  if (!adoption_id || !youtube_video_id) {
    return NextResponse.json({ error: 'adoption_id and youtube_video_id are required' }, { status: 400 });
  }

  await logOperation({
    type: 'campaign_creation_start',
    adoption_id,
    method_type,
    youtube_video_id,
    isDryRun
  });

  // Resolve credentials
  let accessToken: string;
  let developerToken: string;
  let loginCustomerId: string | undefined;
  let customerId: string;

  const studioDevToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const studioLoginCid = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const studioCustomerId = process.env.STUDIO_GOOGLE_ADS_CUSTOMER_ID;

  try {
    if ((method_type as string) === 'managed_sufitube') {
      if (!studioDevToken || !studioCustomerId) {
        const msg = 'SufiTube Google Ads credentials are not configured for this environment (missing Developer Token or Studio Customer ID).';
        await logOperation({ type: 'config_error', error: msg, adoption_id, isDryRun });
        return NextResponse.json({ error: msg }, { status: 503 });
      }
      const studioToken = await getValidStudioAccessToken();
      if (!studioToken) {
        const msg = 'SufiTube managed account is not connected. Complete OAuth setup at /admin/google-ads.';
        await logOperation({ type: 'config_error', error: msg, adoption_id, isDryRun });
        return NextResponse.json({ error: msg }, { status: 503 });
      }
      accessToken = studioToken;
      developerToken = studioDevToken;
      loginCustomerId = studioLoginCid;
      customerId = studioCustomerId;
    } else {
      if (!sponsor_customer_id) return NextResponse.json({ error: "Sponsor's Google Ads customer ID is required." }, { status: 400 });
      if (!studioDevToken) {
        const msg = 'GOOGLE_ADS_DEVELOPER_TOKEN is required even for sponsor-managed campaigns.';
        await logOperation({ type: 'config_error', error: msg, adoption_id, isDryRun });
        return NextResponse.json({ error: msg }, { status: 503 });
      }

      const oauthRecord = await getAdoptionGoogleOAuthRecord(adoption_id);
      if (!oauthRecord?.accessToken && !sponsor_access_token) {
        return NextResponse.json({ error: 'Sponsor Google OAuth token not found. Complete the Google OAuth connection step first.' }, { status: 400 });
      }

      if (oauthRecord?.accessibleCustomerIds?.length) {
        const normalized = sponsor_customer_id.replace(/-/g, '');
        const allowed = oauthRecord.accessibleCustomerIds.some((cid) => cid.replace(/-/g, '') === normalized);
        if (!allowed) {
          return NextResponse.json({ error: `The provided customer ID (${sponsor_customer_id}) is not in the authorized Google Ads accounts for this adoption OAuth connection.` }, { status: 400 });
        }
      }

      // Refresh token if it is expiring soon
      accessToken = oauthRecord ? await getValidAccessToken(adoption_id, oauthRecord) : sponsor_access_token!;
      developerToken = studioDevToken;
      customerId = sponsor_customer_id;
    }

    const headers = buildHeaders(accessToken, developerToken, loginCustomerId);
    const campaignStatus = CREATE_MODE === 'live' ? 'ENABLED' : 'PAUSED';

    // Track created resources for rollback
    const createdResources: { type: string; resourceName: string }[] = [];

    try {
      // ── Step 1: Create Campaign Budget ────────────────────────────────────────
      const budgetMicros = Math.round(budget_usd * 1_000_000);
      const budgetResult = await adsRequest(customerId, 'campaignBudgets:mutate', {
        operations: [{ create: { name: `SufiPulse Adoption ${adoption_id} Budget`, deliveryMethod: 'STANDARD', amountMicros: budgetMicros } }],
      }, headers, isDryRun);
      
      const budgetResourceName = budgetResult.results?.[0]?.resourceName;
      if (budgetResourceName) {
        createdResources.push({ type: 'budget', resourceName: budgetResourceName });
        await logOperation({ type: 'step_success', step: 'budget', resourceName: budgetResourceName, adoption_id, isDryRun });
      }

      // ── Step 2: Create Campaign ───────────────────────────────────────────────
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + duration_days * 86400000);
      const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

      const campaignResult = await adsRequest(customerId, 'campaigns:mutate', {
        operations: [{
          create: {
            name: `SufiPulse – ${release_title} [${adoption_id.slice(-6)}]`,
            advertisingChannelType: 'VIDEO',
            biddingStrategyType: 'TARGET_CPM',
            campaignBudget: budgetResourceName || 'dummy_budget',
            status: campaignStatus,
            startDate: fmt(startDate),
            endDate: fmt(endDate),
            networkSettings: { targetYoutube: true, targetContentNetwork: false },
          },
        }],
      }, headers, isDryRun);
      
      const campaignResourceName = campaignResult.results?.[0]?.resourceName;
      if (campaignResourceName) {
        createdResources.push({ type: 'campaign', resourceName: campaignResourceName });
        await logOperation({ type: 'step_success', step: 'campaign', resourceName: campaignResourceName, adoption_id, isDryRun });
      }

      // ── Step 3: Create Ad Group ────────────────────────────────────────────────
      const adGroupResult = await adsRequest(customerId, 'adGroups:mutate', {
        operations: [{
          create: {
            name: `${release_title} – AdGroup`,
            campaign: campaignResourceName || 'dummy_campaign',
            status: 'ENABLED',
            adGroupType: 'VIDEO_TRUE_VIEW_IN_STREAM',
          },
        }],
      }, headers, isDryRun);
      
      const adGroupResourceName = adGroupResult.results?.[0]?.resourceName;
      if (adGroupResourceName) {
        createdResources.push({ type: 'ad_group', resourceName: adGroupResourceName });
        await logOperation({ type: 'step_success', step: 'ad_group', resourceName: adGroupResourceName, adoption_id, isDryRun });
      }

      // ── Step 4: Create Video Ad ────────────────────────────────────────────────
      const objectiveLabel: Record<string, string> = {
        awareness: 'Discover', devotional_reach: 'Feel', community_engagement: 'Share', event_support: 'Join us', release_launch_support: 'Watch now',
      };
      const cta = objectiveLabel[campaign_objective] || 'Watch now';

      await adsRequest(customerId, 'adGroupAds:mutate', {
        operations: [{
          create: {
            adGroup: adGroupResourceName || 'dummy_adgroup',
            status: 'ENABLED',
            ad: {
              finalUrls: [`https://www.youtube.com/watch?v=${youtube_video_id}`],
              videoAd: { inStream: { actionButtonLabel: cta, actionHeadline: release_title.slice(0, 25), video: { youtubeVideoId: youtube_video_id } } },
            },
          },
        }],
      }, headers, isDryRun);
      await logOperation({ type: 'step_success', step: 'ad', adoption_id, isDryRun });

      // ── Step 5: Geo Targeting ─────────────────────────────────────────────────
      const GEO_IDS: Record<string, number> = {
        US: 2840, GB: 2826, CA: 2124, AU: 2036, PK: 2586, IN: 2356, AE: 2784, SA: 2682, DE: 2276, FR: 2250, NL: 2528, SE: 2752,
      };
      const geoIds = target_regions.map((code) => GEO_IDS[code.toUpperCase()]).filter(Boolean);

      if (geoIds.length > 0 && campaignResourceName) {
        await adsRequest(customerId, 'campaignCriteria:mutate', {
          operations: geoIds.map((geoId) => ({
            create: { campaign: campaignResourceName, location: { geoTargetConstant: `geoTargetConstants/${geoId}` } },
          })),
        }, headers, isDryRun);
        await logOperation({ type: 'step_success', step: 'targeting', adoption_id, isDryRun });
      }

      await logOperation({ type: 'campaign_creation_complete', adoption_id, isDryRun });

      return NextResponse.json({
        success: true,
        campaign_resource_name: campaignResourceName,
        status: isDryRun ? 'dry_run_passed' : campaignStatus,
        note: isDryRun ? 'Dry run completed successfully. No real resources were created.' : (campaignStatus === 'PAUSED' ? 'Campaign created in PAUSED state.' : 'Campaign is LIVE.'),
        customer_id: customerId,
        adoption_id,
      });

    } catch (error: any) {
      // ROLLBACK LOGIC
      if (!isDryRun && createdResources.length > 0) {
        await logOperation({ type: 'rollback_start', adoption_id, resources: createdResources });
        for (const res of createdResources.reverse()) {
          try {
            const mutatePath = res.type === 'budget' ? 'campaignBudgets:mutate' : (res.type === 'campaign' ? 'campaigns:mutate' : 'adGroups:mutate');
            await adsRequest(customerId, mutatePath, { operations: [{ remove: res.resourceName }] }, headers, false);
            await logOperation({ type: 'rollback_step_success', step: res.type, resourceName: res.resourceName, adoption_id });
          } catch (rollbackErr: any) {
            await logOperation({ type: 'rollback_step_failed', step: res.type, resourceName: res.resourceName, error: rollbackErr.message, adoption_id });
          }
        }
      }
      throw error;
    }

  } catch (error: any) {
    console.error('Google Ads campaign creation failed:', error);
    return NextResponse.json({ error: error?.message || 'Campaign creation failed' }, { status: 500 });
  }
}
