import { NextRequest, NextResponse } from 'next/server';
import { getAdoptionGoogleOAuthRecord } from '@/app/lib/server/adoption-google-oauth-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const configured = !!process.env.GOOGLE_ADS_CLIENT_ID;

  const record = await getAdoptionGoogleOAuthRecord(id);
  if (!record) {
    return NextResponse.json({
      configured,
      connected: false,
      adoption_id: id,
      message: 'No OAuth token found for this adoption.',
    });
  }

  return NextResponse.json({
    configured,
    connected: true,
    adoption_id: id,
    token_type: record.tokenType,
    expires_at: record.expiresAt,
    accessible_customer_ids: record.accessibleCustomerIds,
    updated_at: record.updatedAt,
  });
}
