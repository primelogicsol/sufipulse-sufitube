import { chromium } from 'playwright';
import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';

const PORT = process.argv[2] || '3000';
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = resolve('scripts/g8-screenshots-final');

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  console.log(`\n=== G8 Final Visual Capture ===`);
  console.log(`Server: ${BASE}`);
  
  // ── Desktop 1440px ──────────────────────────────────────────────────────────
  console.log('\nCapturing Desktop 1440px...');
  const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await dCtx.newPage();
  await dPage.goto(`${BASE}/releases`, { waitUntil: 'domcontentloaded' });
  
  // Wait for data load
  await dPage.waitForSelector('article, [class*="card"], img[src*="ytimg"]', { timeout: 15000 }).catch(() => {});
  await sleep(2000); // Allow rendering to settle

  // Extract Dropdowns securely via labels (User specified method)
  const dropdowns = await dPage.evaluate(() => {
    return Array.from(document.querySelectorAll('label')).map(label => {
      const wrapper = label.parentElement;
      const select = wrapper?.querySelector('select');
      
      if (!select) return null;
      
      return {
        label: label.textContent?.trim(),
        value: select.value,
        options: Array.from(select.options).map(o => ({
          value: o.value,
          text: o.textContent?.trim()
        }))
      };
    }).filter(Boolean);
  });
  
  console.log('\n--- Filter Dropdowns Found ---');
  dropdowns.forEach(d => {
    console.log(`Label: ${d.label}`);
    d.options.forEach(o => console.log(`  - ${o.text}`));
  });
  console.log('------------------------------\n');

  // Desktop captures
  await dPage.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  await dPage.screenshot({ path: `${OUT_DIR}/01_desktop_hero.png` });
  
  // Scroll down slightly to ensure Global Reach is visible (adjust based on typical layout)
  await dPage.evaluate(() => window.scrollBy(0, 600));
  await sleep(500);
  await dPage.screenshot({ path: `${OUT_DIR}/02_desktop_global_reach.png` });

  await dPage.evaluate(() => window.scrollBy(0, 600));
  await sleep(500);
  await dPage.screenshot({ path: `${OUT_DIR}/03_desktop_toolbar_cards.png` });

  await dPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(500);
  await dPage.screenshot({ path: `${OUT_DIR}/04_desktop_footer.png` });

  await dPage.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await dPage.screenshot({ path: `${OUT_DIR}/05_desktop_full.png`, fullPage: true });

  await dCtx.close();

  // ── Mobile 390px ─────────────────────────────────────────────────────────────
  console.log('Capturing Mobile 390px...');
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mPage = await mCtx.newPage();
  await mPage.goto(`${BASE}/releases`, { waitUntil: 'domcontentloaded' });
  
  await mPage.waitForSelector('article, [class*="card"], img[src*="ytimg"]', { timeout: 15000 }).catch(() => {});
  await sleep(2000);

  await mPage.evaluate(() => window.scrollTo(0, 0));
  await sleep(300);
  await mPage.screenshot({ path: `${OUT_DIR}/06_mobile_hero.png` });

  await mPage.evaluate(() => window.scrollBy(0, 800));
  await sleep(500);
  await mPage.screenshot({ path: `${OUT_DIR}/07_mobile_toolbar_cards.png` });

  await mPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(500);
  await mPage.screenshot({ path: `${OUT_DIR}/08_mobile_footer.png` });

  await mPage.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await mPage.screenshot({ path: `${OUT_DIR}/09_mobile_full.png`, fullPage: true });

  await mCtx.close();
  await browser.close();

  console.log(`\n✅ Captures complete in ${OUT_DIR}`);
}

run().catch(e => { console.error(e); process.exit(1); });
