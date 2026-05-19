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
  | 'lyrics-translation-published'
  | 'writer-submission-confirmation'
  | 'writer-status-under-review'
  | 'writer-status-revision-requested'
  | 'writer-status-approved'
  | 'writer-status-archived'
  | 'vocalist-submission-confirmation'
  | 'vocalist-status-under-review'
  | 'vocalist-status-revision-requested'
  | 'vocalist-status-approved'
  | 'vocalist-status-archived'
  | 'producer-submission-confirmation'
  | 'producer-status-under-review'
  | 'producer-status-revision-requested'
  | 'producer-status-approved'
  | 'producer-status-archived'
  | 'kalam-status-under-review'
  | 'kalam-status-revision-requested'
  | 'kalam-status-approved'
  | 'kalam-status-not-advanced'
  | 'kalam-status-pre-allocated'
  | 'kalam-status-production-consideration'
  | 'payout-status-verified'
  | 'payout-status-revision-requested'
  | 'payout-status-rejected'
  | 'literary-submission-confirmation'
  | 'literary-status-under-review'
  | 'literary-status-revision-requested'
  | 'literary-status-approved'
  | 'literary-status-archived'
  | 'studio-submission-confirmation'
  | 'studio-status-under-review'
  | 'studio-status-revision-requested'
  | 'studio-status-approved'
  | 'studio-status-archived'
  | 'inquiry-confirmation';

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
const templates: Record<EmailTemplate, (data: any) => { subject: string; html: string }> = {
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
    subject: 'Translation Request Received',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(200, 167, 94, 0.2);">
        <div style="margin-bottom: 32px;">
          <img src="https://sufipulse.com/sufipulse-logo-v5.png" alt="SufiPulse" style="height: 48px;" />
        </div>
        <h2 style="color: #F8FAFC; margin-bottom: 24px;">Request Received</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name || 'Seeker'},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your request for <strong>${language}</strong> lyrics translation for <strong>"${songTitle}"</strong> has been received and logged in the institutional workflow.
        </p>
        <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Song Title</p>
          <p style="font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">${songTitle}</p>
          <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Requested Language</p>
          <p style="font-size: 16px; font-weight: 600; margin: 0;">${language}</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          Our team reviews and prioritizes translation requests based on institutional capacity and audience alignment. You will be notified as soon as the translation is published.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
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

  'lyrics-translation-published': ({ songTitle, language, releaseUrl, name }) => ({
    subject: 'Requested Lyrics Translation Published',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
        <div style="margin-bottom: 32px;">
          <img src="https://sufipulse.com/sufipulse-logo-v5.png" alt="SufiPulse" style="height: 48px;" />
        </div>
        <h2 style="color: #F8FAFC; margin-bottom: 24px;">Translation Available</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name || 'Seeker'},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Great news! The <strong>${language}</strong> lyrics translation you requested for <strong>"${songTitle}"</strong> is now available and formally published.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${releaseUrl}" style="display: inline-block; background-color: #C8A75E; color: #0F172A; padding: 14px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">
            View Translation
          </a>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          Thank you for your interest and for being part of the SufiPulse institutional community.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'writer-submission-confirmation': ({ name, referenceId, trackingToken }) => ({
    subject: 'SufiPulse Writer Intake Submission Received',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(200, 167, 94, 0.2);">
        <div style="margin-bottom: 32px;">
          <img src="https://sufipulse.com/sufipulse-logo-v5.png" alt="SufiPulse" style="height: 48px;" />
        </div>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your writer profile and kalam submission have been formally received by the SufiPulse editorial board under the Ahl-e-Qalam intake framework.
        </p>
        <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Submission Reference</p>
            <p style="font-family: monospace; font-size: 18px; color: #C8A75E; margin: 0;">${referenceId}</p>
          </div>
          <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Current Status</p>
            <p style="font-size: 16px; font-weight: 600; margin: 0;">Pending Editorial Review</p>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications/${referenceId}?token=${trackingToken}" style="display: inline-block; background-color: #C8A75E; color: #0F172A; padding: 14px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">
            Track Application Progress
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          Please note that submission acknowledgment does not constitute editorial approval, production authorization, publication commitment, or release clearance.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'writer-status-under-review': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Update: Under Editorial Screening [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your submission (Ref: ${referenceId}) has moved into the **Under Editorial Screening** phase.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Our Majlis-e-Nazr (Editorial Council) is currently reviewing your profile and sample kalam for thematic and structural alignment with the SufiPulse institutional framework.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'writer-status-revision-requested': ({ name, referenceId, adminNote }) => ({
    subject: `SufiPulse Submission Update: Revision Requested [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          The editorial board has requested revisions for your submission (Ref: ${referenceId}).
        </p>
        <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 12px; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Editorial Feedback</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">${adminNote || 'Please log in to your dashboard to view specific revision requirements.'}</p>
        </div>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Please log in to your dashboard to update your profile or sample work according to the feedback above.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'writer-status-approved': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Approved: Welcome to Ahl-e-Qalam [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          We are pleased to inform you that your submission (Ref: ${referenceId}) has been **Approved**.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          You are now formally recognized as an Ahl-e-Qalam within the SufiPulse institutional registry. Your dashboard access is now active.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          **Institutional Notice:** This approval confirms your eligibility within the SufiPulse ecosystem. It does not constitute kalam approval, production authorization, publication clearance, or registry lock for any specific work.
        </p>
        <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #C8A75E; color: #0F172A; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Access Dashboard</a>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'writer-status-archived': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Update: Registry Status [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px;">
        <p>Dear ${name},</p>
        <p>Your writer profile has been archived. Reference: ${referenceId}</p>
      </div>
    `,
  }),

  'vocalist-submission-confirmation': ({ name, referenceId, trackingToken }) => ({
    subject: 'SufiPulse Vocalist Intake Submission Received',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(200, 167, 94, 0.2);">
        <div style="margin-bottom: 32px;">
          <img src="https://sufipulse.com/sufipulse-logo-v5.png" alt="SufiPulse" style="height: 48px;" />
        </div>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your vocalist profile and performance samples have been formally received by the SufiPulse editorial and production board under the Ahl-e-Sada intake framework.
        </p>
        <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Submission Reference</p>
            <p style="font-family: monospace; font-size: 18px; color: #C8A75E; margin: 0;">${referenceId}</p>
          </div>
          <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Current Status</p>
            <p style="font-size: 16px; font-weight: 600; margin: 0;">Pending Performance Screening</p>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications/${referenceId}?token=${trackingToken}" style="display: inline-block; background-color: #C8A75E; color: #0F172A; padding: 14px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">
            Track Application Progress
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          Please note that submission acknowledgment does not constitute vocal approval, kalam assignment, recording authorization, or release clearance.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Performance Coordination</p>
        </div>
      </div>
    `,
  }),

  'vocalist-status-under-review': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Update: Performance Screening [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your submission (Ref: ${referenceId}) has moved into the **Performance Screening** phase.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Our production board is currently evaluating your vocal range and technical capability for alignment with the SufiPulse institutional framework.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Performance Coordination</p>
        </div>
      </div>
    `,
  }),

  'vocalist-status-revision-requested': ({ name, referenceId, adminNote }) => ({
    subject: `SufiPulse Submission Update: Revision Requested [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          The production board has requested revisions or additional samples for your submission (Ref: ${referenceId}).
        </p>
        <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 12px; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Technical Feedback</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">${adminNote || 'Please log in to your dashboard to view specific revision requirements.'}</p>
        </div>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Please log in to your dashboard to update your profile or provide additional samples according to the feedback above.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Performance Coordination</p>
        </div>
      </div>
    `,
  }),

  'vocalist-status-approved': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Approved: Welcome to Ahl-e-Sada [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          We are pleased to inform you that your submission (Ref: ${referenceId}) has been **Approved**.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          You are now formally recognized as an Ahl-e-Sada within the SufiPulse institutional registry. Your dashboard access is now active.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          **Institutional Notice:** This approval confirms your eligibility for kalam assignment within the SufiPulse ecosystem. It does not constitute recording authorization or publication clearance for any specific work.
        </p>
        <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #C8A75E; color: #0F172A; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Access Dashboard</a>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Performance Coordination</p>
        </div>
      </div>
    `,
  }),

  'vocalist-status-archived': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Update: Registry Status [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Thank you for your interest in the Ahl-e-Sada framework.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          After careful review, we have decided not to move forward with your submission (Ref: ${referenceId}) at this time. Your profile has been archived within our registry.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Performance Coordination</p>
        </div>
      </div>
    `,
  }),

  'producer-submission-confirmation': ({ name, referenceId, trackingToken }) => ({
    subject: 'SufiPulse Producer Intake Submission Received',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(200, 167, 94, 0.2);">
        <div style="margin-bottom: 32px;">
          <img src="https://sufipulse.com/sufipulse-logo-v5.png" alt="SufiPulse" style="height: 48px;" />
        </div>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your producer profile and musical portfolio have been formally received by the SufiPulse production board under the Ahl-e-Naghma intake framework.
        </p>
        <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Submission Reference</p>
            <p style="font-family: monospace; font-size: 18px; color: #C8A75E; margin: 0;">${referenceId}</p>
          </div>
          <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Current Status</p>
            <p style="font-size: 16px; font-weight: 600; margin: 0;">Pending Portfolio Screening</p>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications/${referenceId}?token=${trackingToken}" style="display: inline-block; background-color: #C8A75E; color: #0F172A; padding: 14px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; text-transform: uppercase; font-size: 12px; letter-spacing: 0.1em;">
            Track Application Progress
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          Please note that submission acknowledgment does not constitute producer approval, assignment authorization, or release clearance.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Production Coordination</p>
        </div>
      </div>
    `,
  }),

  'producer-status-under-review': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Update: Portfolio Screening [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your submission (Ref: ${referenceId}) has moved into the **Portfolio Screening** phase.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Our production board is currently evaluating your technical capability and arrangement style for alignment with the SufiPulse institutional framework.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Production Coordination</p>
        </div>
      </div>
    `,
  }),

  'producer-status-revision-requested': ({ name, referenceId, adminNote }) => ({
    subject: `SufiPulse Submission Update: Revision Requested [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          The production board has requested revisions or additional project context for your submission (Ref: ${referenceId}).
        </p>
        <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 12px; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Technical Feedback</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">${adminNote || 'Please log in to your dashboard to view specific revision requirements.'}</p>
        </div>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Please log in to your dashboard to update your profile or provide additional portfolio data according to the feedback above.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Production Coordination</p>
        </div>
      </div>
    `,
  }),

  'producer-status-approved': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Approved: Welcome to Ahl-e-Naghma [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          We are pleased to inform you that your submission (Ref: ${referenceId}) has been **Approved**.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          You are now formally recognized as an Ahl-e-Naghma within the SufiPulse institutional registry. Your dashboard access is now active.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          **Institutional Notice:** This approval confirms your eligibility for musical structuring and arrangement assignments. It does not constitute recording authorization or publication clearance for any specific work.
        </p>
        <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #C8A75E; color: #0F172A; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Access Dashboard</a>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Production Coordination</p>
        </div>
      </div>
    `,
  }),

  'producer-status-archived': ({ name, referenceId }) => ({
    subject: `SufiPulse Submission Update: Registry Status [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Thank you for your interest in the Ahl-e-Naghma framework.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          After careful review, we have decided not to move forward with your submission (Ref: ${referenceId}) at this time. Your profile has been archived within our registry.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Production Coordination</p>
        </div>
      </div>
    `,
  }),

  'kalam-status-under-review': ({ name, title, referenceId }) => ({
    subject: `Kalam Update: Under Editorial Review [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your kalam submission **"${title}"** (Ref: ${referenceId}) has moved into the **Under Editorial Review** phase.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          The Majlis-e-Nazr is currently evaluating the thematic and structural aspects of this work.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'kalam-status-revision-requested': ({ name, title, referenceId, adminNote }) => ({
    subject: `Kalam Update: Revision Requested [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Revisions have been requested for your kalam **"${title}"** (Ref: ${referenceId}).
        </p>
        <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 12px; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Editorial Note</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">${adminNote || 'Please check your dashboard for details.'}</p>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'kalam-status-approved': ({ name, title, referenceId }) => ({
    subject: `Kalam Approved: Editorial Clearance [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your kalam **"${title}"** (Ref: ${referenceId}) has received **Editorial Approval**.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          **Institutional Notice:** Editorial approval confirms literary acceptance only. It does not authorize vocalist assignment, production, recording, publication, or release.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'kalam-status-not-advanced': ({ name, title, referenceId }) => ({
    subject: `Kalam Update: Registry Status [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Thank you for submitting **"${title}"** (Ref: ${referenceId}).
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          After review, we have decided not to advance this specific work into the SufiPulse production cycle at this time.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'kalam-status-pre-allocated': ({ name, title, referenceId }) => ({
    subject: `Kalam Update: Registry Pre-Allocation [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your kalam **"${title}"** (Ref: ${referenceId}) has been **Registry Pre-Allocated**.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          This work is now reserved for potential future production assignment.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'kalam-status-production-consideration': ({ name, title, referenceId }) => ({
    subject: `Kalam Update: Production Consideration [${referenceId}]`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(236, 72, 153, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your approved kalam **"${title}"** (Ref: ${referenceId}) has entered the **Production Consideration** phase.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          The production board will now evaluate this work for vocal suitability, musical form, and studio readiness.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Editorial Coordination</p>
        </div>
      </div>
    `,
  }),

  'payout-status-verified': ({ name }) => ({
    subject: 'SufiPulse Payout Account Verified',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your payout account has been **Verified** for institutional disbursements.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          This confirmation ensures your registry entry is aligned for future royalty cycles. Actual disbursements will occur according to the institutional payout schedule.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Financial Governance</p>
        </div>
      </div>
    `,
  }),

  'payout-status-revision-requested': ({ name, adminNote }) => ({
    subject: 'Action Required: Payout Registry Revision',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          The financial governance board has requested revisions for your payout registry entry.
        </p>
        <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 12px; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Governance Note</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">${adminNote || 'Please log in to your dashboard to update your banking information.'}</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          Please update your financial details in the contributor hub to resume the verification process.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Financial Governance</p>
        </div>
      </div>
    `,
  }),

  'payout-status-rejected': ({ name, adminNote }) => ({
    subject: 'Payout Registry Update: Status Restricted',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your payout registry submission has been **Rejected** for institutional disbursements.
        </p>
        <div style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 12px; color: #EF4444; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px 0;">Reason for Rejection</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">${adminNote || 'No specific reason provided.'}</p>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Financial Governance</p>
        </div>
      </div>
    `,
  }),
  'literary-submission-confirmation': ({ name, referenceId, trackingToken }: any) => ({
    subject: 'Ahl-e-Tahreer Application Received',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.2);">
        <h2 style="color: #D4AF37;">Ahl-e-Tahreer Application Received</h2>
        <p>Dear ${name || 'Contributor'},</p>
        <p>Your Literary Contributor application has been received for editorial review under Ahl-e-Tahreer.</p>
        <p><strong>Reference ID:</strong> ${referenceId}</p>
        <div style="background-color: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 14px; margin: 0;">Institutional Workflow Notes:</p>
          <ul style="font-size: 13px; color: #94A3B8;">
            <li>Submission received and logged in the registry.</li>
            <li>Editorial review by the Majlis-e-Nazr is required.</li>
            <li>Approval does not guarantee publication in the Literary Journal.</li>
            <li>Approved work may be considered for /literary-journal.</li>
            <li>This pathway is independent of /releases and musical production.</li>
          </ul>
        </div>
        <p>You can monitor your application status using the link provided in your dashboard when activated.</p>
      </div>
    `,
  }),

  'literary-status-under-review': ({ name, referenceId }: any) => ({
    subject: `Ahl-e-Tahreer Status Update: [${referenceId}]`,
    html: `<p>Dear ${name}, your Literary Contributor application is now under editorial screening. Ref: ${referenceId}</p>`,
  }),

  'literary-status-revision-requested': ({ name, referenceId, adminNote }: any) => ({
    subject: `Ahl-e-Tahreer Status Update: Revision Requested [${referenceId}]`,
    html: `<p>Dear ${name}, revisions are requested for your literary profile. Note: ${adminNote}</p>`,
  }),

  'literary-status-approved': ({ name, referenceId }: any) => ({
    subject: `Ahl-e-Tahreer Status Update: Approved [${referenceId}]`,
    html: `<p>Dear ${name}, your Literary Contributor profile has been approved for the SufiPulse Literary Journal registry. Ref: ${referenceId}</p>`,
  }),

  'literary-status-archived': ({ name, referenceId }: any) => ({
    subject: `Ahl-e-Tahreer Status Update: Archived [${referenceId}]`,
    html: `<p>Dear ${name}, your literary profile has been archived. Ref: ${referenceId}</p>`,
  }),

  'studio-submission-confirmation': ({ name, referenceId }: any) => ({
    subject: 'Karkhana-e-Sada Technical Intake Received',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.2);">
        <h2 style="color: #D4AF37;">Karkhana-e-Sada Intake Received</h2>
        <p>Dear ${name || 'Studio Partner'},</p>
        <p>Your Studio Credentials have been received for technical audit under Karkhana-e-Sada.</p>
        <p><strong>Reference ID:</strong> ${referenceId}</p>
        <div style="background-color: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 14px; margin: 0;">Audit Workflow Notes:</p>
          <ul style="font-size: 13px; color: #94A3B8;">
            <li>Credentials logged in the technical registry.</li>
            <li>Technical audit of facility and equipment is required.</li>
            <li>Approval allows regional session hosting for SufiPulse.</li>
            <li>This pathway is restricted to authorized network partners.</li>
          </ul>
        </div>
      </div>
    `,
  }),

  'studio-status-under-review': ({ name, referenceId }: any) => ({
    subject: `Karkhana-e-Sada Status Update: [${referenceId}]`,
    html: `<p>Dear ${name}, your studio facility is now under technical audit. Ref: ${referenceId}</p>`,
  }),

  'studio-status-revision-requested': ({ name, referenceId, adminNote }: any) => ({
    subject: `Karkhana-e-Sada Status Update: Revision Requested [${referenceId}]`,
    html: `<p>Dear ${name}, technical revisions or clarifications are requested for your studio profile. Note: ${adminNote}</p>`,
  }),

  'studio-status-approved': ({ name, referenceId }: any) => ({
    subject: `Karkhana-e-Sada Status Update: Authorized [${referenceId}]`,
    html: `<p>Dear ${name}, your studio facility has been authorized for inclusion within the SufiPulse production network. Ref: ${referenceId}</p>`,
  }),

  'studio-status-archived': ({ name, referenceId }: any) => ({
    subject: `Karkhana-e-Sada Status Update: Archived [${referenceId}]`,
    html: `<p>Dear ${name}, your studio profile has been archived. Ref: ${referenceId}</p>`,
  }),

  'inquiry-confirmation': ({ name, referenceId, category }: any) => ({
    subject: 'SufiPulse Inquiry Received',
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0F172A; color: #F8FAFC; border-radius: 12px; border: 1px solid rgba(200, 167, 94, 0.2);">
        <div style="margin-bottom: 32px;">
          <img src="https://sufipulse.com/sufipulse-logo-v5.png" alt="SufiPulse" style="height: 48px;" />
        </div>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Dear ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Your inquiry has been successfully received and entered into the SufiPulse institutional response workflow.
        </p>
        <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
          <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Reference ID</p>
            <p style="font-family: monospace; font-size: 18px; color: #C8A75E; margin: 0;">${referenceId}</p>
          </div>
          <div>
            <p style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0;">Classification</p>
            <p style="font-size: 16px; font-weight: 600; margin: 0;">${category.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px;">
          Our relevant teams will review and coordinate a response based on the nature of your request. Expected response window for institutional inquiries is 3–5 business days.
        </p>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
          <p style="font-size: 14px; margin: 0; color: #64748B;">Sincerely,</p>
          <p style="font-size: 14px; font-weight: 600; margin: 4px 0 0 0; color: #F8FAFC;">SufiPulse Institutional Coordination</p>
        </div>
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

export const sendLyricsTranslationPublishedEmail = async (to: string, data: { songTitle: string; language: string; releaseUrl: string; name?: string }): Promise<void> => {
  const { subject, html } = templates['lyrics-translation-published'](data);
  await sendEmail({ to, subject, html });
};

export const sendWriterSubmissionConfirmationEmail = async (to: string, data: { name: string; referenceId: string; trackingToken: string }): Promise<void> => {
  const { subject, html } = templates['writer-submission-confirmation'](data);
  await sendEmail({ to, subject, html });
};

export const sendWriterStatusUpdateEmail = async (to: string, status: string, data: { name: string; referenceId: string; adminNote?: string }): Promise<void> => {
  let templateKey: EmailTemplate;
  switch (status) {
    case 'under_review':
    case 'under_editorial_screening':
      templateKey = 'writer-status-under-review';
      break;
    case 'revision_requested':
      templateKey = 'writer-status-revision-requested';
      break;
    case 'approved':
    case 'approved_as_writer':
      templateKey = 'writer-status-approved';
      break;
    case 'rejected':
    case 'archived':
    case 'archived_not_advanced':
      templateKey = 'writer-status-archived';
      break;
    default:
      return;
  }
  const { subject, html } = templates[templateKey](data);
  await sendEmail({ to, subject, html });
};

export const sendStudioSubmissionConfirmationEmail = async (to: string, data: { name: string; referenceId: string }): Promise<void> => {
  const { subject, html } = templates['studio-submission-confirmation'](data);
  await sendEmail({ to, subject, html });
};

export const sendStudioStatusUpdateEmail = async (to: string, status: string, data: { name: string; referenceId: string; adminNote?: string }): Promise<void> => {
  let templateKey: EmailTemplate;
  switch (status) {
    case 'under_review':
    case 'under_audit':
      templateKey = 'studio-status-under-review';
      break;
    case 'revision_requested':
      templateKey = 'studio-status-revision-requested';
      break;
    case 'approved':
    case 'authorized':
      templateKey = 'studio-status-approved';
      break;
    case 'rejected':
    case 'archived':
      templateKey = 'studio-status-archived';
      break;
    default:
      return;
  }
  const { subject, html } = templates[templateKey](data);
  await sendEmail({ to, subject, html });
};

export const sendLiterarySubmissionConfirmationEmail = async (to: string, data: { name: string; referenceId: string; trackingToken: string }): Promise<void> => {
  const { subject, html } = templates['literary-submission-confirmation'](data);
  await sendEmail({ to, subject, html });
};

export const sendLiteraryStatusUpdateEmail = async (to: string, status: string, data: { name: string; referenceId: string; adminNote?: string }): Promise<void> => {
  let templateKey: EmailTemplate;
  switch (status) {
    case 'under_review':
    case 'under_editorial_screening':
      templateKey = 'literary-status-under-review';
      break;
    case 'revision_requested':
      templateKey = 'literary-status-revision-requested';
      break;
    case 'approved_for_journal':
    case 'approved':
      templateKey = 'literary-status-approved';
      break;
    case 'rejected':
    case 'archived':
      templateKey = 'literary-status-archived';
      break;
    default:
      return;
  }
  const { subject, html } = templates[templateKey](data);
  await sendEmail({ to, subject, html });
};

export const sendVocalistSubmissionConfirmationEmail = async (to: string, data: { name: string; referenceId: string; trackingToken: string }): Promise<void> => {
  const { subject, html } = templates['vocalist-submission-confirmation'](data);
  await sendEmail({ to, subject, html });
};

export const sendVocalistStatusUpdateEmail = async (to: string, status: string, data: { name: string; referenceId: string; adminNote?: string }): Promise<void> => {
  let templateKey: EmailTemplate;
  switch (status) {
    case 'under_review':
    case 'performance_screening':
      templateKey = 'vocalist-status-under-review';
      break;
    case 'revision_requested':
      templateKey = 'vocalist-status-revision-requested';
      break;
    case 'approved':
    case 'approved_as_vocalist':
      templateKey = 'vocalist-status-approved';
      break;
    case 'rejected':
    case 'archived':
      templateKey = 'vocalist-status-archived';
      break;
    default:
      return;
  }
  const { subject, html } = templates[templateKey](data);
  await sendEmail({ to, subject, html });
};

export const sendProducerSubmissionConfirmationEmail = async (to: string, data: { name: string; referenceId: string; trackingToken: string }): Promise<void> => {
  const { subject, html } = templates['producer-submission-confirmation'](data);
  await sendEmail({ to, subject, html });
};

export const sendProducerStatusUpdateEmail = async (to: string, status: string, data: { name: string; referenceId: string; adminNote?: string }): Promise<void> => {
  let templateKey: EmailTemplate;
  switch (status) {
    case 'under_review':
    case 'portfolio_screening':
      templateKey = 'producer-status-under-review';
      break;
    case 'revision_requested':
      templateKey = 'producer-status-revision-requested';
      break;
    case 'approved':
    case 'approved_as_producer':
      templateKey = 'producer-status-approved';
      break;
    case 'rejected':
    case 'archived':
      templateKey = 'producer-status-archived';
      break;
    default:
      return;
  }
  const { subject, html } = templates[templateKey](data);
  await sendEmail({ to, subject, html });
};

export const sendKalamStatusUpdateEmail = async (to: string, status: string, data: { name: string; title: string; referenceId: string; adminNote?: string }): Promise<void> => {
  let templateKey: EmailTemplate;
  switch (status) {
    case 'under_review':
    case 'under_editorial_review':
      templateKey = 'kalam-status-under-review';
      break;
    case 'revision_requested':
      templateKey = 'kalam-status-revision-requested';
      break;
    case 'approved':
    case 'editorially_approved':
      templateKey = 'kalam-status-approved';
      break;
    case 'not_advanced':
    case 'rejected':
      templateKey = 'kalam-status-not-advanced';
      break;
    case 'registry_pre_allocated':
    case 'pre_allocated':
      templateKey = 'kalam-status-pre-allocated';
      break;
    case 'production_consideration':
      templateKey = 'kalam-status-production-consideration';
      break;
    default:
      return;
  }
  const { subject, html } = templates[templateKey](data);
  await sendEmail({ to, subject, html });
};

export const sendPayoutStatusUpdateEmail = async (to: string, status: string, data: { name: string; adminNote?: string }): Promise<void> => {
  let templateKey: EmailTemplate;
  switch (status) {
    case 'verified':
      templateKey = 'payout-status-verified';
      break;
    case 'revision_requested':
      templateKey = 'payout-status-revision-requested';
      break;
    case 'rejected':
      templateKey = 'payout-status-rejected';
      break;
    default:
      return;
  }
  const { subject, html } = templates[templateKey](data as any);
  await sendEmail({ to, subject, html });
};

export const sendInquiryConfirmationEmail = async (to: string, data: { name: string; referenceId: string; category: string }): Promise<void> => {
  const { subject, html } = templates['inquiry-confirmation'](data);
  await sendEmail({ to, subject, html });
};
