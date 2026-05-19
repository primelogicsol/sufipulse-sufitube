// lib/google-ads/verification-matrix.ts
import 'server-only';
import { getGoogleAdsUserOAuth, getValidUserAccessToken } from '@/app/lib/server/google-ads-oauth-store';
import { getAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';
import { getStudioOAuthRecord, getValidStudioAccessToken } from '@/app/lib/server/google-ads-studio-oauth-store';
import { ADS_API_VERSION } from './config';

export type VerificationMatrixResult = {
  oauth: {
    connected: boolean;
    valid: boolean;
    tokenExpired: boolean;
    hasRefreshToken: boolean;
    googleEmail: string | null;
    error?: string | null;
    classification?: 'TOKEN_REFRESH_FAILED' | 'USER_PERMISSION_DENIED' | 'DEVELOPER_TOKEN' | 'OAUTH_ERROR';
  };
  account: {
    customerId: string | null;
    exists: boolean;
    accessible: boolean;
    viaMcc: boolean;
    error?: string | null;
    classification?: 'INVALID_CUSTOMER_ID' | 'USER_PERMISSION_DENIED' | 'BILLING' | 'DEVELOPER_TOKEN' | 'PAYLOAD_SCHEMA';
  };
  hierarchy?: {
    checked: boolean;
    foundInList: boolean;
    accessibleCount: number;
    error?: string | null;
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
 * Supports individual user/adoption tokens OR the global Studio token.
 */
export async function runInternalVerification(params: {
  userId?: string;
  adoptionId?: string;
  targetCustomerId?: string;
  studio?: boolean;
}): Promise<VerificationMatrixResult> {
  const { userId, adoptionId, targetCustomerId, studio } = params;
  const now = new Date().toISOString();

  let activeRecord: any = null;
  let accessToken: string | null = null;

  const result: VerificationMatrixResult = {
    oauth: {
      connected: false,
      valid: false,
      tokenExpired: false,
      hasRefreshToken: false,
      googleEmail: null,
    },
    account: {
      customerId: targetCustomerId || null,
      exists: false,
      accessible: false,
      viaMcc: false,
    },
    timestamp: now,
  };

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  if (!developerToken) {
    result.oauth.classification = 'DEVELOPER_TOKEN';
    result.account.error = 'DEVELOPER_TOKEN_MISSING';
    return result;
  }

  // 1. Resolve Token and Record
  try {
    if (studio) {
      activeRecord = await getStudioOAuthRecord();
      accessToken = await getValidStudioAccessToken();
    } else {
      const userRecord = userId ? await getGoogleAdsUserOAuth(userId) : null;
      const adoptionRecord = adoptionId ? await getAdoptionGoogleOAuthRecord(adoptionId) : null;
      activeRecord = userRecord || adoptionRecord;
      
      if (userId && userRecord) {
        accessToken = await getValidUserAccessToken(userId, userRecord);
      } else if (activeRecord) {
        accessToken = activeRecord.accessToken;
      }
    }
  } catch (err: any) {
    console.error('[verification-matrix] Token resolution failed:', err);
    result.oauth.error = err.message;
    result.oauth.classification = 'TOKEN_REFRESH_FAILED';
  }

  if (!activeRecord) return result;

  result.oauth.connected = true;
  result.oauth.hasRefreshToken = !!activeRecord.refreshToken;
  result.oauth.googleEmail = activeRecord.googleEmail || null;
  
  if (activeRecord.expiresAt) {
    result.oauth.tokenExpired = Date.now() >= new Date(activeRecord.expiresAt).getTime();
  }

  result.oauth.valid = !!accessToken;

  if (!accessToken) {
    if (result.oauth.tokenExpired) result.oauth.classification = 'TOKEN_REFRESH_FAILED';
    return result;
  }

  // 2. Hierarchy Check (v22 listAccessibleCustomers)
  try {
    const hierarchyUrl = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers:listAccessibleCustomers`;
    const hierarchyRes = await fetch(hierarchyUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
      },
    });

    result.hierarchy = {
      checked: true,
      foundInList: false,
      accessibleCount: 0,
    };

    if (hierarchyRes.ok) {
      const hierarchyData = await hierarchyRes.json();
      const resourceNames = hierarchyData.resourceNames || [];
      result.hierarchy.accessibleCount = resourceNames.length;
      
      if (result.account.customerId) {
        const targetCid = result.account.customerId.replace(/-/g, '');
        result.hierarchy.foundInList = resourceNames.some((name: string) => 
          name.split('/').pop() === targetCid
        );
      }
    } else {
      result.hierarchy.error = `HTTP_${hierarchyRes.status}`;
    }
  } catch (err: any) {
    result.hierarchy = { checked: true, foundInList: false, accessibleCount: 0, error: err.message };
  }

  if (!result.account.customerId) return result;
  const cid = result.account.customerId.replace(/-/g, '');

  // 3. Verify Account Status (Query-based Search)
  try {
    const searchUrl = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${cid}/googleAds:search`;
    const searchBody = {
      query: `SELECT customer.id, customer.descriptive_name, customer.status, customer.time_zone FROM customer WHERE customer.id = '${cid}'`
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        // For search, we can use the target account itself as the context if it was found in the accessible list,
        // or the MCC if provided. Using target CID directly is often more robust if authorized.
        ...(loginCustomerId ? { 'login-customer-id': loginCustomerId.replace(/-/g, '') } : { 'login-customer-id': cid }),
      },
      body: JSON.stringify(searchBody)
    });

    if (response.ok) {
      const searchData = await response.json();
      const customer = searchData.results?.[0]?.customer;

      if (customer) {
        result.account.exists = true;
        result.account.accessible = true;
        result.account.viaMcc = !!loginCustomerId;
        
        result.suspension = {
          isSuspended: customer.status === 'SUSPENDED',
          reason: customer.status,
        };
      } else {
        // If query returns empty but listAccessibleCustomers had it, it's a structural anomaly
        console.warn(`[verification-matrix] Search returned no results for ${cid}`);
        result.account.error = 'SEARCH_EMPTY';
      }
    } else {
      const errorText = await response.text();
      let errorData: any;
      try { errorData = JSON.parse(errorText); } catch { errorData = { message: errorText }; }
      
      console.warn(`[verification-matrix] Customer search failed (HTTP ${response.status}):`, errorText);
      const googleError = errorData.error?.status || `HTTP_${response.status}`;
      result.account.error = googleError;
      
      // Classify errors
      if (response.status === 404) {
        result.account.classification = 'INVALID_CUSTOMER_ID';
      } else if (response.status === 403) {
        result.account.classification = 'USER_PERMISSION_DENIED';
      } else if (googleError.includes('DEVELOPER_TOKEN')) {
        result.account.classification = 'DEVELOPER_TOKEN';
      } else if (googleError.includes('BILLING')) {
        result.account.classification = 'BILLING';
      } else if (response.status === 400) {
        result.account.classification = 'PAYLOAD_SCHEMA';
      }
    }
  } catch (err: any) {
    console.error('[verification-matrix] API search call failed:', err);
    result.account.error = 'NETWORK_ERROR';
  }

  return result;
}
