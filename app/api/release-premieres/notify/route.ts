import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/pool';
import { rateLimiters, getRateLimitKey } from '@/app/lib/rate-limiter';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const res = NextResponse.next();
    const isAllowed = await rateLimiters.strict(request, res);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { releaseId, email } = await request.json();

    if (!releaseId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Minimal email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (process.env.RELEASE_STORAGE_BACKEND !== 'postgres') {
      return NextResponse.json({ error: 'Notifications require postgres backend' }, { status: 503 });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const insertQuery = `
      INSERT INTO release_notification_subscriptions 
      (release_id, normalized_email, status, token)
      VALUES ($1, $2, 'subscribed', $3)
      ON CONFLICT (release_id, normalized_email) DO NOTHING
      RETURNING id
    `;
    
    await db.query(insertQuery, [releaseId, normalizedEmail, token]);

    return NextResponse.json({ success: true, message: "You're on the release alert list." }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/release-premieres/notify] POST ERROR:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
