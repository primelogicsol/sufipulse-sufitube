import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const language = searchParams.get('language');
    const priority = searchParams.get('priority');
    const sentToUser = searchParams.get('sentToUser');
    const publishedToRelease = searchParams.get('publishedToRelease');
    const search = searchParams.get('search')?.toLowerCase();

    let requests = cmsServerStorage.getAllLyricsRequests();

    if (status && status !== 'all') {
      requests = requests.filter(r => r.status === status);
    }
    if (language && language !== 'all') {
      requests = requests.filter(r => r.languageCode === language || r.languageName === language);
    }
    if (priority && priority !== 'all') {
      requests = requests.filter(r => r.priority === priority);
    }
    if (sentToUser !== null) {
      const val = sentToUser === 'true';
      requests = requests.filter(r => r.sentToUser === val);
    }
    if (publishedToRelease !== null) {
      const val = publishedToRelease === 'true';
      requests = requests.filter(r => r.publishedToRelease === val);
    }
    if (search) {
      requests = requests.filter(r => 
        r.releaseTitle.toLowerCase().includes(search) || 
        r.requesterEmail?.toLowerCase().includes(search) ||
        r.requesterName?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('[API /api/admin/lyrics-requests] GET ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
