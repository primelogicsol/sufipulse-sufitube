import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { saveYTAnalyticsToken } from '@/app/lib/server/youtube-analytics-oauth-store';

const OAUTH_STATE_COOKIE = 'sufipulse_yt_oauth_state';

function statesMatch(expected: string | undefined, received: string | null): boolean {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function redirectAndClearState(url: string): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin/youtube-analytics/callback',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const adminUrl = `${appUrl}/admin/youtube-analytics`;

  if (!statesMatch(expectedState, state)) {
    return redirectAndClearState(`${adminUrl}?yt_auth=error&reason=invalid_oauth_state`);
  }

  if (error || !code) {
    return redirectAndClearState(`${adminUrl}?yt_auth=denied`);
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectAndClearState(`${adminUrl}?yt_auth=error&reason=missing_credentials`);
  }

  const redirectUri = `${appUrl}/api/admin/youtube-analytics/callback`;

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
      cache: 'no-store',
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || tokens.error || 'Token exchange failed');
    }
    if (!tokens.refresh_token) {
      throw new Error('No refresh token returned — reconnect with consent to grant offline read-only access.');
    }

    await saveYTAnalyticsToken({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresInSeconds: Number(tokens.expires_in || 3600),
    });

    return redirectAndClearState(`${adminUrl}?yt_auth=success`);
  } catch (err: any) {
    console.error('[youtube-analytics/callback]', err);
    return redirectAndClearState(
      `${adminUrl}?yt_auth=error&reason=${encodeURIComponent(err.message || 'token_exchange_failed')}`
    );
  }
}
