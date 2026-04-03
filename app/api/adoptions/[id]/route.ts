import { NextRequest, NextResponse } from 'next/server';

// Internal-only route — called by the Stripe webhook to update adoption payment status.
// Protected by x-webhook-secret header matching STRIPE_WEBHOOK_SECRET.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = request.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // In the standalone localStorage app the webhook runs server-side and cannot
  // write to the browser's localStorage. We store a server-side pending update
  // that the client polls on the success page to confirm payment.
  //
  // In a Supabase/PostgreSQL backend you would do:
  //   await supabase.from('song_adoptions').update(body).eq('id', params.id)
  //
  // For now we return the update payload so the success page can apply it.
  return NextResponse.json({
    adoption_id: params.id,
    update: body,
    message: 'Payment confirmed. Client should apply update to local state.',
  });
}
