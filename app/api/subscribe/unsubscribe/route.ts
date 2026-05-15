import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const SUBSCRIBERS_FILE = path.join(process.cwd(), '.data', 'subscribers.json');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  if (!email || !token) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(SUBSCRIBERS_FILE)) {
      return NextResponse.json({ error: 'No subscribers found' }, { status: 404 });
    }

    const subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
    const initialCount = subscribers.length;
    
    const filtered = subscribers.filter((s: any) => 
      !(s.email.toLowerCase() === email.toLowerCase() && s.token === token)
    );

    if (filtered.length === initialCount) {
      return NextResponse.json({ error: 'Subscriber not found or invalid token' }, { status: 404 });
    }

    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(filtered, null, 2), 'utf8');

    return NextResponse.json({ ok: true, message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error('[unsubscribe]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
