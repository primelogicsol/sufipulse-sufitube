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

const GADS_VER = process.env.GOOGLE_ADS_API_VERSION || 'v19';
const LIST_ACCESSIBLE = `https://googleads.googleapis.com/${GADS_VER}/customers:listAccessibleCustomers`;

export type VerifyReasonCode =
  | 'MISSING_DEVELOPER_TOKEN'
  | 'NO_OAUTH_TOKEN'
  | 'GOOGLE_ACCOUNT_MISMATCH'
  | 'GOOGLE_ADS_API_CALL_FAILED'
  | 'NO_ACCESSIBLE_CUSTOMERS'
  | 'CUSTOMER_NOT_DIRECTLY_ACCESSIBLE'
  | 'CUSTOMER_NOT_ACCESSIBLE_THROUGH_MCC'
  | 'VERIFIED_DIRECT'
  | 'VERIFIED_VIA_MANAGER';

/**
 * POST /api/google-ads/verify-account
 *
 * Body: { adoptionId, userId, customerId, enteredEmail? }
 * Returns: { verified, reasonCode, customerId, accounts, connectedGoogleEmail, debug }
 */
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
  console.log('[verify-account] SufiPulse user authenticated:', !!user, user ? `id=${user.id}` : '');

  if (!user && !adoptionId) {
    console.error('[verify-account] ABORT: no user and no adoptionId → NO_OAUTH_TOKEN');
    return NextResponse.json(
      { error: 'Authentication or adoptionId required.', reasonCode: 'NO_OAUTH_TOKEN' as VerifyReasonCode },
      { status: 401 }
    );
  }
  if (user && userId && userId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden', reasonCode: 'NO_OAUTH_TOKEN' as VerifyReasonCode },
      { status: 403 }
    );
  }
  if (!customerId) {
    return NextResponse.json({ error: 'customerId is required.' }, { status: 400 });
  }
  if (!userId && !adoptionId) {
    return NextResponse.json({ error: 'Provide userId or adoptionId.' }, { status: 400 });
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  console.log('[verify-account] GOOGLE_ADS_DEVELOPER_TOKEN present:', !!developerToken);
  console.log('[verify-account] GOOGLE_ADS_LOGIN_CUSTOMER_ID (MCC):', process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '(not set)');

  if (!developerToken) {
    console.error('[verify-account] ABORT: reasonCode=MISSING_DEVELOPER_TOKEN');
    return NextResponse.json(
      { error: 'Google Ads is not configured on this server.', reasonCode: 'MISSING_DEVELOPER_TOKEN' as VerifyReasonCode },
      { status: 503 }
    );
  }

  const effectiveUserId = userId || user?.id || '';

  // ── Resolve access token ───────────────────────────────────────────────────
  let accessToken: string | null = null;
  let userRecord = effectiveUserId ? await getGoogleAdsUserOAuth(effectiveUserId) : null;

  console.log('[verify-account] userOAuthRecord found:', !!userRecord);
  if (userRecord) {
    console.log('[verify-account] userOAuthRecord.googleEmail:', userRecord.googleEmail || '(none)');
    console.log('[verify-account] userOAuthRecord.hasAccessToken:', !!userRecord.accessToken);
    console.log('[verify-account] userOAuthRecord.hasRefreshToken:', !!userRecord.refreshToken);
  }

  if (userRecord?.accessToken) {
    accessToken = await getValidUserAccessToken(effectiveUserId, userRecord);
    console.log('[verify-account] getValidUserAccessToken resolved:', !!accessToken);
  }

  let adoptionRecord = null;
  if (!accessToken && adoptionId) {
    adoptionRecord = await getAdoptionGoogleOAuthRecord(adoptionId);
    console.log('[verify-account] adoptionOAuthRecord found:', !!adoptionRecord);
    if (adoptionRecord) {
      console.log('[verify-account] adoptionOAuthRecord.googleEmail:', adoptionRecord.googleEmail || '(none)');
      console.log('[verify-account] adoptionOAuthRecord.hasAccessToken:', !!adoptionRecord.accessToken);
      console.log('[verify-account] adoptionOAuthRecord.hasRefreshToken:', !!adoptionRecord.refreshToken);
    }
    if (adoptionRecord?.accessToken) {
      accessToken = adoptionRecord.accessToken;
    }
  }

  const connectedGoogleEmail: string | null =
    userRecord?.googleEmail ?? adoptionRecord?.googleEmail ?? null;
  console.log('[verify-account] connectedGoogleEmail:', connectedGoogleEmail || '(unknown)');

  if (!accessToken) {
    console.error('[verify-account] ABORT: reasonCode=NO_OAUTH_TOKEN — no accessToken found');
    return NextResponse.json(
      {
        error: 'No OAuth token found. Complete Google sign-in first.',
        reasonCode: 'NO_OAUTH_TOKEN' as VerifyReasonCode,
        connectedGoogleEmail: null,
        debug: { adoptionId, userId: effectiveUserId, userRecordFound: !!userRecord, adoptionRecordFound: !!adoptionRecord },
      },
      { status: 401 }
    );
  }

  const normalizedTarget = customerId.replace(/-/g, '');
  console.log('[verify-account] normalizedTarget:', normalizedTarget);

  const emailMismatch =
    !!enteredEmail &&
    !!connectedGoogleEmail &&
    enteredEmail.toLowerCase().trim() !== connectedGoogleEmail.toLowerCase().trim();
  if (emailMismatch) {
    console.warn(`[verify-account] EMAIL MISMATCH: entered="${enteredEmail}" connected="${connectedGoogleEmail}"`);
  }

  async function callListAccessible(loginCustomerId?: string): Promise<{
    ok: boolean;
    resourceNames: string[];
    errorPayload: unknown;
    httpStatus: number;
  }> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken!}`,
      'developer-token': developerToken!,
    };
    if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;

    console.log(
      `[verify-account] → listAccessibleCustomers${loginCustomerId ? ` login-customer-id=${loginCustomerId}` : ' (no login-customer-id)'}`
    );

    const res = await fetch(LIST_ACCESSIBLE, { headers });
    const rawText = await res.text();
    let payload: { resourceNames?: string[]; error?: unknown };
    try {
      payload = JSON.parse(rawText);
    } catch {
      console.error(`[verify-account] ← HTTP ${res.status} non-JSON body:`, rawText.slice(0, 200));
      payload = { error: `HTTP ${res.status} — non-JSON response` };
    }
    console.log(`[verify-account] ← HTTP ${res.status}:`, JSON.stringify(payload));
    return {
      ok: res.ok,
      resourceNames: Array.isArray(payload.resourceNames) ? payload.resourceNames : [],
      errorPayload: payload.error ?? null,
      httpStatus: res.status,
    };
  }

  try {
    console.log('[verify-account] API call: yes');
    let result = await callListAccessible();

    const mccId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
    if ((!result.ok || result.resourceNames.length === 0) && mccId) {
      console.log(`[verify-account] first call empty/failed — retrying with MCC=${mccId}`);
      result = await callListAccessible(mccId);
    }

    if (!result.ok) {
      console.error(`[verify-account] ABORT: reasonCode=GOOGLE_ADS_API_CALL_FAILED HTTP ${result.httpStatus}`);
      return NextResponse.json(
        {
          error: `Google Ads API error (HTTP ${result.httpStatus})`,
          reasonCode: 'GOOGLE_ADS_API_CALL_FAILED' as VerifyReasonCode,
          google_ads_error: result.errorPayload,
          connectedGoogleEmail,
          debug: { httpStatus: result.httpStatus, customerId, normalizedTarget, connectedGoogleEmail, emailMismatch },
        },
        { status: 502 }
      );
    }

    const resourceNames = result.resourceNames;
    const normalizedAccounts = resourceNames.map((rn: string) =>
      rn.replace('customers/', '').replace(/-/g, '')
    );
    const accounts = normalizedAccounts.map((id: string) =>
      id.length === 10 ? `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}` : id
    );

    console.log('[verify-account] resourceNames from Google:', resourceNames);
    console.log('[verify-account] normalized accounts:', normalizedAccounts);
    console.log(`[verify-account] target="${normalizedTarget}" vs [${normalizedAccounts.join(', ')}]`);

    if (normalizedAccounts.length === 0) {
      const reasonCode: VerifyReasonCode = emailMismatch ? 'GOOGLE_ACCOUNT_MISMATCH' : 'NO_ACCESSIBLE_CUSTOMERS';
      console.warn(`[verify-account] FINAL: reasonCode=${reasonCode} — no accounts returned`);
      return NextResponse.json({
        verified: false,
        reasonCode,
        customerId,
        accounts: [],
        connectedGoogleEmail,
        debug: { normalizedTarget, normalizedAccounts: [], emailMismatch },
      });
    }

    let verified = normalizedAccounts.includes(normalizedTarget);
    let verifiedViaManager: string | null = null;
    console.log('[verify-account] direct match:', verified);

    if (!verified) {
      console.log('[verify-account] checking MCC hierarchy...');
      for (const mccNormalized of normalizedAccounts) {
        try {
          console.log(`[verify-account] trying manager login-customer-id=${mccNormalized}`);
          const mccRes = await fetch(
            `https://googleads.googleapis.com/${GADS_VER}/customers/${normalizedTarget}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken!}`,
                'developer-token': developerToken!,
                'login-customer-id': mccNormalized,
              },
            }
          );
          console.log(`[verify-account] MCC HTTP ${mccRes.status} target=${normalizedTarget} via manager=${mccNormalized}`);
          if (mccRes.ok) {
            verified = true;
            verifiedViaManager = mccNormalized;
            console.log(`[verify-account] verified via manager=${mccNormalized}`);
            break;
          }
        } catch (err) {
          console.warn(`[verify-account] MCC check error manager=${mccNormalized}:`, err);
        }
      }
    }

    let reasonCode: VerifyReasonCode;
    if (verified && verifiedViaManager) {
      reasonCode = 'VERIFIED_VIA_MANAGER';
    } else if (verified) {
      reasonCode = 'VERIFIED_DIRECT';
    } else if (emailMismatch) {
      reasonCode = 'GOOGLE_ACCOUNT_MISMATCH';
    } else {
      reasonCode = 'CUSTOMER_NOT_ACCESSIBLE_THROUGH_MCC';
    }

    console.log(`[verify-account] FINAL: reasonCode=${reasonCode} verified=${verified} connectedEmail=${connectedGoogleEmail}`);

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
      } else if (adoptionId) {
        if (!adoptionRecord) adoptionRecord = await getAdoptionGoogleOAuthRecord(adoptionId);
        if (adoptionRecord) {
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
    }

    return NextResponse.json({
      verified,
      reasonCode,
      customerId,
      accounts,
      connectedGoogleEmail,
      debug: {
        normalizedTarget,
        normalizedAccounts,
        totalAccounts: accounts.length,
        emailMismatch,
        verifiedViaManager,
        apiVersion: GADS_VER,
      },
    });
  } catch (error: any) {
    console.error('[verify-account] unexpected error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to verify Google Ads account.',
        reasonCode: 'GOOGLE_ADS_API_CALL_FAILED' as VerifyReasonCode,
        connectedGoogleEmail,
      },
      { status: 500 }
    );
  }
}
