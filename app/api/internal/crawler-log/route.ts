import { NextRequest, NextResponse } from 'next/server';
import { crawlerRegistry } from '@/lib/crawler-registry';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const internalHeader = request.headers.get('x-sp-internal-crawler');
    if (internalHeader !== '1') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const ua = String(body.userAgent || '');
    const pathUrl = String(body.path || '/');
    if (ua && crawlerRegistry.isBot(ua)) {
      crawlerRegistry.logVisit(ua, pathUrl);
      return NextResponse.json({ ok: true, logged: true });
    }
    return NextResponse.json({ ok: true, logged: false });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
