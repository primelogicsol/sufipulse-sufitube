import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAuth } from '@/server/middleware/authenticate';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { writerProfileSchema } from '@/app/lib/validation-schemas';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  const validationResult = await validateRequestBody(request, writerProfileSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;

    const writers = (await import('@/lib/entity-storage-server')).entityGetAll<any>('writers');
    const existing = writers.find((w: any) => w.referenceId === id || w.id === id);

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
    const updated = entityUpdate('writers', existing.id, {
      ...body,
      profile_status: 'pending_review',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log(`[Writer Intake] Application revised: ${existing.id} | Ref: ${existing.referenceId}`);

    notifyAdminNewSubmission(
      'writer application revision',
      body.full_name || body.pen_name || body.email,
      body.pen_name || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
