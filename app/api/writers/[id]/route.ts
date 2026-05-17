import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { sendWriterStatusUpdateEmail } from '@/app/lib/email';
import { requireAdmin } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';
import { auditLog } from '@/app/lib/audit-log';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('writers', id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { profile_status, admin_note } = body;

    const existing = entityGetById('writers', id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = entityUpdate('writers', id, {
      profile_status,
      admin_notes: admin_note,
      reviewed_at: new Date().toISOString(),
      reviewed_by: authResult.id
    });

    if (!updated) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    const item = updated as any;

    // Handle role assignment on approval
    if (profile_status === 'approved' || profile_status === 'approved_as_writer') {
      if (item.user_id) {
        const u = usersRepository.findById(item.user_id);
        if (u) {
          const existingRoles = u.assigned_roles ?? [];
          usersRepository.setRoles(item.user_id, 'writer', [...new Set([...existingRoles, 'writer'])]);
          
          auditLog({ 
            userId: authResult.id, 
            userEmail: authResult.email, 
            action: 'role_assigned', 
            resourceType: 'user', 
            resourceId: item.user_id, 
            details: { role: 'writer', profileId: id, adminNote: admin_note } 
          });
        }
      }
    }

    // Logging & Audit
    auditLog({ 
      userId: authResult.id, 
      userEmail: authResult.email, 
      action: `profile_status_${profile_status}` as any, 
      resourceType: 'writer', 
      resourceId: id, 
      details: { adminNote: admin_note } 
    });

    // Send Status Email (Failsafe)
    const referenceId = item.referenceId || `SP-WRT-${new Date().getFullYear()}-${id.split('_')[1]?.slice(0, 8).toUpperCase() || 'REF'}`;
    
    (async () => {
      try {
        console.log(`[Admin Workflow] Sending status email to ${item.email} for status: ${profile_status}`);
        await sendWriterStatusUpdateEmail(item.email, profile_status, {
          name: item.pen_name || item.full_name || 'Writer',
          referenceId: referenceId,
          adminNote: admin_note
        });
        console.log(`[Admin Workflow] Status email sent successfully to ${item.email}`);
      } catch (err: any) {
        console.error(`[Admin Workflow] Email failure: ${err.message || err}`);
      }
    })();

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
