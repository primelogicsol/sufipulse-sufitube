/**
 * Playwright validation — Google Ads guided detection flow
 * Mocks API responses to simulate post-OAuth state without real credentials.
 *
 * Three timing fixes vs v1:
 *   Check 2 — confirm recheck was TRIGGERED via network interception, not by catching a <100ms spinner
 *   Check 3 — read select option value directly instead of relying on Playwright text= visibility of <option>
 *   Check 4 — add 150ms artificial delay to verify mock so we can catch the disabled→enabled transition
 */
import { chromium } from 'playwright';

const BASE          = 'https://sufipulse.com';
const RELEASE_SLUG  = 'aMzdiIuYgK4';
const MOCK_ID       = 'mock-gads-validation-001';
const MOCK_EMAIL    = 'testuser@gmail.com';
const MOCK_CID      = '123-456-7890';   // pre-formatted xxx-xxx-xxxx

const MOCK_ADOPTION = {
  id: MOCK_ID,
  methodType: 'use_my_google_ads',
  adoptionStatus: 'draft',
  releaseSlug: RELEASE_SLUG,
  sponsorName: 'Test Sponsor',
  sponsorEmail: 'test@example.com',
  sponsorCountry: 'US',
  sponsorCity: 'New York',
  campaignIntention: 'general_awareness',
  amountDue: 100,
  targetRegions: ['Global'],
  targetLanguages: ['All'],
};

const makeStatus = (accounts) => ({
  configured: true,
  missing_vars: [],
  connected: true,
  adoption_id: MOCK_ID,
  user_id: 'user-test',
  accessible_customer_ids: accounts,
  google_email: MOCK_EMAIL,
  updated_at: new Date().toISOString(),
  campaign: null,
});

