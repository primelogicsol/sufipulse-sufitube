/**
 * server/services/email.ts
 *
 * Email sending service. Provider is selected via EMAIL_PROVIDER env var:
 *   console   → logs to stdout (default, zero external deps)
 *   smtp      → nodemailer with SMTP credentials
 *   sendgrid  → SendGrid HTTP API
 *   resend    → Resend HTTP API
 *
 * To add a provider: implement the EmailProvider interface and add it to
 * the factory switch below.
 */

import { config } from '@/server/config';
import type { SendEmailOptions } from '@/server/types';

// ─── Provider interface ───────────────────────────────────────────────────────

interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}

// ─── Providers ────────────────────────────────────────────────────────────────

class ConsoleProvider implements EmailProvider {
  async send({ to, subject }: SendEmailOptions): Promise<void> {
    console.log(`[Email:console] To: ${to} | Subject: ${subject}`);
  }
}

class SendGridProvider implements EmailProvider {
  async send({ to, subject, html, text }: SendEmailOptions): Promise<void> {
    if (!config.email.sendgridKey) throw new Error('SENDGRID_API_KEY not set');

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.email.sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: config.email.from, name: config.email.fromName },
        subject,
        content: [
          { type: 'text/html', value: html },
          ...(text ? [{ type: 'text/plain', value: text }] : []),
        ],
      }),
    });

    if (!res.ok) throw new Error(`SendGrid error: ${await res.text()}`);
  }
}

class ResendProvider implements EmailProvider {
  async send({ to, subject, html, text }: SendEmailOptions): Promise<void> {
    if (!config.email.resendKey) throw new Error('RESEND_API_KEY not set');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.email.resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.email.fromName} <${config.email.from}>`,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
  }
}

class SmtpProvider implements EmailProvider {
  async send(options: SendEmailOptions): Promise<void> {
    // Dynamic import to avoid loading nodemailer in edge environments
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpSecure,
      auth: config.email.smtpUser
        ? { user: config.email.smtpUser, pass: config.email.smtpPass }
        : undefined,
    });

    await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function createProvider(): EmailProvider {
  switch (config.email.provider) {
    case 'sendgrid': return new SendGridProvider();
    case 'resend':   return new ResendProvider();
    case 'smtp':     return new SmtpProvider();
    default:         return new ConsoleProvider();
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

const templates = {
  verification: (name: string, code: string) => ({
    subject: 'Verify Your SufiPulse Account',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1>Welcome to SufiPulse, ${name}!</h1>
        <p>Please verify your email with the code below:</p>
        <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;border-radius:8px">${code}</div>
        <p>This code expires in ${config.auth.otpExpiryMinutes} minutes.</p>
        <p style="color:#666;font-size:12px">If you didn't register, ignore this email.</p>
      </div>`,
  }),

  passwordReset: (name: string, code: string) => ({
    subject: 'Reset Your SufiPulse Password',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1>Password Reset</h1>
        <p>Hi ${name}, use this code to reset your password:</p>
        <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;border-radius:8px">${code}</div>
        <p>This code expires in ${config.auth.otpExpiryMinutes} minutes.</p>
        <p style="color:#666;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>`,
  }),

  welcome: (name: string) => ({
    subject: 'Welcome to SufiPulse!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1>Welcome to SufiPulse, ${name}!</h1>
        <p>Your account is active. Explore sacred music and poetry from around the world.</p>
        <p>Visit us at <a href="${config.app.url}">${config.app.url}</a></p>
      </div>`,
  }),
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  await createProvider().send(options);
}

export async function sendVerificationEmail(to: string, name: string, code: string): Promise<void> {
  const { subject, html } = templates.verification(name, code);
  await sendEmail({ to, subject, html });
}

export async function sendPasswordResetEmail(to: string, name: string, code: string): Promise<void> {
  const { subject, html } = templates.passwordReset(name, code);
  await sendEmail({ to, subject, html });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const { subject, html } = templates.welcome(name);
  await sendEmail({ to, subject, html });
}
