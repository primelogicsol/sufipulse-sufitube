// One-time Suno connection for SufiPulse Studio.
// Google authentication happens in a normal Chrome window with NO browser automation attached.
// After you sign in and close that window, SufiPulse verifies the saved Suno session.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const local = process.env.LOCALAPPDATA;
if (!local) throw new Error('Windows local Chrome profile required.');
const profile = path.join(local, 'SufiPulse', 'StudioChrome');
const statusFile = path.join(local, 'SufiPulse', 'suno-connection.json');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function report(state, message) {
  fs.mkdirSync(path.dirname(statusFile), { recursive: true });
  fs.writeFileSync(statusFile, JSON.stringify({ state, message, updatedAt: new Date().toISOString() }));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(profile, { recursive: true });
  if (!fs.existsSync(chrome)) throw new Error('Google Chrome was not found.');

  report('connecting', 'Sign in to Suno in the normal Chrome window, then close that Suno window to verify.');
  const child = spawn(chrome, [
    '--user-data-dir=' + profile,
    '--new-window',
    '--start-maximized',
    'https://suno.com/create'
  ], { detached: false, stdio: 'ignore', windowsHide: false });

  console.log('Normal Chrome opened for Suno sign-in. Sign in, confirm your Suno account is visible, then CLOSE that dedicated Suno window.');

  // Wait until the dedicated Chrome process exits. No automation touches Google sign-in.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
      reject(new Error('Suno sign-in window timed out before it was closed.'));
    }, 15 * 60_000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.once('error', err => { clearTimeout(timer); reject(err); });
  });

  report('verifying', 'Verifying the saved Suno session.');
  await sleep(1200);

  const browser = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    headless: true,
    timeout: 15000,
  });
  try {
    const page = browser.pages()[0] || await browser.newPage();
    await page.goto('https://suno.com/create', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    const signedIn = await page.evaluate(() => {
      const text = document.body?.innerText || '';
      const hasLogin = /\b(log in|sign in|sign up|continue with google|continue with apple|continue with phone)\b/i.test(text);
      const hasAccountUi = /\b(library|studio|create)\b/i.test(text);
      return location.hostname.endsWith('suno.com') && hasAccountUi && !hasLogin;
    }).catch(() => false);

    if (!signedIn) {
      report('needs_signin', 'Suno sign-in was not detected. Click Connect Suno and try again.');
      process.exitCode = 2;
      return;
    }
    report('connected', 'Suno sign-in saved and verified. Future authorized imports reuse this session.');
    console.log('Suno connected and verified.');
  } finally {
    await browser.close().catch(() => undefined);
  }
})().catch(err => {
  report('needs_signin', 'Could not verify Suno login. Click Connect Suno and try again.');
  console.error(err.message);
  process.exit(1);
});