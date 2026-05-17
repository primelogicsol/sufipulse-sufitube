import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { sendProducerStatusUpdateEmail } from '@/app/lib/email';
import { requireAdmin } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';
import { auditLog } from '@/app/lib/audit-log';

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
    
    // Status normalization
    const status = body.profile_status || body.status;
    const adminNote = body.admin_notes || body.admin_note;

    const updated = entityUpdate('producers', id, { 
      profile_status: status,
      status: status,
      admin_notes: adminNote,
      reviewed_by: authResult.id,
      reviewed_at: new Date().toISOString() 
    } as any);

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const item = updated as any;

    // Post-update logic (Roles & Auditing)
    if (status === 'approved') {
      const applicantId = item.user_id ?? item.userId;
      let u = applicantId ? usersRepository.findById(applicantId) : null;
      if (!u && item.email) u = usersRepository.findByEmail(item.email);
      
      if (u) {
        const existingRoles = u.assigned_roles ?? [];
        usersRepository.setRoles(u.id, 'producer', [...new Set([...existingRoles, 'producer'])]);
        auditLog({ 
          userId: authResult.id, 
          userEmail: authResult.email, 
          action: 'role_assigned', 
          resourceType: 'user', 
          resourceId: u.id, 
          details: { role: 'producer', profileId: id, adminNote } 
        });
      }
    }

    auditLog({ 
      userId: authResult.id, 
      userEmail: authResult.email, 
      action: `profile_${status}`, 
      resourceType: 'producer', 
      resourceId: id, 
      details: { adminNote } 
    });

    // Send Status Email (Async)
    if (item.email) {
      (async () => {
        try {
          await sendProducerStatusUpdateEmail(item.email, status, {
            name: item.professional_name || item.full_name || 'Producer',
            referenceId: item.referenceId || item.id,
            adminNote: adminNote
          });
          console.log(`[Admin Workflow] Status email sent to: ${item.email} for status: ${status}`);
        } catch (err: any) {
          console.error(`[Admin Workflow] Email failure: ${err.message || err}`);
        }
      })();
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
