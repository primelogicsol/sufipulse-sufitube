import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET /api/admin/google-ads/logs
 * Returns recent operational logs for the Google Ads console.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const LOG_FILE = path.join(process.cwd(), '.data', 'google-ads-operation-logs.json');

  try {
    const data = await fs.readFile(LOG_FILE, 'utf8');
    const logs = JSON.parse(data);
    return NextResponse.json(logs);
  } catch (err) {
    return NextResponse.json([]);
  }
}
