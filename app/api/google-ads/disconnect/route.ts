import { NextRequest, NextResponse } from 'next/server';
import {
  getGoogleAdsUserOAuth,
  deleteGoogleAdsUserOAuth,
} from '@/app/lib/server/google-ads-oauth-store';
import {
  getAdoptionGoogleOAuthRecord,
  deleteAdoptionGoogleOAuthRecord,
} from '@/app/lib/server/adoption-google-oauth-store';
import { requireAuth } from '@/server/middleware/authenticate';

/**
 * POST /api/google-ads/disconnect
 *
 * Revokes the Google OAuth token with Google and removes local records.
 * Clears both user-level (global) and adoption-level (per-song) tokens.
 *
 * Body: { adoptionId?, userId? }
 * At least one must be provided.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { adoptionId, userId } = body as {
    adoptionId?: string;
    userId?: string;
  };

  // Prevent users from disconnecting other users' tokens
  if (userId && userId !== authResult.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!adoptionId && !userId) {
    return NextResponse.json(
      { error: 'Provide at least one of adoptionId or userId.' },
      { status: 400 }
    );
  }

  let tokenToRevoke: string | null = null;

  // Revoke and remove user-level token first
  if (userId) {
    const userRecord = await getGoogleAdsUserOAuth(userId);
    if (userRecord?.accessToken) {
      tokenToRevoke = userRecord.accessToken;
    }
    await deleteGoogleAdsUserOAuth(userId);
  }

  // Revoke and remove adoption-level token
  if (adoptionId) {
    const adoptionRecord = await getAdoptionGoogleOAuthRecord(adoptionId);
    if (adoptionRecord?.accessToken && !tokenToRevoke) {
      // Only revoke once — avoid double-revoking same token
      tokenToRevoke = adoptionRecord.accessToken;
    }
    await deleteAdoptionGoogleOAuthRecord(adoptionId);
  }

  // Revoke with Google (non-fatal if it fails)
  if (tokenToRevoke) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    } catch {
      // Non-fatal — local records are already cleared
    }
  }

  return NextResponse.json({ disconnected: true });
}
