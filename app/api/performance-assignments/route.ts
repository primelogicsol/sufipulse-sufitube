import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { requireAuth, requireAdmin } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('performance-assignments');
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
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    if (!body.release_title && !body.release_id) {
      return NextResponse.json({ error: 'release_title or release_id is required' }, { status: 400 });
    }
    const record = entityCreate('performance-assignments', {
      ...body,
      status: body.status || 'pending',
    });
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
