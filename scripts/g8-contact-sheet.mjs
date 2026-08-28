/**
 * g8-contact-sheet.mjs
 * Renders all 10 G8 screenshots into a single contact-sheet PNG.
 */
import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

const SCREENSHOTS_DIR = resolve('scripts/g8-screenshots');
const OUT = resolve('scripts/g8-screenshots/g8-contact-sheet.png');

const files = readdirSync(SCREENSHOTS_DIR)
  .filter(f => f.endsWith('.png') && !f.includes('contact'))
  .sort();

const images = files.map(f => {
  const data = readFileSync(resolve(SCREENSHOTS_DIR, f));
  return { name: f.replace('.png','').replace(/_/g,' '), b64: data.toString('base64') };
});

const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #111; color: #eee; font-family: system-ui, sans-serif; padding: 20px; }
  h1 { text-align: center; font-size: 18px; margin-bottom: 16px; color: #fff;
       border-bottom: 1px solid #444; padding-bottom: 10px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .cell { background: #1a1a1a; border-radius: 6px; overflow: hidden;
          border: 1px solid #333; }
  .label { font-size: 10px; padding: 6px 8px; background: #222; color: #aaa;
           border-bottom: 1px solid #333; text-transform: uppercase; letter-spacing: 0.5px; }
  img { width: 100%; height: auto; display: block; max-height: 220px;
        object-fit: cover; object-position: top; }
  .full-row { grid-column: 1 / -1; }
  .full-row img { max-height: 160px; }
</style>
</head>
<body>
<h1>G8 Visual Review — /releases — Production Build (3509252)</h1>
<div class="grid">
${images.map((img, i) => {
  const isFullPage = img.name.includes('full page');
  return `<div class="cell${isFullPage ? ' full-row' : ''}">
    <div class="label">${String(i+1).padStart(2,'0')}. ${img.name}</div>
    <img src="data:image/png;base64,${img.b64}" alt="${img.name}" />
  </div>`;
}).join('\n')}
</div>
</body>
</html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1600, height: 900 });
await page.setContent(html, { waitUntil: 'load' });

// Wait for all images to render
await page.waitForTimeout(500);

// Capture full-page height
const fullHeight = await page.evaluate(() => document.body.scrollHeight);
await page.setViewportSize({ width: 1600, height: fullHeight });
await page.waitForTimeout(300);

await page.screenshot({ path: OUT, fullPage: true });
await browser.close();

console.log('Contact sheet saved to:', OUT);
