import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

// Stripe requires the raw body to verify signatures — disable Next.js body parsing
export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
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

  // Handle the events we care about
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
      // Not an adoption payment — ignore
      return NextResponse.json({ received: true });
    }

    try {
      // Update the adoption record in localStorage via the internal update API
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await fetch(`${appUrl}/api/adoptions/${adoptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': process.env.STRIPE_WEBHOOK_SECRET! },
        body: JSON.stringify({
          payment_status: 'paid',
          amount_paid: amountPaid,
          stripe_session_id: stripeSessionId,
          adoption_status: 'pending_review',
        }),
      });
    } catch (err) {
      console.error('Failed to update adoption after Stripe payment:', err);
      // Still return 200 — Stripe will not retry if we return 200
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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await fetch(`${appUrl}/api/adoptions/${adoptionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-webhook-secret': process.env.STRIPE_WEBHOOK_SECRET! },
          body: JSON.stringify({ payment_status: 'failed' }),
        });
      } catch (err) {
        console.error('Failed to mark adoption payment as failed:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
