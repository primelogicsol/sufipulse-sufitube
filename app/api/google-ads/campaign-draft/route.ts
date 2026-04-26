import { NextRequest, NextResponse } from 'next/server';
import { upsertGoogleAdsCampaign } from '@/app/lib/server/google-ads-campaign-store';
import { requireAuth } from '@/server/middleware/authenticate';

/**
 * POST /api/google-ads/campaign-draft
 *
 * Saves campaign intent to the store without making any Google Ads API call.
 * Use this to persist user intent before the campaign is authorized and submitted.
 *
 * Body: { adoptionId, releaseId, userId, youtubeVideoId, budgetAmount, selectedCustomerId, campaignObjective }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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
