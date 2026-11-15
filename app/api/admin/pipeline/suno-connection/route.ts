import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function statusPath() {
  if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) return null;
  return path.join(process.env.LOCALAPPDATA, 'SufiPulse', 'suno-connection.json');
}
function status() {
  const p = statusPath();
  if (!p) return { state: 'unavailable', message: 'Local Windows Chrome is required.' };
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (data.state === 'connecting' && Date.now() - Date.parse(data.updatedAt || '') > 12 * 60_000) {
      return { state: 'needs_signin', message: 'Connection attempt expired. Please reconnect.' };
    }
    return { state: data.state || 'needs_signin', message: data.message || '', updatedAt: data.updatedAt || null };
  } catch {
    return { state: 'needs_signin', message: 'Sign in to Suno once to enable authorized imports.' };
  }
}
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(status(), { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const p = statusPath();
  if (!p || process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Suno browser sign-in is only available on the local Windows development server.' }, { status: 422 });
  }
  const current = status();
  if (current.state === 'connecting') return NextResponse.json(current);
  const script = path.join(process.cwd(), 'scripts', 'connect-suno.cjs');
  if (!fs.existsSync(script)) return NextResponse.json({ error: 'Suno connector script is missing.' }, { status: 500 });
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ state: 'connecting', message: 'Complete sign-in in the dedicated Chrome window.', updatedAt: new Date().toISOString() }));
    const child = spawn(process.execPath, [script], { cwd: process.cwd(), detached: true, stdio: 'ignore', windowsHide: false });
    child.unref();
    return NextResponse.json({ state: 'connecting', message: 'Complete sign-in in the dedicated Chrome window.' });
  } catch {
    fs.writeFileSync(p, JSON.stringify({ state: 'needs_signin', message: 'Could not open Chrome. Check whether a SufiPulse Suno window is already running.', updatedAt: new Date().toISOString() }));
    return NextResponse.json({ error: 'Could not start Chrome sign-in.' }, { status: 500 });
  }
}
