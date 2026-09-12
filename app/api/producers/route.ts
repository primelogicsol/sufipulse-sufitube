import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAuth } from '@/server/middleware/authenticate';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { producerProfileSchema } from '@/app/lib/validation-schemas';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  
  try {
    const rawProducers = entityGetAll('producers') || [];
    const rawWriters = entityGetAll('writers') || [];
    
    const internalNaghma = rawWriters
      .filter((w: any) => 
        w.roles && 
        (w.roles.includes('Composer') || w.roles.includes('Music Director') || w.roles.includes('Producer'))
      )
      .map((w: any) => ({
        id: w.id,
        user_id: w.reviewed_by || 'internal',
        full_name: w.public_name,
        professional_name: w.pen_name || w.public_credit,
        country: w.country || 'USA',
        city: 'Internal',
        email: 'internal@sufipulse.com',
        years_experience: 'Internal',
        primary_production_focus: w.roles.filter((r: string) => ['Composer', 'Music Director', 'Producer'].includes(r)),
        additional_roles: w.roles.filter((r: string) => !['Composer', 'Music Director', 'Producer'].includes(r)),
        primary_tools: 'SufiPulse Studio',
        musical_background: w.conceptual_orientation || '',
        portfolio_link: 'Internal Contributor',
        worked_structured_production: true,
        acknowledge_centralized_control: true,
        accept_framework: true,
        profile_status: 'approved',
        status_label: 'Approved / Internal Contributor',
        affiliation: w.affiliation || 'SufiPulse Studio USA',
        workflow: 'Internal Institutional Workflow',
        created_at: w.created_at,
        submitted_at: w.submitted_at || w.created_at,
        updated_at: w.updated_at,
        is_internal_mapped: true
      }));

    const items = [...rawProducers, ...internalNaghma];

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
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const validationResult = await validateRequestBody(request, producerProfileSchema);
  if (validationResult instanceof NextResponse) return validationResult;

  try {
    const body = validationResult.data;
    const record = entityCreate('producers', {
      ...body,
      user_id: authResult.id,
      email: body.email || authResult.email,
      profile_status: (body as any).profile_status || 'pending',
      submitted_at: new Date().toISOString(),
    });
    notifyAdminNewSubmission(
      'producer application',
      body.full_name || body.professional_name || body.email,
      body.professional_name || '—'
    ).catch((err) => console.error('[notify]', err?.message || err));
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
