/**
 * g8-visual-capture.mjs
 *
 * G8: Capture screenshots of /releases at desktop and mobile widths
 * for human visual review across eight required zones.
 *
 * Screenshots are saved to: scripts/g8-screenshots/
 *
 * Usage: node scripts/g8-visual-capture.mjs [port]
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';

const PORT = process.argv[2] || '3000';
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = resolve('scripts/g8-screenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function capture(page, label, selector) {
  const safe = label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const path = `${OUT_DIR}/${safe}.png`;
  if (selector) {
    try {
      const el = await page.$(selector);
      if (el) {
        await el.screenshot({ path });
        console.log(`  📸 ${label} → g8-screenshots/${safe}.png`);
        return;
      }
    } catch {}
  }
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${label} → g8-screenshots/${safe}.png`);
}

async function run() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  console.log('\n=== G8 — Visual Capture: /releases ===');
  console.log(`Server: ${BASE}`);
  console.log(`Screenshots → ${OUT_DIR}\n`);

  // ── Desktop (1440px) ──────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/releases`, { waitUntil: 'load' });
    await sleep(2000); // Allow useEffect data load

    console.log('Desktop 1440px:');

    // Full above-fold
    await capture(page, '01_desktop_above_fold', null);

    // Scroll to hero zone
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(300);
    await capture(page, '02_desktop_hero_zone', 'header ~ * section:first-of-type, [class*="hero"], [class*="banner"]');

    // Filter toolbar
    await capture(page, '03_desktop_toolbar', '[class*="filter"], form, .toolbar, select');

    // Scroll to release cards
    await page.evaluate(() => window.scrollTo(0, 600));
    await sleep(300);
    await page.screenshot({ path: `${OUT_DIR}/04_desktop_cards_section.png`, fullPage: false });
    console.log('  📸 04_desktop_cards_section → g8-screenshots/04_desktop_cards_section.png');

    // Scroll to bottom — pagination
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(300);
    await page.screenshot({ path: `${OUT_DIR}/05_desktop_pagination_footer.png`, fullPage: false });
    console.log('  📸 05_desktop_pagination_footer → g8-screenshots/05_desktop_pagination_footer.png');

    // Full page scroll screenshot
    await page.screenshot({ path: `${OUT_DIR}/06_desktop_full_page.png`, fullPage: true });
    console.log('  📸 06_desktop_full_page → g8-screenshots/06_desktop_full_page.png');

    // Test empty state — search for something that won't match
    await page.evaluate(() => window.scrollTo(0, 300));
    await sleep(200);
    const searchInput = await page.$('input[type="search"], input[placeholder*="earch" i]');
    if (searchInput) {
      await searchInput.fill('ZZZNOMATCHZZZ');
      await sleep(700); // debounce
      await page.screenshot({ path: `${OUT_DIR}/07_desktop_empty_state.png`, fullPage: false });
      console.log('  📸 07_desktop_empty_state → g8-screenshots/07_desktop_empty_state.png');
      await searchInput.fill(''); // clear
      await sleep(700);
    }

    await ctx.close();
  }

  // ── Mobile (390px iPhone 14) ──────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/releases`, { waitUntil: 'load' });
    await sleep(2000);

    console.log('\nMobile 390px:');

    await page.screenshot({ path: `${OUT_DIR}/08_mobile_above_fold.png`, fullPage: false });
    console.log('  📸 08_mobile_above_fold → g8-screenshots/08_mobile_above_fold.png');

    await page.evaluate(() => window.scrollTo(0, 400));
    await sleep(300);
    await page.screenshot({ path: `${OUT_DIR}/09_mobile_filter_cards.png`, fullPage: false });
    console.log('  📸 09_mobile_filter_cards → g8-screenshots/09_mobile_filter_cards.png');

    await page.screenshot({ path: `${OUT_DIR}/10_mobile_full_page.png`, fullPage: true });
    console.log('  📸 10_mobile_full_page → g8-screenshots/10_mobile_full_page.png');

    await ctx.close();
  }

  await browser.close();

  console.log('\n=== G8 Screenshot Capture Complete ===');
  console.log('Review the following for each zone:');
  console.log('  1. Hero: banner visible, title hierarchy, no clipping');
  console.log('  2. Global Reach: no duplicate banner / awkward spacing');
  console.log('  3. Featured release: artwork, title, metadata, CTAs coherent');
  console.log('  4. Toolbar: search + 5 filters aligned');
  console.log('  5. Duration labels: Default (Standard/Long) / Any / Short / Standard / Long');
  console.log('  6. Year facet: all catalogue years, not just current page');
  console.log('  7. Cards: canonical title, governance label, duration, metadata');
  console.log('  8. Pagination + states: page controls, empty state, loading state');
  console.log('\nG8 status: REQUIRES HUMAN VISUAL REVIEW of screenshots above.');
}

run().catch(err => {
  console.error('G8 capture error:', err.message);
  process.exit(1);
});
