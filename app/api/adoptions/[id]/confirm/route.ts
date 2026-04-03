import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { upsertAdoptionPaymentRecord } from '@/app/lib/server/adoption-payment-store';

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
  });
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      {
        verified: false,
        reason: 'stripe_not_configured',
      },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const sessionId = String(body?.session_id || '').trim();

    if (!sessionId) {
      return NextResponse.json({ verified: false, reason: 'missing_session_id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const adoptionIdFromSession = session.metadata?.adoption_id;

    if (!adoptionIdFromSession || adoptionIdFromSession !== id) {
      return NextResponse.json({ verified: false, reason: 'adoption_mismatch' }, { status: 400 });
    }

    const isPaid = session.payment_status === 'paid';

    if (!isPaid) {
      const failed = await upsertAdoptionPaymentRecord(id, {
        paymentStatus: 'failed',
        adoptionStatus: 'pending_review',
        stripeSessionId: session.id,
        amountPaid: (session.amount_total || 0) / 100,
        lastEventType: 'checkout.session.not_paid',
      });

      return NextResponse.json({
        verified: false,
        reason: 'payment_not_completed',
        payment_record: failed,
      });
    }

    const paidRecord = await upsertAdoptionPaymentRecord(id, {
      paymentStatus: 'paid',
      adoptionStatus: 'pending_review',
      stripeSessionId: session.id,
      amountPaid: (session.amount_total || 0) / 100,
      lastEventType: 'checkout.session.verified',
    });

    return NextResponse.json({
      verified: true,
      payment_record: paidRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        verified: false,
        reason: error?.message || 'confirmation_failed',
      },
      { status: 500 },
    );
  }
}
