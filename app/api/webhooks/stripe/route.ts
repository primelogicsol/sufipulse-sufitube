import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { applyWebhookEventIfNew } from '@/app/lib/server/adoption-payment-store';
import { getAdoptionRecord, updateAdoptionRecord } from '@/app/lib/server/adoption-store';

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
  });
};

// Stripe requires the raw body to verify signatures — disable Next.js body parsing
export const config = { api: { bodyParser: false } };

// Status ranks — a webhook must never move an adoption backward.
const STATUS_RANK: Record<string, number> = {
  draft: 0, pending_review: 1, admin_review: 2, approved: 3,
  campaign_prepared: 4, awaiting_user_approval: 4, scheduled: 5,
  live: 6, monitoring: 7, completed: 8, report_ready: 9,
};

function canAdvanceTo(currentStatus: string, targetStatus: string): boolean {
  const current = STATUS_RANK[currentStatus] ?? -1;
  const target = STATUS_RANK[targetStatus] ?? -1;
  return target > current;
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook not configured.' },
      { status: 503 }
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe webhook not configured.' },
      { status: 503 }
    );
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'payment_intent.succeeded'
  ) {
    let adoptionId: string | null = null;
    let stripeSessionId: string | null = null;
    let amountPaid = 0;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      adoptionId = session.metadata?.adoption_id || null;
      stripeSessionId = session.id;
      amountPaid = (session.amount_total || 0) / 100;
    }

    if (!adoptionId) {
      return NextResponse.json({ received: true });
    }

    // Determine safe target status — never downgrade beyond what already happened.
    const targetAdoptionStatus = 'admin_review';
    const current = getAdoptionRecord(adoptionId);
    const safeAdoptionStatus = current && !canAdvanceTo(current.adoptionStatus, targetAdoptionStatus)
      ? current.adoptionStatus   // already at admin_review or higher — preserve it
      : targetAdoptionStatus;

    try {
      await applyWebhookEventIfNew({
        eventId: event.id,
        adoptionId,
        paymentStatus: 'paid',
        adoptionStatus: safeAdoptionStatus,
        amountPaid,
        stripeSessionId: stripeSessionId || undefined,
        eventType: event.type,
      });

      // Sync main adoption store, preserving any status higher than admin_review.
      if (current) {
        updateAdoptionRecord(adoptionId, {
          paymentStatus: 'paid',
          amountPaid,
          ...(paymentReference(stripeSessionId)),
          ...(canAdvanceTo(current.adoptionStatus, targetAdoptionStatus)
            ? { adoptionStatus: targetAdoptionStatus }
            : {}),
        });
      }
    } catch (err) {
      console.error('Failed to persist adoption payment after Stripe payment:', err);
    }
  }

  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    let adoptionId: string | null = null;

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      adoptionId = session.metadata?.adoption_id || null;
    }

    if (adoptionId) {
      try {
        await applyWebhookEventIfNew({
          eventId: event.id,
          adoptionId,
          paymentStatus: 'failed',
          adoptionStatus: 'pending_review',
          eventType: event.type,
        });
      } catch (err) {
        console.error('Failed to persist adoption payment failure:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

function paymentReference(sessionId: string | null): Record<string, any> {
  if (!sessionId) return {};
  return { paymentReference: sessionId, paymentProvider: 'stripe' };
}
