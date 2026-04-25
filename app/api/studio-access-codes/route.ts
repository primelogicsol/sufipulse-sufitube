import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAdmin } from '@/server/middleware/authenticate';

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
  try {
    const body = await request.json();
    if (!body.email) return NextResponse.json({ error: 'email is required' }, { status: 400 });
    const record = entityCreate('studio-access-codes', {
      ...body,
      status: body.status || 'pending',
      issued_code: body.issued_code ?? null,
      issued_at: body.issued_at ?? null,
    });
    // Only notify admin for contributor-submitted requests, not admin-created codes
    if (!body._admin_created) {
      notifyAdminNewSubmission(
        'studio access code request',
        body.name || body.email,
        body.role || '—'
      ).catch(() => {});
    }
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
