/**
 * g10-g14-browser-gates.mjs
 *
 * G10: Verify zero POST /api/auth/token/refresh in anonymous session.
 * G14: Verify exactly one /api/releases catalogue GET per user action.
 *
 * Runs against production build at http://localhost:3000 (or PORT env).
 * Uses Playwright in incognito/anonymous context (no stored cookies/session).
 *
 * GATE G10 PASS: POST /api/auth/token/refresh count = 0 across all navigations.
 * GATE G14 PASS: /api/releases collection GET count = 1 per action.
 *
 * Usage: node scripts/g10-g14-browser-gates.mjs [port]
 */

import { chromium } from 'playwright';

const PORT = process.argv[2] || '3000';
const BASE = `http://localhost:${PORT}`;

// Routes for G10 navigation sequence
const G10_ROUTES = ['/', '/releases', '/writers', '/vocalists', '/studio'];

// Auth-related patterns to monitor for G10
const AUTH_PATTERNS = [/\/api\/auth\/token\/refresh/, /\/api\/auth\/session/, /\/api\/auth\/token(?!\/refresh)/, /session/i];
const REFRESH_PATTERN = /\/api\/auth\/token\/refresh/;
const CATALOGUE_PATTERN = /\/api\/releases\?/;
const DETAIL_PATTERN = /\/api\/releases\/[^?]/;

