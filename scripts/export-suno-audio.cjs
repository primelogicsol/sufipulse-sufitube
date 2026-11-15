const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');

const [assetId, output] = process.argv.slice(2);
const timeout = 120_000;

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForCdp(port, deadline = Date.now() + 20_000) {
  const url = `http://127.0.0.1:${port}/json/version`;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 350));
  }
  throw new Error('Chrome debugging connection did not become ready.');
}

async function exportAudio() {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(assetId || '') || !output || !process.env.LOCALAPPDATA) {
    throw new Error('Suno export requires a song ID and a local Windows Chrome profile.');
  }

  const profile = path.join(process.env.LOCALAPPDATA, 'SufiPulse', 'StudioChrome');
  const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = await getFreePort();

  // Launch normal Chrome with the already-authenticated SufiPulse profile, then attach over CDP.
  // This avoids Playwright launchPersistentContext, which can cause Chrome to close immediately.
  const chromeProcess = spawn(chrome, [
    '--user-data-dir=' + profile,
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=' + port,
    '--new-window',
    '--start-maximized',
    'about:blank',
  ], { detached: false, stdio: 'ignore', windowsHide: false });

  let browser;
  try {
    await waitForCdp(port);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const context = browser.contexts()[0];
    if (!context) throw new Error('Chrome opened without an attachable browser context.');

    const pages = context.pages();
    const page = pages[0] || await context.newPage();
    const songUrl = 'https://suno.com/song/' + assetId;
    await page.goto(songUrl, { waitUntil: 'domcontentloaded', timeout: 25_000 });

    const login = page.getByRole('button', { name: /^(log in|sign in)$/i }).first();
    const options = page.getByRole('button', { name: /^more options for /i }).first();
    const signInDialog = page.getByRole('button', { name: /^continue with (google|apple|phone)$/i }).first();

    await login.or(signInDialog).or(options).first().waitFor({ timeout: 25_000 });
    await login.or(signInDialog).first().waitFor({ timeout: 2_500 }).catch(() => undefined);

    if (await login.isVisible().catch(() => false) || await signInDialog.isVisible().catch(() => false)) {
      throw new Error('Sign in to Suno again using Reconnect Suno, then retry Fetch from Suno.');
    }

    await options.click({ timeout: 10_000 });
    const menuItem = page.getByRole('menuitem', { name: /^download$/i });
    const downloadAction = menuItem.or(page.getByText('Download', { exact: true })).first();
    await downloadAction.waitFor({ timeout: 8_000 }).catch(() => {
      throw new Error('Suno did not offer this account a download for the selected song.');
    });

    const pending = page.waitForEvent('download', { timeout });
    await downloadAction.click();

    const confirm = page.getByRole('button', { name: /^(unlock & download|download)$/i }).last();
    const mp3Menu = page.getByRole('menuitem', { name: /^(mp3 audio|mp3)$/i }).first();
    const mp3Button = page.getByRole('button', { name: /^(mp3 audio|mp3)$/i }).first();

    const nextStep = await Promise.race([
      pending.then(() => 'download'),
      confirm.waitFor({ state: 'visible', timeout: 10_000 }).then(() => 'confirm').catch(() => 'none'),
      mp3Menu.waitFor({ state: 'visible', timeout: 10_000 }).then(() => 'mp3menu').catch(() => 'none'),
      mp3Button.waitFor({ state: 'visible', timeout: 10_000 }).then(() => 'mp3button').catch(() => 'none'),
    ]);

    if (nextStep === 'confirm') await confirm.click();
    if (nextStep === 'mp3menu') await mp3Menu.click();
    if (nextStep === 'mp3button') await mp3Button.click();

    const download = await pending;
    await download.saveAs(output);
    if ((await fs.stat(output)).size === 0) throw new Error('Suno returned an empty export.');
  } finally {
    if (browser) await browser.close().catch(() => undefined);
    if (!chromeProcess.killed) chromeProcess.kill();
  }
}

exportAudio().catch(error => {
  const message = error.message || '';
  console.error(message.startsWith('Suno ') || message.startsWith('Sign in ') ?
    message : 'Suno export failed: ' + message.split('\\n')[0].slice(0, 360));
  process.exitCode = 1;
});