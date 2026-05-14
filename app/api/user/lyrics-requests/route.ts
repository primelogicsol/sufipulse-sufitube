import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getAuthUser } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all requests and filter by user email or user ID
    // We check both to handle cases where user might have requested before/after logging in
    const allRequests = cmsServerStorage.getAllLyricsRequests();
    const userRequests = allRequests.filter(r => 
      (r.userId === user.id) || 
      (user.email && r.requesterEmail === user.email)
    );

    return NextResponse.json(userRequests);
  } catch (error: any) {
    console.error('[API /api/user/lyrics-requests] ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}
