import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCampaignRequests,
  getCampaignRequestsByRelease,
  getCampaignRequestsByStatus,
  upsertCampaignRequest,
  addCampaignRequestEvent,
  type CampaignRequestStatus,
} from '@/app/lib/server/google-ads-campaign-request-store';
import { getAuthUser, requireAuth, requireAdmin } from '@/server/middleware/authenticate';

/**
 * GET /api/google-ads/campaign-requests
 *   ?releaseId=  — filter by release
 *   ?status=     — filter by status
 *   ?all=1       — admin: return all (requires admin role)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const releaseId = searchParams.get('releaseId') ?? '';
  const status = searchParams.get('status') as CampaignRequestStatus | null;
  const all = searchParams.get('all') === '1';

  try {
    if (all) {
      // Admin-only: full list
      const adminCheck = await requireAdmin(request);
      if (adminCheck instanceof NextResponse) return adminCheck;
      const requests = status
        ? await getCampaignRequestsByStatus(status)
        : await getAllCampaignRequests();
      return NextResponse.json(requests);
    }

    if (releaseId) {
      const requests = await getCampaignRequestsByRelease(releaseId);
      // Filter to only requests owned by this user (unless admin)
      const filtered =
        authResult.role === 'admin'
          ? requests
          : requests.filter((r) => r.userId === authResult.id);
      return NextResponse.json(filtered);
    }

    // Default: return only this user's requests
    const all2 = await getAllCampaignRequests();
    const mine = authResult.role === 'admin'
      ? all2
      : all2.filter((r) => r.userId === authResult.id);
    return NextResponse.json(mine);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/google-ads/campaign-requests
 * Creates or updates a campaign request record.
 * Called by AdoptTab after the sponsor completes the Google Ads form.
 */
export async function POST(request: NextRequest) {
  // Auth optional — unauthenticated sponsors (Google OAuth only) are allowed
  const authResult = await getAuthUser(request);

  try {
    const body = await request.json();
    const {
      adoptionId,
      releaseId,
      releaseTitle,
      releaseSlug,
      youtubeVideoId,
      budgetAmount,
      currency = 'USD',
      campaignObjective = 'awareness',
      targetRegions = ['Global'],
      targetLanguages = ['All'],
      googleAdsCustomerId,
      durationDays,
      oauthConnected = false,
      methodType,
      sponsorName,
      sponsorEmail,
    } = body;

    if (!adoptionId || !releaseId) {
      return NextResponse.json(
        { error: 'adoptionId and releaseId are required' },
        { status: 400 }
      );
    }

    const record = await upsertCampaignRequest({
      adoptionId,
      releaseId,
      releaseTitle,
      releaseSlug,
      youtubeVideoId,
      userId: authResult?.id ?? '',
      sponsorEmail: sponsorEmail ?? authResult?.email ?? '',
      sponsorName,
      budgetAmount: Number(budgetAmount) || 0,
      currency,
      campaignObjective,
      targetRegions,
      targetLanguages,
      googleAdsCustomerId,
      durationDays: durationDays ? Number(durationDays) : undefined,
      oauthConnected,
      methodType: methodType ?? 'use_my_google_ads',
      status: 'pending_review',
    });

    await addCampaignRequestEvent(adoptionId, {
      eventType: 'submitted',
      actorType: 'user',
      actorId: authResult?.id,
      message: `Campaign request submitted. Budget: $${budgetAmount}. Method: ${methodType ?? 'use_my_google_ads'}.`,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
