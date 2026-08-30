import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { applyRateLimit, createRateLimiter } from '@/server/middleware/rate-limit';
import { db } from '@/server/db/pool';
import { sendEmail } from '@/app/lib/email';
import { logger } from '@/app/lib/logger';

const apiLogger = logger.api;

const notifySubscribersLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 5 });

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const rateLimited = await applyRateLimit(request, notifySubscribersLimiter);
  if (rateLimited) return rateLimited;

  try {
    const { title, youtubeId, youtubePlaylistId, slug, releaseId } = await request.json();
    if (!title || !youtubeId || !releaseId) {
      return NextResponse.json({ error: 'title, youtubeId, and releaseId are required' }, { status: 400 });
    }

    if (process.env.RELEASE_STORAGE_BACKEND !== 'postgres') {
       return NextResponse.json({ error: 'Requires postgres backend' }, { status: 503 });
    }

    const { rows: subscribers } = await db.query(
      `SELECT id, normalized_email FROM release_notification_subscriptions
       WHERE release_id = $1 AND status = 'subscribed' AND notified_at IS NULL`,
      [releaseId]
    );

    if (subscribers.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: 'No eligible subscribers to notify' });
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
    You are receiving this because you subscribed to be notified when this premiere went live.
  </p>
</div>`;

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];
    const isMock = !process.env.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER === 'console';

    for (const sub of subscribers) {
      try {
        await sendEmail({
          to: sub.normalized_email,
          subject: `New Release: ${title} — SufiPulse`,
          html,
          text: `New release on SufiPulse: "${title}"\n\nWatch on YouTube: ${ytUrl}\n\nView on site: ${siteUrl}`,
        });

        if (!isMock) {
          await db.query(
            `UPDATE release_notification_subscriptions SET notified_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [sub.id]
          );
          sent++;
        } else {
           apiLogger.info(`Skipped setting notified_at for ${sub.normalized_email} because EMAIL_PROVIDER is console or unconfigured.`);
           skipped++;
        }
      } catch (err: any) {
        errors.push(`${sub.normalized_email}: ${err.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      total: subscribers.length,
      skipped,
      providerUnavailable: isMock,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
