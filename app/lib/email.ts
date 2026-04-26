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
  | 'welcome';

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
