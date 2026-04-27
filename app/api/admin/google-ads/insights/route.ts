import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getValidStudioAccessToken } from '@/app/lib/server/google-ads-studio-oauth-store';

interface AdsMetricSummary {
  impressions: number;
  clicks: number;
  conversions: number;
  costMicros: number;
  videoViews: number;
}

const emptySummary = (): AdsMetricSummary => ({
  impressions: 0,
  clicks: 0,
  conversions: 0,
  costMicros: 0,
  videoViews: 0,
});

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sumMetricsFromResponse = (responsePayload: any[]): AdsMetricSummary => {
  const summary = emptySummary();
  for (const chunk of responsePayload || []) {
    for (const row of chunk?.results || []) {
      const metrics = row?.metrics || {};
      summary.impressions += toNumber(metrics.impressions);
      summary.clicks += toNumber(metrics.clicks);
      summary.conversions += toNumber(metrics.conversions);
      summary.costMicros += toNumber(metrics.costMicros);
      summary.videoViews += toNumber(metrics.videoViews);
    }
  }
  return summary;
};

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const customerIds: string[] = Array.isArray(body?.customerIds) ? body.customerIds : [];

    if (customerIds.length === 0) {
      return NextResponse.json({ error: 'No customer IDs provided' }, { status: 400 });
    }

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

    if (!developerToken || !loginCustomerId) {
      return NextResponse.json(
        { error: 'GOOGLE_ADS_DEVELOPER_TOKEN and GOOGLE_ADS_LOGIN_CUSTOMER_ID are required.' },
        { status: 503 }
      );
    }

    const accessToken = await getValidStudioAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'SufiTube managed account is not connected. Complete OAuth setup at /admin/google-ads.' },
        { status: 503 }
      );
    }

    const uniqueIds = [...new Set(customerIds)];
    const perCustomer: Array<{ customerId: string; summary: AdsMetricSummary; error?: string }> = [];
    const total = emptySummary();

    for (const rawCustomerId of uniqueIds) {
      const customerId = rawCustomerId.replace(/-/g, '');
      try {
        const response = await fetch(
          `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'developer-token': developerToken,
              'login-customer-id': loginCustomerId.replace(/-/g, ''),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query:
                'SELECT metrics.impressions, metrics.clicks, metrics.conversions, metrics.cost_micros, metrics.video_views FROM campaign WHERE segments.date DURING LAST_30_DAYS',
            }),
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          perCustomer.push({
            customerId: rawCustomerId,
            summary: emptySummary(),
            error: `Google Ads API error: ${response.status} ${errorText}`,
          });
          continue;
        }

        const responsePayload = await response.json();
        const summary = sumMetricsFromResponse(responsePayload);

        total.impressions += summary.impressions;
        total.clicks += summary.clicks;
        total.conversions += summary.conversions;
        total.costMicros += summary.costMicros;
        total.videoViews += summary.videoViews;

        perCustomer.push({ customerId: rawCustomerId, summary });
      } catch (error: any) {
        perCustomer.push({
          customerId: rawCustomerId,
          summary: emptySummary(),
          error: error?.message || 'Unknown Google Ads request error',
        });
      }
    }

    return NextResponse.json({
      summary: total,
      customers: perCustomer,
      coverage: {
        totalCustomerIds: uniqueIds.length,
        successfulCustomerIds: perCustomer.filter((item) => !item.error).length,
      },
      timeframe: 'LAST_30_DAYS',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load Google Ads insights' },
      { status: 500 }
    );
  }
}
