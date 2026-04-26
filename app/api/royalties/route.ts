import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';

export async function GET() {
  try {
    const items = entityGetAll('royalties');
    const sorted = (items as any[]).sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    return NextResponse.json(sorted);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.release_id || !body.stakeholder_type) {
      return NextResponse.json(
        { error: 'release_id and stakeholder_type are required.' },
        { status: 400 }
      );
    }
    const record = entityCreate('royalties', {
      ...body,
      payout_status: body.payout_status || 'pending',
    });
    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
