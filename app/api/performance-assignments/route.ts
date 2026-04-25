import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';

export async function GET() {
  try {
    const items = entityGetAll('performance-assignments');
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
