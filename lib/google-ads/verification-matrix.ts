// lib/google-ads/verification-matrix.ts
import 'server-only';
import { getGoogleAdsUserOAuth, getValidUserAccessToken } from '@/app/lib/server/google-ads-oauth-store';
import { getAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';

const ADS_API_VERSION = 'v17'; // Baseline for this project

export type VerificationMatrixResult = {
  oauth: {
    connected: boolean;
    valid: boolean;
    tokenExpired: boolean;
    hasRefreshToken: boolean;
    googleEmail: string | null;
  };
  account: {
    customerId: string | null;
    exists: boolean;
    accessible: boolean;
    viaMcc: boolean;
  };
  billing?: {
    setup: boolean;
    status: string | null;
  };
  suspension?: {
    isSuspended: boolean;
    reason?: string | null;
  };
  timestamp: string;
};

/**
 * Runs a comprehensive internal verification check for a Google Ads account.
 * This is intended for admin diagnostics and background infrastructure health checks.
 */
export async function runInternalVerification(params: {
  userId?: string;
  adoptionId?: string;
  targetCustomerId?: string;
}): Promise<VerificationMatrixResult> {
  const { userId, adoptionId, targetCustomerId } = params;
  const now = new Date().toISOString();

  // 1. Resolve OAuth Record
  const userRecord = userId ? await getGoogleAdsUserOAuth(userId) : null;
  const adoptionRecord = adoptionId ? await getAdoptionGoogleOAuthRecord(adoptionId) : null;
  const activeRecord = userRecord || adoptionRecord;

  const result: VerificationMatrixResult = {
    oauth: {
      connected: !!activeRecord,
      valid: false,
      tokenExpired: false,
      hasRefreshToken: !!activeRecord?.refreshToken,
      googleEmail: activeRecord?.googleEmail || null,
    },
    account: {
      customerId: targetCustomerId || activeRecord?.verifiedCustomerId || null,
      exists: false,
      accessible: false,
      viaMcc: false,
    },
    timestamp: now,
  };

  if (!activeRecord) return result;

  // 2. Check Token Expiry
  if (activeRecord.expiresAt) {
    result.oauth.tokenExpired = Date.now() >= new Date(activeRecord.expiresAt).getTime();
  }

  // 3. Attempt Access Token Retrieval (Silent Refresh)
  let accessToken: string | null = null;
  try {
    if (userId && userRecord) {
      accessToken = await getValidUserAccessToken(userId, userRecord);
    } else {
      // Adoption record refresh logic would go here if needed, 
      // but usually we rely on userRecord for admin-level operations.
      accessToken = activeRecord.accessToken;
    }
    result.oauth.valid = !!accessToken;
  } catch (err) {
    console.error('[verification-matrix] OAuth validation failed:', err);
    result.oauth.valid = false;
  }

  if (!accessToken || !result.account.customerId) return result;

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!developerToken) return result;

  const cid = result.account.customerId.replace(/-/g, '');

  // 4. Verify Account Status (Customer Resource)
  try {
    const customerUrl = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${cid}`;
    const response = await fetch(customerUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        ...(loginCustomerId ? { 'login-customer-id': loginCustomerId.replace(/-/g, '') } : {}),
      },
    });

    if (response.ok) {
      const customerData = await response.json();
      result.account.exists = true;
      result.account.accessible = true;
      result.account.viaMcc = !!loginCustomerId;
      
      // Billing and Suspension signals (simplified for now)
      // Note: Real billing checks require querying BillingSetup or GoogleAdsService
      result.suspension = {
        isSuspended: customerData.status === 'SUSPENDED',
        reason: customerData.status,
      };
    } else {
      console.warn(`[verification-matrix] Customer lookup failed (HTTP ${response.status}):`, await response.text());
    }
  } catch (err) {
    console.error('[verification-matrix] API call failed:', err);
  }

  return result;
}
