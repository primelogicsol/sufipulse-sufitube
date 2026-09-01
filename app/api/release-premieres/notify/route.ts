import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { validatePublicSubmission } from '@/app/lib/security';
import { subscriptionSchema } from '@/app/lib/validation-schemas';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), '.data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

interface Subscriber {
  email: string;
  source?: string;
  releaseId?: string;
  subscribedAt: string;
  token?: string;
}

/**
 * POST /api/release-premieres/notify
 *
 * Saves a premiere-specific notification subscription to the filesystem
 * subscriber store (.data/subscribers.json) — same backing store as
 * /api/subscribe, so the admin can see all subscribers in one place.
 *
 * Previously required RELEASE_STORAGE_BACKEND=postgres and returned 503
 * on the current filesystem deployment. Now works without a database.
 */
export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, subscriptionSchema, {
    rateLimit: 'strict',
    sanitizationRules: { email: 'email' },
  });
  if (validation instanceof NextResponse) return validation;

  const { email } = validation.data;

  // releaseId comes from the body — not part of the shared schema, read it separately
  let releaseId: string | undefined;
  try {
    const raw = await request.clone().json().catch(() => ({}));
    releaseId = typeof raw?.releaseId === 'string' ? raw.releaseId.trim() : undefined;
  } catch {
    // releaseId is optional — premiere context only
  }

  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    const normalised = email.toLowerCase().trim();

    let subscribers: Subscriber[] = [];
    try {
      if (fs.existsSync(SUBSCRIBERS_FILE)) {
        subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
      }
    } catch (readErr) {
      console.error('[release-premieres/notify] read error', readErr);
    }

    // Idempotent: if already subscribed for this premiere, return success silently
    const alreadySubscribed = subscribers.some(
      (s) => s.email === normalised && (releaseId ? s.releaseId === releaseId : true)
    );
    if (alreadySubscribed) {
      return NextResponse.json({
        success: true,
        message: "You're already on the release alert list.",
        alreadySubscribed: true,
      });
    }

    const token = randomBytes(32).toString('hex');
    subscribers.push({
      email: normalised,
      source: 'premiere-notify',
      ...(releaseId ? { releaseId } : {}),
      subscribedAt: new Date().toISOString(),
      token,
    });

    try {
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
    } catch (writeErr: any) {
      console.error('[release-premieres/notify] write error', writeErr);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: "You're on the release alert list." },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API /api/release-premieres/notify] POST ERROR:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
