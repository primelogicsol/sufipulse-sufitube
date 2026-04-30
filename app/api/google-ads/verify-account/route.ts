import { NextRequest, NextResponse } from 'next/server';
import {
  getGoogleAdsUserOAuth,
  getValidUserAccessToken,
  upsertGoogleAdsUserOAuth,
} from '@/app/lib/server/google-ads-oauth-store';
import {
  getAdoptionGoogleOAuthRecord,
  upsertAdoptionGoogleOAuthRecord,
} from '@/app/lib/server/adoption-google-oauth-store';
import { getAuthUser } from '@/server/middleware/authenticate';

const GADS_VER = 'v22';
const LIST_ACCESSIBLE = `https://googleads.googleapis.com/${GADS_VER}/customers:listAccessibleCustomers`;

export type VerifyReasonCode =
  | 'MISSING_DEVELOPER_TOKEN'
  | 'NO_OAUTH_TOKEN'
  | 'OAUTH_TOKEN_EXPIRED'
  | 'GOOGLE_ACCOUNT_MISMATCH'
  | 'GOOGLE_ADS_API_CALL_FAILED'
  | 'NO_ACCESSIBLE_CUSTOMERS'
  | 'CUSTOMER_NOT_DIRECTLY_ACCESSIBLE'
  | 'CUSTOMER_NOT_ACCESSIBLE_THROUGH_MCC'
  | 'VERIFIED_DIRECT'
  | 'VERIFIED_VIA_MANAGER';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    adoptionId = '',
    userId = '',
    customerId = '',
    enteredEmail = '',
  } = body as {
    adoptionId?: string;
    userId?: string;
    customerId?: string;
    enteredEmail?: string;
  };

  console.log('[verify-account] ═══ REQUEST ═══');
  console.log('[verify-account] adoptionId:', adoptionId || '(none)');
  console.log('[verify-account] userId:', userId || '(none)');
  console.log('[verify-account] customerId (raw):', customerId || '(none)');
  console.log('[verify-account] enteredEmail:', enteredEmail || '(not provided)');
  console.log('[verify-account] API version:', GADS_VER);

  const user = await getAuthUser(request);

  if (!user && !adoptionId) {
    return NextResponse.json(
      { error: 'Authentication or adoptionId required.', reasonCode: 'NO_OAUTH_TOKEN' as VerifyReasonCode },
      { status: 401 }
    );
  }
  if (user && userId && userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden', reasonCode: 'NO_OAUTH_TOKEN' as VerifyReasonCode }, { status: 403 });
  }
  if (!customerId) {
    return NextResponse.json({ error: 'customerId is required.' }, { status: 400 });
  }
  if (!userId && !adoptionId) {
    return NextResponse.json({ error: 'Provide userId or adoptionId.' }, { status: 400 });
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    return NextResponse.json(
      { error: 'Google Ads is not configured on this server.', reasonCode: 'MISSING_DEVELOPER_TOKEN' as VerifyReasonCode },
      { status: 503 }
    );
  }

  const effectiveUserId = userId || user?.id || '';

  // ── 1. Load stored OAuth record ──────────────────────────────────────────
  let accessToken: string | null = null;
  let hasRefreshToken = false;
  let tokenExpired = false;

  const userRecord = effectiveUserId ? await getGoogleAdsUserOAuth(effectiveUserId) : null;
  let adoptionRecord = adoptionId ? await getAdoptionGoogleOAuthRecord(adoptionId) : null;

  const activeRecord = userRecord || adoptionRecord;
  const connectedGoogleEmail: string | null = activeRecord?.googleEmail ?? null;

  console.log('[verify-account] userRecord found:', !!userRecord);
  console.log('[verify-account] adoptionRecord found:', !!adoptionRecord);
  console.log('[verify-account] connectedGoogleEmail:', connectedGoogleEmail || '(unknown)');

  if (userRecord?.accessToken) {
    hasRefreshToken = !!userRecord.refreshToken;
    tokenExpired = userRecord.expiresAt
      ? Date.now() >= new Date(userRecord.expiresAt).getTime()
      : false;
    accessToken = await getValidUserAccessToken(effectiveUserId, userRecord);
    console.log('[verify-account] user token — expired:', tokenExpired, 'refreshed:', accessToken !== userRecord.accessToken);
  } else if (adoptionRecord?.accessToken) {
    hasRefreshToken = !!adoptionRecord.refreshToken;
    tokenExpired = adoptionRecord.expiresAt
      ? Date.now() >= new Date(adoptionRecord.expiresAt).getTime()
      : false;

    console.log('[verify-account] adoption token — expired:', tokenExpired, 'hasRefresh:', hasRefreshToken);

    // Proactively refresh if we know the token is expired and have a refresh token
    if (tokenExpired && hasRefreshToken) {
      const refreshed = await refreshAdoptionToken(adoptionId, adoptionRecord.refreshToken!);
      if (refreshed) {
        accessToken = refreshed;
        console.log('[verify-account] proactive refresh succeeded');
      } else {
        accessToken = adoptionRecord.accessToken;
        console.log('[verify-account] proactive refresh failed — using stored token');
      }
    } else {
      accessToken = adoptionRecord.accessToken;
    }
  }

  // ── Debug snapshot ───────────────────────────────────────────────────────
  const tokenDebug = {
    hasAccessToken: !!accessToken,
    hasRefreshToken,
    tokenExpired,
    tokenSource: userRecord ? 'user_record' : adoptionRecord ? 'adoption_record' : 'none',
    connectedGoogleEmail,
    requestedScopeIncludesAdwords: true, // oauth/start always sets adwords scope
    apiVersion: GADS_VER,
    developerTokenPresent: !!developerToken,
    mccId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || null,
  };
  console.log('[verify-account] tokenDebug:', JSON.stringify(tokenDebug));

  if (!accessToken) {
    return NextResponse.json(
      {
        error: 'No OAuth token found. Please reconnect your Google Ads account.',
        reasonCode: 'NO_OAUTH_TOKEN' as VerifyReasonCode,
        connectedGoogleEmail: null,
        debug: { ...tokenDebug, adoptionId, userId: effectiveUserId },
      },
      { status: 401 }
    );
  }

  const normalizedTarget = customerId.replace(/-/g, '');
  const emailMismatch =
    !!enteredEmail &&
    !!connectedGoogleEmail &&
    enteredEmail.toLowerCase().trim() !== connectedGoogleEmail.toLowerCase().trim();

  // ── 2. Call Google Ads API ───────────────────────────────────────────────
  async function callListAccessible(token: string, loginCustomerId?: string) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'developer-token': developerToken!,
    };
    if (loginCustomerId) headers['login-customer-id'] = loginCustomerId.replace(/-/g, '');

    console.log(
      `[verify-account] → listAccessibleCustomers${loginCustomerId ? ` login-customer-id=${loginCustomerId}` : ''}`
    );

    const res = await fetch(LIST_ACCESSIBLE, { headers });
    const rawText = await res.text();
    let payload: { resourceNames?: string[]; error?: unknown } = {};
    try {
      payload = JSON.parse(rawText);
    } catch {
      console.error(`[verify-account] ← HTTP ${res.status} non-JSON:`, rawText.slice(0, 300));
      payload = { error: `HTTP ${res.status} — non-JSON response` };
    }
    console.log(`[verify-account] ← HTTP ${res.status}:`, JSON.stringify(payload).slice(0, 300));
    return {
      ok: res.ok,
      status: res.status,
      resourceNames: Array.isArray(payload.resourceNames) ? payload.resourceNames : [],
      errorPayload: payload.error ?? null,
    };
  }

  try {
    const mccId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '';

    // First attempt — no login-customer-id header
    let result = await callListAccessible(accessToken);

    // ── 401: try token refresh and retry once ─────────────────────────────
    // Handles both userRecord and adoptionRecord expired tokens.
    if (result.status === 401 && hasRefreshToken) {
      console.log('[verify-account] got 401 — attempting token refresh');
      let newToken: string | null = null;
      if (adoptionRecord?.refreshToken) {
        newToken = await refreshAdoptionToken(adoptionId, adoptionRecord.refreshToken);
      } else if (userRecord?.refreshToken) {
        newToken = await refreshUserToken(effectiveUserId, userRecord.refreshToken);
      }
      if (newToken) {
        accessToken = newToken;
        console.log('[verify-account] token refreshed — retrying API call');
        result = await callListAccessible(accessToken);
      }
    }

    // ── Still 401 after refresh attempt ───────────────────────────────────
    if (result.status === 401) {
      console.error('[verify-account] 401 after refresh attempt — token expired or revoked');
      return NextResponse.json(
        {
          error: 'Google Ads connection expired or incomplete. Please reconnect your Google Ads account.',
          reasonCode: 'OAUTH_TOKEN_EXPIRED' as VerifyReasonCode,
          connectedGoogleEmail,
          debug: { ...tokenDebug, googleAdsApiHttpStatus: 401, googleAdsApiErrorMessage: result.errorPayload },
        },
        { status: 401 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          error: `Google Ads API error (HTTP ${result.status})`,
          reasonCode: 'GOOGLE_ADS_API_CALL_FAILED' as VerifyReasonCode,
          google_ads_error: result.errorPayload,
          connectedGoogleEmail,
          debug: { ...tokenDebug, googleAdsApiHttpStatus: result.status, googleAdsApiErrorMessage: result.errorPayload },
        },
        { status: 502 }
      );
    }

    // ── Normalize direct accounts ─────────────────────────────────────────
    let normalizedAccounts = result.resourceNames.map((rn: string) =>
      rn.replace('customers/', '').replace(/-/g, '')
    );

    console.log('[verify-account] direct accessible accounts:', normalizedAccounts);
    console.log('[verify-account] target:', normalizedTarget);

    // ── MCC listAccessibleCustomers retry ─────────────────────────────────
    // If target not found in direct results (or direct results empty), always
    // retry with the MCC login-customer-id. This discovers sub-accounts managed
    // by the MCC that are not "directly accessible" to the authenticated user.
    if (mccId && !normalizedAccounts.includes(normalizedTarget)) {
      console.log(`[verify-account] target not in direct accounts — retrying listAccessibleCustomers with MCC=${mccId}`);
      const mccResult = await callListAccessible(accessToken, mccId);
      if (mccResult.ok && mccResult.resourceNames.length > 0) {
        const mccNormalized = mccResult.resourceNames.map((rn: string) =>
          rn.replace('customers/', '').replace(/-/g, '')
        );
        console.log('[verify-account] MCC-accessible accounts:', mccNormalized);
        // Merge without duplicates — keep MCC account itself in the list for hierarchy checks
        normalizedAccounts = [...new Set([...normalizedAccounts, ...mccNormalized])];
      }
    }

    const accounts = normalizedAccounts.map((id: string) =>
      id.length === 10 ? `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}` : id
    );

    if (normalizedAccounts.length === 0) {
      const reasonCode: VerifyReasonCode = emailMismatch ? 'GOOGLE_ACCOUNT_MISMATCH' : 'NO_ACCESSIBLE_CUSTOMERS';
      return NextResponse.json({
        verified: false,
        reasonCode,
        customerId,
        accounts: [],
        connectedGoogleEmail,
        debug: { ...tokenDebug, normalizedTarget, normalizedAccounts, emailMismatch, googleAdsApiHttpStatus: result.status },
      });
    }

    // ── Check direct match ────────────────────────────────────────────────
    let verified = normalizedAccounts.includes(normalizedTarget);
    let verifiedViaManager: string | null = null;

    // ── Check MCC hierarchy (GET customers) ───────────────────────────────
    // For each accessible account, try fetching the target customer using that
    // account as login-customer-id. Covers nested MCC structures.
    if (!verified) {
      for (const mccNormalized of normalizedAccounts) {
        try {
          const mccRes = await fetch(
            `https://googleads.googleapis.com/${GADS_VER}/customers/${normalizedTarget}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'login-customer-id': mccNormalized,
              },
            }
          );
          console.log(`[verify-account] MCC GET check HTTP ${mccRes.status} target=${normalizedTarget} via=${mccNormalized}`);
          if (mccRes.ok) {
            verified = true;
            verifiedViaManager = mccNormalized;
            break;
          }
        } catch (err) {
          console.warn(`[verify-account] MCC GET check error manager=${mccNormalized}:`, err);
        }
      }
    }

    const reasonCode: VerifyReasonCode = verified && verifiedViaManager
      ? 'VERIFIED_VIA_MANAGER'
      : verified
      ? 'VERIFIED_DIRECT'
      : emailMismatch
      ? 'GOOGLE_ACCOUNT_MISMATCH'
      : 'CUSTOMER_NOT_ACCESSIBLE_THROUGH_MCC';

    console.log(`[verify-account] FINAL: ${reasonCode} verified=${verified}`);

    // ── Persist verification ──────────────────────────────────────────────
    if (verified) {
      if (userRecord) {
        await upsertGoogleAdsUserOAuth({
          userId: effectiveUserId,
          accessToken: userRecord.accessToken,
          refreshToken: userRecord.refreshToken,
          tokenType: userRecord.tokenType,
          accessibleCustomerIds: accounts,
          googleEmail: userRecord.googleEmail,
          verifiedCustomerId: customerId,
        });
      } else if (adoptionRecord) {
        await upsertAdoptionGoogleOAuthRecord({
          adoptionId,
          accessToken: adoptionRecord.accessToken,
          refreshToken: adoptionRecord.refreshToken,
          tokenType: adoptionRecord.tokenType,
          accessibleCustomerIds: accounts,
          googleEmail: adoptionRecord.googleEmail,
          verifiedCustomerId: customerId,
        });
      }
    }

    return NextResponse.json({
      verified,
      reasonCode,
      customerId,
      accounts,
      connectedGoogleEmail,
      debug: {
        ...tokenDebug,
        normalizedTarget,
        normalizedAccounts,
        totalAccounts: accounts.length,
        emailMismatch,
        verifiedViaManager,
        googleAdsApiHttpStatus: result.status,
      },
    });
  } catch (error: any) {
    console.error('[verify-account] unexpected error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to verify Google Ads account.',
        reasonCode: 'GOOGLE_ADS_API_CALL_FAILED' as VerifyReasonCode,
        connectedGoogleEmail,
        debug: tokenDebug,
      },
      { status: 500 }
    );
  }
}

async function refreshAdoptionToken(adoptionId: string, refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error('[verify-account] token refresh failed:', data);
      return null;
    }
    const record = await import('@/app/lib/server/adoption-google-oauth-store')
      .then(m => m.getAdoptionGoogleOAuthRecord(adoptionId));
    if (record) {
      await import('@/app/lib/server/adoption-google-oauth-store')
        .then(m => m.upsertAdoptionGoogleOAuthRecord({
          adoptionId,
          accessToken: data.access_token,
          refreshToken,
          tokenType: data.token_type || record.tokenType,
          expiresInSeconds: Number(data.expires_in || 3600),
          accessibleCustomerIds: record.accessibleCustomerIds,
          googleEmail: record.googleEmail,
        }));
    }
    return data.access_token;
  } catch (err) {
    console.error('[verify-account] refresh exception:', err);
    return null;
  }
}

async function refreshUserToken(userId: string, refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error('[verify-account] user token refresh failed:', data);
      return null;
    }
    const { getGoogleAdsUserOAuth, upsertGoogleAdsUserOAuth } =
      await import('@/app/lib/server/google-ads-oauth-store');
    const record = await getGoogleAdsUserOAuth(userId);
    if (record) {
      await upsertGoogleAdsUserOAuth({
        userId,
        accessToken: data.access_token,
        refreshToken,
        tokenType: data.token_type || record.tokenType,
        expiresInSeconds: Number(data.expires_in || 3600),
        accessibleCustomerIds: record.accessibleCustomerIds,
        googleEmail: record.googleEmail,
        verifiedCustomerId: record.verifiedCustomerId,
      });
    }
    return data.access_token;
  } catch (err) {
    console.error('[verify-account] user refresh exception:', err);
    return null;
  }
}
