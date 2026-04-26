import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAdmin } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('studio');
    return NextResponse.json(
      items.sort((a: any, b: any) =>
        new Date(b.submitted_at || b.created_at || 0).getTime() -
        new Date(a.submitted_at || a.created_at || 0).getTime()
      )
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.email) return NextResponse.json({ error: 'email is required' }, { status: 400 });
    const record = entityCreate('studio', {
      ...body,
      profile_status: body.profile_status || 'pending',
      submitted_at: new Date().toISOString(),
    });
    notifyAdminNewSubmission(
      'studio partner application',
      body.studio_name || body.primary_contact_name || body.email,
      body.studio_name || '—'
    ).catch(() => {});
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
