import 'server-only';

let nodemailer: any = null;
try { nodemailer = require('nodemailer'); } catch {}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sufipulse.com';
const APP_NAME = 'SufiPulse';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface NotificationPayload {
  to: string;
  subject: string;
  name: string;
  role?: string;
  event: string;
  message: string;
  action_url?: string;
  reference?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { to, subject, role = 'guest', event, action_url } = payload;
  const name = escapeHtml(payload.name);
  const message = escapeHtml(payload.message);
  const reference = payload.reference ? escapeHtml(payload.reference) : undefined;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (!nodemailer || !smtpHost || !smtpUser || !smtpPass) {
    console.log(`[SufiPulse Notify] TO:${to} | SUBJECT:${subject}\n${message}`);
    return;
  }

  const accent = event === 'approved' ? '#10b981' : event === 'rejected' ? '#ef4444' : '#f59e0b';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${APP_NAME}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="padding:32px 40px 24px;background:#111111;border-radius:12px 12px 0 0;border-bottom:1px solid #2a2a2a;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;">${APP_NAME}</div>
            <div style="font-size:12px;color:#888;margin-top:2px;">Notification</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;background:#111111;">
            <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${role}</p>
            <p style="margin:0 0 24px;color:#ffffff;font-size:20px;font-weight:600;">Dear ${name},</p>
            <p style="margin:0 0 24px;color:#cccccc;font-size:15px;line-height:1.7;">${message}</p>
            ${reference ? `<p style="margin:0 0 16px;color:#666;font-size:13px;">Reference: ${reference}</p>` : ''}
            ${action_url ? `<div style="text-align:center;margin-top:32px;"><a href="${action_url}" style="display:inline-block;background:${accent};color:#000;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">View Details</a></div>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#0d0d0d;border-top:1px solid #1a1a1a;border-radius:0 0 12px 12px;">
            <p style="margin:0;color:#444;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ${APP_NAME} · This is an automated notification.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({ from: `"${APP_NAME}" <${FROM_EMAIL}>`, to, subject, html, text: message });
  } catch (err) {
    console.error('[SufiPulse Notify Error]', err);
  }
}

export async function notifyAdminNewSubmission(type: string, from: string, orgOrSubject: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || FROM_EMAIL;
  await sendNotification({
    to: adminEmail,
    subject: `[SufiPulse] New ${type} submission from ${from}`,
    name: 'Admin',
    role: 'admin',
    event: 'application_received',
    message: `A new ${type} submission has been received from ${from} (${orgOrSubject}). Please review it in the admin dashboard.`,
    action_url: `${APP_URL}/admin`,
  });
}

export async function notifySubmitterStatusChange(opts: {
  to: string;
  name: string;
  type: string;
  status: string;
  adminNote?: string;
}): Promise<void> {
  const { to, name, type, status, adminNote } = opts;
  const isApproved = status === 'approved' || status === 'published';
  const isRejected = status === 'rejected';
  const isRevision = status === 'revision_requested';

  if (!isApproved && !isRejected && !isRevision) return;

  let subject: string;
  let message: string;
  let event: string;

  if (isApproved) {
    subject = `[SufiPulse] Your ${type} has been Approved`;
    event = 'approved';
    message = `We are pleased to inform you that your ${type} has been reviewed and approved by the SufiPulse team.${adminNote ? `\n\nNote from the team: ${adminNote}` : ''}\n\nWe will be in touch with next steps.`;
  } else if (isRevision) {
    subject = `[SufiPulse] Revision requested on your ${type}`;
    event = 'revision_requested';
    message = `Thank you for submitting your ${type} to SufiPulse. Our team has reviewed your submission and is requesting a revision before we can proceed.${adminNote ? `\n\nWhat to revise:\n${adminNote}` : ''}\n\nPlease log in to your dashboard to update your submission.`;
  } else {
    subject = `[SufiPulse] Update on your ${type}`;
    event = 'rejected';
    message = `Thank you for submitting your ${type} to SufiPulse. After careful review, we are unable to move forward with this proposal at this time.${adminNote ? `\n\nNote from the team: ${adminNote}` : ''}\n\nWe appreciate your interest and encourage you to reach out in the future.`;
  }

  await sendNotification({
    to,
    subject,
    name,
    event,
    message,
    action_url: isApproved || isRevision ? `${APP_URL}/` : undefined,
  });
}
