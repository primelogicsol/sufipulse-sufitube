/**
 * Email service for sending password reset, verification, and notification emails.
 *
 * Set EMAIL_PROVIDER in .env.local on the VPS to activate real sending:
 *   EMAIL_PROVIDER=smtp   → uses SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 *   EMAIL_PROVIDER=resend → uses RESEND_API_KEY
 *   EMAIL_PROVIDER=sendgrid → uses SENDGRID_API_KEY
 *   (default) console    → logs to stdout only (development)
 */

import { logger } from './logger';

const emailLogger = logger.api;

type EmailTemplate =
  | 'verification'
  | 'password-reset'
  | 'welcome'
  | 'subscription-confirmed'
  | 'lyrics-request-confirmation'
  | 'lyrics-request-admin-notification'
  | 'lyrics-translation-published';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}

// SMTP provider (nodemailer — works with Gmail, any SMTP server)
class SmtpProvider implements EmailProvider {
  private config: { host: string; port: number; user: string; pass: string; from: string };

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS are required for EMAIL_PROVIDER=smtp');
    }
    this.config = {
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user,
      pass,
      from: process.env.EMAIL_FROM || `SufiPulse <${user}>`,
    };
  }

  async send({ to, subject, html, text }: SendEmailOptions): Promise<void> {
    // Dynamically require nodemailer so it's only loaded server-side
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require('nodemailer') as typeof import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.port === 465,
      auth: { user: this.config.user, pass: this.config.pass },
    });
    await transporter.sendMail({
      from: this.config.from,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
  }
}

// SendGrid provider
class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    if (!this.apiKey) throw new Error('SENDGRID_API_KEY not configured');
  }

  async send({ to, subject, html, text }: SendEmailOptions): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email: process.env.EMAIL_FROM || 'noreply@sufipulse.com',
          name: process.env.EMAIL_FROM_NAME || 'SufiPulse',
        },
        subject,
        content: [
          { type: 'text/html', value: html },
          ...(text ? [{ type: 'text/plain', value: text }] : []),
        ],
      }),
    });
    if (!response.ok) throw new Error(`SendGrid error: ${await response.text()}`);
  }
}

// Resend provider
class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    if (!this.apiKey) throw new Error('RESEND_API_KEY not configured');
  }

  async send({ to, subject, html, text }: SendEmailOptions): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@sufipulse.com',
        to,
        subject,
        html,
        text,
      }),
    });
    if (!response.ok) throw new Error(`Resend error: ${await response.text()}`);
  }
}

// Console provider (development fallback)
class ConsoleProvider implements EmailProvider {
  async send({ to, subject }: SendEmailOptions): Promise<void> {
    emailLogger.info(`[EMAIL MOCK] To: ${to} | Subject: ${subject} — set EMAIL_PROVIDER=smtp to send real emails`);
  }
}

// Factory
const createProvider = (): EmailProvider => {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  switch (provider) {
    case 'smtp':
      return new SmtpProvider();
    case 'sendgrid':
      return new SendGridProvider();
    case 'resend':
      return new ResendProvider();
    default:
      return new ConsoleProvider();
  }
};

