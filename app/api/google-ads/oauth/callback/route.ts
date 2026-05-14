import { NextRequest, NextResponse } from 'next/server';
import { upsertGoogleAdsUserOAuth } from '@/app/lib/server/google-ads-oauth-store';
import { getGoogleAdsConfig } from '@/lib/google-ads/config';

const ADS_API_VERSION = 'v22';

/**
 * GET /api/google-ads/oauth/callback
 *
 * Handles the redirect back from Google OAuth2.
 * Exchanges the auth code for tokens and persists them.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state') || '{}';
  const error = searchParams.get('error');

  let state: any = {};
  try { state = JSON.parse(stateStr); } catch {}

  const config = getGoogleAdsConfig();

  const fallbackRedirect = (status: 'success' | 'error', msg?: string) => {
    const url = new URL(request.url);
    url.pathname = state.returnSlug ? `/release-detail/${state.returnSlug}` : '/my-adoptions';
    url.search = '';
    url.searchParams.set('adoption_id', state.adoptionId || '');
    url.searchParams.set('step', 'google_ads_connected');
    url.searchParams.set('adoption_oauth', status);
    if (msg) url.searchParams.set('error', msg);
    return NextResponse.redirect(url.toString());
  };

  if (error) {
    return fallbackRedirect('error', error);
  }

  if (!code) {
    return fallbackRedirect('error', 'No authorization code returned from Google');
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization-code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokens.error_description || tokens.error || 'Failed to exchange code for tokens');
    }

    // 2. Optional: fetch user email to identify the connected account
    let googleEmail = null;
    try {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (infoRes.ok) {
        const info = await infoRes.json();
        googleEmail = info.email;
      }
    } catch {}

    // 3. Fetch list of accessible customer IDs immediately to simplify the UI flow
    let accessibleCustomerIds: string[] = [];
    try {
      const customersRes = await fetch(
        `https://googleads.googleapis.com/${ADS_API_VERSION}/customers:listAccessibleCustomers`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'developer-token': config.developerToken,
          },
        }
      );
      if (customersRes.ok) {
        const data = await customersRes.json();
        accessibleCustomerIds = (data.resourceNames ?? []).map((rn: string) =>
          rn.replace('customers/', '').replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')
        );
      }
    } catch {}

    // 4. Persist tokens and account info
    if (state.userId) {
      await upsertGoogleAdsUserOAuth({
        userId: state.userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        expiresInSeconds: tokens.expires_in,
        googleEmail,
        accessibleCustomerIds,
      });
    }

    return fallbackRedirect('success');
  } catch (err: any) {
    console.error('Google Ads OAuth callback error:', err);
    return fallbackRedirect('error', err.message);
  }
}
