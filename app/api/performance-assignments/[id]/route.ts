import { NextRequest, NextResponse } from 'next/server';
import { entityGetById, entityUpdate } from '@/lib/entity-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const item = entityGetById('performance-assignments', id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = entityUpdate('performance-assignments', id, {
      ...body,
      updated_at: new Date().toISOString(),
    });
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
