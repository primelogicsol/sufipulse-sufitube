import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate, entityDelete } from '@/lib/entity-storage-server';
import { sendKalamStatusUpdateEmail } from '@/app/lib/email';
import { notifySubmitterStatusChange } from '@/lib/send-notification';
import { requireAdmin, requireAuth } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('kalams', id) as any;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ownerId = item.user_id ?? item.userId ?? item.submitter_id ?? item.created_by;
  if (authResult.role !== 'admin' && ownerId !== authResult.id && item.email !== authResult.email) {
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
    const existing = entityGetById('kalams', id) as any;
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isAdmin = authResult.role === 'admin';

    if (!isAdmin) {
      const ownerId = existing.user_id ?? existing.userId ?? existing.submitter_id ?? existing.created_by;
      const ownerMatches = ownerId === authResult.id || (!ownerId && existing.email === authResult.email);
      if (!ownerMatches) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (existing.status !== 'revision_requested') {
        return NextResponse.json({ error: 'Can only resubmit items in revision_requested status' }, { status: 403 });
      }
      const updated = entityUpdate('kalams', id, {
        content: body.content ?? existing.content,
        title: body.title ?? existing.title,
        language: body.language ?? existing.language,
        writing_style: body.writing_style ?? existing.writing_style,
        status: 'submitted',
        revision_notes: null,
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json(updated);
    }

    const note = body.revision_notes || body.admin_note;
    const revisionLog = body.status === 'revision_requested' && note
      ? [...(existing.revision_log || []), { note, requestedAt: new Date().toISOString(), requestedBy: authResult.email }]
      : (existing.revision_log || []);

    const updated = entityUpdate('kalams', id, { 
      ...body, 
      reviewed_at: new Date().toISOString(), 
      reviewed_by: isAdmin ? authResult.id : undefined,
      revision_log: revisionLog 
    });

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const item = updated as any;
    const status = body.status;

    // Send Status Email (Failsafe)
    if (isAdmin && status && status !== existing.status) {
      (async () => {
        try {
          console.log(`[Admin Workflow] Sending kalam status email to ${item.email} for status: ${status}`);
          await sendKalamStatusUpdateEmail(item.email, status, {
            name: item.full_name || 'Writer',
            title: item.title,
            referenceId: item.referenceId || id,
            adminNote: note
          });
          console.log(`[Admin Workflow] Kalam status email sent successfully to ${item.email}`);
        } catch (err: any) {
          console.error(`[Admin Workflow] Kalam email failure: ${err.message || err}`);
        }
      })();
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
  const item = entityGetById('kalams', id) as any;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const delOwnerId = item.user_id ?? item.userId ?? item.submitter_id ?? item.created_by;
  if (authResult.role !== 'admin' && delOwnerId !== authResult.id && item.email !== authResult.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  entityDelete('kalams', id);
  return NextResponse.json({ success: true });
}
