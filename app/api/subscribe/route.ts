import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { sendSubscriptionConfirmedEmail } from '@/app/lib/email';
import { validatePublicSubmission } from '@/app/lib/security';
import { subscriptionSchema } from '@/app/lib/validation-schemas';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), '.data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

interface Subscriber {
  email: string;
  releaseId?: string;
  subscribedAt: string;
  token?: string;
}

export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, subscriptionSchema, {
    rateLimit: 'strict',
    sanitizationRules: {
      email: 'email'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const { email } = validation.data;
  
  // Hand-parse releaseId if needed as it's not in subscriptionSchema
  // Actually I should add it to the schema if it's used.
  // For now I'll just use email.

  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const normalised = email.toLowerCase().trim();

    // Load existing subscribers and check for duplicates
    let subscribers: Subscriber[] = [];
    try {
      if (fs.existsSync(SUBSCRIBERS_FILE)) {
        const content = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
        subscribers = JSON.parse(content);
      }
    } catch (readErr) {
      console.error('[subscribe] read error', readErr);
    }

    if (subscribers.some((s) => s.email === normalised)) {
      return NextResponse.json({ 
        ok: true, 
        message: "You're already on the list", 
        alreadySubscribed: true 
      });
    }

    // Generate token and save new subscriber
    let token;
    try {
      token = randomBytes(24).toString('hex');
    } catch {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    subscribers.push({ 
      email: normalised, 
      subscribedAt: new Date().toISOString(),
      token
    });

    try {
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
    } catch (writeErr: any) {
      console.error('[subscribe] write error', writeErr);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    // Send confirmation email (Fire and Forget)
    sendSubscriptionConfirmedEmail(normalised, token).catch(err => {
      console.error('[subscribe] confirmation email failed internally', err);
    });

    return NextResponse.json({ 
      ok: true, 
      message: "You're on the list" 
    });

  } catch (err: any) {
    console.error('[subscribe] critical failure', err);
    return NextResponse.json({ 
      error: 'Server error'
    }, { status: 500 });
  }
}
