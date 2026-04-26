import { type NextRequest, NextResponse } from 'next/server';
import { loginOrCreateGoogleUser } from '@/server/services/auth';
import { config } from '@/server/config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const fail = (msg: string) =>
    NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(msg)}`);

  if (error || !code) return fail('Google sign-in was cancelled');

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_ADS_CLIENT_SECRET;

  if (!clientId || !clientSecret) return fail('Google sign-in is not configured');

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || 'Token exchange failed');
    }

    // Fetch Google profile
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userInfoRes.json();
    if (!userInfoRes.ok || !profile.sub || !profile.email) {
      throw new Error('Could not retrieve profile from Google');
    }

    const result = await loginOrCreateGoogleUser({
      googleId: profile.sub,
      email: profile.email,
      fullName: profile.name || profile.email.split('@')[0],
    });

    // Role-based redirect
    const role = result.user.role;
    let destination = '/user/profile';
    if (role === 'admin') destination = '/admin';
    else if (role === 'writer') destination = '/user/writer/dashboard';
    else if (role === 'vocalist') destination = '/user/vocalist/dashboard';
    else if (role === 'producer') destination = '/user/producer/dashboard';
    else if (role === 'literary') destination = '/user/literary-contributor/dashboard';
    else if (role === 'studio') destination = '/user/studio-engineer/dashboard';

    const res = NextResponse.redirect(`${appUrl}${destination}`);
    const cookieOpts = {
      httpOnly: true,
      secure: config.app.isProduction,
      sameSite: 'lax' as const, // lax required for cross-site OAuth redirect
      path: '/',
    };
    res.cookies.set('access_token', result.accessToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 });
    res.cookies.set('refresh_token', result.refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 });

    return res;
  } catch (err: any) {
    console.error('[Google auth callback]', err);
    return fail(err.message || 'Google sign-in failed');
  }
}
