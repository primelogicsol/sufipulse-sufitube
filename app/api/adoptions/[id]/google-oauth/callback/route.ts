import { NextRequest, NextResponse } from 'next/server';
import { upsertAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';

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

    // Optional: discover accounts this token can access (for launch-time validation)
    let accessibleCustomerIds: string[] = [];
    try {
      const accessibleRes = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        },
      });
      const accessiblePayload = await accessibleRes.json();
      if (accessibleRes.ok && Array.isArray(accessiblePayload?.resourceNames)) {
        accessibleCustomerIds = accessiblePayload.resourceNames
          .map((name: string) => String(name || '').split('/').pop() || '')
          .filter(Boolean)
          .map((id: string) => {
            if (id.length === 10) return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
            return id;
          });
      }
    } catch {
      // Non-fatal — we'll still persist token and validate later at launch time.
    }

    await upsertAdoptionGoogleOAuthRecord({
      adoptionId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenType: tokens.token_type,
      expiresInSeconds: Number(tokens.expires_in || 0),
      accessibleCustomerIds,
    });

    return NextResponse.redirect(
      `${appUrl}/?adoption_oauth=success&adoption_id=${adoptionId}`
    );
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      `${appUrl}/?adoption_oauth=error&reason=${encodeURIComponent(err.message)}&adoption_id=${adoptionId}`
    );
  }
}
