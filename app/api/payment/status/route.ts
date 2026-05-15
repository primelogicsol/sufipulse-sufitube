import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payment/status
 * Returns Stripe configuration availability.
 */
export async function GET(request: NextRequest) {
  const isSecretSet = !!process.env.STRIPE_SECRET_KEY;
  const isPublicSet = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  return NextResponse.json({
    available: isSecretSet && isPublicSet,
    stripeEnabled: isSecretSet && isPublicSet,
    missing: [
      !isSecretSet && 'STRIPE_SECRET_KEY',
      !isPublicSet && 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ].filter(Boolean)
  });
}
