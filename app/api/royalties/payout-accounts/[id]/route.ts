import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '../../../../../server/middleware/authenticate';
import { sendPayoutStatusUpdateEmail } from '../../../../lib/email';

const DATA_FILE = path.join(process.cwd(), '.data', 'payout-accounts.json');

function readAll(): any[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(data: any[]) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const { status, admin_notes } = await request.json();

    const records = readAll();
    const idx = records.findIndex(r => r.id === id || r.user_id === id);
    
    if (idx === -1) {
      return NextResponse.json({ error: 'Payout account not found' }, { status: 404 });
    }

    const record = records[idx];
    const oldStatus = record.status;
    
    // Update record
    records[idx] = {
      ...record,
      status,
      admin_notes,
      updated_at: new Date().toISOString()
    };

    writeAll(records);

    // Send status update email (Failsafe)
    if (status !== oldStatus) {
      (async () => {
        try {
          console.log(`[Payout Verification] Sending status email to ${record.email} for status: ${status}`);
          await sendPayoutStatusUpdateEmail(record.email, status, {
            name: record.account_holder_name || 'Contributor',
            adminNote: admin_notes
          });
          console.log(`[Payout Verification] Status email sent successfully to ${record.email}`);
        } catch (err: any) {
          console.error(`[Payout Verification] Email failure: ${err.message || err}`);
        }
      })();
    }

    return NextResponse.json({ success: true, account: records[idx] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
