import { NextRequest, NextResponse } from 'next/server';
import { kashmirPartnerStore } from '@/server/services/kashmir-partner-store';
import { PartnerPillar, KashmirDistrict } from '@/server/types/kashmir-reach';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      pillar,
      district,
      organizationType,
      locationDetails,
      primaryHandle,
      contactPerson,
      contactChannel,
      contactValue,
      estimatedCommunityReach,
      notes,
    } = body;

    if (!name || !pillar || !district || !contactPerson || !contactValue) {
      return NextResponse.json(
        { success: false, error: 'Name, pillar, district, contact person, and contact value are required' },
        { status: 400 }
      );
    }

    // Save as pending verification (Mandatory Human Approval Gate)
    const newPartner = kashmirPartnerStore.save({
      name: name.trim(),
      pillar: pillar as PartnerPillar,
      district: district as KashmirDistrict,
      organizationType: organizationType || 'cultural_society',
      locationDetails: locationDetails || 'Kashmir Valley',
      primaryHandle: primaryHandle || '',
      contactPerson: contactPerson.trim(),
      contactChannel: contactChannel || 'whatsapp',
      contactValue: contactValue.trim(),
      estimatedCommunityReach: Number(estimatedCommunityReach) || 2000,
      relationshipType: 'independent_partner',
      verificationStatus: 'pending_verification',
      consentStatus: 'permission_pending',
      notes: notes || 'Submitted via SufiPulse.com public partner application portal.',
    });

    return NextResponse.json({
      success: true,
      message: 'Application received successfully. The SufiPulse editorial & cultural review committee will review and verify your organization before activation.',
      partnerId: newPartner.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Application submission failed' },
      { status: 500 }
    );
  }
}
