import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAuth } from '@/server/middleware/authenticate';

const DATA_FILE = path.join(process.cwd(), '.data', 'payout-accounts.json');

interface PayoutAccount {
  id: string;
  user_id: string;
  account_holder_name: string;
  bank_name: string;
  account_type: 'checking' | 'savings';
  // Last 4 digits only — never store full account number
  account_last4: string;
  routing_number: string;
  swift_bic?: string;
  currency: string;
  country: string;
  notes?: string;
  status: 'pending_review' | 'verified' | 'rejected';
  submitted_at: string;
  updated_at: string;
}

const readAll = (): PayoutAccount[] => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeAll = (records: PayoutAccount[]) => {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
};

// GET — fetch current user's payout account
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const records = readAll();
  const account = records.find(r => r.user_id === authResult.id) || null;
  return NextResponse.json({ account });
}

// POST — submit or update payout account
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const {
    account_holder_name,
    bank_name,
    account_type,
    account_number,
    routing_number,
    swift_bic,
    currency = 'USD',
    country = 'US',
    notes,
  } = body;

  if (!account_holder_name?.trim()) {
    return NextResponse.json({ error: 'Account holder name is required' }, { status: 400 });
  }
  if (!bank_name?.trim()) {
    return NextResponse.json({ error: 'Bank name is required' }, { status: 400 });
  }
  if (!account_number || String(account_number).length < 4) {
    return NextResponse.json({ error: 'Valid account number is required' }, { status: 400 });
  }
  if (!routing_number?.trim()) {
    return NextResponse.json({ error: 'Routing number is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const records = readAll();
  const existingIdx = records.findIndex(r => r.user_id === authResult.id);

  const accountLast4 = String(account_number).slice(-4);

  const record: PayoutAccount = {
    id: existingIdx >= 0 ? records[existingIdx].id : `payout_${Date.now()}`,
    user_id: authResult.id,
    account_holder_name: account_holder_name.trim(),
    bank_name: bank_name.trim(),
    account_type: account_type || 'checking',
    account_last4: accountLast4,
    routing_number: routing_number.trim(),
    swift_bic: swift_bic?.trim() || undefined,
    currency,
    country,
    notes: notes?.trim() || undefined,
    status: 'pending_review',
    submitted_at: existingIdx >= 0 ? records[existingIdx].submitted_at : now,
    updated_at: now,
  };

  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    records.push(record);
  }

  writeAll(records);
  return NextResponse.json({ account: record });
}
