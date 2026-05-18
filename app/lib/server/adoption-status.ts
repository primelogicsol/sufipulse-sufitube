import type { AdoptionStatus } from './adoption-store';

/**
 * Numeric rank for each adoption status.
 * Used to prevent backward transitions (never downgrade a status).
 */
export const STATUS_RANK: Record<string, number> = {
  draft: 0,
  submitted: 1,
  payment_pending: 1,
  pending_payment: 1, // alias
  payment_received: 2,
  paid_pending_review: 2, // alias
  pending_review: 2, // alias
  google_ads_connection_pending: 1,
  google_ads_connected_pending_review: 2,
  google_ads_verified_adopter: 2,
  pending_google_ads_manual_review: 2,
  google_ads_verification_pending: 2,
  google_ads_verified: 2,
  google_ads_verification_failed: 2,
  campaign_preparation_requested: 3,
  admin_review: 3,
  awaiting_user_approval: 3,
  under_review: 3,
  approved: 4,
  campaign_prepared: 5,
  prepared: 5,
  scheduled: 6,
  live: 7,
  monitoring: 8,
  completed: 9,
  report_ready: 10,
  cancelled: -1,
  failed: -1,
  hidden: -2,
  rejected: -1,
  archived: -3,
  reconnect_required: 1,
  permission_denied: 1,
};

export function canAdvanceTo(current: string, target: string): boolean {
  const cur = STATUS_RANK[current] ?? -1;
  const tgt = STATUS_RANK[target] ?? -1;
  // Special case: allowed to archive/hide/reject from many states
  if (target === 'archived' || target === 'hidden' || target === 'rejected' || target === 'cancelled') return true;
  return tgt > cur;
}

/**
 * Statuses that an owner (non-admin) is allowed to set via PATCH.
 * Admin-only statuses (approved, scheduled, live, etc.) are excluded.
 */
export const OWNER_SETTABLE_STATUSES = new Set<AdoptionStatus>([
  'draft',
  'pending_payment',
  'pending_review',
  'paid_pending_review',
  'google_ads_connection_pending',
  'google_ads_connected_pending_review',
  'pending_google_ads_manual_review',
  'google_ads_verification_pending',
  'google_ads_verified',
  'google_ads_verification_failed',
  'awaiting_user_approval',
]);
