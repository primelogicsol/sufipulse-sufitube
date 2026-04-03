import { NextRequest, NextResponse } from 'next/server';
import { getAdoptionPaymentRecord, upsertAdoptionPaymentRecord } from '@/app/lib/server/adoption-payment-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await getAdoptionPaymentRecord(id);

  return NextResponse.json({
    adoption_id: id,
    payment_record: record,
  });
}

// Internal-only route — called by the Stripe webhook to update adoption payment status.
// Protected by x-webhook-secret header matching STRIPE_WEBHOOK_SECRET.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const secret = request.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const record = await upsertAdoptionPaymentRecord(id, {
    paymentStatus: body?.payment_status,
    adoptionStatus: body?.adoption_status,
    amountPaid: body?.amount_paid,
    stripeSessionId: body?.stripe_session_id,
    lastEventType: body?.event_type,
  });

  // In the standalone localStorage app the webhook runs server-side and cannot
  // write to the browser's localStorage. We store a server-side pending update
  // that the client polls on the success page to confirm payment.
  //
  // In a Supabase/PostgreSQL backend you would do:
  //   await supabase.from('song_adoptions').update(body).eq('id', id)
  //
  // For now we return the update payload so the success page can apply it.
  return NextResponse.json({
    adoption_id: id,
    update: body,
    payment_record: record,
    message: 'Payment update recorded on server store. Client should sync local state.',
  });
}
