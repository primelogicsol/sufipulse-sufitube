/**
 * Smoke test: Adopt This Song — Google Ads workflow end-to-end.
 *
 * Run against a live local server:
 *   node scripts/smoke-test-adoptions.mjs
 *
 * No real Google OAuth token is needed. The verify-account call will
 * return "no token" (expected), and the manual-review fallback path is
 * fully exercised.
 *
 * Tests:
 *  A. Create use_my_google_ads adoption draft
 *  B. Verify-account with no OAuth token → 401, record still exists
 *  C. Patch to google_ads_verification_failed → record preserved
 *  D. Submit for manual review → campaign request created
 *  E. Create managed_sufitube adoption
 *  F. GET /api/adoptions?all=1 (admin) → both records visible
 *  G. GET /api/google-ads/status (no auth) → 200, configured field present
 *  H. Switch-to-managed simulation → new adoption with managed type
 */

const BASE = 'http://localhost:3000';

// ── Minimal fake release ────────────────────────────────────────────────────
const RELEASE_ID    = 'smoke-test-release-001';
const RELEASE_TITLE = 'Smoke Test Kalam';
const RELEASE_SLUG  = 'smoke-test-kalam';

let passed = 0;
let failed = 0;
const errors = [];

function ok(label) {
  console.log(`  ✓  ${label}`);
  passed++;
}

function fail(label, detail) {
  console.error(`  ✗  ${label}`);
  if (detail) console.error(`     → ${detail}`);
  failed++;
  errors.push({ label, detail });
}

