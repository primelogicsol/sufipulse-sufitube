import { NextRequest, NextResponse } from 'next/server';
import { upsertAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';

/**
 * GET /api/google-oauth/callback
 *
 * Unified Google OAuth2 callback. The adoption ID is carried through
 * the `state` query parameter — no adoption ID in the URL so this
 * route works for both local and production without path variation.
 *
 * Registered redirect URIs:
 *   Local:      http://localhost:3000/api/google-oauth/callback
 *   Production: https://sufipulse.com/api/google-oauth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const rawState = searchParams.get('state') || '';

  // State is JSON: { adoptionId, returnSlug } — fall back gracefully if malformed
  let adoptionId = '';
  let returnSlug = '';
  try {
    const parsed = JSON.parse(rawState);
    adoptionId = parsed.adoptionId || '';
    returnSlug = parsed.returnSlug || '';
  } catch {
    adoptionId = rawState; // legacy plain-string state
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

  const fallbackRedirect = (status: string, reason?: string) => {
    const base = returnSlug ? `${appUrl}/release-detail/${returnSlug}` : `${appUrl}/`;
    const url = new URL(base);
    url.searchParams.set('adoption_oauth', status);
    if (adoptionId) url.searchParams.set('adoption_id', adoptionId);
    if (reason) url.searchParams.set('reason', reason);
    return NextResponse.redirect(url.toString());
  };

  if (error || !code) {
    return fallbackRedirect('denied');
  }

  if (!clientId || !clientSecret) {
    return fallbackRedirect('error', 'missing_credentials');
  }

  const redirectUri = `${appUrl}/api/google-oauth/callback`;

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

    // Discover which Google Ads customer accounts this token can access
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

    if (adoptionId) {
      await upsertAdoptionGoogleOAuthRecord({
        adoptionId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenType: tokens.token_type,
        expiresInSeconds: Number(tokens.expires_in || 0),
        accessibleCustomerIds,
      });
    }

    return fallbackRedirect('success');
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return fallbackRedirect('error', err.message);
  }
}
