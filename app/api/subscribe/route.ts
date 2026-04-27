import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), '.data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

interface Subscriber {
  email: string;
  releaseId?: string;
  subscribedAt: string;
}

const readSubscribers = (): Subscriber[] => {
  try {
    if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const writeSubscribers = (subscribers: Subscriber[]) => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
};

export async function POST(request: NextRequest) {
  try {
    const { email, releaseId } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const subscribers = readSubscribers();
    if (subscribers.some((s) => s.email === normalised)) {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    subscribers.push({ email: normalised, releaseId: releaseId || undefined, subscribedAt: new Date().toISOString() });
    writeSubscribers(subscribers);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[subscribe]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
