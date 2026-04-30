import { NextRequest, NextResponse } from 'next/server';
import { saveYTAnalyticsToken } from '@/app/lib/server/youtube-analytics-oauth-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const adminUrl = `${appUrl}/admin/youtube-analytics`;

  if (error || !code) {
    return NextResponse.redirect(`${adminUrl}?yt_auth=denied`);
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${adminUrl}?yt_auth=error&reason=missing_credentials`);
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
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || 'Token exchange failed');
    }
    if (!tokens.refresh_token) {
      throw new Error('No refresh token returned — ensure prompt=consent is set.');
    }

    await saveYTAnalyticsToken({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresInSeconds: Number(tokens.expires_in || 3600),
    });

    return NextResponse.redirect(`${adminUrl}?yt_auth=success`);
  } catch (err: any) {
    console.error('[youtube-analytics/callback]', err);
    return NextResponse.redirect(
      `${adminUrl}?yt_auth=error&reason=${encodeURIComponent(err.message)}`
    );
  }
}
