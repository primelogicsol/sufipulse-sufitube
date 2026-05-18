import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { sendLiteraryStatusUpdateEmail } from '@/app/lib/email';
import { requireAdmin } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';
import { auditLog } from '@/app/lib/audit-log';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('literary', id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = entityUpdate('literary', id, { ...body, reviewed_at: new Date().toISOString() });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const item = updated as any;
    const status = body.profile_status || body.status;
    
    // Role activation logic
    if (status === 'approved_for_journal' || status === 'approved') {
      if (item.user_id) {
        const u = usersRepository.findById(item.user_id);
        if (u) {
          const existing = u.assigned_roles ?? [];
          usersRepository.setRoles(item.user_id, 'literary', [...new Set([...existing, 'literary'])]);
          auditLog({ 
            userId: authResult.id, 
            userEmail: authResult.email, 
            action: 'role_assigned', 
            resourceType: 'user', 
            resourceId: item.user_id, 
            details: { role: 'literary', profileId: id, adminNote: body.admin_note } 
          });
        }
      }
    }

    // Audit Logging
    auditLog({ 
      userId: authResult.id, 
      userEmail: authResult.email, 
      action: `profile_${status}` as any, 
      resourceType: 'literary', 
      resourceId: id, 
      details: { adminNote: body.admin_note } 
    });

    // Notify Submitter
    if (item.email) {
      sendLiteraryStatusUpdateEmail(item.email, status, {
        name: item.full_name || item.pen_name || 'Contributor',
        referenceId: item.referenceId || id,
        adminNote: body.admin_note,
      }).catch((err) => console.error('[notify]', err?.message || err));
    }
    
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('[Literary PATCH ERROR]:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
