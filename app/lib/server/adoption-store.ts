import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'adoptions.json');

export type MethodType = 'managed_sufitube' | 'use_my_google_ads';
export type AdAccountOwner = 'sufipulse' | 'user';
export type PaymentOwner = 'sufipulse_gateway' | 'google_ads_billing' | 'not_required';
export type AdoptionStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'paid_pending_review'
  | 'pending_google_ads_manual_review'
  | 'google_ads_verification_pending'
  | 'google_ads_verified'
  | 'google_ads_verification_failed'
  | 'campaign_preparation_requested'
  | 'admin_review'
  | 'approved'
  | 'campaign_prepared'
  | 'awaiting_user_approval'
  | 'under_review'
  | 'prepared'
  | 'scheduled'
  | 'live'
  | 'monitoring'
  | 'completed'
  | 'report_ready'
  | 'cancelled'
  | 'failed';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded' | 'not_required';
export type OAuthStatus = 'not_connected' | 'connected' | 'expired' | 'revoked';
export type CampaignStatus = 'not_created' | 'draft' | 'paused' | 'enabled' | 'removed' | 'failed';

export interface AdoptionRecord {
  id: string;
  releaseId: string;
  releaseTitle?: string;
  releaseSlug?: string;
  youtubeId?: string;

  // Owner
  userId?: string;
  sponsorName?: string;
  sponsorEmail?: string;
  sponsorCountry?: string;
  sponsorCity?: string;
  adopterType?: string;

  // Method — determines who owns the ad account and who handles payment
  methodType: MethodType;
  adAccountOwner: AdAccountOwner;
  paymentOwner: PaymentOwner;

  // Status
  adoptionStatus: AdoptionStatus;

  // Intention (spiritual label chosen by sponsor)
  campaignIntention: string;
  dedicationMessage?: string;

  // Technical campaign targeting (maps from intention, editable by admin)
  campaignObjective: string;
  targetRegions: string[];
  targetLanguages: string[];

  // Tier and Budget
  selectedTier?: string;
  selectedTierLabel?: string;

  // Payment
  amountDue: number;
  amountPaid: number;
  expectedPaymentAmount?: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  paymentRoute?: string | null;
  paymentLinkTier?: string | null;
  paymentLinkUrl?: string | null;

  // Google Ads
  oauthStatus: OAuthStatus;
  googleAdsCustomerId?: string | null;
  googleAdsVerificationStatus?: 'verified' | 'failed' | 'manual_review_required' | null;
  campaignStatus: CampaignStatus;
  campaignResourceName?: string | null;

  // Display
  publicDisplayMode?: string;
  publicLocationMode?: string;
  publicListingApproved: boolean;
  isAnonymous: boolean;

  // Agreements
  agreementAccepted?: boolean;
  publicMentionAccepted?: boolean;
  institutionalClausesAccepted?: boolean;

  // Admin
  adminNote?: string | null;
  reportUrl?: string | null;

  createdAt: string;
  updatedAt: string;
}

type Store = { adoptions: Record<string, AdoptionRecord> };

function readStore(): Store {
  if (!existsSync(STORE_PATH)) return { adoptions: {} };
  try {
    return JSON.parse(readFileSync(STORE_PATH, 'utf-8')) as Store;
  } catch {
    return { adoptions: {} };
  }
}

function writeStore(store: Store): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${STORE_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
  renameSync(tmp, STORE_PATH);
}

function deriveOwnership(methodType: MethodType): {
  adAccountOwner: AdAccountOwner;
  paymentOwner: PaymentOwner;
  paymentStatus: PaymentStatus;
} {
  if (methodType === 'managed_sufitube') {
    return {
      adAccountOwner: 'sufipulse',
      paymentOwner: 'sufipulse_gateway',
      paymentStatus: 'unpaid',
    };
  }
  return {
    adAccountOwner: 'user',
    paymentOwner: 'google_ads_billing',
    paymentStatus: 'not_required',
  };
}

export function createAdoptionRecord(
  data: Omit<AdoptionRecord, 'id' | 'adAccountOwner' | 'paymentOwner' | 'paymentStatus' | 'createdAt' | 'updatedAt'> &
    Partial<Pick<AdoptionRecord, 'adAccountOwner' | 'paymentOwner' | 'paymentStatus'>>
): AdoptionRecord {
  const store = readStore();
  const now = new Date().toISOString();
  const ownership = deriveOwnership(data.methodType);

  const record: AdoptionRecord = {
    ...ownership,
    ...data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  store.adoptions[record.id] = record;
  writeStore(store);
  return record;
}

export function getAdoptionRecord(id: string): AdoptionRecord | null {
  const store = readStore();
  return store.adoptions[id] ?? null;
}

export function updateAdoptionRecord(
  id: string,
  patch: Partial<Omit<AdoptionRecord, 'id' | 'createdAt'>>
): AdoptionRecord | null {
  const store = readStore();
  const record = store.adoptions[id];
  if (!record) return null;
  const updated: AdoptionRecord = { ...record, ...patch, updatedAt: new Date().toISOString() };
  store.adoptions[id] = updated;
  writeStore(store);
  return updated;
}

export function getAdoptionsByUser(userId: string): AdoptionRecord[] {
  const store = readStore();
  return Object.values(store.adoptions)
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAdoptionsByRelease(releaseId: string): AdoptionRecord[] {
  const store = readStore();
  // Allowed statuses for public display: paid_pending_review, live, completed, report_ready
  // Also use_my_google_ads that are submitted (not draft)
  const VISIBLE_STATUSES = ['paid_pending_review', 'live', 'completed', 'report_ready'];

  return Object.values(store.adoptions)
    .filter((r) => 
      r.releaseId === releaseId && 
      r.publicListingApproved && 
      (
        r.paymentStatus === 'paid' || 
        VISIBLE_STATUSES.includes(r.adoptionStatus) ||
        (r.methodType === 'use_my_google_ads' && r.adoptionStatus !== 'draft')
      )
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAllAdoptionRecords(): AdoptionRecord[] {
  const store = readStore();
  return Object.values(store.adoptions).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}
