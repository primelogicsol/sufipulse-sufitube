import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin, getAuthUser } from '@/server/middleware/authenticate';
import { sendEmail } from '@/app/lib/email';

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
    const recipientEmail = body.email || existing.requesterEmail;
    const lyrics = body.translatedLyrics || existing.translatedLyrics;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient email available' }, { status: 400 });
    }

    if (!lyrics) {
      return NextResponse.json({ error: 'No translated lyrics available to send' }, { status: 400 });
    }

    const admin = await getAuthUser(request);

    // Build the email
    const subject = `Your Requested Lyrics Are Ready: ${existing.releaseTitle}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1a1a1a;">Lyrics Ready</h2>
        <p>Hello,</p>
        <p>Your requested lyrics translation for <strong>"${existing.releaseTitle}"</strong> is now ready.</p>
        
        <div style="background: #fafafa; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #eee;">
          <h3 style="margin-top: 0; color: #d97706; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">${existing.languageName} Lyrics</h3>
          <p style="white-space: pre-wrap; font-family: serif; font-size: 16px; line-height: 1.6; color: #333;">${lyrics}</p>
        </div>

        ${existing.sourceUrl ? `
        <p>You can also view the release and synchronized lyrics here: <br/>
        <a href="${existing.sourceUrl}" style="color: #d97706; font-weight: bold;">${existing.sourceUrl}</a></p>
        ` : ''}

        <p>Thank you for supporting SufiPulse and the preservation of sacred music.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          Sent by SufiPulse Administration<br/>
          © ${new Date().getFullYear()} SufiPulse. All rights reserved.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        to: recipientEmail,
        subject,
        html,
        text: `Your requested lyrics for "${existing.releaseTitle}" in ${existing.languageName} are ready:\n\n${lyrics}\n\nView at: ${existing.sourceUrl || 'SufiPulse.com'}`
      });
    } catch (emailError: any) {
      console.error('[Lyrics Request Email Error]', emailError);
      const isAuthError = emailError.message?.includes('535') || emailError.message?.includes('Authentication');
      return NextResponse.json({ 
        error: isAuthError 
          ? 'Email server rejected credentials (535). Please check your SMTP_USER and SMTP_PASS in .env.' 
          : `Email failed: ${emailError.message}` 
      }, { status: 500 });
    }

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      sentToUser: true,
      sentToUserAt: now,
      sentToUserEmail: recipientEmail,
      status: (existing.status === 'published') ? 'published' : 'sent_to_user',
      updatedAt: now
    };

    const saved = cmsServerStorage.saveLyricsRequest(updated);
    return NextResponse.json({ success: true, request: saved });

  } catch (error: any) {
    console.error('[API /api/admin/lyrics-requests/send] ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
