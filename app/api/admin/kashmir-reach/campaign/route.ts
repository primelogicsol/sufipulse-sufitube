import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { kashmirPartnerStore } from '@/server/services/kashmir-partner-store';
import { generatePartnerCampaignKit } from '@/server/services/kashmir-campaign-generator';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { partnerId, releaseSlug } = await req.json();

    if (!partnerId || !releaseSlug) {
      return NextResponse.json(
        { success: false, error: 'partnerId and releaseSlug are required' },
        { status: 400 }
      );
    }

    const partner = kashmirPartnerStore.getById(partnerId);
    if (!partner) {
      return NextResponse.json(
        { success: false, error: `Partner not found: ${partnerId}` },
        { status: 404 }
      );
    }

    const kit = generatePartnerCampaignKit(partner, releaseSlug);
    return NextResponse.json({ success: true, kit });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate campaign kit' },
      { status: 500 }
    );
  }
}
