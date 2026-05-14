import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/server/middleware/authenticate';
import { getGoogleAdsConfig } from '@/lib/google-ads/config';

/**
 * POST /api/google-ads/oauth/start
 *
 * Builds the Google OAuth2 authorization URL and returns it.
 * The client then redirects the browser to this URL.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const config = getGoogleAdsConfig();
  if (!config.clientId || !config.redirectUri) {
    return NextResponse.json({ error: 'Google Ads integration is not fully configured on the server.' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const adoptionId = body.adoptionId || '';
  const returnSlug = body.returnSlug || '';

  // state contains metadata to restore context after redirect
  const state = JSON.stringify({ 
    userId: auth.id, 
    adoptionId, 
    returnSlug,
    timestamp: Date.now() 
  });

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', config.clientId);
  oauthUrl.searchParams.set('redirect_uri', config.redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords');
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent');
  oauthUrl.searchParams.set('state', state);

  return NextResponse.json({ authUrl: oauthUrl.toString() });
}
