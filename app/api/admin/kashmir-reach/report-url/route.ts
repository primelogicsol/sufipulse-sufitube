import { NextRequest, NextResponse } from 'next/server';
import { kashmirPartnerStore } from '@/server/services/kashmir-partner-store';

export async function POST(req: NextRequest) {
  try {
    const { partnerId, releaseSlug, channel, publishedUrl } = await req.json();

    if (!partnerId || !releaseSlug || !publishedUrl) {
      return NextResponse.json(
        { success: false, error: 'partnerId, releaseSlug, and publishedUrl are required' },
        { status: 400 }
      );
    }

    const ok = kashmirPartnerStore.recordPublication(partnerId, {
      releaseSlug,
      channel: channel || 'community_network',
      publishedUrl,
    });

    if (!ok) {
      return NextResponse.json(
        { success: false, error: `Partner not found: ${partnerId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Publication URL recorded' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record publication URL' },
      { status: 500 }
    );
  }
}
