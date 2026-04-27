import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdoptionPaymentRecord, upsertAdoptionPaymentRecord } from '@/app/lib/server/adoption-payment-store';
import { getAdoptionRecord, updateAdoptionRecord } from '@/app/lib/server/adoption-store';
import { requireAuth } from '@/server/middleware/authenticate';

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const existing = await getAdoptionPaymentRecord(id);
  if (existing?.userId && existing.userId !== authResult.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ verified: false, reason: 'stripe_not_configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const sessionId = String(body?.session_id || '').trim();
    if (!sessionId) {
      return NextResponse.json({ verified: false, reason: 'missing_session_id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session.metadata?.adoption_id || session.metadata.adoption_id !== id) {
      return NextResponse.json({ verified: false, reason: 'adoption_mismatch' }, { status: 400 });
    }

    const isPaid = session.payment_status === 'paid';
    const amountPaid = (session.amount_total || 0) / 100;

    if (!isPaid) {
      const failed = await upsertAdoptionPaymentRecord(id, {
        userId: authResult.id,
        paymentStatus: 'failed',
        adoptionStatus: 'pending_review',
        stripeSessionId: session.id,
        amountPaid,
        lastEventType: 'checkout.session.not_paid',
      });
      updateAdoptionRecord(id, { paymentStatus: 'failed', amountPaid });
      return NextResponse.json({ verified: false, reason: 'payment_not_completed', payment_record: failed });
    }

    // Payment confirmed — update both stores
    const paidRecord = await upsertAdoptionPaymentRecord(id, {
      userId: authResult.id,
      paymentStatus: 'paid',
      adoptionStatus: 'admin_review',
      stripeSessionId: session.id,
      amountPaid,
      lastEventType: 'checkout.session.verified',
    });

    const adoption = getAdoptionRecord(id);
    updateAdoptionRecord(id, {
      paymentStatus: 'paid',
      amountPaid,
      paymentReference: session.id,
      paymentProvider: 'stripe',
      adoptionStatus: 'admin_review',
    });

    return NextResponse.json({ verified: true, payment_record: paidRecord, adoption });
  } catch (error: any) {
    return NextResponse.json({ verified: false, reason: error?.message || 'confirmation_failed' }, { status: 500 });
  }
}
