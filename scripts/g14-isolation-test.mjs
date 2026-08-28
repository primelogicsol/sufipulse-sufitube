/**
 * g14-isolation-test.mjs
 * Isolates each G14 action with separate, non-overlapping measurement windows.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('G14 Isolation Test — production server at', BASE);

  // ── Step 1: Initial load ──────────────────────────────────────────────────
  const step1 = [];
  const h1 = req => { if (req.url().includes('/api/releases?')) step1.push(req.url().replace(BASE, '')); };
  context.on('request', h1);

  await page.goto(`${BASE}/releases`, { waitUntil: 'load' });
  await sleep(3000); // Allow useEffect hydration + fetch + response

  context.off('request', h1);
  console.log('\n[1] Initial load');
  console.log('  Count:', step1.length);
  step1.forEach(u => console.log('  GET', u));
  const step1Pass = step1.length === 1;
  console.log('  Result:', step1Pass ? '✅ PASS' : `❌ FAIL (expected 1, got ${step1.length})`);

  // ── Step 2: Filter change ─────────────────────────────────────────────────
  await sleep(500); // Pause between actions
  const step2 = [];
  const h2 = req => { if (req.url().includes('/api/releases?')) step2.push(req.url().replace(BASE, '')); };
  context.on('request', h2);

  const selects = await page.$$('select');
  if (selects.length >= 2) {
    await selects[1].selectOption('video');
  } else {
    console.log('  (no format select found)');
  }
  await sleep(2000);

  context.off('request', h2);
  console.log('\n[2] Filter change (format → video)');
  console.log('  Count:', step2.length);
  step2.forEach(u => console.log('  GET', u));
  const step2Pass = step2.length === 1;
  console.log('  Result:', step2Pass ? '✅ PASS' : `❌ FAIL (expected 1, got ${step2.length})`);

  // ── Step 3: Page change ───────────────────────────────────────────────────
  await sleep(500);
  const step3 = [];
  const h3 = req => { if (req.url().includes('/api/releases?')) step3.push(req.url().replace(BASE, '')); };
  context.on('request', h3);

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const p2 = buttons.find(b => b.textContent.trim() === '2');
    if (p2) p2.click();
    else {
      const p2aria = document.querySelector('[aria-label="Page 2"]');
      if (p2aria) p2aria.click();
    }
  });
  await sleep(2000);

  context.off('request', h3);
  console.log('\n[3] Page change (→ page 2)');
  console.log('  Count:', step3.length);
  step3.forEach(u => console.log('  GET', u));
  const step3Pass = step3.length === 1;
  console.log('  Result:', step3Pass ? '✅ PASS' : `❌ FAIL (expected 1, got ${step3.length})`);

  // ── Step 4: Search ────────────────────────────────────────────────────────
  await sleep(500);
  const step4 = [];
  const h4 = req => { if (req.url().includes('/api/releases?')) step4.push(req.url().replace(BASE, '')); };
  context.on('request', h4);

  const searchInput = await page.$('input[type="search"], input[placeholder*="earch" i], input[aria-label*="earch" i]');
  if (searchInput) {
    await searchInput.fill('');
    await searchInput.type('Sufi', { delay: 50 });
    await sleep(500); // > 350ms debounce
  } else {
    console.log('  (search input not found)');
  }

  context.off('request', h4);
  console.log('\n[4] Search "Sufi" (after 350ms debounce)');
  console.log('  Count:', step4.length);
  step4.forEach(u => console.log('  GET', u));
  const step4Pass = step4.length === 1;
  console.log('  Result:', step4Pass ? '✅ PASS' : `❌ FAIL (expected 1, got ${step4.length})`);

  // Summary
  const allPass = step1Pass && step2Pass && step3Pass && step4Pass;
  console.log('\n═══════════════════════════════════');
  console.log('G14 Isolation Results');
  console.log('  Initial load:  ', step1Pass ? 'PASS ✅' : `FAIL ❌ (${step1.length} requests)`);
  console.log('  Filter change: ', step2Pass ? 'PASS ✅' : `FAIL ❌ (${step2.length} requests)`);
  console.log('  Page change:   ', step3Pass ? 'PASS ✅' : `FAIL ❌ (${step3.length} requests)`);
  console.log('  Search:        ', step4Pass ? 'PASS ✅' : `FAIL ❌ (${step4.length} requests)`);
  console.log('  G14 overall:  ', allPass ? 'PASS ✅' : 'FAIL ❌');
  console.log('═══════════════════════════════════');

  await browser.close();
  if (!allPass) process.exit(1);
}

run().catch(err => { console.error(err.message); process.exit(1); });
