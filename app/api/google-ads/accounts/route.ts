import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAdsUserOAuth } from '@/app/lib/server/google-ads-oauth-store';
import { getAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';

/**
 * GET /api/google-ads/accounts?userId=...&adoptionId=...
 *
 * Returns the list of accessible Google Ads customer IDs for the
 * authenticated user. Looks up the stored OAuth record (user-level
 * first, then adoption-level fallback). Optionally re-fetches from
 * Google if the token is still valid and the caller passes refresh=1.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '';
  const adoptionId = searchParams.get('adoptionId') || '';
  const refresh = searchParams.get('refresh') === '1';

  if (!userId && !adoptionId) {
    return NextResponse.json(
      { error: 'Provide userId or adoptionId.' },
      { status: 400 }
    );
  }

  const userRecord = userId ? await getGoogleAdsUserOAuth(userId) : null;
  const adoptionRecord =
    !userRecord && adoptionId
      ? await getAdoptionGoogleOAuthRecord(adoptionId)
      : null;
  const record = userRecord || adoptionRecord;

  if (!record) {
    return NextResponse.json(
      { connected: false, accounts: [], error: 'No OAuth token found. Complete Google sign-in first.' },
      { status: 404 }
    );
  }

  let accounts = record.accessibleCustomerIds ?? [];

  // Optional live re-fetch from Google (costs one API call)
  if (refresh && record.accessToken && process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    try {
      const res = await fetch(
        'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
        {
          headers: {
            Authorization: `Bearer ${record.accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          },
        }
      );
      const payload = await res.json();
      if (res.ok && Array.isArray(payload?.resourceNames)) {
        accounts = payload.resourceNames
          .map((name: string) => String(name).split('/').pop() || '')
          .filter(Boolean)
          .map((cid: string) =>
            cid.length === 10
              ? `${cid.slice(0, 3)}-${cid.slice(3, 6)}-${cid.slice(6)}`
              : cid
          );
      }
    } catch {
      // Non-fatal — return stored list
    }
  }

  return NextResponse.json({
    connected: true,
    accounts,
    token_expires_at: record.expiresAt ?? null,
    updated_at: record.updatedAt,
  });
}
