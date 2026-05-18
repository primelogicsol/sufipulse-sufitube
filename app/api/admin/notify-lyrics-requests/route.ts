import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { sendLyricsTranslationPublishedEmail } from '@/app/lib/email';
import { type LyricsRequest } from '@/lib/cms-storage';

export const dynamic = 'force-dynamic';

// POST /api/admin/notify-lyrics-requests
// Body: { releaseId, languageCode }
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { releaseId, languageCode } = await request.json();
    if (!releaseId || !languageCode) {
      return NextResponse.json({ error: 'releaseId and languageCode are required' }, { status: 400 });
    }

    const release = cmsServerStorage.getRelease(releaseId);
    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const allRequests = cmsServerStorage.getAllLyricsRequests();
    const pendingRequests = allRequests.filter(r => 
      (r.releaseId === releaseId || (r.youtubeId && r.youtubeId === release.youtubeId)) && 
      (r.languageCode === languageCode || r.languageName?.toLowerCase() === languageCode.toLowerCase()) &&
      r.notifyWhenPublished &&
      !r.notificationSentAt
    );

    if (pendingRequests.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: 'No pending requests for this language' });
    }

    const siteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/release-detail/${release.slug}`;
    const languageName = languageCode.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    let sent = 0;
    const errors: string[] = [];

    for (const req of pendingRequests) {
      try {
        if (req.requesterEmail) {
          await sendLyricsTranslationPublishedEmail(req.requesterEmail, {
            songTitle: release.title,
            language: req.languageName || languageName,
            releaseUrl: siteUrl
          });

          // Update request status
          const updatedRequest: LyricsRequest = {
            ...req,
            status: 'published',
            publishedToRelease: true,
            sentToUser: true,
            sentToUserAt: new Date().toISOString(),
            notificationSentAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          cmsServerStorage.saveLyricsRequest(updatedRequest);
          sent++;
        }
      } catch (err: any) {
        errors.push(`${req.requesterEmail}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      sent, 
      total: pendingRequests.length, 
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (err: any) {
    console.error('[API /api/admin/notify-lyrics-requests] ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
