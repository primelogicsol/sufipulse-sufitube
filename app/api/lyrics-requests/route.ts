import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getAuthUser, requireAdmin } from '@/server/middleware/authenticate';
import { 
  sendLyricsRequestConfirmationEmail, 
  sendLyricsRequestAdminNotificationEmail,
  sendLyricsTranslationPublishedEmail 
} from '@/app/lib/email';
import { type LyricsRequest } from '@/lib/cms-storage';
import { validatePublicSubmission } from '@/app/lib/security';
import { lyricsRequestSchema } from '@/app/lib/validation-schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lyrics-requests
 * Admin only: Get all lyrics requests
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const requests = cmsServerStorage.getAllLyricsRequests();
    return NextResponse.json(requests);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST /api/lyrics-requests
 * Public: Submit a new lyrics request
 */
export async function POST(request: NextRequest) {
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
    const { 
      releaseId, 
      releaseSlug, 
      releaseTitle, 
      youtubeId,
      languageName, 
      languageCode, 
      requesterEmail, 
      requesterName, 
      note,
      notifyWhenPublished = true,
      sourceUrl 
    } = body as any;

    if (!releaseTitle || !languageName || !requesterEmail) {
      return NextResponse.json({ error: 'Release title, target language, and email are required' }, { status: 400 });
    }

    // Check for duplicate (same release, same language, same email in last 30 days)
    const allRequests = cmsServerStorage.getAllLyricsRequests();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const isDuplicate = allRequests.some(r => 
      (r.releaseId === releaseId || r.releaseSlug === releaseSlug || (youtubeId && r.youtubeId === youtubeId)) && 
      (r.languageName === languageName || r.languageCode === languageCode) && 
      r.requesterEmail?.toLowerCase() === requesterEmail.toLowerCase() &&
      new Date(r.createdAt) > thirtyDaysAgo
    );

    if (isDuplicate) {
      return NextResponse.json({ 
        success: true,
        saved: true,
        message: `You have already submitted a request for ${languageName} translation for this song. We will notify you when it is ready.` 
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
      languageName,
      requestType: 'lyrics_translation',
      requesterName: requesterName || user?.full_name || '',
      requesterEmail: requesterEmail.toLowerCase() || user?.email || '',
      userId: user?.id,
      status: 'submitted',
      priority: 'normal',
      requestedMessage: note || '',
      notifyWhenPublished: !!notifyWhenPublished,
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
      ? `Translation request received. We’ll notify you when ${languageName} lyrics are published.`
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

/**
 * PATCH /api/lyrics-requests
 * Admin only: Update a lyrics request
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id, ...patch } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const existing = cmsServerStorage.getLyricsRequest(id);
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    // --- INTEGRATION LOGIC: IF MARKED AS PUBLISHED ---
    if (patch.status === 'published' && existing.status !== 'published') {
      const lyrics = patch.translatedLyrics || existing.translatedLyrics;
      const languageCode = existing.languageCode || 'en';
      
      if (!lyrics) {
        return NextResponse.json({ error: 'No translated lyrics available to publish' }, { status: 400 });
      }

      const release = cmsServerStorage.getRelease(existing.releaseId);
      if (release) {
        const updatedRelease = { ...release };
        const lines = lyrics.split('\n').map((l: string) => l.trim()).filter(Boolean);

        if (release.lyricsStructure) {
          updatedRelease.lyricsStructure = {
            ...(release.lyricsStructure || {}),
            [languageCode]: [{
              id: `block_${Date.now()}`,
              type: 'other' as const,
              heading: 'Requested Translation',
              lines: lines,
              order: 1,
              isPublished: true
            }]
          };
        } else {
          updatedRelease.lyrics = {
            ...(release.lyrics || {}),
            [languageCode]: [{
              urdu: '',
              transliteration: '',
              translation: lyrics,
              timestamp: '00:00.00'
            }]
          };
        }

        if (!updatedRelease.availableLanguages.includes(languageCode)) {
          updatedRelease.availableLanguages = [...updatedRelease.availableLanguages, languageCode];
        }

        cmsServerStorage.saveRelease(updatedRelease);

        try {
          revalidatePath('/');
          revalidatePath('/releases');
          revalidatePath(`/release-detail/${release.slug}`);
        } catch (revalErr) {
          console.warn('[PATCH /api/lyrics-requests] Revalidation failed', revalErr);
        }
      }
    }

    const updated = cmsServerStorage.saveLyricsRequest({
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString()
    });

    // --- NOTIFICATION LOGIC ---
    if (patch.status === 'published' && existing.status !== 'published' && existing.notifyWhenPublished && existing.requesterEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      sendLyricsTranslationPublishedEmail(existing.requesterEmail, {
        songTitle: existing.releaseTitle,
        language: existing.languageName,
        name: existing.requesterName,
        releaseUrl: `${appUrl}/release-detail/${existing.releaseSlug}`
      }).catch(err => console.error('[Email Notification Error]', err));
      
      // Update notification status
      cmsServerStorage.saveLyricsRequest({
        ...updated,
        notificationSentAt: new Date().toISOString()
      });
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
