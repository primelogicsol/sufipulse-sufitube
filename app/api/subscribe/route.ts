import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { sendSubscriptionConfirmedEmail } from '@/app/lib/email';
import { applyRateLimit, createRateLimiter } from '@/server/middleware/rate-limit';

export const dynamic = 'force-dynamic';

const subscribeLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

const DATA_DIR = path.join(process.cwd(), '.data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

interface Subscriber {
  email: string;
  releaseId?: string;
  subscribedAt: string;
  token?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimited = await applyRateLimit(request, subscribeLimiter);
    if (rateLimited) return rateLimited;

    // 2. Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 3. Parse and validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request' }, { status: 400 });
    }

    const { email, releaseId } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // 4. Load existing subscribers and check for duplicates
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

    // 5. Generate token and save new subscriber
    let token;
    try {
      token = randomBytes(24).toString('hex');
    } catch {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    subscribers.push({ 
      email: normalised, 
      releaseId: releaseId || undefined, 
      subscribedAt: new Date().toISOString(),
      token
    });

    try {
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
    } catch (writeErr: any) {
      console.error('[subscribe] write error', writeErr);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    // 6. Send confirmation email (Fire and Forget)
    try {
      // Don't await to keep the response fast for the user
      sendSubscriptionConfirmedEmail(normalised, token).catch(err => {
        console.error('[subscribe] confirmation email failed internally', err);
      });
    } catch (emailErr) {
      console.error('[subscribe] failed to trigger confirmation email', emailErr);
    }

    return NextResponse.json({ 
      ok: true, 
      message: "You're on the list" 
    });

  } catch (err: any) {
    console.error('[subscribe] critical failure', err);
    return NextResponse.json({ 
      error: 'Server error', 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
