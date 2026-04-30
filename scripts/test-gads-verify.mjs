/**
 * scripts/test-gads-verify.mjs
 *
 * Smoke-test the Google Ads verify-account API on the live VPS.
 * Run from project root:
 *   node scripts/test-gads-verify.mjs
 *
 * Set these env vars (or hardcode for one-off testing):
 *   BASE_URL     - e.g. https://www.sufipulse.com (default)
 *   ADOPTION_ID  - UUID of an existing adoption (or omit for user-only check)
 *   USER_ID      - SufiPulse user ID (or omit)
 *   CUSTOMER_ID  - Google Ads customer ID to verify (default: 964-121-0148)
 *   COOKIE       - session cookie header value (optional)
 */

const BASE_URL = process.env.BASE_URL || 'https://www.sufipulse.com';
const ADOPTION_ID = process.env.ADOPTION_ID || '';
const USER_ID = process.env.USER_ID || '';
const CUSTOMER_ID = process.env.CUSTOMER_ID || '964-121-0148';
const COOKIE = process.env.COOKIE || '';

async function checkStatus() {
  const params = new URLSearchParams();
  if (ADOPTION_ID) params.set('adoptionId', ADOPTION_ID);
  const url = `${BASE_URL}/api/google-ads/status${params.size ? '?' + params : ''}`;
  console.log('\n── STATUS ──────────────────────────────────');
  console.log('GET', url);
  const res = await fetch(url, {
    headers: COOKIE ? { cookie: COOKIE } : {},
  });
  const data = await res.json();
  console.log('HTTP', res.status);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

async function verifyAccount() {
  const url = `${BASE_URL}/api/google-ads/verify-account`;
  const body = { adoptionId: ADOPTION_ID, userId: USER_ID, customerId: CUSTOMER_ID };
  console.log('\n── VERIFY ──────────────────────────────────');
  console.log('POST', url);
  console.log('body:', JSON.stringify(body));
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(COOKIE ? { cookie: COOKIE } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log('HTTP', res.status);
  console.log(JSON.stringify(data, null, 2));
  return data;
}

(async () => {
  try {
    await checkStatus();
    await verifyAccount();
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
})();
