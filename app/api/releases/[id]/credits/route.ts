import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';

const DATA_FILE = path.join(process.cwd(), '.data', 'release-credits.json');

const readAll = (): any[] => {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (records: any[]) => {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const credits = readAll().filter((c: any) => c.release_id === id);
  return NextResponse.json(credits);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();
  const { credits, append = false } = body;

  if (!Array.isArray(credits)) {
    return NextResponse.json({ error: 'credits must be an array' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const all = readAll();
  const base = append ? all : all.filter((c: any) => c.release_id !== id);
  const newRecords = credits.map((c: any, i: number) => ({
    ...c,
    id: c.id || `credit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    release_id: id,
    order: c.order ?? i,
    created_at: c.created_at || now,
    updated_at: now,
  }));

  writeAll([...base, ...newRecords]);
  return NextResponse.json(newRecords);
}
