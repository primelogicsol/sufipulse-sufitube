import { NextRequest, NextResponse } from 'next/server';
import { entityCreate, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { sendLiterarySubmissionConfirmationEmail } from '@/app/lib/email';
import { literaryContributorProfileSchema } from '@/app/lib/validation-schemas';
import { validatePublicSubmission } from '@/app/lib/security';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, literaryContributorProfileSchema, {
    rateLimit: 'strict',
    sanitizationRules: {
      full_name: 'text',
      pen_name: 'text',
      email: 'email',
      country: 'text',
      city: 'text',
      years_experience: 'text',
      writing_sample_link: 'url',
      short_bio: 'text',
      publication_intent: 'text'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    const trackingToken = crypto.randomBytes(32).toString('hex');
    
    // Create base record
    const record = entityCreate('literary', {
      ...body,
      email: body.email, 
      profile_status: 'pending_review',
      submitted_at: new Date().toISOString(),
      trackingToken: trackingToken,
    });

    const referenceId = `SP-LIT-${new Date().getFullYear()}-${record.id.split('_')[1].slice(0, 8).toUpperCase()}`;
    
    // Update with referenceId
    const finalRecord = entityUpdate('literary', record.id, { referenceId } as any);

    // Failsafe: Send confirmation email
    (async () => {
      try {
        await sendLiterarySubmissionConfirmationEmail(body.email, {
          name: body.full_name || body.pen_name || 'Literary Contributor',
          referenceId: referenceId,
          trackingToken: trackingToken
        });
      } catch (emailErr: any) {
        console.error(`[Literary Intake] Email failure: ${emailErr.message || emailErr}`);
      }
    })();

    notifyAdminNewSubmission(
      'literary contributor application',
      body.full_name || body.pen_name || body.email,
      body.pen_name || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json({ ...finalRecord, referenceId, trackingToken }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
