import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';

export async function GET() {
  try {
    const items = entityGetAll('sadas');
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
  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    const record = entityCreate('sadas', {
      ...body,
      status: body.status || 'pending',
      submitted_at: new Date().toISOString(),
    });
    notifyAdminNewSubmission(
      'sada submission',
      body.vocalist_name || body.author_name || body.user_id || 'Unknown vocalist',
      body.title
    ).catch(() => {});
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
