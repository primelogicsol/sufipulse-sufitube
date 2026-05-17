import { NextRequest, NextResponse } from 'next/server';
import { entityCreate, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { sendVocalistSubmissionConfirmationEmail } from '@/app/lib/email';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { vocalistProfileSchema } from '@/app/lib/validation-schemas';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  const validationResult = await validateRequestBody(request, vocalistProfileSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;
    const trackingToken = crypto.randomBytes(32).toString('hex');
    
    // Create base record
    const record = entityCreate('vocalists', {
      ...body,
      email: body.email, // Use provided email for public intake
      profile_status: 'pending_review',
      status: 'pending_review',
      submitted_at: new Date().toISOString(),
      trackingToken: trackingToken,
    });

    const referenceId = `SP-VOC-${new Date().getFullYear()}-${record.id.split('_')[1].slice(0, 8).toUpperCase()}`;
    
    // Update with referenceId
    const finalRecord = entityUpdate('vocalists', record.id, { referenceId } as any);

    console.log(`[Vocalist Intake] Application saved: ${record.id} | Ref: ${referenceId}`);

    // Failsafe: Send confirmation email to vocalist
    (async () => {
      try {
        console.log(`[Vocalist Intake] Confirmation email queued for: ${body.email}`);
        await sendVocalistSubmissionConfirmationEmail(body.email, {
          name: body.performance_name || body.full_name || 'Vocalist',
          referenceId: referenceId,
          trackingToken: trackingToken
        });
        console.log(`[Vocalist Intake] Confirmation email sent successfully`);
      } catch (emailErr: any) {
        console.error(`[Vocalist Intake] Email failure: ${emailErr.message || emailErr}`);
      }
    })();

    notifyAdminNewSubmission(
      'vocalist application',
      body.performance_name || body.full_name || body.email,
      body.performance_name || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json({ ...finalRecord, referenceId, trackingToken }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
