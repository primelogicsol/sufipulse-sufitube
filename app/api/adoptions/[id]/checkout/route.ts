import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/server/middleware/authenticate';
import { getAdoptionRecord, updateAdoptionRecord } from '@/app/lib/server/adoption-store';
import { getAdoptionPaymentRecord, upsertAdoptionPaymentRecord } from '@/app/lib/server/adoption-payment-store';

let stripeClient: Stripe | null = null;
const getStripeClient = () => {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    });
  }
  return stripeClient;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthUser(request);
  if (!authResult) {
    return NextResponse.json(
      { error: 'Please sign in to continue payment.' },
      { status: 401 }
    );
  }

  const { id } = await params;

  const adoption = getAdoptionRecord(id);
  if (!adoption) {
    return NextResponse.json({ error: 'Adoption not found' }, { status: 404 });
  }

  // Only managed_sufitube uses SufiPulse Stripe checkout
  if (adoption.methodType === 'use_my_google_ads') {
    return NextResponse.json(
      { error: 'use_my_google_ads does not collect payment through SufiPulse. User pays Google directly.' },
      { status: 400 }
    );
  }

  // Enforce ownership
  const existing = await getAdoptionPaymentRecord(id);
  if (existing?.userId && existing.userId !== authResult!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { amountUSD, releaseTitle, sponsorName, sponsorEmail, packageName } = body;

    if (!amountUSD || amountUSD <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: sponsorEmail || adoption.sponsorEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amountUSD * 100),
            product_data: {
              name: packageName ? `Song Adoption – ${packageName}` : 'Song Adoption – Custom Budget',
              description: releaseTitle
                ? `Sponsor the spread of "${releaseTitle}" — managed by SufiPulse`
                : 'Sufi kalam sponsorship — managed by SufiPulse',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        adoption_id: id,
        method_type: 'managed_sufitube',
        sponsor_name: sponsorName || adoption.sponsorName || '',
      },
      success_url: `${appUrl}/adoption-success?adoption_id=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/adoption-cancel?adoption_id=${id}`,
    });

    // Update adoption record with pending payment
    updateAdoptionRecord(id, {
      paymentStatus: 'pending',
      paymentProvider: 'stripe',
      paymentRoute: 'stripe_sufipulse',
      amountDue: amountUSD,
      adoptionStatus: 'pending_review',
    });

    await upsertAdoptionPaymentRecord(id, { userId: authResult!.id, paymentStatus: 'pending' });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