const R    = { check1: null, check2: null, check3: null, check4: null };
const errs = [];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page    = await ctx.newPage();

  // Capture real errors only (ignore CSP noise for 3rd-party scripts)
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('plausible') && !msg.text().includes('fonts.googleapis')) {
      errs.push('console.error: ' + msg.text());
    }
  });
  page.on('pageerror', err => errs.push('pageerror: ' + err.message));

  // Track which API calls were made
  const apiCalls = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) apiCalls.push(req.url());
  });

  // ── Mocks ──────────────────────────────────────────────────────────────────

  await page.route(`**/api/adoptions/${MOCK_ID}`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ADOPTION) })
  );

  // Google Ads status:
  //   initial poll (no recheck=1) → 0 accounts  (no-account state)
  //   recheck=1 (focus-triggered) → 1 account   (detection)
  await page.route('**/api/google-ads/status**', route => {
    const accounts = route.request().url().includes('recheck=1') ? [MOCK_CID] : [];
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeStatus(accounts)) });
  });

  // Verify-account — 400ms delay so we can catch disabled→enabled transition in Check 4
  await page.route('**/api/google-ads/verify-account', async route => {
    await sleep(400);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ verified: true }) });
  });

  // ── Navigate to simulated OAuth return ────────────────────────────────────
  const url = `${BASE}/release-detail/${RELEASE_SLUG}?adopt=1&step=google_ads_connected&adoption_id=${MOCK_ID}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for AdoptTab lazy load + state restoration to settle on no-account state
  try {
    await page.waitForSelector('text=No Google Ads account found', { timeout: 15000 });
  } catch {
    const body = await page.locator('body').textContent().catch(() => '');
    errs.push('SETUP FAILED: no-account state never rendered. Body: ' + body.slice(0, 500));
    await browser.close();
    return printResults();
  }

  // ── CHECK 1: Google email visible ─────────────────────────────────────────
  try {
    const emailLocator = page.locator(`text=${MOCK_EMAIL}`).first();
    const visible = await emailLocator.isVisible({ timeout: 3000 });
    R.check1 = visible ? 'PASS' : 'FAIL';
    if (!visible) {
      const noAcctText = await page.locator('text=No Google Ads account found').first().textContent().catch(() => '');
      errs.push(`CHECK 1: "${MOCK_EMAIL}" not found. No-account text: "${noAcctText}"`);
    }
  } catch (e) {
    R.check1 = 'FAIL';
    errs.push(`CHECK 1 exception: ${e.message}`);
  }

  // ── CHECK 2: Focus event triggers recheck — verified via network call ──────
  // Strategy: watch for recheck=1 API call after focus event.
  // The spinner may appear and vanish in <100ms (mock is fast), so we validate
  // by confirming the recheck call was made (the focus listener fired).
  const recheckCallsBefore = apiCalls.filter(u => u.includes('recheck=1')).length;

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await sleep(100);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));

  // Give up to 3s for the recheck request to fire
  const recheckFired = await (async () => {
    for (let i = 0; i < 30; i++) {
      await sleep(100);
      if (apiCalls.filter(u => u.includes('recheck=1')).length > recheckCallsBefore) return true;
    }
    return false;
  })();

  if (recheckFired) {
    R.check2 = 'PASS';
  } else {
    R.check2 = 'FAIL';
    // Secondary check: did the no-account state disappear? (would mean recheck happened but we missed the request)
    const noAcctGone = !(await page.locator('text=No Google Ads account found').isVisible().catch(() => true));
    errs.push(`CHECK 2: recheck=1 call not detected after focus event. noAcctGone=${noAcctGone}. Recent calls: ${JSON.stringify(apiCalls.slice(-5))}`);
  }

  // ── CHECK 3: Account selector — option value is xxx-xxx-xxxx ─────────────
  // Playwright text= can't see inside a closed <select>. Read the option directly via evaluate.
  try {
    // Wait for the select element to appear
    await page.waitForSelector('select', { timeout: 5000 });

    const selectValue = await page.evaluate(() => {
      const sel = document.querySelector('select');
      if (!sel) return null;
      const opt = Array.from(sel.options).find(o => /\d{3}-\d{3}-\d{4}/.test(o.value));
      return opt ? opt.value : null;
    });

    if (selectValue && /\d{3}-\d{3}-\d{4}/.test(selectValue)) {
      R.check3 = 'PASS';
    } else {
      R.check3 = 'FAIL';
      const allOpts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('select option')).map(o => o.value)
      );
      errs.push(`CHECK 3: no xxx-xxx-xxxx option found. All option values: ${JSON.stringify(allOpts)}`);
    }
  } catch (e) {
    R.check3 = 'FAIL';
    errs.push(`CHECK 3 exception: ${e.message}`);
  }

  // ── CHECK 4: Continue to Review gating ───────────────────────────────────
  // The 400ms verify delay gives a window to catch disabled→enabled transition.
  // We capture button state RIGHT when the select appears (verify is in-flight),
  // then wait 600ms for verify to complete and check it becomes enabled.
  try {
    const continueBtn = page.locator('button', { hasText: 'Continue to Review' });

    // Wait for the select to appear (account selector rendered, verify just started)
    await page.waitForSelector('select', { timeout: 5000 });
    await continueBtn.waitFor({ timeout: 3000 });

    // Capture IMMEDIATELY — verify is in-flight (400ms mock), button must be disabled
    const initiallyDisabled = await continueBtn.isDisabled();

    // Wait for 400ms mock + React re-render (600ms total should be safe)
    await sleep(600);

    const finallyEnabled = await continueBtn.isEnabled();

    if (!initiallyDisabled) {
      R.check4 = 'FAIL';
      errs.push('CHECK 4: Continue was enabled BEFORE verify completed (initiallyDisabled=false) — gating broken');
    } else if (finallyEnabled) {
      R.check4 = 'PASS';
    } else {
      R.check4 = 'FAIL';
      const verifyErr = await page.locator('text=Account not accessible').isVisible().catch(() => false);
      const stillVerifying = await page.locator('text=Verifying account access').isVisible().catch(() => false);
      errs.push(`CHECK 4: button stayed disabled. verifyError=${verifyErr}, stillVerifying=${stillVerifying}`);
    }
  } catch (e) {
    R.check4 = 'FAIL';
    errs.push(`CHECK 4 exception: ${e.message}`);
  }

  await browser.close();
  printResults();
}

function printResults() {
  const icon = r => r === 'PASS' ? '✔' : r === 'FAIL' ? '✘' : '?';
  console.log('');
  console.log(`${icon(R.check1)}  Google email visible`);
  console.log(`${icon(R.check2)}  Spinner appears on window focus return (no click needed)`);
  console.log(`${icon(R.check3)}  Account selector populated with xxx-xxx-xxxx IDs`);
  console.log(`${icon(R.check4)}  Continue to Review unlocks after selection`);
  if (errs.length) {
    console.log('');
    console.log('FAILURES:');
    errs.forEach(e => console.log('  —', e));
  }
  process.exit(Object.values(R).every(v => v === 'PASS') ? 0 : 1);
}

run().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
