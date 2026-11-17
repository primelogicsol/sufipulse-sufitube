import { NextRequest, NextResponse } from 'next/server';
import { kashmirPartnerStore } from '@/server/services/kashmir-partner-store';
import { PartnerPillar, KashmirDistrict } from '@/server/types/kashmir-reach';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pillar = searchParams.get('pillar') as PartnerPillar | undefined;
    const district = searchParams.get('district') as KashmirDistrict | undefined;
    const q = searchParams.get('q') || undefined;

    // Filter strictly to verified partners only
    const verifiedPartners = kashmirPartnerStore.filter({
      pillar,
      district,
      status: 'verified',
      searchQuery: q,
    });

    // PRIVACY SANITIZATION:
    // Strip all confidential contact data, verification notes, internal tokens, and raw metrics
    const sanitized = verifiedPartners.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      pillar: p.pillar,
      district: p.district,
      organizationType: p.organizationType,
      locationDetails: p.locationDetails,
      primaryHandle: p.primaryHandle,
      relationshipType: p.relationshipType,
      estimatedCommunityReach: p.estimatedCommunityReach,
      verifiedAt: p.verifiedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        partners: sanitized,
        total: sanitized.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch public partner directory' },
      { status: 500 }
    );
  }
}
