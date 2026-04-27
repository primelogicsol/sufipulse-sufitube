// cache-bust: 2026-04-27
import { NextRequest, NextResponse } from 'next/server';
import {
  createAdoptionRecord,
  getAllAdoptionRecords,
  getAdoptionsByUser,
  getAdoptionsByRelease,
  type MethodType,
} from '@/app/lib/server/adoption-store';
import { getAuthUser, requireAdmin } from '@/server/middleware/authenticate';

/**
 * POST /api/adoptions
 * Creates a persistent adoption record on the server.
 * Auth optional — userId stored if authenticated.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);

  try {
    const body = await request.json();
    const {
      releaseId,
      releaseTitle,
      releaseSlug,
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
      amountDue = 0,
      currency = 'USD',
      googleAdsCustomerId,
      publicDisplayMode = 'full_name',
      publicLocationMode = 'city_country',
      isAnonymous = false,
      adoptionStatus = 'draft',
    }: {
      releaseId: string;
      releaseTitle?: string;
      releaseSlug?: string;
      methodType: MethodType;
      sponsorName?: string;
      sponsorEmail?: string;
      sponsorCountry?: string;
      sponsorCity?: string;
      adopterType?: string;
      campaignIntention?: string;
      dedicatedMessage?: string;
      dedicationMessage?: string;
      campaignObjective?: string;
      targetRegions?: string[];
      targetLanguages?: string[];
      amountDue?: number;
      currency?: string;
      googleAdsCustomerId?: string;
      publicDisplayMode?: string;
      publicLocationMode?: string;
      isAnonymous?: boolean;
      adoptionStatus?: string;
    } = body;

    if (!releaseId || !methodType) {
      return NextResponse.json({ error: 'releaseId and methodType are required' }, { status: 400 });
    }
    if (methodType !== 'managed_sufitube' && methodType !== 'use_my_google_ads') {
      return NextResponse.json({ error: 'Invalid methodType' }, { status: 400 });
    }

    const record = createAdoptionRecord({
      releaseId,
      releaseTitle,
      releaseSlug,
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
      targetRegions,
      targetLanguages,
      amountDue,
      amountPaid: 0,
      currency,
      paymentProvider: null,
      paymentReference: null,
      paymentRoute: null,
      oauthStatus: 'not_connected',
      googleAdsCustomerId: googleAdsCustomerId ?? null,
      campaignStatus: 'not_created',
      campaignResourceName: null,
      publicDisplayMode,
      publicLocationMode,
      publicListingApproved: false,
      isAnonymous,
      adminNote: null,
      reportUrl: null,
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
  const me = searchParams.get('me') === '1';
  const all = searchParams.get('all') === '1';
  const releaseId = searchParams.get('releaseId');

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
