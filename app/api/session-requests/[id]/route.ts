import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { notifySubmitterStatusChange } from '@/lib/send-notification';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = entityGetById('session-requests', id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = entityUpdate('session-requests', id, {
      ...body,
      reviewed_at: new Date().toISOString(),
    });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const status = body.status;
    if (status === 'approved' || status === 'scheduled' || status === 'rejected') {
      const item = updated as any;
      if (item.email) {
        notifySubmitterStatusChange({
          to: item.email,
          name: item.requester_name || item.contact_name || item.email,
          type: 'studio session request',
          status,
          adminNote: body.admin_note,
        }).catch(() => {});
      }
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
