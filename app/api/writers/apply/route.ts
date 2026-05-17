import { NextRequest, NextResponse } from 'next/server';
import { entityCreate, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { sendWriterSubmissionConfirmationEmail } from '@/app/lib/email';
import { requireAuth } from '@/server/middleware/authenticate';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { writerProfileSchema } from '@/app/lib/validation-schemas';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  const validationResult = await validateRequestBody(request, writerProfileSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;
    const trackingToken = crypto.randomBytes(32).toString('hex');
    
    // Create base record
    const record = entityCreate('writers', {
      ...body,
      email: body.email, // Use provided email for public intake
      profile_status: 'pending_review',
      submitted_at: new Date().toISOString(),
      trackingToken: trackingToken,
    });

    const referenceId = `SP-WRT-${new Date().getFullYear()}-${record.id.split('_')[1].slice(0, 8).toUpperCase()}`;
    
    // Update with referenceId
    const finalRecord = entityUpdate('writers', record.id, { referenceId } as any);

    console.log(`[Writer Intake] Application saved: ${record.id} | Ref: ${referenceId}`);

    // Failsafe: Send confirmation email to writer
    (async () => {
      try {
        console.log(`[Writer Intake] Confirmation email queued for: ${body.email}`);
        await sendWriterSubmissionConfirmationEmail(body.email, {
          name: body.full_name || body.pen_name || 'Writer',
          referenceId: referenceId,
          trackingToken: trackingToken
        });
        console.log(`[Writer Intake] Confirmation email sent successfully`);
      } catch (emailErr: any) {
        console.error(`[Writer Intake] Email failure: ${emailErr.message || emailErr}`);
      }
    })();

    notifyAdminNewSubmission(
      'writer application',
      body.full_name || body.pen_name || body.email,
      body.pen_name || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json({ ...finalRecord, referenceId, trackingToken }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
