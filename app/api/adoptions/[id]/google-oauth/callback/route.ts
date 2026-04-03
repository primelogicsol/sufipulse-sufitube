import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/adoptions/[id]/google-oauth/callback
 *
 * Google OAuth2 callback — exchanges the authorization code for tokens,
 * stores them on the adoption record, then redirects the sponsor back to
 * the release page with a success indicator.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const adoptionId = searchParams.get('state') || id;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/?adoption_oauth=denied&adoption_id=${adoptionId}`
    );
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/?adoption_oauth=error&reason=missing_credentials&adoption_id=${adoptionId}`
    );
  }

  const redirectUri = `${appUrl}/api/adoptions/${id}/google-oauth/callback`;

  try {
    // Exchange authorization code for tokens
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

    // Store tokens against the adoption record via internal PATCH
    // In a database backend you would persist refresh_token securely.
    // In the localStorage standalone app the client must apply this via the
    // redirect URL parameters (the server cannot write to the browser's localStorage).
    const tokenPayload = encodeURIComponent(
      JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type,
      })
    );

    // Redirect back to the page — client will read the params and update storage
    return NextResponse.redirect(
      `${appUrl}/?adoption_oauth=success&adoption_id=${adoptionId}&tokens=${tokenPayload}`
    );
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      `${appUrl}/?adoption_oauth=error&reason=${encodeURIComponent(err.message)}&adoption_id=${adoptionId}`
    );
  }
}
