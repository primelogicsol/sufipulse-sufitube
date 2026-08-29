import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/pool';

export async function POST(request: NextRequest) {
  try {
    const { releaseId, email } = await request.json();

    if (!releaseId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Minimal email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Create the table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS release_notification_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        release_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        normalized_email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'confirmed',
        confirmation_token VARCHAR(255),
        unsubscribe_token VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP WITH TIME ZONE,
        notified_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(release_id, normalized_email)
      );
    `;
    await db.query(createTableQuery);

    const checkQuery = `
      SELECT id FROM release_notification_subscriptions 
      WHERE release_id = $1 AND normalized_email = $2
    `;
    const checkRes = await db.query(checkQuery, [releaseId, normalizedEmail]);

    if (checkRes.rows.length > 0) {
      // Return 200 for idempotency
      return NextResponse.json({ success: true, message: "You're already subscribed to this premiere." }, { status: 200 });
    }

    const insertQuery = `
      INSERT INTO release_notification_subscriptions 
      (release_id, email, normalized_email, status, confirmation_token, unsubscribe_token, confirmed_at)
      VALUES ($1, $2, $3, 'confirmed', $4, $5, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    // Dummy tokens
    const confirmationToken = Math.random().toString(36).substring(2, 15);
    const unsubscribeToken = Math.random().toString(36).substring(2, 15);

    await db.query(insertQuery, [releaseId, email, normalizedEmail, confirmationToken, unsubscribeToken]);

    return NextResponse.json({ success: true, message: "You're on the release alert list." }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/release-premieres/notify] POST ERROR:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
