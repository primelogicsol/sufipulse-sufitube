import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { notifySubmitterStatusChange } from '@/lib/send-notification';
import { requireAdmin } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('producers', id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = entityUpdate('producers', id, { ...body, reviewed_at: new Date().toISOString() });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const status = body.profile_status || body.status;
    if (status === 'approved' || status === 'rejected') {
      const item = updated as any;
      if (status === 'approved' && item.user_id) {
        const u = usersRepository.findById(item.user_id);
        if (u) {
          const existing = u.assigned_roles ?? [];
          usersRepository.setRoles(item.user_id, 'producer', [...new Set([...existing, 'producer'])]);
        }
      }
      if (item.email) {
        notifySubmitterStatusChange({
          to: item.email,
          name: item.professional_name || item.full_name || item.email,
          type: 'producer application',
          status,
          adminNote: body.admin_note,
        }).catch(() => {});
      }
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
