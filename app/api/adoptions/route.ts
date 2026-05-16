// cache-bust: 2026-04-27
import { NextRequest, NextResponse } from 'next/server';
import {
  createAdoptionRecord,
  getAllAdoptionRecords,
  getAdoptionsByUser,
  getAdoptionsByRelease,
} from '@/app/lib/server/adoption-store';
import { getAuthUser, requireAdmin } from '@/server/middleware/authenticate';
import { validateRequestBody, validateQueryParams } from '@/app/lib/api-middleware';
import { adoptionApiSchema, adoptionsQuerySchema } from '@/app/lib/validation-schemas';

/**
 * POST /api/adoptions
 * Creates a persistent adoption record on the server.
 * Auth optional — userId stored if authenticated.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);

  const validationResult = await validateRequestBody(request, adoptionApiSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;
    const {
      releaseId,
      releaseTitle,
      releaseSlug,
      youtubeId,
      thumbnailUrl,
      methodType,
      sponsorName,
      sponsorEmail: bodyEmail,
      sponsorCountry,
      sponsorCity,
      adopterType,
      campaignIntention = 'general_awareness',
      dedicationMessage,
      campaignObjective,
      targetRegions = ['Global'],
      targetLanguages = ['All'],
      preferredAudienceRegion,
      amountDue = 0,
      currency = 'USD',
      googleAdsCustomerId,
      googleAdsAccountEmail,
      googleAdsConnectionStatus,
      googleAdsAccessStatus,
      googleAdsTokenStatus,
      googleAdsCampaignId,
      googleAdsCampaignName,
      googleAdsCampaignStatus,
      publicDisplayMode = 'full_name',
      publicLocationMode = 'city_country',
      isAnonymous = false,
      adoptionStatus = 'draft',
      agreementAccepted,
      publicMentionAccepted,
      institutionalClausesAccepted,
      selectedTier,
      selectedTierLabel,
      paymentLinkUrl,
    } = body;

    const record = createAdoptionRecord({
      releaseId,
      releaseTitle,
      releaseSlug,
      youtubeId,
      thumbnailUrl,
      userId: user?.id,
      sponsorName: sponsorName ?? undefined,
      sponsorEmail: bodyEmail ?? user?.email ?? undefined,
      sponsorCountry: sponsorCountry ?? undefined,
      sponsorCity: sponsorCity ?? undefined,
      adopterType: adopterType ?? undefined,
      methodType,
      campaignIntention,
      dedicationMessage,
      campaignObjective: campaignObjective || 'awareness',
      targetRegions: targetRegions || ['Global'],
      targetLanguages: targetLanguages || ['All'],
      preferredAudienceRegion,
      amountDue: amountDue || 0,
      amountPaid: 0,
      expectedPaymentAmount: amountDue || 0,
      currency: currency || 'USD',
      paymentProvider: null,
      paymentReference: null,
      paymentRoute: null,
      paymentLinkUrl: paymentLinkUrl ?? null,
      selectedTier,
      selectedTierLabel,
      oauthStatus: 'not_connected',
      googleAdsCustomerId: googleAdsCustomerId ?? null,
      googleAdsAccountEmail: googleAdsAccountEmail ?? null,
      googleAdsConnectionStatus: googleAdsConnectionStatus ?? null,
      googleAdsAccessStatus: googleAdsAccessStatus ?? null,
      googleAdsTokenStatus: googleAdsTokenStatus ?? null,
      googleAdsCampaignId: googleAdsCampaignId ?? null,
      googleAdsCampaignName: googleAdsCampaignName ?? null,
      googleAdsCampaignStatus: googleAdsCampaignStatus ?? null,
      campaignStatus: 'not_created',
      campaignResourceName: null,
      publicDisplayMode,
      publicLocationMode,
      publicListingApproved: false,
      isAnonymous: isAnonymous || false,
      agreementAccepted: !!agreementAccepted,
      publicMentionAccepted: !!publicMentionAccepted,
      institutionalClausesAccepted: !!institutionalClausesAccepted,
      adminNote: null,
      reportUrl: null,
      adminAdopterApproved: false,
      publicAdopterEligible: false,
      adoptionStatus: adoptionStatus as any,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create adoption' }, { status: 500 });
  }
}

/**
 * GET /api/adoptions
 *   ?me=1   — current user's adoptions (requires auth)
 *   ?all=1  — all adoptions (requires admin)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const validationResult = validateQueryParams(searchParams, adoptionsQuerySchema);
  if (!validationResult.success) {
    return NextResponse.json(validationResult.error, { status: 400 });
  }

  const { me: meParam, all: allParam, releaseId } = validationResult.data;
  const me = meParam === '1';
  const all = allParam === '1';

  if (all) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;
    return NextResponse.json(getAllAdoptionRecords());
  }

  if (me) {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json(getAdoptionsByUser(user.id));
  }

  // Public: approved adopters for a release (publicListingApproved=true)
  if (releaseId) {
    return NextResponse.json(getAdoptionsByRelease(releaseId));
  }

  return NextResponse.json({ error: 'Specify ?me=1, ?all=1, or ?releaseId=' }, { status: 400 });
}
