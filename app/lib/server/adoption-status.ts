import type { AdoptionStatus } from './adoption-store';

/**
 * Numeric rank for each adoption status.
 * Used to prevent backward transitions (never downgrade a status).
 */
export const STATUS_RANK: Record<string, number> = {
  draft: 0,
  pending_review: 1,
  pending_google_ads_manual_review: 1,
  google_ads_verification_pending: 1,
  google_ads_verified: 1,
  google_ads_verification_failed: 1,
  submitted: 1,
  campaign_preparation_requested: 2,
  admin_review: 2,
  awaiting_user_approval: 2,
  under_review: 2,
  approved: 3,
  campaign_prepared: 4,
  prepared: 4,
  scheduled: 5,
  live: 6,
  monitoring: 7,
  completed: 8,
  report_ready: 9,
  cancelled: -1,
  failed: -1,
};

export function canAdvanceTo(current: string, target: string): boolean {
  const cur = STATUS_RANK[current] ?? -1;
  const tgt = STATUS_RANK[target] ?? -1;
  return tgt > cur;
}

/**
 * Statuses that an owner (non-admin) is allowed to set via PATCH.
 * Admin-only statuses (approved, scheduled, live, etc.) are excluded.
 */
export const OWNER_SETTABLE_STATUSES = new Set<AdoptionStatus>([
  'draft',
  'pending_review',
  'pending_google_ads_manual_review',
  'google_ads_verification_pending',
  'google_ads_verified',
  'google_ads_verification_failed',
  'awaiting_user_approval',
]);
