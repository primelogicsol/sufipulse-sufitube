import { type NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(_req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/login?error=Google+sign-in+is+not+configured`);
  }

  // Generate a random state token for CSRF protection.
  // It is stored in a short-lived HttpOnly cookie and validated in the callback.
  const state = randomBytes(24).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  // Store state in HttpOnly cookie for 10 minutes — only the callback needs it.
  res.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  return res;
}
