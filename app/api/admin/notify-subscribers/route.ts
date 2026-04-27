import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import { sendEmail } from '@/app/lib/email';

const SUBSCRIBERS_FILE = path.join(process.cwd(), '.data', 'subscribers.json');

interface Subscriber { email: string; subscribedAt: string; }

const readSubscribers = (): Subscriber[] => {
  try {
    if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  } catch { return []; }
};

// POST /api/admin/notify-subscribers
// Body: { title, youtubeId, youtubePlaylistId?, slug }
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { title, youtubeId, youtubePlaylistId, slug } = await request.json();
    if (!title || !youtubeId) {
      return NextResponse.json({ error: 'title and youtubeId are required' }, { status: 400 });
    }

    const subscribers = readSubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: 'No subscribers yet' });
    }

    const ytUrl = youtubePlaylistId
      ? `https://www.youtube.com/watch?v=${youtubeId}&list=${youtubePlaylistId}`
      : `https://www.youtube.com/watch?v=${youtubeId}`;

    const siteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com'}/release-detail/${slug || youtubeId}`;

    const html = `
<div style="background:#0F172A;color:#F8FAFC;font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;border-radius:12px;">
  <img src="https://sufipulse.com/sufipulse-logo-v5.png" alt="SufiPulse" style="height:40px;margin-bottom:24px;" />
  <p style="color:#C8A75E;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 8px;">New Release</p>
  <h1 style="font-size:22px;font-weight:600;margin:0 0 16px;color:#F8FAFC;">${title}</h1>
  <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px;">
    A new sacred kalam has been released on SufiPulse. Listen now on YouTube.
  </p>
  <a href="${ytUrl}" style="display:inline-block;background:#C8A75E;color:#0F172A;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;margin-bottom:16px;">
    Watch on YouTube
  </a>
  <br/>
  <a href="${siteUrl}" style="color:#64748B;font-size:12px;">
    View on SufiPulse
  </a>
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;" />
  <p style="color:#475569;font-size:11px;margin:0;">
    You are receiving this because you subscribed to SufiPulse release alerts.
  </p>
</div>`;

    let sent = 0;
    const errors: string[] = [];

    for (const sub of subscribers) {
      try {
        await sendEmail({
          to: sub.email,
          subject: `New Release: ${title} — SufiPulse`,
          html,
          text: `New release on SufiPulse: "${title}"\n\nWatch on YouTube: ${ytUrl}\n\nView on site: ${siteUrl}`,
        });
        sent++;
      } catch (err: any) {
        errors.push(`${sub.email}: ${err.message}`);
      }
    }

    return NextResponse.json({ ok: true, sent, total: subscribers.length, errors: errors.length > 0 ? errors : undefined });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
