import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/releases', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('article, [class*="card"], [class*="Card"]', { timeout: 12000 }).catch(() => {});
await new Promise(r => setTimeout(r, 2000));

const allSelects = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('select')).map(sel => ({
    label: sel.getAttribute('aria-label') || sel.name || sel.id || sel.closest('label')?.textContent?.trim() || '(unlabeled)',
    options: Array.from(sel.options).map(o => `${o.text} [${o.value}]`)
  }));
});

console.log('All <select> elements on /releases:');
allSelects.forEach((s, i) => {
  console.log(`  [${i}] ${s.label}`);
  s.options.forEach(o => console.log(`    ${o}`));
});

await browser.close();
