import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate, entityDelete } from '@/lib/entity-storage-server';
import { notifySubmitterStatusChange } from '@/lib/send-notification';
import { requireAuth } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('sadas', id) as any;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (authResult.role !== 'admin' && item.user_id !== authResult.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const existing = entityGetById('sadas', id) as any;
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isAdmin = authResult.role === 'admin';

    if (!isAdmin) {
      if (existing.user_id !== authResult.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (existing.status !== 'revision_requested') {
        return NextResponse.json({ error: 'Can only resubmit items in revision_requested status' }, { status: 403 });
      }
      const updated = entityUpdate('sadas', id, {
        title: body.title ?? existing.title,
        language: body.language ?? existing.language,
        link: body.link ?? existing.link,
        lyrics: body.lyrics ?? existing.lyrics,
        status: 'submitted',
        revision_notes: null,
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json(updated);
    }

    const note = body.admin_note;
    const revisionLog = body.status === 'revision_requested' && note
      ? [...(existing.revision_log || []), { note, requestedAt: new Date().toISOString(), requestedBy: authResult.email }]
      : (existing.revision_log || []);

    const updated = entityUpdate('sadas', id, { ...body, reviewed_at: new Date().toISOString(), revision_log: revisionLog });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const status = body.status;
    if (status === 'approved' || status === 'published' || status === 'rejected' || status === 'revision_requested') {
      const item = updated as any;
      if (item.email) {
        notifySubmitterStatusChange({
          to: item.email,
          name: item.vocalist_name || item.author_name || item.email,
          type: 'sada submission',
          status,
          adminNote: note,
        }).catch((err) => console.error('[notify]', err?.message || err));
      }
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('sadas', id) as any;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (authResult.role !== 'admin' && item.user_id !== authResult.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  entityDelete('sadas', id);
  return NextResponse.json({ success: true });
}
