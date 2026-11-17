import { NextRequest, NextResponse } from 'next/server';
import { kashmirPartnerStore } from '@/server/services/kashmir-partner-store';

export async function POST(req: NextRequest) {
  try {
    const { partnerId, notes } = await req.json();

    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: 'partnerId is required' },
        { status: 400 }
      );
    }

    const verified = kashmirPartnerStore.verify(partnerId, notes);
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