async function post(path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function get(path, headers = {}) {
  const res = await fetch(`${BASE}${path}`, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function patch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// ── Admin cookie helper ─────────────────────────────────────────────────────
// Reads admin JWT from .data/admin-test-token.txt if present (set manually).
// If absent, admin-only tests are skipped with a warning.
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(__dirname, '../.data/admin-test-token.txt');
let adminCookie = '';
if (existsSync(TOKEN_FILE)) {
  adminCookie = `token=${readFileSync(TOKEN_FILE, 'utf-8').trim()}`;
} else {
  console.warn('\n  ⚠  No admin token found at .data/admin-test-token.txt');
  console.warn('     Admin-only assertions (Test F) will be skipped.\n');
}

// ───────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log('  Adoption Smoke Tests — Use My Google Ads workflow');
console.log('═══════════════════════════════════════════════════════\n');

// ── TEST A: Create use_my_google_ads draft ──────────────────────────────────
console.log('A. Create use_my_google_ads adoption draft');
const { status: aStatus, data: aData } = await post('/api/adoptions', {
  releaseId:          RELEASE_ID,
  releaseTitle:       RELEASE_TITLE,
  releaseSlug:        RELEASE_SLUG,
  methodType:         'use_my_google_ads',
  sponsorName:        'Test Sponsor',
  sponsorEmail:       'smoke@sufipulse.test',
  sponsorCountry:     'India',
  sponsorCity:        'Delhi',
  adopterType:        'individual',
  campaignIntention:  'spiritual_reflection',
  amountDue:          120,
  currency:           'USD',
  targetRegions:      ['India', 'Pakistan'],
  targetLanguages:    ['Urdu', 'Hindi'],
  adoptionStatus:     'draft',
});

const adoptionId = aData?.id;

if (aStatus !== 201)             fail('POST /api/adoptions → 201', `got ${aStatus}: ${aData?.error}`);
else                             ok('POST /api/adoptions → 201');
if (!adoptionId)                 fail('Response has id field');
else                             ok(`Adoption ID assigned: ${adoptionId.slice(-12)}`);
if (aData?.methodType !== 'use_my_google_ads') fail('methodType = use_my_google_ads', aData?.methodType);
else                             ok('methodType = use_my_google_ads');
if (aData?.adoptionStatus !== 'draft') fail('adoptionStatus = draft', aData?.adoptionStatus);
else                             ok('adoptionStatus = draft');
if (aData?.paymentStatus !== 'not_required') fail('paymentStatus = not_required (Google pays directly)', aData?.paymentStatus);
else                             ok('paymentStatus = not_required (pay Google directly)');

// ── TEST B: Verify-account with no OAuth token ──────────────────────────────
console.log('\nB. verify-account with no OAuth token → 401, record unaffected');
const { status: bStatus, data: bData } = await post('/api/google-ads/verify-account', {
  adoptionId,
  customerId: '9641210148',
});

if (bStatus !== 401 && bStatus !== 503)
  fail(`verify-account returns 401/503 when no token`, `got ${bStatus}: ${JSON.stringify(bData)}`);
else
  ok(`verify-account returns ${bStatus} when no OAuth token (expected — no token stored)`);

// Confirm adoption record still exists after failed verify attempt
const { status: bGetStatus, data: bGetData } = await get(`/api/adoptions/${adoptionId}`);
if (bGetStatus !== 200)          fail('Adoption record still accessible after verify attempt', `got ${bGetStatus}`);
else                             ok('Adoption record persists after verify attempt');
if (bGetData?.adoptionStatus !== 'draft') fail('adoptionStatus still draft (verify failure did not corrupt record)', bGetData?.adoptionStatus);
else                             ok('adoptionStatus still draft — record not corrupted');

// ── TEST C: Patch to google_ads_verification_failed ─────────────────────────
console.log('\nC. PATCH adoption → google_ads_verification_failed (simulates UI patch after verify failure)');
const { status: cStatus, data: cData } = await patch(`/api/adoptions/${adoptionId}`, {
  googleAdsCustomerId:       '964-121-0148',
  googleAdsVerificationStatus: 'failed',
  adoptionStatus:            'google_ads_verification_failed',
});

if (cStatus !== 200)             fail('PATCH → 200', `got ${cStatus}: ${cData?.error}`);
else                             ok('PATCH /api/adoptions/[id] → 200');
if (cData?.adoptionStatus !== 'google_ads_verification_failed')
                                 fail('adoptionStatus = google_ads_verification_failed', cData?.adoptionStatus);
else                             ok('adoptionStatus = google_ads_verification_failed');
if (cData?.googleAdsCustomerId !== '964-121-0148')
                                 fail('googleAdsCustomerId stored', cData?.googleAdsCustomerId);
else                             ok('googleAdsCustomerId stored on record');
if (cData?.googleAdsVerificationStatus !== 'failed')
                                 fail('googleAdsVerificationStatus = failed', cData?.googleAdsVerificationStatus);
else                             ok('googleAdsVerificationStatus = failed');

// ── TEST D: Submit for manual review ────────────────────────────────────────
console.log('\nD. Submit for manual review → update adoption + create campaign request');

// Patch adoption to manual_review status (as handleManualReview does)
const { status: dPatchStatus, data: dPatchData } = await patch(`/api/adoptions/${adoptionId}`, {
  googleAdsCustomerId:       '964-121-0148',
  googleAdsVerificationStatus: 'manual_review_required',
  adoptionStatus:            'pending_google_ads_manual_review',
  paymentRoute:              'google_direct',
});

if (dPatchStatus !== 200)        fail('PATCH to pending_google_ads_manual_review → 200', `got ${dPatchStatus}`);
else                             ok('PATCH → pending_google_ads_manual_review');
if (dPatchData?.adoptionStatus !== 'pending_google_ads_manual_review')
                                 fail('adoptionStatus = pending_google_ads_manual_review', dPatchData?.adoptionStatus);
else                             ok('adoptionStatus = pending_google_ads_manual_review');

// Create campaign request (as handleManualReview does)
const { status: dCrStatus, data: dCrData } = await post('/api/google-ads/campaign-requests', {
  adoptionId,
  releaseId:         RELEASE_ID,
  releaseTitle:      RELEASE_TITLE,
  releaseSlug:       RELEASE_SLUG,
  methodType:        'use_my_google_ads',
  paymentRoute:      'google_direct',
  googleAdsCustomerId: '964-121-0148',
  budgetAmount:      120,
  targetRegions:     ['India', 'Pakistan'],
  targetLanguages:   ['Urdu', 'Hindi'],
  campaignObjective: 'spiritual_reflection',
  sponsorName:       'Test Sponsor',
  sponsorEmail:      'smoke@sufipulse.test',
  status:            'pending_manual_review',
  reviewReason:      'google_ads_auto_verification_failed',
});

if (dCrStatus !== 201)           fail('POST /api/google-ads/campaign-requests → 201', `got ${dCrStatus}: ${dCrData?.error}`);
else                             ok('Campaign request created (status: pending_manual_review)');
if (dCrData?.adoptionId !== adoptionId)
                                 fail('Campaign request linked to adoptionId', dCrData?.adoptionId);
else                             ok(`Campaign request linked to adoption ${adoptionId.slice(-8)}`);

// Verify final adoption state via GET
const { status: dGetStatus, data: dGetData } = await get(`/api/adoptions/${adoptionId}`);
if (dGetStatus !== 200)          fail('GET adoption after manual review → 200', `got ${dGetStatus}`);
else                             ok('GET adoption after manual review → 200');
if (dGetData?.adoptionStatus !== 'pending_google_ads_manual_review')
                                 fail('Final status = pending_google_ads_manual_review', dGetData?.adoptionStatus);
else                             ok('Final adoptionStatus = pending_google_ads_manual_review ✓ visible to admin');
if (dGetData?.campaignRequestStatus !== null && dGetData?.campaignRequestStatus !== undefined)
                                 ok(`campaignRequestStatus merged: ${dGetData.campaignRequestStatus}`);

// ── TEST E: Create managed_sufitube adoption ─────────────────────────────────
console.log('\nE. Create managed_sufitube adoption');
const { status: eStatus, data: eData } = await post('/api/adoptions', {
  releaseId:          RELEASE_ID,
  releaseTitle:       RELEASE_TITLE,
  releaseSlug:        RELEASE_SLUG,
  methodType:         'managed_sufitube',
  sponsorName:        'Managed Sponsor',
  sponsorEmail:       'managed@sufipulse.test',
  sponsorCountry:     'Pakistan',
  sponsorCity:        'Lahore',
  adopterType:        'family',
  campaignIntention:  'ramadan_sacred_season',
  amountDue:          199,
  currency:           'USD',
  targetRegions:      ['South Asia'],
  targetLanguages:    ['Urdu'],
  adoptionStatus:     'pending_review',
});

const managedId = eData?.id;
if (eStatus !== 201)             fail('POST managed_sufitube → 201', `got ${eStatus}: ${eData?.error}`);
else                             ok('POST managed_sufitube → 201');
if (eData?.methodType !== 'managed_sufitube') fail('methodType = managed_sufitube', eData?.methodType);
else                             ok('methodType = managed_sufitube');
if (eData?.paymentStatus !== 'unpaid') fail('paymentStatus = unpaid (Stripe required)', eData?.paymentStatus);
else                             ok('paymentStatus = unpaid (Stripe checkout required)');
if (eData?.adoptionStatus !== 'pending_review') fail('adoptionStatus = pending_review', eData?.adoptionStatus);
else                             ok('adoptionStatus = pending_review');

// ── TEST F: Admin can see both records ──────────────────────────────────────
console.log('\nF. Admin GET /api/adoptions?all=1 → both records visible');
if (!adminCookie) {
  console.log('  ⚠  Skipped — no admin token (create .data/admin-test-token.txt with your JWT)');
} else {
  const { status: fStatus, data: fData } = await get('/api/adoptions?all=1', { Cookie: adminCookie });
  if (fStatus !== 200)           fail('GET ?all=1 → 200', `got ${fStatus}`);
  else                           ok('GET /api/adoptions?all=1 → 200');
  if (!Array.isArray(fData))     fail('Response is array');
  else {
    ok(`Total adoption records visible: ${fData.length}`);
    const gads = fData.find(a => a.id === adoptionId);
    const mgd  = fData.find(a => a.id === managedId);
    if (!gads) fail('use_my_google_ads adoption visible to admin');
    else        ok(`use_my_google_ads adoption visible (status: ${gads.adoptionStatus})`);
    if (!mgd)  fail('managed_sufitube adoption visible to admin');
    else        ok(`managed_sufitube adoption visible (status: ${mgd.adoptionStatus})`);
  }
}

// ── TEST G: /api/google-ads/status graceful when unauthenticated ────────────
console.log('\nG. GET /api/google-ads/status (unauthenticated) → 200 with configured field');
const { status: gStatus, data: gData } = await get('/api/google-ads/status');
if (gStatus !== 200)             fail('GET /api/google-ads/status → 200', `got ${gStatus}`);
else                             ok('GET /api/google-ads/status → 200 (no 500)');
if (typeof gData?.configured !== 'boolean') fail('Response has configured boolean', JSON.stringify(gData));
else                             ok(`configured = ${gData.configured} (${gData.configured ? 'env vars present' : 'env vars missing — manual review fallback active'})`);
if (gData?.configured === false && Array.isArray(gData?.missing_vars))
                                 ok(`Missing vars reported: ${gData.missing_vars.join(', ')}`);
if (gData?.connected === false)  ok('connected = false for unauthenticated request (expected)');

// ── TEST H: Switch-to-managed simulation ────────────────────────────────────
console.log('\nH. Switch-to-managed: new managed adoption from same sponsor data');
const { status: hStatus, data: hData } = await post('/api/adoptions', {
  releaseId:          RELEASE_ID,
  releaseTitle:       RELEASE_TITLE,
  releaseSlug:        RELEASE_SLUG,
  methodType:         'managed_sufitube',
  sponsorName:        'Test Sponsor',          // same as use_my_google_ads test
  sponsorEmail:       'smoke@sufipulse.test',  // same
  sponsorCountry:     'India',
  sponsorCity:        'Delhi',
  adopterType:        'individual',
  campaignIntention:  'spiritual_reflection',
  amountDue:          120,
  currency:           'USD',
  targetRegions:      ['India', 'Pakistan'],
  targetLanguages:    ['Urdu', 'Hindi'],
  adoptionStatus:     'pending_review',
});

if (hStatus !== 201)             fail('Switch-to-managed: new adoption → 201', `got ${hStatus}`);
else                             ok('Switch-to-managed: new managed adoption created → 201');
if (hData?.methodType !== 'managed_sufitube') fail('New adoption is managed_sufitube', hData?.methodType);
else                             ok('New adoption has methodType = managed_sufitube');
if (hData?.sponsorName === 'Test Sponsor') ok('Sponsor info carried over correctly');
else                             fail('Sponsor info preserved from original form', hData?.sponsorName);

// ── Original use_my_google_ads draft still exists (not deleted) ─────────────
const { status: hCheckStatus, data: hCheckData } = await get(`/api/adoptions/${adoptionId}`);
if (hCheckStatus === 200)        ok(`Original use_my_google_ads draft (${adoptionId.slice(-8)}) still exists — not deleted`);
else                             fail('Original draft preserved after switch-to-managed', `got ${hCheckStatus}`);

// ── SUMMARY ──────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════');

if (errors.length > 0) {
  console.error('\n  Failures:');
  errors.forEach(e => console.error(`  • ${e.label}${e.detail ? ': ' + e.detail : ''}`));
}

console.log('\n  Adoption IDs created (safe to delete from .data/adoptions.json):');
if (adoptionId) console.log(`  • use_my_google_ads:  ${adoptionId}`);
if (managedId)  console.log(`  • managed_sufitube:   ${managedId}`);
if (hData?.id)  console.log(`  • switch-to-managed:  ${hData.id}`);
console.log('');

process.exit(failed > 0 ? 1 : 0);
