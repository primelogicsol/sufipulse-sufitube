import { NextRequest, NextResponse } from 'next/server';
import { cmsStorage } from '@/lib/cms-storage';

export const dynamic = 'force-dynamic';

// GET /api/releases/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const release = cmsStorage.getRelease(id);
    if (!release) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(release);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/releases/[id] (update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const existing = cmsStorage.getRelease(id);

    if (!existing) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const updated = cmsStorage.saveRelease({
      ...existing,
      ...body,
      id, // Don't allow ID change
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/releases/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const deleted = cmsStorage.deleteRelease(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
