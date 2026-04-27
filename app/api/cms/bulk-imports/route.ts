import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';

const DATA_FILE = path.join(process.cwd(), '.data', 'cms-bulk-imports.json');

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

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const records = readAll();
  const sorted = records.sort(
    (a: any, b: any) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
  return NextResponse.json(sorted);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const {
    import_type,
    status,
    file_name,
    file_url,
    total_items,
    successful_items,
    failed_items,
    error_log,
    started_at,
    completed_at,
    created_by,
  } = body;

  if (!import_type) {
    return NextResponse.json({ error: 'import_type is required' }, { status: 400 });
  }

  const record = {
    id: `bulk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    import_type,
    status: status || 'completed',
    file_name: file_name || undefined,
    file_url: file_url || undefined,
    total_items: Number(total_items ?? 0),
    successful_items: Number(successful_items ?? 0),
    failed_items: Number(failed_items ?? 0),
    error_log: error_log || undefined,
    started_at: started_at || undefined,
    completed_at: completed_at || undefined,
    created_by: created_by || auth.id,
    created_at: new Date().toISOString(),
  };

  const records = readAll();
  records.push(record);
  writeAll(records);

  return NextResponse.json(record, { status: 201 });
}
