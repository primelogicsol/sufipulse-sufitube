import { NextRequest, NextResponse } from 'next/server';
import { upsertGoogleAdsCampaign } from '@/app/lib/server/google-ads-campaign-store';
import { getAdoptionRecord } from '@/app/lib/server/adoption-store';
import { getAuthUser } from '@/server/middleware/authenticate';

/**
 * POST /api/google-ads/campaign-draft
 *
 * Saves campaign intent to the store without making any Google Ads API call.
 * Use this to persist user intent before the campaign is authorized and submitted.
 *
 * Body: { adoptionId, releaseId, userId, youtubeVideoId, budgetAmount, selectedCustomerId, campaignObjective }
 *
 * Auth: optional — adoption UUID serves as the access token for anonymous drafts.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);

  const body = await request.json();
  const {
    adoptionId = '',
    releaseId = '',
    userId = '',
    youtubeVideoId = '',
    budgetAmount = 0,
    selectedCustomerId = '',
  } = body as {
    adoptionId?: string;
    releaseId?: string;
    userId?: string;
    youtubeVideoId?: string;
    budgetAmount?: number;
    selectedCustomerId?: string;
  };

  if (!adoptionId || !selectedCustomerId) {
    return NextResponse.json(
      { error: 'adoptionId and selectedCustomerId are required.' },
      { status: 400 }
    );
  }

  // Verify caller owns this adoption (authenticated user or anonymous draft)
  const adoption = getAdoptionRecord(adoptionId);
  if (!adoption) {
    return NextResponse.json({ error: 'Adoption not found.' }, { status: 404 });
  }
  if (user) {
    if (adoption.userId && adoption.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
  } else if (adoption.userId != null) {
    // Adoption belongs to a registered user but caller is unauthenticated
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const record = await upsertGoogleAdsCampaign({
    adoptionId,
    releaseId,
    userId,
    selectedCustomerId,
    youtubeVideoId,
    budgetAmount,
    campaignStatus: 'PAUSED',
  });

  return NextResponse.json({
    success: true,
    status: 'draft_saved',
    adoption_id: adoptionId,
    release_id: releaseId,
    campaign: record,
  });
}
