import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const requests = cmsServerStorage.getAllLyricsRequests();
    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
