import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/google-ads/connect/start
 *
 * Builds the Google OAuth2 authorization URL and returns it.
 * The caller navigates to authUrl — this avoids a server-side 302
 * so we can include userId in the state param cleanly.
 *
 * Body: { adoptionId, userId, returnSlug }
 * Returns: { authUrl }
 *
 * The callback redirect_uri is /api/google-ads/oauth/callback.
 * Register both of these in Google Cloud Console OAuth 2.0 credentials:
 *   http://localhost:3000/api/google-ads/oauth/callback
 *   https://yourdomain.com/api/google-ads/oauth/callback
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { adoptionId = '', userId = '', returnSlug = '' } = body as {
    adoptionId?: string;
    userId?: string;
    returnSlug?: string;
  };

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured. Set GOOGLE_ADS_CLIENT_ID in environment variables.' },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/google-ads/oauth/callback`;
  const state = JSON.stringify({ adoptionId, userId, returnSlug });

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords');
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent');
  oauthUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: oauthUrl.toString() });
}
