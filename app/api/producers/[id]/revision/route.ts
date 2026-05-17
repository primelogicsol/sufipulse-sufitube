import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAuth } from '@/server/middleware/authenticate';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { producerProfileSchema } from '@/app/lib/validation-schemas';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  const validationResult = await validateRequestBody(request, producerProfileSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;

    const producers = (await import('@/lib/entity-storage-server')).entityGetAll<any>('producers');
    const existing = producers.find((p: any) => p.referenceId === id || p.id === id);

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Security check: must be owner (auth) OR provide correct trackingToken
    const isOwner = !(authResult instanceof NextResponse) && existing.user_id === authResult.id;
    const isTokenMatch = token && existing.trackingToken === token;
    const isAdmin = !(authResult instanceof NextResponse) && authResult.role === 'admin';

    if (!isOwner && !isTokenMatch && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Valid tracking token or authentication required' }, { status: 403 });
    }

    // Update with new data and reset status to pending_review
    const updated = entityUpdate('producers', existing.id, {
      ...body,
      profile_status: 'pending_review',
      status: 'pending_review',
      updated_at: new Date().toISOString(),
    });

    notifyAdminNewSubmission(
      'producer profile revision',
      body.professional_name || body.full_name || body.email,
      body.professional_name || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
