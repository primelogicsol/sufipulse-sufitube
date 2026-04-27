import { NextRequest, NextResponse } from 'next/server';
import { upsertStudioOAuthRecord } from '@/app/lib/server/google-ads-studio-oauth-store';

/**
 * GET /api/admin/google-ads/studio-oauth/callback
 *
 * Google OAuth2 callback for the SufiTube managed ads account.
 * Receives the authorization code, exchanges for tokens, and stores
 * refresh + access token in .data/google-ads-studio-oauth.json.
 *
 * Register this URI in Google Cloud Console OAuth 2.0 credentials:
 *   https://yourdomain.com/api/admin/google-ads/studio-oauth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const adminUrl = `${appUrl}/admin/google-ads`;

  if (error || !code) {
    return NextResponse.redirect(`${adminUrl}?studio_oauth=denied`);
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${adminUrl}?studio_oauth=error&reason=missing_credentials`);
  }

  const redirectUri = `${appUrl}/api/admin/google-ads/studio-oauth/callback`;

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

    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Ensure prompt=consent is set.');
    }

    await upsertStudioOAuthRecord({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenType: tokens.token_type || 'Bearer',
      expiresInSeconds: Number(tokens.expires_in || 3600),
    });

    return NextResponse.redirect(`${adminUrl}?studio_oauth=success`);
  } catch (err: any) {
    console.error('[studio-oauth/callback]', err);
    return NextResponse.redirect(
      `${adminUrl}?studio_oauth=error&reason=${encodeURIComponent(err.message)}`
    );
  }
}
