import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { sendWriterSubmissionConfirmationEmail } from '@/app/lib/email';
import { requireAuth } from '@/server/middleware/authenticate';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { writerProfileSchema } from '@/app/lib/validation-schemas';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('writers');
    const sorted = items.sort(
      (a: any, b: any) =>
        new Date(b.submitted_at || b.created_at || 0).getTime() -
        new Date(a.submitted_at || a.created_at || 0).getTime()
    );
    // Admin gets all records; authenticated user gets only their own
    const result = authResult.role === 'admin'
      ? sorted
      : sorted.filter((i: any) => i.user_id === authResult.id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const validationResult = await validateRequestBody(request, writerProfileSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;
    const record = entityCreate('writers', {
      ...body,
      user_id: authResult.id,
      email: body.email || authResult.email,
      profile_status: (body as any).profile_status || 'pending',
      submitted_at: new Date().toISOString(),
    });

    // Logging: [Writer Submission] Submission saved
    console.log(`[Writer Submission] Submission saved: ${record.id}`);

    const referenceId = `SP-WRT-${new Date().getFullYear()}-${record.id.split('_')[1].slice(0, 8).toUpperCase()}`;

    // Failsafe: Send confirmation email to writer
    (async () => {
      try {
        console.log(`[Writer Submission] Confirmation email queued for: ${body.email || authResult.email}`);
        await sendWriterSubmissionConfirmationEmail(body.email || authResult.email, {
          name: body.full_name || body.pen_name || authResult.full_name || 'Writer',
          referenceId: referenceId,
          trackingToken: record.id
        });
        console.log(`[Writer Submission] Confirmation email sent successfully to: ${body.email || authResult.email}`);
      } catch (emailErr: any) {
        console.error(`[Writer Submission] Email failure: ${emailErr.message || emailErr}`);
      }
    })();

    notifyAdminNewSubmission(
      'writer application',
      body.full_name || body.pen_name || body.email,
      body.pen_name || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));
    return NextResponse.json({ ...record, referenceId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
