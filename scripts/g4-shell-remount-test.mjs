/**
 * g4-shell-remount-test.mjs
 *
 * G4: Verify that <header> and <footer> DOM nodes persist (are not remounted)
 * during client-side navigation through the five required public routes.
 *
 * Method:
 *   1. Navigate to /releases (initial load)
 *   2. Capture ElementHandles for <header> and <footer>
 *   3. Navigate to each next route by clicking an internal <a> link
 *      (not page.goto — simulates real App Router client navigation)
 *   4. After each navigation, verify the same DOM nodes are still connected
 *      (elementHandle.evaluate(el => el.isConnected) === true)
 *   5. A remount would create a new DOM node, making the original handle
 *      return isConnected === false
 *
 * G4 PASS: header isConnected = true AND footer isConnected = true
 *          after every route transition. Remount count = 0.
 *
 * G4 FAIL: header or footer isConnected = false at any point.
 *
 * Usage: node scripts/g4-shell-remount-test.mjs [port]
 */

import { chromium } from 'playwright';

const PORT = process.argv[2] || '3000';
const BASE = `http://localhost:${PORT}`;

const NAV_SEQUENCE = [
  { label: '/releases → /writers',    href: '/writers',    linkText: ['Writers', 'Literary Contributors', 'writers'] },
  { label: '/writers → /vocalists',   href: '/vocalists',  linkText: ['Vocalists', 'vocalists'] },
  { label: '/vocalists → /studio',    href: '/studio',     linkText: ['Studio', 'studio', 'Inside Studio'] },
  { label: '/studio → /releases',     href: '/releases',   linkText: ['Sufi Songs', 'SufiTube', 'Releases', 'releases'] },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function clickInternalLink(page, href, candidates) {
  // Try clicking a nav link with matching text or href
  for (const text of candidates) {
    try {
      const link = await page.$(`a[href="${href}"], nav a:has-text("${text}")`);
      if (link) {
        await link.click();
        await page.waitForURL(`**${href}`, { timeout: 10000 });
        return true;
      }
    } catch {}
  }
  // Fallback: evaluate to click any anchor with the matching href
  const clicked = await page.evaluate((targetHref) => {
    const links = Array.from(document.querySelectorAll('a'));
    const match = links.find(a => a.href.endsWith(targetHref) || a.getAttribute('href') === targetHref);
    if (match) { match.click(); return true; }
    return false;
  }, href);
  if (clicked) {
    await page.waitForURL(`**${href}`, { timeout: 10000 });
    return true;
  }
  return false;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n=== G4 — Persistent Shell Remount Test ===');
  console.log(`Server: ${BASE}`);
  console.log('Method: DOM node identity via Playwright ElementHandle.isConnected\n');

  // Navigate to initial route
  console.log('Initial navigation: /releases');
  await page.goto(`${BASE}/releases`, { waitUntil: 'load' });
  await sleep(1500); // Allow hydration

  // Capture original DOM node handles
  const headerHandle = await page.$('header');
  const footerHandle = await page.$('footer');

  if (!headerHandle) { console.error('❌ Could not find <header> element'); process.exit(1); }
  if (!footerHandle) { console.error('❌ Could not find <footer> element'); process.exit(1); }

  // Verify initial connection
  const headerInitial = await headerHandle.evaluate(el => el.isConnected);
  const footerInitial = await footerHandle.evaluate(el => el.isConnected);
  console.log(`Initial <header> connected: ${headerInitial}`);
  console.log(`Initial <footer> connected: ${footerInitial}\n`);

  let headerRemounts = 0;
  let footerRemounts = 0;
  const results = [];

  for (const step of NAV_SEQUENCE) {
    const navigated = await clickInternalLink(page, step.href, step.linkText);
    if (!navigated) {
      console.log(`  ⚠️  ${step.label}: could not find internal link, falling back to goto`);
      await page.goto(`${BASE}${step.href}`, { waitUntil: 'load' });
    }
    await sleep(800); // Allow App Router transition to settle

    const currentUrl = page.url();
    const headerConnected = await headerHandle.evaluate(el => el.isConnected).catch(() => false);
    const footerConnected = await footerHandle.evaluate(el => el.isConnected).catch(() => false);

    const headerRemounted = !headerConnected;
    const footerRemounted = !footerConnected;
    if (headerRemounted) headerRemounts++;
    if (footerRemounted) footerRemounts++;

    const stepPass = headerConnected && footerConnected;
    results.push({ label: step.label, url: currentUrl, headerConnected, footerConnected, pass: stepPass });

    console.log(`  ${step.label}`);
    console.log(`    URL: ${currentUrl.replace(BASE, '')}`);
    console.log(`    <header> isConnected: ${headerConnected}  ${headerRemounted ? '❌ REMOUNTED' : '✅'}`);
    console.log(`    <footer> isConnected: ${footerConnected}  ${footerRemounted ? '❌ REMOUNTED' : '✅'}`);
  }

  // Final summary
  const g4Pass = headerRemounts === 0 && footerRemounts === 0;

  console.log('\n═══════════════════════════════════════════════');
  console.log('GATE EVIDENCE — G4: Persistent Public Shell');
  console.log('═══════════════════════════════════════════════');
  console.log(`COMMIT:      3509252d561366bcdaf3e9df5e2e0431085f3560`);
  console.log(`ENVIRONMENT: Production build, ${BASE}`);
  console.log(`METHOD:      Playwright ElementHandle.isConnected after client-side link clicks\n`);
  console.log(`CRITERION:`);
  console.log(`  Header initial mount  = 1`);
  console.log(`  Footer initial mount  = 1`);
  console.log(`  Route sequence: /releases → /writers → /vocalists → /studio → /releases`);
  console.log(`  Header remounts = 0`);
  console.log(`  Footer remounts = 0\n`);
  console.log(`RESULT:`);
  console.log(`  Header remounts observed: ${headerRemounts}`);
  console.log(`  Footer remounts observed: ${footerRemounts}`);
  console.log(`\n  G4: ${g4Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════');

  await browser.close();
  if (!g4Pass) process.exit(1);
}

run().catch(err => {
  console.error('\n❌ G4 test error:', err.message);
  process.exit(1);
});
