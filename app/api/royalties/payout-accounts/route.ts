import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const DATA_FILE = path.join(process.cwd(), '.data', 'payout-accounts.json');

/**
 * GET /api/royalties/payout-accounts
 * Admin view of all submitted payout accounts.
 */
export async function GET() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const records = JSON.parse(raw);
    return NextResponse.json(Array.isArray(records) ? records : []);
  } catch {
    return NextResponse.json([]);
  }
}
