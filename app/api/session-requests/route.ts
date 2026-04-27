import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAuth } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('session-requests');
    const sorted = items.sort((a: any, b: any) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    // Admin gets all; user gets only their own
    const result = authResult.role === 'admin'
      ? sorted
      : sorted.filter((i: any) => i.user_id === authResult.id);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.email && !body.requester_name) {
      return NextResponse.json({ error: 'email or requester_name is required' }, { status: 400 });
    }
    const record = entityCreate('session-requests', {
      ...body,
      status: body.status || 'pending',
    });
    notifyAdminNewSubmission(
      'studio session request',
      body.requester_name || body.contact_name || body.email,
      body.session_type || 'â€”'
    ).catch((err) => console.error('[notify]', err?.message || err));
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
