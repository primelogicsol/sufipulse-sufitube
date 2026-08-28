/**
 * g8-contact-sheet-v2.mjs
 * Waits for actual release card content to appear before screenshotting.
 */
import { chromium } from 'playwright';
import { resolve } from 'path';

const PORT = process.argv[2] || '3000';
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = resolve('scripts/g8-screenshots');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForCards(page, timeout = 15000) {
  // Wait for at least one release card to appear (indicates useEffect fetch completed)
  try {
    await page.waitForSelector(
      '[class*="card"], [class*="Card"], article, [class*="release"], img[src*="ytimg"]',
      { timeout }
    );
    await sleep(800); // Allow full render after first card appears
  } catch {
    await sleep(3000); // Fallback if no card selector found
  }
}

async function cap(page, label) {
  const safe = label.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const path = `${OUT_DIR}/v2_${safe}.png`;
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const paths = [];

  // ── Desktop 1440px ──────────────────────────────────────────────────────────
  const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await dCtx.newPage();
  await dPage.goto(`${BASE}/releases`, { waitUntil: 'domcontentloaded' });
  await waitForCards(dPage);

  // Above fold with hero
  await dPage.evaluate(() => window.scrollTo(0, 0));
  await sleep(200);
  paths.push(['01 Desktop — Hero & above fold', await cap(dPage, 'desktop_hero')]);

  // Scroll to filter toolbar
  await dPage.evaluate(() => window.scrollTo(0, 500));
  await sleep(200);
  paths.push(['02 Desktop — Filter toolbar & featured release', await cap(dPage, 'desktop_toolbar_featured')]);

  // Scroll to release cards grid
  await dPage.evaluate(() => window.scrollTo(0, 1000));
  await sleep(200);
  paths.push(['03 Desktop — Release cards grid', await cap(dPage, 'desktop_cards')]);

  // Scroll to bottom — pagination + footer
  await dPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(200);
  paths.push(['04 Desktop — Pagination & footer', await cap(dPage, 'desktop_pagination_footer')]);

  // Empty state: search ZZZNOMATCH
  await dPage.evaluate(() => window.scrollTo(0, 500));
  await sleep(200);
  const si = await dPage.$('input[type="search"], input[placeholder*="earch" i]');
  if (si) {
    await si.fill('ZZZNOMATCHZZZ');
    await sleep(800); // debounce
  }
  paths.push(['05 Desktop — Empty / no-results state', await cap(dPage, 'desktop_empty_state')]);
  if (si) { await si.fill(''); await sleep(800); }

  // Duration dropdown open — inspect labels
  await dPage.evaluate(() => window.scrollTo(0, 400));
  await sleep(200);
  const selects = await dPage.$$('select');
  let durationLabel = '(duration select not found)';
  for (const sel of selects) {
    const opts = await sel.evaluate(el =>
      Array.from(el.options).map(o => o.text)
    );
    if (opts.some(o => /duration|short|long|standard|default/i.test(o))) {
      durationLabel = opts.join(' | ');
    }
  }
  console.log('Duration options found:', durationLabel);
  paths.push(['06 Desktop — Filter zone (duration options logged above)', await cap(dPage, 'desktop_filter_zone')]);

  // Year facet — inspect options
  let yearOptions = '(year select not found)';
  for (const sel of selects) {
    const opts = await sel.evaluate(el =>
      Array.from(el.options).map(o => o.text)
    );
    if (opts.some(o => /202\d|year/i.test(o))) {
      yearOptions = opts.join(' | ');
    }
  }
  console.log('Year options found:', yearOptions);

  await dCtx.close();

  // ── Mobile 390px ─────────────────────────────────────────────────────────────
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mPage = await mCtx.newPage();
  await mPage.goto(`${BASE}/releases`, { waitUntil: 'domcontentloaded' });
  await waitForCards(mPage);

  await mPage.evaluate(() => window.scrollTo(0, 0));
  await sleep(200);
  paths.push(['07 Mobile 390px — Above fold', await cap(mPage, 'mobile_above_fold')]);

  await mPage.evaluate(() => window.scrollTo(0, 500));
  await sleep(200);
  paths.push(['08 Mobile 390px — Filter toolbar', await cap(mPage, 'mobile_toolbar')]);

  await mPage.evaluate(() => window.scrollTo(0, 900));
  await sleep(200);
  paths.push(['09 Mobile 390px — Release cards', await cap(mPage, 'mobile_cards')]);

  await mPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(200);
  paths.push(['10 Mobile 390px — Pagination & footer', await cap(mPage, 'mobile_footer')]);

  await mCtx.close();

  // ── Build contact sheet ───────────────────────────────────────────────────────
  const { readFileSync } = await import('fs');
  const images = paths.map(([label, path]) => ({
    label,
    b64: readFileSync(path).toString('base64'),
  }));

  const html = `<!DOCTYPE html><html><head><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0d0d0d;color:#eee;font-family:system-ui;padding:16px}
    h1{text-align:center;font-size:15px;margin-bottom:14px;color:#fff;padding-bottom:8px;border-bottom:1px solid #333}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .cell{background:#181818;border-radius:5px;overflow:hidden;border:1px solid #2a2a2a}
    .label{font-size:9px;padding:5px 7px;background:#1e1e1e;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #2a2a2a}
    img{width:100%;display:block;max-height:260px;object-fit:cover;object-position:top}
    .meta{font-size:8px;padding:4px 7px;color:#555;background:#111}
  </style></head><body>
  <h1>G8 Visual Review — /releases — Production (3509252) — Data-loaded captures</h1>
  <div class="grid">
  ${images.map((img, i) => `<div class="cell">
    <div class="label">${String(i+1).padStart(2,'0')}. ${img.label}</div>
    <img src="data:image/png;base64,${img.b64}" />
    <div class="meta">Duration: ${i===5 ? durationLabel.slice(0,120) : '—'} | Year: ${i===5 ? yearOptions.slice(0,80) : '—'}</div>
  </div>`).join('')}
  </div>
  <div style="margin-top:14px;background:#1a1a1a;padding:10px;border-radius:4px;font-size:10px;color:#666">
    <b style="color:#999">Duration options logged:</b> ${durationLabel}<br>
    <b style="color:#999">Year facet options logged:</b> ${yearOptions}
  </div>
  </body></html>`;

  const sheetCtx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const sheetPage = await sheetCtx.newPage();
  await sheetPage.setContent(html, { waitUntil: 'load' });
  await sleep(600);
  const h = await sheetPage.evaluate(() => document.body.scrollHeight);
  await sheetPage.setViewportSize({ width: 1400, height: h });
  await sleep(300);
  const outPath = `${OUT_DIR}/g8-contact-sheet-v2.png`;
  await sheetPage.screenshot({ path: outPath, fullPage: true });
  await sheetCtx.close();
  await browser.close();
  console.log('Contact sheet v2 saved to:', outPath);
}

run().catch(e => { console.error(e.message); process.exit(1); });
