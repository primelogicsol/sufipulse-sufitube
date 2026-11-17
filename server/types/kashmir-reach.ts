/**
 * server/types/kashmir-reach.ts
 *
 * Types for the SufiPulse Kashmir Partner Network (KPN).
 * Foundation for institutional community distribution across 10 Kashmir Valley districts.
 */

export type PartnerPillar =
  | 'ecological_conservation'
  | 'artisan_craft_heritage'
  | 'sacred_literature_sufi'
  | 'youth_academic_thinkers';

export type KashmirDistrict =
  | 'srinagar'
  | 'anantnag'
  | 'baramulla'
  | 'budgam'
  | 'pulwama'
  | 'kupwara'
  | 'shopian'
  | 'ganderbal'
  | 'bandipora'
  | 'kulgam';

export type PartnerChannel =
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'telegram'
  | 'youtube'
  | 'community_network';

export type PartnerVerificationStatus =
  | 'verified'
  | 'invited'
  | 'pending_verification'
  | 'inactive';

export type PartnerConsentStatus =
  | 'explicit_permission_granted'
  | 'permission_pending'
  | 'revoked';

export interface PartnerPublicationRecord {
  id: string;
  releaseSlug: string;
  channel: PartnerChannel;
  publishedUrl: string;
  reportedAt: string;
  verifiedByAdmin?: boolean;
}

export interface KashmirPartner {
  id: string;                           // e.g. "kpn_ecowatch_sgr"
  name: string;                         // e.g. "Kashmir EcoWatch"
  slug: string;                         // e.g. "kashmir-ecowatch"
  organizationType:
    | 'conservation_ngo'
    | 'artisan_guild'
    | 'cultural_society'
    | 'academic_forum'
    | 'shrine_circle'
    | 'independent_creator';
  pillar: PartnerPillar;
  district: KashmirDistrict;
  locationDetails: string;              // e.g. "Srinagar (Rajbagh / Dal Lake area)"
  authorizedChannels: PartnerChannel[];
  primaryHandle: string;                // e.g. "@kashmirecowatch"
  contactPerson: string;
  contactChannel: 'whatsapp' | 'email' | 'phone';
  contactValue: string;
  verificationStatus: PartnerVerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string;
  consentStatus: PartnerConsentStatus;
  consentGrantedAt?: string;
  estimatedCommunityReach: number;      // Documented community/follower footprint
  trackingCode: string;                 // e.g. "ecowatch" -> generates ?utm_source=kpn&utm_partner=ecowatch
  matchedReleaseThemes: string[];       // e.g. ["environmental", "dal_lake", "river_preservation"]
  metrics: {
    campaignsReceived: number;
    campaignsAccepted: number;
    publishedUrls: PartnerPublicationRecord[];
    totalReferralClicks: number;
    engagedListens: number;             // >60s playback on SufiPulse.com
    completedListens: number;           // Full track playback
    lastAttributedVisitAt?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerCampaignKit {
  partnerId: string;
  partnerName: string;
  partnerTrackingCode: string;
  releaseId: string;
  releaseSlug: string;
  releaseTitle: string;
  destinationUrl: string;               // e.g. https://sufipulse.com/release-detail/[slug]?utm_source=kpn&utm_partner=[code]
  disclaimer: string;
  whatsappMessage: string;
  instagramCaption: string;
  facebookPost: string;
  telegramMessage: string;
  assets: Array<{
    type: 'vertical_clip_15s' | 'vertical_clip_30s' | 'vertical_clip_45s' | 'thumbnail' | 'audio_preview';
    label: string;
    url: string;
  }>;
  generatedAt: string;
}
