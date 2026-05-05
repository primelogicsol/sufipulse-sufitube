import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getAuthUser } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: releaseIdOrSlug } = await params;

  try {
    const release = cmsServerStorage.getRelease(releaseIdOrSlug) || cmsServerStorage.getReleaseBySlug(releaseIdOrSlug);
    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const body = await request.json();
    const { languageCode, languageName, requesterName, requesterEmail, note, notifyWhenPublished } = body;

    if (!languageCode || !languageName) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }

    if (notifyWhenPublished && !requesterEmail) {
      return NextResponse.json({ error: 'Email is required for notifications' }, { status: 400 });
    }

    // Check for duplicate
    const allRequests = cmsServerStorage.getAllLyricsRequests();
    const isDuplicate = allRequests.some(r => 
      r.releaseId === release.id && 
      r.languageCode === languageCode && 
      ((requesterEmail && r.requesterEmail === requesterEmail) || (!requesterEmail && r.requesterName === requesterName))
    );

    if (isDuplicate) {
      return NextResponse.json({ 
        message: 'You have already submitted a request for this translation. We will notify you when it is published.' 
      }, { status: 409 });
    }

    const user = await getAuthUser(request);

    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      releaseId: release.id,
      releaseSlug: release.slug,
      releaseTitle: release.title,
      languageCode,
      languageName,
      requesterName: requesterName || user?.name || '',
      requesterEmail: requesterEmail || user?.email || '',
      note: note || '',
      notifyWhenPublished: !!notifyWhenPublished,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id
    };

    const saved = cmsServerStorage.saveLyricsRequest(newRequest);

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you. Your lyrics request has been received.',
      request: saved 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error saving lyrics request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
