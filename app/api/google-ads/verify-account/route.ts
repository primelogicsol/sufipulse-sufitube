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

/**
 * POST /api/google-ads/verify-account
 *
 * Verifies that a specific Google Ads customer ID is accessible via the
 * stored OAuth token for the given user/adoption context.
 *
 * Body: { adoptionId, userId, customerId }
 * Returns: { verified: boolean, customerId, accounts: string[] }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { adoptionId = '', userId = '', customerId = '' } = body as {
    adoptionId?: string;
    userId?: string;
    customerId?: string;
  };

  // Allow either an authenticated user OR an adoption-level request (adoptionId as access token).
  // Unauthenticated users without an adoptionId are rejected.
  const user = await getAuthUser(request);
  if (!user && !adoptionId) {
    return NextResponse.json({ error: 'Authentication or adoptionId required.' }, { status: 401 });
  }
  if (user && userId && userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      { error: 'Google Ads is not configured on this server.' },
      { status: 503 }
    );
  }

  // Resolve the effective userId for token lookup
  const effectiveUserId = userId || user?.id || '';

  let accessToken: string | null = null;
  let userRecord = effectiveUserId ? await getGoogleAdsUserOAuth(effectiveUserId) : null;

  if (userRecord?.accessToken) {
    accessToken = await getValidUserAccessToken(effectiveUserId, userRecord);
  }

  let adoptionRecord = null;
  if (!accessToken && adoptionId) {
    adoptionRecord = await getAdoptionGoogleOAuthRecord(adoptionId);
    if (adoptionRecord?.accessToken) {
      accessToken = adoptionRecord.accessToken;
    }
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: 'No OAuth token found. Complete Google sign-in first.' },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(
      'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': developerToken,
        },
      }
    );
    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload?.error?.message || `Google Ads API error ${res.status}`);
    }

    const accounts: string[] = Array.isArray(payload?.resourceNames)
      ? payload.resourceNames
          .map((name: string) => String(name).split('/').pop() || '')
          .filter(Boolean)
          .map((cid: string) =>
            cid.length === 10
              ? `${cid.slice(0, 3)}-${cid.slice(3, 6)}-${cid.slice(6)}`
              : cid
          )
      : [];

    const normalizedTarget = customerId.replace(/-/g, '');
    const verified = accounts.some((cid) => cid.replace(/-/g, '') === normalizedTarget);

    if (verified) {
      if (userRecord) {
        await upsertGoogleAdsUserOAuth({
          userId: effectiveUserId,
          accessToken: userRecord.accessToken,
          refreshToken: userRecord.refreshToken,
          tokenType: userRecord.tokenType,
          accessibleCustomerIds: userRecord.accessibleCustomerIds,
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
            accessibleCustomerIds: adoptionRecord.accessibleCustomerIds,
            verifiedCustomerId: customerId,
          });
        }
      }
    }

    return NextResponse.json({ verified, customerId, accounts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to verify Google Ads account.' },
      { status: 500 }
    );
  }
}
