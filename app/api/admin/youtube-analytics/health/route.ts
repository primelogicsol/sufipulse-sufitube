import { NextResponse } from 'next/server';
import { getYouTubeConnection } from '@/lib/youtube-connection';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authResult = await requireAdmin(request as any);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const yt = await getYouTubeConnection();
    const health = await yt.checkHealth();
    return NextResponse.json(health);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
