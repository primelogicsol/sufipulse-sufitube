import { NextRequest, NextResponse } from 'next/server';
import { entityCreate, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { sendWriterSubmissionConfirmationEmail } from '@/app/lib/email';
import { writerProfileSchema } from '@/app/lib/validation-schemas';
import { validatePublicSubmission } from '@/app/lib/security';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, writerProfileSchema, {
    rateLimit: 'strict',
    sanitizationRules: {
      full_name: 'text',
      pen_name: 'text',
      country: 'text',
      city: 'text',
      email: 'email',
      literary_background: 'text',
      thematic_focus: 'text',
      sample_kalam: 'text',
      previous_publications: 'text'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    const trackingToken = crypto.randomBytes(32).toString('hex');
    
    // Create base record
    const record = entityCreate('writers', {
      ...body,
      email: body.email, 
      profile_status: 'pending_review',
      submitted_at: new Date().toISOString(),
      trackingToken: trackingToken,
    });

    const referenceId = `SP-WRT-${new Date().getFullYear()}-${record.id.split('_')[1].slice(0, 8).toUpperCase()}`;
    
    // Update with referenceId
    const finalRecord = entityUpdate('writers', record.id, { referenceId } as any);

    // Failsafe: Send confirmation email to writer
    (async () => {
      try {
        await sendWriterSubmissionConfirmationEmail(body.email, {
          name: body.full_name || body.pen_name || 'Writer',
          referenceId: referenceId,
          trackingToken: trackingToken
        });
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
