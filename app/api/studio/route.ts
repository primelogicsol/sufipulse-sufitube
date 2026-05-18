import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate, entityUpdate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { sendStudioSubmissionConfirmationEmail } from '@/app/lib/email';
import { requireAuth } from '@/server/middleware/authenticate';
import { studioProfileSchema } from '@/app/lib/validation-schemas';
import { validatePublicSubmission } from '@/app/lib/security';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('studio');
    const sorted = items.sort((a: any, b: any) =>
      new Date(b.submitted_at || b.created_at || 0).getTime() -
      new Date(a.submitted_at || a.created_at || 0).getTime()
    );
    const result = authResult.role === 'admin'
      ? sorted
      : sorted.filter((i: any) => i.user_id === authResult.id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, studioProfileSchema, {
    rateLimit: 'strict',
    sanitizationRules: {
      studio_name: 'text',
      email: 'email',
      phone: 'text',
      country: 'text',
      city: 'text',
      primary_contact_name: 'text',
      years_in_operation: 'text',
      previous_work_link: 'url',
      equipment_overview: 'text'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    // Create base record
    const record = entityCreate('studio', {
      ...body,
      profile_status: 'pending',
      submitted_at: new Date().toISOString(),
    });

    const referenceId = `SP-STD-${new Date().getFullYear()}-${record.id.split('_')[1].slice(0, 8).toUpperCase()}`;
    
    // Update with referenceId
    const finalRecord = entityUpdate('studio', record.id, { referenceId } as any);

    // Failsafe: Send confirmation email to studio
    (async () => {
      try {
        await sendStudioSubmissionConfirmationEmail(body.email, {
          name: body.studio_name || body.primary_contact_name || 'Studio Partner',
          referenceId: referenceId
        });
      } catch (emailErr: any) {
        console.error(`[Studio Intake] Email failure: ${emailErr.message || emailErr}`);
      }
    })();

    notifyAdminNewSubmission(
      'studio partner application',
      body.studio_name || body.primary_contact_name || body.email,
      body.studio_name || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json({ ...finalRecord, referenceId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
