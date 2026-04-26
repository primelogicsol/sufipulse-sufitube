import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';

const DATA_FILE = path.join(process.cwd(), '.data', 'payout-accounts.json');

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const records = JSON.parse(raw);
    return NextResponse.json(Array.isArray(records) ? records : []);
  } catch {
    return NextResponse.json([]);
  }
}
