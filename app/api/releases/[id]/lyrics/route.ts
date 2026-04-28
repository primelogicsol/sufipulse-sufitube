import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';

const DATA_FILE = path.join(process.cwd(), '.data', 'release-lyrics.json');

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const lyrics = readAll().filter((l: any) => l.release_id === id);
  return NextResponse.json(lyrics);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();
  const { lyrics, append = false } = body;

  if (!Array.isArray(lyrics)) {
    return NextResponse.json({ error: 'lyrics must be an array' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const all = readAll();
  const base = append ? all : all.filter((l: any) => l.release_id !== id);
  const newRecords = lyrics.map((l: any, i: number) => ({
    ...l,
    id: l.id || `lyrics_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    release_id: id,
    order: l.order ?? i,
    created_at: l.created_at || now,
    updated_at: now,
  }));

  writeAll([...base, ...newRecords]);
  return NextResponse.json(newRecords);
}
