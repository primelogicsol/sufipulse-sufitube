import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { notifySubmitterStatusChange } from '@/lib/send-notification';
import { requireAdmin } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('articles', id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const existing = entityGetById('articles', id) as any;
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const note = body.admin_note;
    const revisionLog = body.status === 'revision_requested' && note
      ? [...(existing.revision_log || []), { note, requestedAt: new Date().toISOString(), requestedBy: authResult.email }]
      : (existing.revision_log || []);

    const updated = entityUpdate('articles', id, { ...body, reviewed_at: new Date().toISOString(), revision_log: revisionLog });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const status = body.status;
    if (status === 'approved' || status === 'published' || status === 'rejected' || status === 'revision_requested') {
      const item = updated as any;
      if (item.email) {
        notifySubmitterStatusChange({
          to: item.email,
          name: item.author_name || item.email,
          type: 'article submission',
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
