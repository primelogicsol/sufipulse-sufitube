import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getAuthUser } from '@/server/middleware/authenticate';
import { sendLyricsRequestConfirmationEmail, sendLyricsRequestAdminNotificationEmail } from '@/app/lib/email';
import { type LyricsRequest } from '@/lib/cms-storage';

export const dynamic = 'force-dynamic';

// POST /api/lyrics-requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      releaseId, 
      slug, 
      songTitle, 
      language, 
      languageCode, 
      requesterEmail, 
      requesterName, 
      requestedMessage,
      sourceUrl 
    } = body;

    if (!songTitle || !language) {
      return NextResponse.json({ error: 'Song title and language are required' }, { status: 400 });
    }

    // Check for duplicate (same song, same language, same email in last 30 days)
    const allRequests = cmsServerStorage.getAllLyricsRequests();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const isDuplicate = allRequests.some(r => 
      (r.releaseId === releaseId || r.releaseSlug === slug) && 
      r.languageName === language && 
      r.requesterEmail === requesterEmail &&
      new Date(r.createdAt) > thirtyDaysAgo
    );

    if (isDuplicate) {
      return NextResponse.json({ 
        success: true,
        saved: true,
        message: `You have already submitted a request for ${language} translation for this song. We will notify you when it is ready.` 
      }, { status: 200 }); // Return 200 but indicate it was already saved
    }

    const user = await getAuthUser(request);

    const newRequest: LyricsRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      releaseId,
      releaseSlug: slug,
      releaseTitle: songTitle,
      languageCode,
      languageName: language,
      requestType: 'lyrics_translation',
      requesterName: requesterName || user?.name || '',
      requesterEmail: requesterEmail || user?.email || '',
      userId: user?.id,
      status: 'pending',
      priority: 'normal',
      requestedMessage: requestedMessage || '',
      sentToUser: false,
      publishedToRelease: false,
      sourceUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = cmsServerStorage.saveLyricsRequest(newRequest);

    // --- Send Email Notifications ---
    let emailSent = false;
    try {
      if (newRequest.requesterEmail) {
        await sendLyricsRequestConfirmationEmail(newRequest.requesterEmail, {
          songTitle: newRequest.releaseTitle,
          language: newRequest.languageName,
          name: newRequest.requesterName
        });
        emailSent = true;
      }

      const adminEmail = process.env.ADMIN_EMAIL || 'fk.envcal@gmail.com';
      await sendLyricsRequestAdminNotificationEmail(adminEmail, {
        songTitle: newRequest.releaseTitle,
        language: newRequest.languageName,
        requesterName: newRequest.requesterName,
        requesterEmail: newRequest.requesterEmail,
        note: newRequest.requestedMessage
      });
    } catch (emailError) {
      console.error('[Lyrics Request Email Error]', emailError);
    }

    return NextResponse.json({ 
      success: true, 
      saved: true,
      emailSent,
      requestId: saved.id,
      language: saved.languageName,
      status: saved.status,
      message: emailSent 
        ? `Thank you. Your lyrics request for ${language} has been received and a confirmation email has been sent.`
        : `Thank you. Your lyrics request for ${language} has been received.`
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API /api/lyrics-requests] ERROR:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
