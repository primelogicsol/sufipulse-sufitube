import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAdmin } from '@/server/middleware/authenticate';
import { partnershipSchema } from '@/app/lib/validation-schemas';
import { validatePublicSubmission } from '@/app/lib/security';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('partnerships');
    const sorted = items.sort(
      (a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    return NextResponse.json(sorted);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, partnershipSchema, {
    rateLimit: 'standard',
    sanitizationRules: {
      organization_name: 'text',
      contact_name: 'text',
      email: 'email',
      phone: 'text',
      website: 'url',
      partnership_type: 'text',
      proposal_details: 'text'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    const record = entityCreate('partnerships', {
      ...body,
      status: 'pending',
    });

    notifyAdminNewSubmission('partnership proposal', body.contact_name, body.organization_name).catch((err) => console.error('[notify]', err?.message || err));

    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
