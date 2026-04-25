import { NextResponse } from 'next/server';
import { entityGetAll } from '@/lib/entity-storage-server';

export async function GET() {
  try {
    const releases = entityGetAll('releases');
    const writers = entityGetAll('writers');
    const partnerships = entityGetAll('partnerships');

    return NextResponse.json({
      releases: Array.isArray(releases) ? releases.length : 0,
      writers: Array.isArray(writers) ? writers.length : 0,
      institutions: Array.isArray(partnerships) ? partnerships.length : 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
