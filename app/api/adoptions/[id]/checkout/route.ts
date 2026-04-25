import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/server/middleware/authenticate';

// Module-scoped Stripe instance — created once, reused across requests
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
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const stripe = getStripeClient();

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      amountUSD,
      releaseTitle,
      sponsorName,
      sponsorEmail,
      methodType,
      packageName,
    } = body;

    if (!amountUSD || amountUSD <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: sponsorEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amountUSD * 100), // cents
            product_data: {
              name: packageName
                ? `Song Adoption – ${packageName}`
                : 'Song Adoption – Custom Budget',
              description: releaseTitle
                ? `Sponsor the spread of "${releaseTitle}" via ${methodType === 'managed_sufitube' ? 'SufiTube Managed Promotion' : 'Your Google Ads Account'}`
                : 'Sufi kalam sponsorship',
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        adoption_id: id,
        sponsor_name: sponsorName || '',
        method_type: methodType || '',
      },
      success_url: `${appUrl}/adoption-success?adoption_id=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/adoption-cancel?adoption_id=${id}`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
