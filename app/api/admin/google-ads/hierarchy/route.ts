import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getValidStudioAccessToken } from '@/app/lib/server/google-ads-studio-oauth-store';

/**
 * GET /api/admin/google-ads/hierarchy
 * 
 * Internal diagnostic endpoint to list all Google Ads accounts
 * accessible by the current Studio/Admin OAuth token.
 * 
 * Used to resolve INVALID_CUSTOMER_ID and hierarchy alignment issues.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    return NextResponse.json({ error: 'Developer token not configured' }, { status: 503 });
  }

  try {
    const accessToken = await getValidStudioAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'Studio account not connected' }, { status: 503 });
    }
    console.log('[hierarchy-diagnostics] Token starts with:', accessToken.slice(0, 10), 'Length:', accessToken.length);

    // DEBUG: Verify token with userinfo
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const userinfo = await userinfoRes.json();
    console.log('[hierarchy-diagnostics] Token userinfo:', userinfo.email || 'error');

    // DEBUG: Try specific customer fetch
    const studioCid = process.env.STUDIO_GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, '');
    const debugUrl = `https://googleads.googleapis.com/v17/customers/${studioCid}`;
    
    console.log('[hierarchy-diagnostics] Debug fetch from:', debugUrl);
    const debugRes = await fetch(debugUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
      },
    });
    const debugText = await debugRes.text();
    console.log(`[hierarchy-diagnostics] Debug response status: ${debugRes.status}`);
    console.log(`[hierarchy-diagnostics] Debug response snippet: ${debugText.slice(0, 500)}`);

    // Call Google Ads API to list accessible customers
    const url = 'https://googleads.googleapis.com/v22/customers:listAccessibleCustomers';
    
    console.log('[hierarchy-diagnostics] Fetching from:', url);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
      },
    });

    const text = await res.text();
    console.log(`[hierarchy-diagnostics] Google response status: ${res.status}`);
    
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('[hierarchy-diagnostics] Raw Google response (non-JSON):', text.slice(0, 1000));
      return NextResponse.json({
        error: `Google Ads API returned non-JSON response (HTTP ${res.status})`,
        rawResponseSnippet: text.slice(0, 500)
      }, { status: 500 });
    }

    if (!res.ok) {
      return NextResponse.json({
        error: data.error?.message || 'Failed to list accessible customers',
        details: data.error
      }, { status: res.status });
    }

    const resourceNames = data.resourceNames || [];
    const accounts = resourceNames.map((name: string) => {
      const cid = name.split('/').pop() || '';
      return {
        resourceName: name,
        customerId: cid,
        formattedId: cid.length === 10 ? `${cid.slice(0, 3)}-${cid.slice(3, 6)}-${cid.slice(6)}` : cid
      };
    });

    return NextResponse.json({
      success: true,
      accounts,
      configuredIds: {
        loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || null,
        studioCustomerId: process.env.STUDIO_GOOGLE_ADS_CUSTOMER_ID || null,
      },
      oauthScope: 'https://www.googleapis.com/auth/adwords',
      timestamp: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error('[hierarchy-diagnostics] Failed:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
