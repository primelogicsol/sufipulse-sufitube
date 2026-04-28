import { NextRequest, NextResponse } from 'next/server';
import {
  getAdoptionRecord,
  updateAdoptionRecord,
} from '@/app/lib/server/adoption-store';
import { getAdoptionPaymentRecord, upsertAdoptionPaymentRecord } from '@/app/lib/server/adoption-payment-store';
import { getCampaignRequest } from '@/app/lib/server/google-ads-campaign-request-store';
import { getAuthUser, requireAdmin } from '@/server/middleware/authenticate';

/**
 * GET /api/adoptions/[id]
 * Public by ID — merges adoption record + payment + campaign request status.
 * No auth required (ID is a UUID and serves as access token for tracking).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const adoption = getAdoptionRecord(id);
  if (!adoption) {
    return NextResponse.json({ error: 'Adoption not found' }, { status: 404 });
  }

  const payment = await getAdoptionPaymentRecord(id);
  const campaignReq = await getCampaignRequest(id);

  return NextResponse.json({
    ...adoption,
    // Merge payment record — server payment status is authoritative
    paymentStatus: payment?.paymentStatus ?? adoption.paymentStatus,
    amountPaid: payment?.amountPaid ?? adoption.amountPaid,
    stripeSessionId: payment?.stripeSessionId ?? null,
    // Merge campaign status
    campaignRequestStatus: campaignReq?.status ?? null,
    campaignResourceName: campaignReq?.campaignResourceName ?? adoption.campaignResourceName ?? null,
  });
}

/**
 * PATCH /api/adoptions/[id]
 * Update adoption record.
 *   - Stripe webhook: protected by x-webhook-secret header
 *   - Owner: requires auth + ownership match
 *   - Admin: requires admin role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const adoption = getAdoptionRecord(id);
  if (!adoption) {
    return NextResponse.json({ error: 'Adoption not found' }, { status: 404 });
  }

  // ── Stripe webhook path (internal) ─────────────────────────────────────────
  const webhookSecret = request.headers.get('x-webhook-secret');
  if (webhookSecret) {
    if (webhookSecret !== process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const updated = updateAdoptionRecord(id, {
      paymentStatus: body?.payment_status,
      adoptionStatus: body?.adoption_status,
      amountPaid: body?.amount_paid,
      paymentReference: body?.stripe_session_id,
    });
    if (body?.payment_status) {
      await upsertAdoptionPaymentRecord(id, {
        paymentStatus: body.payment_status,
        adoptionStatus: body.adoption_status,
        amountPaid: body.amount_paid,
        stripeSessionId: body.stripe_session_id,
        lastEventType: body.event_type,
      });
    }
    return NextResponse.json({ adoption_id: id, updated });
  }

  // ── Authenticated user or admin ────────────────────────────────────────────
  const user = await getAuthUser(request);

  // Unauthenticated drafts (userId=null): the adoption UUID is the access token
  if (!user && adoption.userId != null) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const isAdmin = user?.role === 'admin';
  // userId=null means an anonymous draft — anyone with the UUID can update it
  const isOwner = adoption.userId == null || (user != null && adoption.userId === user.id);

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  // Non-admin fields (owner-safe updates)
  const ownerFields: (keyof typeof body)[] = [
    'sponsorName', 'sponsorEmail', 'sponsorCountry', 'sponsorCity',
    'adopterType', 'campaignIntention', 'dedicationMessage', 'targetRegions',
    'targetLanguages', 'googleAdsCustomerId', 'googleAdsVerificationStatus', 'oauthStatus',
    'publicDisplayMode', 'publicLocationMode', 'isAnonymous',
    'adoptionStatus', 'amountDue', 'currency', 'paymentRoute',
  ];

  // Admin-only fields
  const adminFields: (keyof typeof body)[] = [
    'adminNote', 'reportUrl', 'publicListingApproved',
    'campaignStatus', 'campaignResourceName', 'campaignObjective',
  ];

  const allowed = isAdmin ? [...ownerFields, ...adminFields] : ownerFields;
  const patch: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) patch[String(key)] = body[key as string];
  }

  // Gate: cannot promote use_my_google_ads to pending_review without a customer ID
  if (patch.adoptionStatus === 'pending_review' && (patch.methodType ?? adoption.methodType) === 'use_my_google_ads') {
    if (!patch.googleAdsCustomerId && !adoption.googleAdsCustomerId) {
      return NextResponse.json(
        { error: 'A Google Ads customer ID is required to submit for review.' },
        { status: 422 }
      );
    }
  }

  const updated = updateAdoptionRecord(id, patch);
  return NextResponse.json(updated);
}
