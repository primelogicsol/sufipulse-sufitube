import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/server/middleware/authenticate';

/**
 * POST /api/google-ads/oauth/start
 *
 * Builds the Google OAuth2 authorization URL and returns it.
 * Auth optional — unauthenticated sponsors can connect via adoptionId.
 * Body: { adoptionId, userId, returnSlug }
 * Returns: { authUrl }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await getAuthUser(request);
  const { adoptionId = '', userId = '', returnSlug = '' } = body as {
    adoptionId?: string;
    userId?: string;
    returnSlug?: string;
  };

  // Require either a logged-in user or an adoptionId (UUID as access token)
  if (!user && !adoptionId) {
    return NextResponse.json({ error: 'Authentication or adoptionId required.' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google Ads integration is not configured on this server.' },
      { status: 503 }
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const redirectUri =
    process.env.GOOGLE_ADS_REDIRECT_URI ||
    `${appUrl}/api/google-ads/oauth/callback`;

  const state = JSON.stringify({ adoptionId, userId, returnSlug });

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email');
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent');
  oauthUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: oauthUrl.toString(), redirect_uri: redirectUri });
}
