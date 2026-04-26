import { NextRequest, NextResponse } from 'next/server';
import {
  getGoogleAdsUserOAuth,
  getValidUserAccessToken,
} from '@/app/lib/server/google-ads-oauth-store';
import { getAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';

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

  let accessToken: string | null = null;

  if (userId) {
    const userRecord = await getGoogleAdsUserOAuth(userId);
    if (userRecord?.accessToken) {
      accessToken = await getValidUserAccessToken(userId, userRecord);
    }
  }

  if (!accessToken && adoptionId) {
    const adoptionRecord = await getAdoptionGoogleOAuthRecord(adoptionId);
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

    return NextResponse.json({ verified, customerId, accounts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to verify Google Ads account.' },
      { status: 500 }
    );
  }
}
