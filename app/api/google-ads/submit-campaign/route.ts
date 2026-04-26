/**
 * POST /api/google-ads/submit-campaign
 *
 * Public alias for /api/google-ads/campaigns/create.
 * Full campaign creation: Budget → Campaign → Ad Group → Video Ad → Geo Targeting
 * Behaviour is controlled by the GOOGLE_ADS_CREATE_MODE env var (draft / manual_review / live).
 */
export { POST } from '@/app/api/google-ads/campaigns/create/route';
