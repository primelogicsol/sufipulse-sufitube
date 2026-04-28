import { NextRequest, NextResponse } from 'next/server';
import { upsertAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';
import { upsertGoogleAdsUserOAuth } from '@/app/lib/server/google-ads-oauth-store';

/**
 * GET /api/google-ads/oauth/callback
 *
 * Canonical Google OAuth2 callback for the "Use My Google Ads" flow.
 * Stores tokens in two places:
 *   1. By userId  → google-ads-oauth.json   (global per sponsor — reusable across songs)
 *   2. By adoptionId → adoption-google-oauth.json  (per song/adoption — backward compat)
 *
 * State param (JSON): { adoptionId, userId, returnSlug }
 *
 * Register in Google Cloud Console OAuth 2.0 credentials:
 *   http://localhost:3000/api/google-ads/oauth/callback        (local)
 *   https://yourdomain.com/api/google-ads/oauth/callback       (production)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const rawState = searchParams.get('state') || '';

  let adoptionId = '';
  let userId = '';
  let returnSlug = '';
  try {
    const parsed = JSON.parse(rawState);
    adoptionId = parsed.adoptionId || '';
    userId = parsed.userId || '';
    returnSlug = parsed.returnSlug || '';
  } catch {
    adoptionId = rawState;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

  const fallbackRedirect = (status: string, reason?: string) => {
    const base = returnSlug ? `${appUrl}/release-detail/${returnSlug}` : `${appUrl}/`;
    const url = new URL(base);
    if (status === 'success') {
      // New canonical success URL — opens Adopt tab and triggers state restoration
      url.searchParams.set('adopt', '1');
      url.searchParams.set('step', 'google_ads_connected');
    } else {
      url.searchParams.set('adoption_oauth', status);
    }
    if (adoptionId) url.searchParams.set('adoption_id', adoptionId);
    if (reason) url.searchParams.set('reason', encodeURIComponent(reason));
    return NextResponse.redirect(url.toString());
  };

  if (error || !code) return fallbackRedirect('denied');
  if (!clientId || !clientSecret) return fallbackRedirect('error', 'missing_credentials');

  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI || `${appUrl}/api/google-ads/oauth/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || 'Token exchange failed');
    }

    // Fetch Google account email for display in SufiPulse UI
    let googleEmail: string | null = null;
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userinfoRes.ok) {
        const userinfo = await userinfoRes.json();
        googleEmail = userinfo?.email || null;
      }
    } catch {
      // Non-fatal
    }

    // Discover accessible Google Ads customer accounts
    let accessibleCustomerIds: string[] = [];
    try {
      const accessibleRes = await fetch(
        'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
          },
        }
      );
      const payload = await accessibleRes.json();
      if (accessibleRes.ok && Array.isArray(payload?.resourceNames)) {
        accessibleCustomerIds = payload.resourceNames
          .map((name: string) => String(name).split('/').pop() || '')
          .filter(Boolean)
          .map((cid: string) =>
            cid.length === 10
              ? `${cid.slice(0, 3)}-${cid.slice(3, 6)}-${cid.slice(6)}`
              : cid
          );
      }
    } catch {
      // Non-fatal — token is still valid, customer IDs validated at campaign launch
    }

    // Store by userId — global per sponsor, reusable across any song adoption
    if (userId) {
      await upsertGoogleAdsUserOAuth({
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenType: tokens.token_type,
        expiresInSeconds: Number(tokens.expires_in || 0),
        accessibleCustomerIds,
        googleEmail,
      });
    }

    // Store by adoptionId — per song/adoption, backward compat with admin flow
    if (adoptionId) {
      await upsertAdoptionGoogleOAuthRecord({
        adoptionId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenType: tokens.token_type,
        expiresInSeconds: Number(tokens.expires_in || 0),
        accessibleCustomerIds,
        googleEmail,
      });
    }

    return fallbackRedirect('success');
  } catch (err: any) {
    console.error('Google Ads OAuth callback error:', err);
    return fallbackRedirect('error', err.message);
  }
}
