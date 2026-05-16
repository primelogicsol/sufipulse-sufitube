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
      releaseSlug, 
      releaseTitle, 
      youtubeId,
      targetLanguage, 
      languageCode, 
      requesterEmail, 
      requesterName, 
      reason,
      notifyWhenPublished = true,
      source = 'public_release_detail',
      sourceUrl 
    } = body;

    if (!releaseTitle || !targetLanguage || !requesterEmail) {
      return NextResponse.json({ error: 'Release title, target language, and email are required' }, { status: 400 });
    }

    // Check for duplicate (same release, same language, same email in last 30 days)
    const allRequests = cmsServerStorage.getAllLyricsRequests();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const isDuplicate = allRequests.some(r => 
      (r.releaseId === releaseId || r.releaseSlug === releaseSlug || (youtubeId && r.youtubeId === youtubeId)) && 
      (r.languageName === targetLanguage || r.languageCode === languageCode) && 
      r.requesterEmail?.toLowerCase() === requesterEmail.toLowerCase() &&
      new Date(r.createdAt) > thirtyDaysAgo
    );

    if (isDuplicate) {
      return NextResponse.json({ 
        success: true,
        saved: true,
        message: `You have already submitted a request for ${targetLanguage} translation for this song. We will notify you when it is ready.` 
      }, { status: 200 });
    }

    const user = await getAuthUser(request);

    const newRequest: LyricsRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      releaseId,
      releaseSlug,
      releaseTitle,
      youtubeId,
      languageCode,
      languageName: targetLanguage,
      requestType: 'lyrics_translation',
      requesterName: requesterName || user?.name || '',
      requesterEmail: requesterEmail.toLowerCase() || user?.email || '',
      userId: user?.id,
      status: 'pending',
      priority: 'normal',
      requestedMessage: reason || '',
      notifyWhenPublished,
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
      if (saved.requesterEmail) {
        await sendLyricsRequestConfirmationEmail(saved.requesterEmail, {
          songTitle: saved.releaseTitle,
          language: saved.languageName,
          name: saved.requesterName
        });
        emailSent = true;
      }

      const adminEmail = process.env.ADMIN_EMAIL || 'fk.envcal@gmail.com';
      await sendLyricsRequestAdminNotificationEmail(adminEmail, {
        songTitle: saved.releaseTitle,
        language: saved.languageName,
        requesterName: saved.requesterName,
        requesterEmail: saved.requesterEmail,
        note: saved.requestedMessage
      });
    } catch (emailError) {
      console.error('[Lyrics Request Email Error]', emailError);
    }

    const successMessage = notifyWhenPublished
      ? `Translation request received. We’ll notify you when ${targetLanguage} lyrics are published.`
      : `Translation request received. Thank you for your feedback.`;

    return NextResponse.json({ 
      success: true, 
      saved: true,
      emailSent,
      requestId: saved.id,
      language: saved.languageName,
      status: saved.status,
      message: successMessage
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API /api/lyrics-requests] ERROR:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
