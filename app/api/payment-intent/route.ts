import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

const getStripeClient = () => {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    });
  }
  return stripeClient;
};

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { amountUSD = 25, donorEmail } = body;

    if (!amountUSD || amountUSD < 1) {
      return NextResponse.json({ error: 'Minimum amount is $1' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountUSD * 100),
      currency: 'usd',
      receipt_email: donorEmail || undefined,
      description: 'Sufi Kalam Sponsorship — SufiPulse',
      metadata: {
        source: 'sufipulse_support_page',
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('PaymentIntent error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
