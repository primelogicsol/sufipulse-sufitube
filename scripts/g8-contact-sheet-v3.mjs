import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

const SCREENSHOTS_DIR = resolve('scripts/g8-screenshots-final');
const OUT = resolve('scripts/g8-screenshots-final/g8-contact-sheet-v3.png');

const files = readdirSync(SCREENSHOTS_DIR)
  .filter(f => f.endsWith('.png') && !f.includes('contact'))
  .sort();

const images = files.map(f => {
  const data = readFileSync(resolve(SCREENSHOTS_DIR, f));
  return { name: f, b64: data.toString('base64') };
});

const html = `<!DOCTYPE html>
<html><head><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d0d0d;color:#eee;font-family:system-ui;padding:16px}
  h1{text-align:center;font-size:16px;margin-bottom:14px;color:#fff;padding-bottom:8px;border-bottom:1px solid #333}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .cell{background:#181818;border-radius:5px;overflow:hidden;border:1px solid #2a2a2a}
  .label{font-size:10px;padding:6px;background:#1e1e1e;color:#888;text-transform:uppercase;border-bottom:1px solid #2a2a2a}
  img{width:100%;display:block;object-fit:cover;object-position:top}
</style></head><body>
<h1>G8 Visual Review V3 — Fully Loaded Captures (1646c27)</h1>
<div class="grid">
${images.map((img) => `<div class="cell" ${img.name.includes('full') ? 'style="grid-column: 1 / -1"' : ''}>
  <div class="label">${img.name}</div>
  <img src="data:image/png;base64,${img.b64}" />
</div>`).join('\n')}
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(1000);
const h = await page.evaluate(() => document.body.scrollHeight);
await page.setViewportSize({ width: 1400, height: h });
await page.waitForTimeout(500);
await page.screenshot({ path: OUT, fullPage: true });
await browser.close();

console.log('V3 Contact Sheet saved to:', OUT);
