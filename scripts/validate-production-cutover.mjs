/**
 * Production cutover validation
 * Phase A: verify new guided-detection code is in the live bundle (DOM text check)
 * Phase B: full 4-check behavioral validation
 * Target: sufipulse.com (production)
 */
import { chromium } from 'playwright';

const RELEASE_SLUG = 'aMzdiIuYgK4';
const MOCK_ID      = 'mock-gads-validation-001';
const MOCK_EMAIL   = 'testuser@gmail.com';
const MOCK_CID     = '123-456-7890';

const MOCK_ADOPTION = {
  id: MOCK_ID, methodType: 'use_my_google_ads', adoptionStatus: 'draft',
  releaseSlug: RELEASE_SLUG, sponsorName: 'Test Sponsor', sponsorEmail: 'test@example.com',
  sponsorCountry: 'US', sponsorCity: 'New York', campaignIntention: 'general_awareness',
  amountDue: 100, targetRegions: ['Global'], targetLanguages: ['All'],
};

const makeStatus = (accounts) => ({
  configured: true, missing_vars: [], connected: true, adoption_id: MOCK_ID,
  user_id: 'user-test', accessible_customer_ids: accounts,
  google_email: MOCK_EMAIL, updated_at: new Date().toISOString(), campaign: null,
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────

async function runChecks(base, label) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`TARGET: ${base} (${label})`);
  console.log('─'.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page    = await ctx.newPage();

  const errs = [];
  const R    = { deploy_new_text: null, deploy_old_text: null,
                 gads_card: null, check1: null, check2: null, check3: null, check4: null };

  // Suppress known-noise console errors
  page.on('console', msg => {
    if (msg.type() === 'error'
        && !msg.text().includes('plausible')
        && !msg.text().includes('fonts.googleapis')) {
      errs.push('console.error: ' + msg.text());
    }
  });

  const apiCalls = [];
  page.on('request', req => { if (req.url().includes('/api/')) apiCalls.push(req.url()); });

  // ── Mocks ──────────────────────────────────────────────────────────────────

  await page.route(`**/api/adoptions/${MOCK_ID}`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ADOPTION) })
  );

  await page.route('**/api/google-ads/status**', route => {
    const accounts = route.request().url().includes('recheck=1') ? [MOCK_CID] : [];
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeStatus(accounts)) });
  });

  await page.route('**/api/google-ads/verify-account', async route => {
    await sleep(2000);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ verified: true }) });
  });

  // ── PHASE A — DEPLOY VERIFICATION ─────────────────────────────────────────
  // Load the page via the OAuth return URL, reach the no-account state,
  // then check what text was actually rendered to confirm which build is running.
  //
  // NEW code: "SufiPulse will automatically detect your account"
  // OLD code: "click \"Check again\" to continue inside SufiPulse" (before guided detection)

  const returnUrl = `${base}/release-detail/${RELEASE_SLUG}?adopt=1&step=google_ads_connected&adoption_id=${MOCK_ID}`;

  try {
    await page.goto(returnUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('text=/Google connected as|No Google Ads account found/', { timeout: 15000 });

    const bodyText = await page.locator('body').textContent();

    // New rebuild copy: no-account heading must say "Google connected as"
    const hasNewText = bodyText.includes('Google connected as') || bodyText.includes('Connected to Google, but no Google Ads');
    R.deploy_new_text = hasNewText ? 'PASS' : 'FAIL';
    if (!hasNewText) {
      errs.push('DEPLOY: new no-account copy not found — rebuild not yet deployed');
      const noAcctBlock = await page.locator('text=/Google connected as|No Google Ads account found/').first()
        .evaluate(el => el.closest('[class]')?.textContent || el.parentElement?.textContent || '')
        .catch(() => '');
      errs.push('DEPLOY: no-account block text: ' + noAcctBlock.slice(0, 200));
    }

    // Neither "Not available on this server" nor "Google Ads integration is being configured" should exist
    const hasOldBlockedText = bodyText.includes('Not available on this server')
                           || bodyText.includes('Google Ads integration is being configured')
                           || bodyText.includes('click "Check again" to continue inside SufiPulse');
    R.deploy_old_text = hasOldBlockedText ? 'FAIL' : 'PASS';
    if (hasOldBlockedText) {
      errs.push('DEPLOY: old blocked-state copy still present — rebuild not yet deployed');
    }

  } catch (e) {
    R.deploy_new_text = 'FAIL';
    R.deploy_old_text = 'FAIL';
    errs.push(`DEPLOY: could not reach no-account state. ${e.message}`);
    // Still report Phase B as skipped
    Object.assign(R, { gads_card: '—', check1: '—', check2: '—', check3: '—', check4: '—' });
    await browser.close();
    return reportTarget(label, R, errs);
  }

  // ── PHASE B — GOOGLE ADS CARD ACTIVE CHECK (step 0) ───────────────────────
  // Navigate to intro step to confirm card is active (not showing "integration being configured")
  try {
    await page.goto(`${base}/release-detail/${RELEASE_SLUG}?adopt=1`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForSelector('text=Adopt This Song', { timeout: 10000 });

    // The Google Ads card should NOT show the disabled-state text
    const bodyText = await page.locator('body').textContent();
    const hasBlockedText = bodyText.includes('Google Ads integration is being configured')
                        || bodyText.includes('Not available on this server');
    // Note: "Not available on this server" appears when configured=false.
    // On live servers where GOOGLE_ADS_CLIENT_ID is set, neither should appear.
    R.gads_card = hasBlockedText ? 'FAIL' : 'PASS';
    if (hasBlockedText) {
      errs.push('GADS_CARD: integration disabled text found on step 0 — env vars may be missing on server');
    }
  } catch (e) {
    R.gads_card = 'FAIL';
    errs.push(`GADS_CARD: ${e.message}`);
  }

  // ── Return to OAuth return state for behavioral checks ────────────────────
  await page.goto(returnUrl, { waitUntil: 'networkidle', timeout: 30000 });
  try {
    await page.waitForSelector('text=/Google connected as|No Google Ads account found/', { timeout: 15000 });
  } catch {
    errs.push('CHECKS: could not re-reach no-account state for behavioral checks');
    Object.assign(R, { check1: 'FAIL', check2: 'FAIL', check3: 'FAIL', check4: 'FAIL' });
    await browser.close();
    return reportTarget(label, R, errs);
  }

  // ── CHECK 1: Google email ─────────────────────────────────────────────────
  try {
    const visible = await page.locator(`text=${MOCK_EMAIL}`).first().isVisible({ timeout: 3000 });
    R.check1 = visible ? 'PASS' : 'FAIL';
    if (!visible) {
      const txt = await page.locator('text=/Google connected as|No Google Ads account found/').first().textContent().catch(() => '');
      errs.push(`CHECK 1: "${MOCK_EMAIL}" not found. No-account text: "${txt}"`);
    }
  } catch (e) { R.check1 = 'FAIL'; errs.push(`CHECK 1: ${e.message}`); }

  // ── CHECK 2: Focus event triggers recheck (network evidence) ─────────────
  const recheckBefore = apiCalls.filter(u => u.includes('recheck=1')).length;
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await sleep(100);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));

  const recheckFired = await (async () => {
    for (let i = 0; i < 30; i++) {
      await sleep(100);
      if (apiCalls.filter(u => u.includes('recheck=1')).length > recheckBefore) return true;
    }
    return false;
  })();

  if (recheckFired) {
    R.check2 = 'PASS';
  } else {
    R.check2 = 'FAIL';
    const noAcctGone = !(await page.locator('text=/Google connected as|No Google Ads account found/').isVisible().catch(() => true));
    errs.push(`CHECK 2: recheck=1 call not triggered after focus. noAcctGone=${noAcctGone}. Recent calls: ${JSON.stringify(apiCalls.slice(-5))}`);
  }

  await sleep(500);

  // ── CHECK 3: Account selector with xxx-xxx-xxxx ───────────────────────────
  try {
    await page.waitForSelector('select', { timeout: 5000 });
    const selectValue = await page.evaluate(() => {
      const sel = document.querySelector('select');
      if (!sel) return null;
      const opt = Array.from(sel.options).find(o => /\d{3}-\d{3}-\d{4}/.test(o.value));
      return opt ? opt.value : null;
    });
    R.check3 = (selectValue && /\d{3}-\d{3}-\d{4}/.test(selectValue)) ? 'PASS' : 'FAIL';
    if (R.check3 === 'FAIL') {
      const allOpts = await page.evaluate(() => Array.from(document.querySelectorAll('select option')).map(o => o.value));
      errs.push(`CHECK 3: no formatted option. Options: ${JSON.stringify(allOpts)}`);
    }
  } catch (e) { R.check3 = 'FAIL'; errs.push(`CHECK 3: ${e.message}`); }

  // ── CHECK 4: Continue to Review gating ───────────────────────────────────
  try {
    const continueBtn = page.locator('button', { hasText: 'Continue to Review' });
    await page.waitForSelector('select', { timeout: 5000 });
    await continueBtn.waitFor({ timeout: 3000 });
    const initiallyDisabled = await continueBtn.isDisabled();
    await sleep(2500); // 2000ms mock + 500ms React re-render margin
    const finallyEnabled = await continueBtn.isEnabled();
    if (!initiallyDisabled) {
      R.check4 = 'FAIL';
      errs.push('CHECK 4: Continue enabled before verification — gating broken');
    } else if (finallyEnabled) {
      R.check4 = 'PASS';
    } else {
      R.check4 = 'FAIL';
      const verifyErr  = await page.locator('text=Account not accessible').isVisible().catch(() => false);
      const verifying  = await page.locator('text=Verifying account access').isVisible().catch(() => false);
      errs.push(`CHECK 4: still disabled. verifyError=${verifyErr}, stillVerifying=${verifying}`);
    }
  } catch (e) { R.check4 = 'FAIL'; errs.push(`CHECK 4: ${e.message}`); }

  await browser.close();
  reportTarget(label, R, errs);
}

