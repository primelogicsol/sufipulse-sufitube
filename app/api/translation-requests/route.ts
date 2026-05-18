import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { sendLyricsTranslationPublishedEmail } from '@/app/lib/email';

export const dynamic = 'force-dynamic';

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
          console.warn('[PATCH /api/translation-requests] Revalidation failed', revalErr);
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
