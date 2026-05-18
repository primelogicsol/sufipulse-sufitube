import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getAuthUser } from '@/server/middleware/authenticate';
import { sendLyricsRequestConfirmationEmail, sendLyricsRequestAdminNotificationEmail } from '@/app/lib/email';
import { validatePublicSubmission } from '@/app/lib/security';
import { lyricsRequestSchema } from '@/app/lib/validation-schemas';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: releaseIdOrSlug } = await params;

  const validation = await validatePublicSubmission(request, lyricsRequestSchema, {
    rateLimit: 'standard',
    sanitizationRules: {
      requesterName: 'text',
      requesterEmail: 'email',
      note: 'text'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    const release = cmsServerStorage.getRelease(releaseIdOrSlug) || cmsServerStorage.getReleaseBySlug(releaseIdOrSlug);
    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const { languageCode, languageName, requesterName, requesterEmail, note, notifyWhenPublished } = body;

    // Check for duplicate
    const allRequests = cmsServerStorage.getAllLyricsRequests();
    const isDuplicate = allRequests.some(r => 
      r.releaseId === release.id && 
      r.languageCode === languageCode && 
      ((requesterEmail && r.requesterEmail === requesterEmail) || (!requesterEmail && r.requesterName === requesterName))
    );

    if (isDuplicate) {
      return NextResponse.json({ 
        message: `You have already submitted a request for ${languageName} translation. We will notify you when it is published.` 
      }, { status: 409 });
    }

    const user = await getAuthUser(request);

    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      releaseId: release.id,
      releaseSlug: release.slug,
      releaseTitle: release.title,
      youtubeId: release.youtubeId,
      languageCode,
      languageName,
      requestType: 'lyrics_translation' as const,
      requesterName: requesterName || user?.full_name || '',
      requesterEmail: requesterEmail || user?.email || '',
      userId: user?.id,
      status: 'submitted' as const,
      priority: 'normal' as const,
      requestedMessage: note || '',
      sentToUser: false,
      publishedToRelease: false,
      notifyWhenPublished: !!notifyWhenPublished,
      sourceUrl: request.headers.get('referer') || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = cmsServerStorage.saveLyricsRequest(newRequest);

    // --- Send Email Notifications ---
    let emailSent = false;
    let adminNotified = false;

    try {
      // 1. Send confirmation to requester
      if (newRequest.requesterEmail) {
        await sendLyricsRequestConfirmationEmail(newRequest.requesterEmail, {
          songTitle: release.title,
          language: languageName,
          name: newRequest.requesterName
        });
        emailSent = true;
      }

      // 2. Send notification to admin
      const adminEmail = process.env.ADMIN_EMAIL || 'fk.envcal@gmail.com';
      await sendLyricsRequestAdminNotificationEmail(adminEmail, {
        songTitle: release.title,
        language: languageName,
        requesterName: newRequest.requesterName,
        requesterEmail: newRequest.requesterEmail,
        note: newRequest.requestedMessage
      });
      adminNotified = true;

    } catch (emailError) {
      console.error('[Lyrics Request Email Error]', emailError);
    }

    return NextResponse.json({ 
      success: true, 
      message: emailSent 
        ? `Thank you. Your lyrics request for ${languageName} has been received and a confirmation email has been sent.`
        : `Thank you. Your lyrics request for ${languageName} has been received.`,
      request: saved,
      emailSent,
      adminNotified
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error saving lyrics request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
