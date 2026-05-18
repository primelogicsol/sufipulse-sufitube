import { NextRequest, NextResponse } from 'next/server';
import { entityCreate, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { sendVocalistSubmissionConfirmationEmail } from '@/app/lib/email';
import { vocalistProfileSchema } from '@/app/lib/validation-schemas';
import { validatePublicSubmission } from '@/app/lib/security';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, vocalistProfileSchema, {
    rateLimit: 'strict',
    sanitizationRules: {
      full_name: 'text',
      performance_name: 'text',
      country: 'text',
      city: 'text',
      email: 'email',
      vocal_range: 'text',
      musical_training: 'text',
      sample_link: 'url'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    const trackingToken = crypto.randomBytes(32).toString('hex');
    
    // Create base record
    const record = entityCreate('vocalists', {
      ...body,
      email: body.email, 
      profile_status: 'pending_review',
      status: 'pending_review',
      submitted_at: new Date().toISOString(),
      trackingToken: trackingToken,
    });

    const referenceId = `SP-VOC-${new Date().getFullYear()}-${record.id.split('_')[1].slice(0, 8).toUpperCase()}`;
    
    // Update with referenceId
    const finalRecord = entityUpdate('vocalists', record.id, { referenceId } as any);

    // Failsafe: Send confirmation email to vocalist
    (async () => {
      try {
        await sendVocalistSubmissionConfirmationEmail(body.email, {
          name: body.performance_name || body.full_name || 'Vocalist',
          referenceId: referenceId,
          trackingToken: trackingToken
        });
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
