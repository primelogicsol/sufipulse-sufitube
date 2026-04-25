import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { requireAdmin, requireAuth } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('articles');
    return NextResponse.json(
      items.sort((a: any, b: any) =>
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime()
      )
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    const record = entityCreate('articles', {
      ...body,
      user_id: authResult.id,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    });
    notifyAdminNewSubmission(
      'article submission',
      authResult.full_name || authResult.email,
      body.title
    ).catch(() => {});
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
