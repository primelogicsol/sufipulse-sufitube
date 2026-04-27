import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { notifySubmitterStatusChange } from '@/lib/send-notification';
import { requireAdmin } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';
import { auditLog } from '@/app/lib/audit-log';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('vocalists', id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = entityUpdate('vocalists', id, { ...body, reviewed_at: new Date().toISOString() });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const status = body.profile_status || body.status;
    if (status === 'approved' || status === 'rejected') {
      const item = updated as any;
      if (status === 'approved') {
        const applicantId = item.user_id ?? item.userId ?? item.submitter_id ?? item.created_by;
        let u = applicantId ? usersRepository.findById(applicantId) : null;
        if (!u && item.email) u = usersRepository.findByEmail(item.email);
        if (u) {
          const existingRoles = u.assigned_roles ?? [];
          usersRepository.setRoles(u.id, 'vocalist', [...new Set([...existingRoles, 'vocalist'])]);
          auditLog({ userId: authResult.id, userEmail: authResult.email, action: 'role_assigned', resourceType: 'user', resourceId: u.id, details: { role: 'vocalist', profileId: id, adminNote: body.admin_note } });
        }
      }
      auditLog({ userId: authResult.id, userEmail: authResult.email, action: status === 'approved' ? 'profile_approved' : 'profile_rejected', resourceType: 'vocalist', resourceId: id, details: { adminNote: body.admin_note } });
      if (item.email) {
        notifySubmitterStatusChange({
          to: item.email,
          name: item.performance_name || item.full_name || item.email,
          type: 'vocalist application',
          status,
          adminNote: body.admin_note,
        }).catch((err) => console.error('[notify]', err?.message || err));
      }
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
