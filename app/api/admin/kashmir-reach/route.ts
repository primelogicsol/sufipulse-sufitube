import { NextRequest, NextResponse } from 'next/server';
import { kashmirPartnerStore } from '@/server/services/kashmir-partner-store';
import { PartnerPillar, KashmirDistrict } from '@/server/types/kashmir-reach';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pillar = searchParams.get('pillar') as PartnerPillar | undefined;
    const district = searchParams.get('district') as KashmirDistrict | undefined;
    const status = searchParams.get('status') || undefined;
    const q = searchParams.get('q') || undefined;

    const partners = kashmirPartnerStore.filter({
      pillar,
      district,
      status,
      searchQuery: q,
    });

    const stats = kashmirPartnerStore.getStats();

    return NextResponse.json({
      success: true,
      stats,
      partners,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch partner data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.pillar || !body.district) {
      return NextResponse.json(
        { success: false, error: 'Name, pillar, and district are required' },
        { status: 400 }
      );
    }

    const saved = kashmirPartnerStore.save(body);
    return NextResponse.json({ success: true, partner: saved });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save partner' },
      { status: 500 }
    );
  }
}