// Email templates
const templates: Record<EmailTemplate, (data: Record<string, string>) => { subject: string; html: string }> = {
  verification: ({ code, name }) => ({
    subject: 'Verify Your SufiPulse Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Welcome to SufiPulse, ${name}!</h1>
        <p>Please verify your email address using the code below:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),

  'password-reset': ({ code, name }) => ({
    subject: 'Reset Your SufiPulse Password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Password Reset Request</h1>
        <p>Hi ${name},</p>
        <p>Use this code to reset your password:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),

  welcome: ({ name }) => ({
    subject: 'Welcome to SufiPulse!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Welcome to SufiPulse, ${name}!</h1>
        <p>Your account is now active. Explore sacred music and poetry from around the world.</p>
        <p>Visit us at <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL}</a></p>
      </div>
    `,
  }),

  'subscription-confirmed': ({ token, email }: { token: string; email: string }) => ({
    subject: 'SufiPulse — Release Alerts Confirmed',
    html: `
      <div style="background:#0F172A;color:#F8FAFC;font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;border-radius:12px;">
        <img src="https://sufipulse.com/sufipulse-logo-v5.png" alt="SufiPulse" style="height:40px;margin-bottom:24px;" />
        <h1 style="font-size:22px;font-weight:600;margin:0 0 16px;color:#F8FAFC;">You're on the list!</h1>
        <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Thank you for subscribing to SufiPulse release alerts. You will be the first to know when a new sacred kalam or literary work is published.
        </p>
        <p style="color:#C8A75E;font-size:14px;font-weight:600;">Expect to hear from us soon.</p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;" />
        <p style="color:#475569;font-size:11px;margin:0;">
          If you didn't subscribe, please <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}" style="color:#64748B;">unsubscribe here</a>.
        </p>
      </div>
    `,
  }),

  'lyrics-request-confirmation': ({ songTitle, language, name }) => ({
    subject: `Lyrics Translation Request Received: ${songTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1a1a1a;">Request Received</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for your interest in SufiPulse. Your request for <strong>${language}</strong> lyrics translation for <strong>"${songTitle}"</strong> has been received.</p>
        <p>Our team will review and prioritize translation requests based on audience demand.</p>
        <div style="background: #fafafa; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Requested Language:</strong> ${language}</p>
          <p style="margin: 5px 0 0; font-size: 14px;"><strong>Status:</strong> Pending Review</p>
        </div>
        <p style="color: #666; font-size: 13px;">We will notify you via this email address as soon as the translation is published.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} SufiPulse. All rights reserved.</p>
      </div>
    `,
  }),

  'lyrics-request-admin-notification': ({ songTitle, language, requesterName, requesterEmail, note }) => ({
    subject: `New Lyrics Translation Request: ${language}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #d97706;">New Translation Request</h2>
        <p>A user has submitted a new lyrics translation request.</p>
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 20px 0;">
          <tr style="background: #f9f9f9;">
            <td width="30%" style="font-weight: bold; border-bottom: 1px solid #eee;">Song</td>
            <td style="border-bottom: 1px solid #eee;">${songTitle}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border-bottom: 1px solid #eee;">Language</td>
            <td style="border-bottom: 1px solid #eee;">${language}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="font-weight: bold; border-bottom: 1px solid #eee;">Requester</td>
            <td style="border-bottom: 1px solid #eee;">${requesterName || 'Anonymous'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; border-bottom: 1px solid #eee;">Email</td>
            <td style="border-bottom: 1px solid #eee;">${requesterEmail || 'Not provided'}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="font-weight: bold;">Note</td>
            <td>${note || 'No note provided'}</td>
          </tr>
        </table>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/lyrics-requests" style="background: #d97706; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Admin Dashboard</a>
        </div>
      </div>
    `,
  }),

  'lyrics-translation-published': ({ songTitle, language, releaseUrl }) => ({
    subject: `SufiPulse lyrics translation published: ${songTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1a1a1a;">Translation Available</h2>
        <p>Great news! The <strong>${language}</strong> lyrics translation you requested for <strong>"${songTitle}"</strong> is now available.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${releaseUrl}" style="background: #d97706; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Translation</a>
        </div>
        <p style="color: #666; font-size: 13px;">Thank you for your patience and for being part of the SufiPulse community.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} SufiPulse. All rights reserved.</p>
      </div>
    `,
  }),
};

// Public API
export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const provider = createProvider();
  await provider.send(options);
  emailLogger.info(`Email sent to ${options.subject}`, { to: options.to });
};

export const sendVerificationEmail = async (to: string, name: string, code: string): Promise<void> => {
  const { subject, html } = templates.verification({ name, code });
  await sendEmail({ to, subject, html });
};

export const sendPasswordResetEmail = async (to: string, name: string, code: string): Promise<void> => {
  const { subject, html } = templates['password-reset']({ name, code });
  await sendEmail({ to, subject, html });
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  const { subject, html } = templates.welcome({ name });
  await sendEmail({ to, subject, html });
};

export const sendSubscriptionConfirmedEmail = async (to: string, token: string): Promise<void> => {
  const { subject, html } = templates['subscription-confirmed']({ token, email: to });
  await sendEmail({ to, subject, html });
};

export const sendLyricsRequestConfirmationEmail = async (to: string, data: { songTitle: string; language: string; name?: string }): Promise<void> => {
  const { subject, html } = templates['lyrics-request-confirmation'](data);
  await sendEmail({ to, subject, html });
};

export const sendLyricsRequestAdminNotificationEmail = async (to: string, data: { songTitle: string; language: string; requesterName?: string; requesterEmail?: string; note?: string }): Promise<void> => {
  const { subject, html } = templates['lyrics-request-admin-notification'](data);
  await sendEmail({ to, subject, html });
};

export const sendLyricsTranslationPublishedEmail = async (to: string, data: { songTitle: string; language: string; releaseUrl: string }): Promise<void> => {
  const { subject, html } = templates['lyrics-translation-published'](data);
  await sendEmail({ to, subject, html });
};