function classifyRequest(url, method) {
  const isRefreshPost = method === 'POST' && REFRESH_PATTERN.test(url);
  const isAuthRelated = AUTH_PATTERNS.some(p => p.test(url));
  const isCatalogueGet = method === 'GET' && CATALOGUE_PATTERN.test(url) && !DETAIL_PATTERN.test(url);
  return { isRefreshPost, isAuthRelated, isCatalogueGet };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Fresh incognito context — no cookies, no session, no stored auth
  const context = await browser.newContext({
    storageState: undefined,
    ignoreHTTPSErrors: true,
  });

  const allRequests = [];

  context.on('request', req => {
    const url = req.url();
    const method = req.method();
    if (url.includes('localhost') || url.includes('auth') || url.includes('api/releases')) {
      allRequests.push({ method, url, time: Date.now() });
    }
  });

  console.log('\n=== G10/G14 Browser Gate Test ===');
  console.log(`Server: ${BASE}`);
  console.log('Context: Fresh anonymous (no cookies, no session)\n');

  // ── G10: Navigate all five routes ──────────────────────────────────────────
  console.log('── G10: Anonymous navigation sequence ──');
  const g10Events = [];
  let currentPage = await context.newPage();

  // Intercept only for G10 accounting
  currentPage.on('request', req => {
    const url = req.url();
    const method = req.method();
    const { isRefreshPost, isAuthRelated } = classifyRequest(url, method);
    if (isRefreshPost || isAuthRelated) {
      g10Events.push({ method, url });
    }
  });

  for (const route of G10_ROUTES) {
    const fullUrl = `${BASE}${route}`;
    console.log(`  → ${route}`);
    await currentPage.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(500); // Allow any deferred effects to fire
  }

  // G10 classification
  const refreshPosts = g10Events.filter(e => e.method === 'POST' && REFRESH_PATTERN.test(e.url));
  const authRelated = g10Events.filter(e => !REFRESH_PATTERN.test(e.url));

  console.log('\n  AUTH-related requests observed:');
  if (g10Events.length === 0) {
    console.log('    (none)');
  } else {
    g10Events.forEach(e => console.log(`    ${e.method} ${e.url}`));
  }
  console.log(`\n  POST /api/auth/token/refresh count: ${refreshPosts.length}`);
  const g10Pass = refreshPosts.length === 0;
  console.log(`  G10: ${g10Pass ? '✅ PASS' : '❌ FAIL'}`);

  // ── G14: Single-fetch verification ─────────────────────────────────────────
  console.log('\n── G14: Single catalogue fetch per user action ──');

  const g14Page = await context.newPage();
  const g14Results = [];

  // Use context-level listener so we catch all requests regardless of which page fires them
  function setupCapture() {
    const captures = [];
    const handler = req => {
      const url = req.url();
      const method = req.method();
      if (method === 'GET' && CATALOGUE_PATTERN.test(url) && !DETAIL_PATTERN.test(url)) {
        captures.push(url);
      }
    };
    context.on('request', handler);
    return {
      stop: () => { context.off('request', handler); return captures; }
    };
  }

  async function measureAction(label, action) {
    const cap = setupCapture();
    await action();
    // Wait long enough for: React hydration → useEffect → fetch → response
    await sleep(1500);
    const captures = cap.stop();
    const pass = captures.length === 1;
    g14Results.push({ label, count: captures.length, pass, urls: captures });
    console.log(`\n  [${label}]`);
    if (captures.length === 0) {
      console.log(`    (no catalogue GET observed)`);
    } else {
      captures.forEach(u => console.log(`    GET ${u.replace(BASE, '')}`));
    }
    console.log(`  Count: ${captures.length} — ${pass ? '✅ PASS' : '❌ FAIL (expected 1)'}`);
  }

  // Action 1: Initial /releases load
  await measureAction('Initial /releases load', async () => {
    await g14Page.goto(`${BASE}/releases`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  });

  // Action 2: Change one filter — use page.evaluate to trigger a React select change
  await measureAction('Change filter (Format → video)', async () => {
    try {
      const selects = await g14Page.$$('select');
      if (selects.length >= 2) {
        await selects[1].selectOption('video');
      } else if (selects.length === 1) {
        await selects[0].selectOption({ index: 1 });
      } else {
        // Try evaluating directly in the page for custom dropdowns
        await g14Page.evaluate(() => {
          const selects = document.querySelectorAll('select');
          if (selects[1]) { selects[1].value = 'video'; selects[1].dispatchEvent(new Event('change', { bubbles: true })); }
        });
      }
    } catch (e) {
      console.log(`    (filter action: ${e.message})`);
    }
  });

  // Action 3: Navigate to page 2 by URL (most reliable way to trigger a page change)
  await measureAction('Change page (→ page 2)', async () => {
    // Reload /releases with page=2 via URL — simulates pagination click on the client
    await g14Page.evaluate(() => {
      // Find and click page 2 button if it exists
      const buttons = Array.from(document.querySelectorAll('button'));
      const p2 = buttons.find(b => b.textContent.trim() === '2');
      if (p2) { p2.click(); return; }
      // Try aria-label
      const p2aria = document.querySelector('[aria-label="Page 2"]');
      if (p2aria) { p2aria.click(); return; }
    });
  });

  // Action 4: Type a search query and wait for 350ms debounce
  await measureAction('Search "Sufi" (after 350ms debounce)', async () => {
    try {
      const searchInput = await g14Page.$(
        'input[type="search"], input[placeholder*="earch" i], input[aria-label*="earch" i]'
      );
      if (searchInput) {
        await searchInput.fill('');
        await searchInput.type('Sufi', { delay: 50 });
        await sleep(500); // > 350ms debounce
      } else {
        console.log(`    (search input not found)`);
      }
    } catch (e) {
      console.log(`    (search: ${e.message})`);
    }
  });

  const g14Pass = g14Results.every(r => r.pass);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log('GATE EVIDENCE SUMMARY');
  console.log('═══════════════════════════════════════════════');
  console.log(`COMMIT:      3509252d561366bcdaf3e9df5e2e0431085f3560`);
  console.log(`ENVIRONMENT: Production build, ${BASE}`);
  console.log(`SESSION:     Incognito / anonymous (Playwright fresh context)\n`);

  console.log('G10 — Anonymous Token Refresh');
  console.log(`  ROUTES: ${G10_ROUTES.join(' → ')}`);
  console.log(`  POST /api/auth/token/refresh observed: ${refreshPosts.length}`);
  console.log(`  STATUS: ${g10Pass ? 'PASS ✅' : 'FAIL ❌'}\n`);

  console.log('G14 — Single Catalogue Fetch Per Action');
  g14Results.forEach(r => {
    console.log(`  [${r.label}]: ${r.count} request(s) — ${r.pass ? 'PASS ✅' : 'FAIL ❌'}`);
  });
  console.log(`  G14 overall: ${g14Pass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log('═══════════════════════════════════════════════\n');

  await browser.close();

  if (!g10Pass || !g14Pass) process.exit(1);
}

run().catch(err => {
  console.error('\n❌ Gate test script error:', err.message);
  process.exit(1);
});
