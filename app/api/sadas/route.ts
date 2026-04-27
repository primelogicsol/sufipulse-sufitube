import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAdmin, requireAuth } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('sadas');
    return NextResponse.json(
      items.sort((a: any, b: any) =>
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
      )
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    const record = entityCreate('sadas', {
      ...body,
      user_id: authResult.id,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });
    notifyAdminNewSubmission(
      'sada submission',
      body.vocalist_name || body.author_name || body.user_id || 'Unknown vocalist',
      body.title
    ).catch((err) => console.error('[notify]', err?.message || err));
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
