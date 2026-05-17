import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAdmin, requireAuth } from '@/server/middleware/authenticate';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { kalamSubmissionSchema } from '@/app/lib/validation-schemas';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('kalams');
    const sorted = items.sort((a: any, b: any) =>
      new Date(b.updated_at || b.created_at || 0).getTime() -
      new Date(a.updated_at || a.created_at || 0).getTime()
    );
    const result = authResult.role === 'admin'
      ? sorted
      : sorted.filter((i: any) => i.user_id === authResult.id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const validationResult = await validateRequestBody(request, kalamSubmissionSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;
    const record = entityCreate('kalams', {
      ...body,
      user_id: authResult.id,
      email: authResult.email,
      full_name: authResult.full_name || 'Writer',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });

    const referenceId = `SP-KLM-${new Date().getFullYear()}-${record.id.split('_')[1].slice(0, 8).toUpperCase()}`;
    const finalRecord = entityUpdate('kalams', record.id, { referenceId }); // Store as referenceId

    console.log(`[Kalam Submission] Saved: ${record.id} | Ref: ${referenceId}`);

    notifyAdminNewSubmission(
      'kalam submission',
      authResult.full_name || authResult.email,
      body.title
    ).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json(finalRecord || { ...record, referenceId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
