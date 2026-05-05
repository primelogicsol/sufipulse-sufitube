import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    const existing = cmsServerStorage.getLyricsRequest(id);
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['pending', 'reviewed', 'fulfilled', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    };

    cmsServerStorage.saveLyricsRequest(updated);

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    const deleted = cmsServerStorage.deleteLyricsRequest(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
