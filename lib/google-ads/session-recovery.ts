// lib/google-ads/session-recovery.ts
import 'server-only';
import { getGoogleAdsUserOAuth, getValidUserAccessToken, GoogleAdsUserOAuthRecord } from '@/app/lib/server/google-ads-oauth-store';
import { getAdoptionGoogleOAuthRecord, upsertAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';

export type SessionRecoveryResult = {
  success: boolean;
  accessToken: string | null;
  error?: string;
  source: 'user' | 'adoption' | 'none';
  refreshed: boolean;
};

/**
 * Ensures a valid access token is available for the given context.
 * Silently refreshes if necessary.
 */
export async function ensureGoogleAdsSession(params: {
  userId?: string;
  adoptionId?: string;
}): Promise<SessionRecoveryResult> {
  const { userId, adoptionId } = params;

  console.log(`[session-recovery] Ensuring session for userId=${userId || 'none'} adoptionId=${adoptionId || 'none'}`);

  // 1. Try User-based OAuth
  if (userId) {
    const userRecord = await getGoogleAdsUserOAuth(userId);
    if (userRecord?.accessToken) {
      try {
        const initialToken = userRecord.accessToken;
        const token = await getValidUserAccessToken(userId, userRecord);
        const refreshed = token !== initialToken;
        
        if (refreshed) {
          console.log(`[session-recovery] User token refreshed silently for userId=${userId}`);
        }

        return {
          success: true,
          accessToken: token,
          source: 'user',
          refreshed,
        };
      } catch (err: any) {
        console.error(`[session-recovery] User token refresh failed for userId=${userId}:`, err.message);
        return {
          success: false,
          accessToken: null,
          error: `User refresh failed: ${err.message}`,
          source: 'user',
          refreshed: false,
        };
      }
    }
  }

  // 2. Try Adoption-based OAuth
  if (adoptionId) {
    const adoptionRecord = await getAdoptionGoogleOAuthRecord(adoptionId);
    if (adoptionRecord?.accessToken) {
      const isExpiring = adoptionRecord.expiresAt
        ? Date.now() + 5 * 60 * 1000 >= new Date(adoptionRecord.expiresAt).getTime()
        : false;

      if (!isExpiring) {
        return {
          success: true,
          accessToken: adoptionRecord.accessToken,
          source: 'adoption',
          refreshed: false,
        };
      }

      if (!adoptionRecord.refreshToken) {
        return {
          success: false,
          accessToken: adoptionRecord.accessToken,
          error: 'Token expiring soon and no refresh token available.',
          source: 'adoption',
          refreshed: false,
        };
      }

      try {
        const token = await refreshAdoptionToken(adoptionId, adoptionRecord.refreshToken);
        if (token) {
          console.log(`[session-recovery] Adoption token refreshed silently for adoptionId=${adoptionId}`);
          return {
            success: true,
            accessToken: token,
            source: 'adoption',
            refreshed: true,
          };
        }
      } catch (err: any) {
        console.error(`[session-recovery] Adoption token refresh failed for adoptionId=${adoptionId}:`, err.message);
        return {
          success: false,
          accessToken: null,
          error: `Adoption refresh failed: ${err.message}`,
          source: 'adoption',
          refreshed: false,
        };
      }
    }
  }

  return {
    success: false,
    accessToken: null,
    error: 'No valid OAuth record found.',
    source: 'none',
    refreshed: false,
  };
}

async function refreshAdoptionToken(adoptionId: string, refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await res.json();
  if (!res.ok || !tokens.access_token) return null;

  const record = await getAdoptionGoogleOAuthRecord(adoptionId);
  if (record) {
    await upsertAdoptionGoogleOAuthRecord({
      adoptionId,
      accessToken: tokens.access_token,
      refreshToken: refreshToken,
      tokenType: tokens.token_type || record.tokenType,
      expiresInSeconds: Number(tokens.expires_in || 3600),
      accessibleCustomerIds: record.accessibleCustomerIds,
      googleEmail: record.googleEmail,
    });
  }

  return tokens.access_token;
}
