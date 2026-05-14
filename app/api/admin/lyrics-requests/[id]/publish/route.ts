import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  try {
    const existing = cmsServerStorage.getAllLyricsRequests().find(r => r.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const body = await request.json();
    const lyrics = body.translatedLyrics || existing.translatedLyrics;
    const targetReleaseId = body.releaseId || existing.releaseId;
    const languageCode = body.languageCode || existing.languageCode || 'en';

    if (!lyrics) {
      return NextResponse.json({ error: 'No translated lyrics available to publish' }, { status: 400 });
    }

    if (!targetReleaseId) {
      return NextResponse.json({ error: 'No target release ID associated with this request' }, { status: 400 });
    }

    const release = cmsServerStorage.getRelease(targetReleaseId);
    if (!release) {
      return NextResponse.json({ error: `Release not found: ${targetReleaseId}` }, { status: 404 });
    }

    // --- Senior Logic: Integration with Release Lyrics System ---
    // We prefer the modern lyricsStructure if available, otherwise fallback to legacy lyrics array.
    const now = new Date().toISOString();
    
    const updatedRelease = { ...release };
    
    // Split lyrics by double newlines into blocks
    const lines = lyrics.split('\n').map((l: string) => l.trim()).filter(Boolean);
    
    if (release.lyricsStructure) {
      // Add as a new language in lyricsStructure
      const newBlock = {
        id: `block_${Date.now()}`,
        type: 'other' as const,
        heading: 'Requested Translation',
        lines: lines,
        order: 1,
        isPublished: true
      };
      
      updatedRelease.lyricsStructure = {
        ...(release.lyricsStructure || {}),
        [languageCode]: [newBlock]
      };
    } else {
      // Fallback to legacy lyrics array
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

    // Ensure language is in availableLanguages
    if (!updatedRelease.availableLanguages.includes(languageCode)) {
      updatedRelease.availableLanguages = [...updatedRelease.availableLanguages, languageCode];
    }

    cmsServerStorage.saveRelease(updatedRelease);

    // --- CACHE INVALIDATION ---
    try {
      revalidatePath('/');
      revalidatePath('/releases');
      revalidatePath(`/release-detail/${release.slug}`);
    } catch (cacheErr) {
      console.warn('[API /api/admin/lyrics-requests/publish] Cache revalidation failed', cacheErr);
    }

    // Update the request status
    const updatedRequest = {
      ...existing,
      publishedToRelease: true,
      publishedAt: now,
      status: 'published' as const,
      updatedAt: now
    };

    const savedRequest = cmsServerStorage.saveLyricsRequest(updatedRequest);

    return NextResponse.json({ 
      success: true, 
      request: savedRequest,
      releaseId: targetReleaseId,
      language: languageCode 
    });

  } catch (error: any) {
    console.error('[API /api/admin/lyrics-requests/publish] ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