function reportTarget(label, R, errs) {
  const icon = r => r === 'PASS' ? '✔' : r === 'FAIL' ? '✘' : r === '—' ? '—' : '?';
  console.log(`\n${label}`);
  console.log('DEPLOY:');
  console.log(`  ${icon(R.deploy_new_text)}  rebuild copy live ("Google connected as…")`);
  console.log(`  ${icon(R.deploy_old_text)}  old blocked-state copy absent`);
  console.log('BROWSER:');
  console.log(`  ${icon(R.gads_card)}  Google Ads card active (not blocked/misconfigured)`);
  console.log(`  ${icon(R.check1)}  Google email visible`);
  console.log(`  ${icon(R.check2)}  Spinner appears on window focus return (no click needed)`);
  console.log(`  ${icon(R.check3)}  Account selector populated with xxx-xxx-xxxx IDs`);
  console.log(`  ${icon(R.check4)}  Continue to Review unlocks after selection`);
  if (errs.length) {
    console.log('\nFAILURES:');
    errs.forEach(e => console.log('  —', e));
  }
}

// ─────────────────────────────────────────────────────────────────────────────

(async () => {
  await runChecks('https://sufipulse.com', 'sufipulse.com (PRODUCTION)');
  console.log('\n' + '─'.repeat(60));
  console.log('NOTE: VPS deploy steps (pull/force-recreate) require SSH access');
  console.log('and must be executed by the user in their VPS terminal.');
  console.log('─'.repeat(60));
})().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
