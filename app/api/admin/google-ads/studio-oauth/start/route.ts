import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';

/**
 * POST /api/admin/google-ads/studio-oauth/start
 *
 * Initiates the Google OAuth2 flow for the SufiTube managed ads account.
 * Admin-only. Returns { authUrl } — admin navigates to it.
 * Callback lands at /api/admin/google-ads/studio-oauth/callback.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_ADS_CLIENT_ID is not configured.' },
      { status: 503 }
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const redirectUri = `${appUrl}/api/admin/google-ads/studio-oauth/callback`;

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  oauthUrl.searchParams.set('client_id', clientId);
  oauthUrl.searchParams.set('redirect_uri', redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords');
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent');
  oauthUrl.searchParams.set('state', 'studio');

  return NextResponse.json({ authUrl: oauthUrl.toString(), redirect_uri: redirectUri });
}
