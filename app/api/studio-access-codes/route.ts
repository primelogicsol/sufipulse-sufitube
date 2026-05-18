import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAdmin } from '@/server/middleware/authenticate';
import { studioAccessCodeRequestSchema } from '@/app/lib/validation-schemas';
import { validatePublicSubmission } from '@/app/lib/security';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('studio-access-codes');
    return NextResponse.json(
      items.sort((a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, studioAccessCodeRequestSchema, {
    rateLimit: 'standard',
    sanitizationRules: {
      name: 'text',
      email: 'email',
      profile_reference: 'text',
      reason: 'text'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    const record = entityCreate('studio-access-codes', {
      ...body,
      status: 'pending',
      issued_code: null,
      issued_at: null,
    });
    
    notifyAdminNewSubmission(
      'studio access code request',
      body.name || body.email,
      body.role || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
