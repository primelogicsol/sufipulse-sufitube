import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { kashmirPartnerStore } from '@/server/services/kashmir-partner-store';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { partnerId, action = 'approve', notes } = await req.json();

    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: 'partnerId is required' },
        { status: 400 }
      );
    }

    const adminActor = auth.email || auth.id || 'admin';

    if (action === 'reject') {
      const removed = kashmirPartnerStore.reject(partnerId, adminActor);
      if (!removed) {
        return NextResponse.json(
          { success: false, error: `Partner ${partnerId} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: 'Application dismissed successfully' });
    }

    const verified = kashmirPartnerStore.verify(partnerId, notes, adminActor);
    if (!verified) {
      return NextResponse.json(
        { success: false, error: `Partner ${partnerId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Partner successfully verified and activated' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
