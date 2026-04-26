import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';

// Optional Nodemailer — only used when SMTP env vars are configured.
// Install with:  npm install nodemailer @types/nodemailer
let nodemailer: any = null;
try {
  nodemailer = require('nodemailer');
} catch {}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sufipulse.com';
const APP_NAME = 'SufiPulse';

function buildHtml(params: {
  name: string;
  role: string;
  event: string;
  message: string;
  action_url?: string;
  reference?: string;
}): string {
  const { name, role, event, message, action_url, reference } = params;

  const roleLabel: Record<string, string> = {
    writer:   'Ahl-e-Qalam · Writer',
    vocalist: 'Ahl-e-Sada · Vocalist',
    producer: 'Ahl-e-Naghma · Producer',
    literary: 'Ahl-e-Tahreer · Literary Contributor',
    studio:   'Studio Engineer / Partner',
    admin:    'SufiPulse Administration',
  };

  const accentColor: Record<string, string> = {
    application_received: '#f59e0b',
    under_review:         '#3b82f6',
    approved:             '#10b981',
    revision_requested:   '#f59e0b',
    rejected:             '#ef4444',
    kalam_approved:       '#10b981',
    kalam_revision:       '#f59e0b',
    kalam_submitted:      '#6366f1',
    sada_submitted:       '#6366f1',
    article_submitted:    '#6366f1',
    assignment_received:  '#8b5cf6',
    royalty_paid:         '#10b981',
    session_scheduled:    '#3b82f6',
    session_completed:    '#10b981',
  };

  const accent = accentColor[event] || '#f59e0b';
  const roleDisplay = roleLabel[role] || role;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SufiPulse</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;background:#111111;border-radius:12px 12px 0 0;border-bottom:1px solid #2a2a2a;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${APP_NAME}</div>
                    <div style="font-size:12px;color:#888;margin-top:2px;">Musical Registry &amp; Creative Production</div>
                  </td>
                  <td align="right">
                    <div style="display:inline-block;background:${accent}20;border:1px solid ${accent}50;color:${accent};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize;">
                      ${event.replace(/_/g, ' ')}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;background:#111111;">
              <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${roleDisplay}</p>
              <p style="margin:0 0 24px;color:#ffffff;font-size:20px;font-weight:600;">Dear ${name},</p>
              <p style="margin:0 0 24px;color:#cccccc;font-size:15px;line-height:1.7;">${message}</p>

              ${reference ? `<p style="margin:0 0 24px;color:#666;font-size:13px;">Reference: <span style="color:#888;">${reference}</span></p>` : ''}

              ${event === 'approved' ? `
              <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-left:3px solid ${accent};border-radius:8px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 8px;color:#ffffff;font-weight:600;font-size:14px;">Accessing Your Dashboard</p>
                <p style="margin:0 0 4px;color:#aaa;font-size:13px;">1. Visit <a href="${appUrl}/login" style="color:${accent};">${appUrl}/login</a></p>
                <p style="margin:0 0 4px;color:#aaa;font-size:13px;">2. Sign in with your registered email address</p>
                <p style="margin:0 0 4px;color:#aaa;font-size:13px;">3. Use the password you set during registration</p>
                <p style="margin:0;color:#aaa;font-size:13px;">4. Navigate to your contributor dashboard to begin</p>
              </div>
              <p style="margin:0 0 24px;color:#666;font-size:12px;">
                If you haven't created an account yet, 
                <a href="${appUrl}/register" style="color:${accent};">register here</a> 
                using this email address to activate your dashboard.
              </p>
              ` : ''}

              ${action_url ? `
              <div style="text-align:center;margin-top:32px;">
                <a href="${action_url}" style="display:inline-block;background:${accent};color:#000;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
                  ${event === 'approved' ? 'Go to My Dashboard' : event === 'revision_requested' ? 'View My Profile' : 'View Status'}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#0d0d0d;border-top:1px solid #1a1a1a;border-radius:0 0 12px 12px;">
              <p style="margin:0;color:#444;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} SufiPulse · Musical Registry · Production Division<br/>
                This is an automated notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { to, subject, name, role, event, message, action_url, reference } = body;

  if (!to || !to.includes('@') || !subject || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!nodemailer || !smtpHost || !smtpUser || !smtpPass) {
    // SMTP not configured — log to console in development, succeed silently in production
    console.log(`[SufiPulse Email] TO:${to} SUBJECT:${subject}\n${message}`);
    return NextResponse.json({ sent: false, reason: 'SMTP not configured' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const html = buildHtml({ name, role, event, message, action_url, reference });

    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: message,
    });

    return NextResponse.json({ sent: true });
  } catch (err: any) {
    console.error('[SufiPulse Email Error]', err);
    return NextResponse.json({ sent: false, error: err.message }, { status: 500 });
  }
}
