import { NextRequest, NextResponse } from 'next/server';
import { kashmirPartnerStore } from '@/server/services/kashmir-partner-store';

export async function POST(req: NextRequest) {
  try {
    const { trackingCode, metric } = await req.json();

    if (!trackingCode || !metric) {
      return NextResponse.json(
        { success: false, error: 'trackingCode and metric are required' },
        { status: 400 }
      );
    }

    if (!['click', 'engaged', 'complete'].includes(metric)) {
      return NextResponse.json(
        { success: false, error: 'metric must be click, engaged, or complete' },
        { status: 400 }
      );
    }

    const recorded = kashmirPartnerStore.recordAttribution(trackingCode, metric);

    return NextResponse.json({ success: true, recorded });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Telemetry recording failed' },
      { status: 500 }
    );
  }
}
