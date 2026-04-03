import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/adoptions/[id]/google-oauth
 *
 * Initiates Google OAuth2 for a sponsor to authorize SufiPulse to
 * manage campaigns in their Google Ads account.
 *
 * Scopes requested:
 *   - https://www.googleapis.com/auth/adwords  (Google Ads API)
 *
 * Flow:
 *   1. Sponsor clicks "Connect Google Ads" in AdoptTab
 *   2. Browser hits this route → redirects to Google consent screen
 *   3. After consent, Google redirects to /api/adoptions/[id]/google-oauth/callback
 *   4. Callback exchanges code for access_token + refresh_token
 *   5. Tokens stored in adoption record; sponsor redirected back to release page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID.' },
      { status: 503 }
    );
  }

  const redirectUri = `${appUrl}/api/adoptions/${params.id}/google-oauth/callback`;

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords');
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent');
  oauthUrl.searchParams.set('state', params.id); // carry adoption_id through OAuth

  return NextResponse.redirect(oauthUrl.toString());
}
