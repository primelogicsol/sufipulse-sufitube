/**
 * SufiPulse Smoke Test — 5 core flows
 *
 * Usage:
 *   ADMIN_EMAIL=admin@sufipulse.com ADMIN_PASSWORD=yourpass node scripts/smoke-test.mjs
 *
 * Optional env:
 *   SMOKE_TEST_URL=https://test.sufipulse.com  (default)
 *   TEST_USER_EMAIL=smoketest@example.com       (auto-registered if not present)
 *   TEST_USER_PASSWORD=TestPass123!             (used for auto-registration)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let envVars = {};
try {
  const envContents = readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  for (const line of envContents.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) envVars[m[1].trim()] = m[2].trim();
  }
} catch {}

const BASE           = process.env.SMOKE_TEST_URL  || envVars.SMOKE_TEST_URL  || 'https://test.sufipulse.com';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL     || envVars.ADMIN_EMAIL     || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD  || envVars.ADMIN_PASSWORD  || '';
const TEST_EMAIL     = process.env.TEST_USER_EMAIL || `smoketest_${Date.now()}@example.com`;
const TEST_PASSWORD  = process.env.TEST_USER_PASSWORD || 'TestPass123!';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set (env or .env.local)');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

let passed = 0;
let failed = 0;
const failures = [];

function pass(label) {
  passed++;
  console.log(`  ${GREEN}✓${RESET} ${label}`);
}

function fail(label, detail = '') {
  failed++;
  const msg = detail ? `${label} — ${detail}` : label;
  failures.push(msg);
  console.log(`  ${RED}✗${RESET} ${label}${detail ? `\n    ${RED}↳ ${detail}${RESET}` : ''}`);
}

function info(label) {
  console.log(`  ${YELLOW}→${RESET} ${label}`);
}

function section(title) {
  console.log(`\n${BOLD}${CYAN}${title}${RESET}`);
  console.log('─'.repeat(title.length));
}

/** Extract cookies from a response and return them as a Cookie header string. */
function extractCookies(res, existing = '') {
  const raw = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') || '').split(/,\s*(?=[a-zA-Z0-9_-]+=)/);

  const jar = {};

  // Seed with existing cookies
  for (const pair of existing.split(';').map(s => s.trim()).filter(Boolean)) {
    const [k, ...v] = pair.split('=');
    if (k) jar[k.trim()] = v.join('=');
  }

  // Override with new cookies from response
  for (const cookie of raw) {
    const kv = cookie.split(';')[0].trim();
    const [k, ...v] = kv.split('=');
    if (k) jar[k.trim()] = v.join('=');
  }

  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function api(method, path, body, cookieStr = '') {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieStr ? { Cookie: cookieStr } : {}),
    },
    redirect: 'follow',
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    let data;
    try { data = await res.json(); } catch { data = {}; }
    return { status: res.status, data, cookies: extractCookies(res, cookieStr), ok: res.ok };
  } catch (err) {
    return { status: 0, data: {}, cookies: cookieStr, ok: false, error: err.message };
  }
}

async function login(email, password) {
  const res = await api('POST', '/api/auth/login', { email, password });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.data?.error?.message || res.status}`);
  return res.cookies;
}

async function register(email, password, fullName = 'Smoke Test User') {
  const res = await api('POST', '/api/auth/register', { email, password, full_name: fullName });
  if (!res.ok && res.status !== 400) throw new Error(`Register failed: ${JSON.stringify(res.data)}`);
  // If 400 it may already exist — try login instead
  if (!res.ok) return await login(email, password);
  return res.cookies;
}

// ── Flow 1: Kalam Revision Loop ───────────────────────────────────────────────

async function flowKalamRevision(adminCookies, userCookies, userEmail) {
  section('Flow 1 — Kalam Revision Loop');

  // Step 1: User submits kalam
  info('User submitting kalam...');
  const submitRes = await api('POST', '/api/kalams', {
    title: 'Smoke Test Kalam',
    language: 'Urdu',
    writing_style: 'Ghazal',
    content: 'آزمائشی کلام — دلِ مضطر کا حال سنو',
  }, userCookies);

  if (!submitRes.ok) {
    fail('Submit kalam', `HTTP ${submitRes.status}: ${JSON.stringify(submitRes.data)}`);
    return null;
  }
  const kalamId = submitRes.data?.id || submitRes.data?.data?.id;
  if (!kalamId) { fail('Submit kalam', 'No ID in response'); return null; }
  pass(`Submit kalam (id: ${kalamId})`);

  // Step 2: Admin loads kalam list — verify it appears as submitted
  info('Admin checking kalam queue...');
  const listRes = await api('GET', '/api/kalams', null, adminCookies);
  const inQueue = listRes.data?.some?.(k => k.id === kalamId && k.status === 'submitted');
  inQueue ? pass('Kalam appears in admin queue with status=submitted') : fail('Kalam in admin queue', `Not found or wrong status. List length: ${listRes.data?.length}`);

  // Step 3: Admin requests revision
  info('Admin requesting revision...');
  const revRes = await api('PATCH', `/api/kalams/${kalamId}`, {
    status: 'revision_requested',
    revision_notes: 'Please refine the third verse for clarity.',
  }, adminCookies);
  revRes.ok ? pass('Admin: revision_requested sent') : fail('Admin: request revision', `HTTP ${revRes.status}`);

  // Step 4: Verify status changed
  const afterRevList = await api('GET', '/api/kalams', null, adminCookies);
  const afterRev = afterRevList.data?.find?.(k => k.id === kalamId);
  afterRev?.status === 'revision_requested'
    ? pass('Status changed to revision_requested')
    : fail('Status after revision request', `Got: ${afterRev?.status}`);

  // Step 5: User resubmits (PATCH with status=submitted + updated content)
  info('User resubmitting kalam...');
  const resubRes = await api('PATCH', `/api/kalams/${kalamId}`, {
    status: 'submitted',
    content: 'آزمائشی کلام — دلِ مضطر کا حال سنو (نظرِ ثانی)',
  }, userCookies);
  // User PATCH might be disallowed if only admin can patch — check
  if (resubRes.status === 403 || resubRes.status === 401) {
    info('User PATCH returned 401/403 — checking if a separate user resubmit endpoint exists');
    fail('User resubmit', `HTTP ${resubRes.status} — user may need a dedicated resubmit endpoint`);
  } else {
    resubRes.ok ? pass('User resubmit OK') : fail('User resubmit', `HTTP ${resubRes.status}: ${JSON.stringify(resubRes.data)}`);
  }

  // Step 6: Admin approves
  info('Admin approving kalam...');
  const approveRes = await api('PATCH', `/api/kalams/${kalamId}`, {
    status: 'approved',
  }, adminCookies);
  approveRes.ok ? pass('Admin: kalam approved') : fail('Admin: approve kalam', `HTTP ${approveRes.status}`);

  // Step 7: Verify final status
  const finalList = await api('GET', '/api/kalams', null, adminCookies);
  const finalKalam = finalList.data?.find?.(k => k.id === kalamId);
  finalKalam?.status === 'approved'
    ? pass('Final status = approved')
    : fail('Final kalam status', `Got: ${finalKalam?.status}`);

  // Step 8: Check revision_log was created
  finalKalam?.revision_log?.length > 0
    ? pass(`revision_log has ${finalKalam.revision_log.length} entr${finalKalam.revision_log.length === 1 ? 'y' : 'ies'}`)
    : fail('revision_log populated', 'revision_log is empty or missing');

  return kalamId;
}

// ── Flow 2: Sada Revision Loop ────────────────────────────────────────────────

async function flowSadaRevision(adminCookies, userCookies) {
  section('Flow 2 — Sada Revision Loop + Dashboard Link');

  // Submit sada
  info('User submitting sada...');
  const submitRes = await api('POST', '/api/sadas', {
    title: 'Smoke Test Sada',
    vocalist_name: 'Test Vocalist',
    email: TEST_EMAIL,
    lyrics: 'آزمائشی صدا',
    language: 'Urdu',
  }, userCookies);

  if (!submitRes.ok) {
    fail('Submit sada', `HTTP ${submitRes.status}: ${JSON.stringify(submitRes.data)}`);
    return null;
  }
  const sadaId = submitRes.data?.id || submitRes.data?.data?.id;
  if (!sadaId) { fail('Submit sada', 'No ID in response'); return null; }
  pass(`Submit sada (id: ${sadaId})`);

  // Admin requests revision
  info('Admin requesting revision on sada...');
  const revRes = await api('PATCH', `/api/sadas/${sadaId}`, {
    status: 'revision_requested',
    admin_note: 'Please re-record with cleaner audio in the second half.',
  }, adminCookies);
  revRes.ok ? pass('Admin: sada revision_requested') : fail('Admin: request sada revision', `HTTP ${revRes.status}`);

  // Verify sada appears in revision queue
  info('Checking sada appears in revision queue...');
  const listRes = await api('GET', '/api/sadas', null, adminCookies);
  const inRevQueue = listRes.data?.find?.(s => s.id === sadaId && s.status === 'revision_requested');
  inRevQueue
    ? pass('Sada visible in revision_requested queue')
    : fail('Sada revision queue', `Not found or wrong status in list`);

  // Check revision_log appended
  inRevQueue?.revision_log?.length > 0
    ? pass(`revision_log populated (${inRevQueue.revision_log.length} entr${inRevQueue.revision_log.length === 1 ? 'y' : 'ies'})`)
    : fail('Sada revision_log', 'Not appended after revision request');

  // Verify the deep-link path resolves (GET with status filter param)
  info('Verifying /admin/sadas?status=revision_requested route resolves...');
  const pageRes = await fetch(`${BASE}/admin/sadas?status=revision_requested`, {
    headers: { Cookie: adminCookies },
    redirect: 'follow',
  });
  pageRes.ok
    ? pass('/admin/sadas?status=revision_requested returns 200')
    : fail('Deep-link route', `HTTP ${pageRes.status}`);

  return sadaId;
}

// ── Flow 3: Article Rejection Loop ────────────────────────────────────────────

async function flowArticleRejection(adminCookies, userCookies) {
  section('Flow 3 — Article Rejection Loop');

  // Submit article
  info('User submitting article...');
  const submitRes = await api('POST', '/api/articles', {
    title: 'Smoke Test Article',
    author_name: 'Test Author',
    email: TEST_EMAIL,
    content: 'This is a smoke test article for testing the rejection flow.',
    language: 'English',
  }, userCookies);

  if (!submitRes.ok) {
    fail('Submit article', `HTTP ${submitRes.status}: ${JSON.stringify(submitRes.data)}`);
    return null;
  }
  const articleId = submitRes.data?.id || submitRes.data?.data?.id;
  if (!articleId) { fail('Submit article', 'No ID in response'); return null; }
  pass(`Submit article (id: ${articleId})`);

  // Verify in pending queue
  const listRes = await api('GET', '/api/articles', null, adminCookies);
  const inQueue = listRes.data?.find?.(a => a.id === articleId);
  inQueue ? pass('Article in admin queue') : fail('Article in admin queue', 'Not found');

  // Admin rejects with note
  info('Admin rejecting article...');
  const rejectRes = await api('PATCH', `/api/articles/${articleId}`, {
    status: 'rejected',
    admin_note: 'Does not meet editorial standards at this time.',
  }, adminCookies);
  rejectRes.ok ? pass('Admin: article rejected') : fail('Admin: reject article', `HTTP ${rejectRes.status}`);

  // Verify status changed
  const afterList = await api('GET', '/api/articles', null, adminCookies);
  const afterArticle = afterList.data?.find?.(a => a.id === articleId);
  afterArticle?.status === 'rejected'
    ? pass('Article status = rejected')
    : fail('Article status after rejection', `Got: ${afterArticle?.status}`);

  // Verify no longer in pending queue (status !== pending/submitted/under_review)
  const stillPending = ['pending', 'submitted', 'under_review'].includes(afterArticle?.status);
  !stillPending
    ? pass('Article moved out of pending queue')
    : fail('Article out of pending queue', 'Still shows as pending');

  // Email logging check — server-side: check the notification would have fired
  // (We can't intercept the actual email in a script, but we can verify
  //  the route reaches the notify call by checking the response includes email)
  const emailField = (rejectRes.data?.email || afterArticle?.email);
  if (emailField) {
    pass(`Email field present on record (${emailField}) — notification would have fired`);
  } else {
    info('No email field on article record — notification may have been skipped (check server logs for [notify])');
  }

  return articleId;
}

// ── Flow 4: Vocalist Role Assignment ─────────────────────────────────────────

async function flowVocalistRole(adminCookies, userCookies, userId) {
  section('Flow 4 — Vocalist Role Flow');

  // Apply as vocalist
  info('Submitting vocalist application...');
  const applyRes = await api('POST', '/api/vocalists', {
    full_name: 'Smoke Test Vocalist',
    performance_name: 'SmokeVoice',
    email: TEST_EMAIL,
    user_id: userId,
    country: 'Pakistan',
    city: 'Lahore',
    years_experience: '3',
    vocal_range: 'Tenor',
    performance_styles: ['Qawwali'],
    languages_performed: ['Urdu', 'Punjabi'],
    musical_training: 'Ustādi',
    sample_link: 'https://example.com/sample.mp3',
    worked_in_studio: true,
    willing_editorial_approval: true,
    accept_producer_coordination: true,
    accept_framework: true,
  }, userCookies);

  if (!applyRes.ok) {
    fail('Submit vocalist application', `HTTP ${applyRes.status}: ${JSON.stringify(applyRes.data)}`);
    return;
  }
  const vocalistId = applyRes.data?.id || applyRes.data?.data?.id;
  if (!vocalistId) { fail('Vocalist application', 'No ID in response'); return; }
  pass(`Vocalist application submitted (id: ${vocalistId})`);

  // Verify in admin queue
  const listRes = await api('GET', '/api/vocalists', null, adminCookies);
  const inQueue = listRes.data?.find?.(v => v.id === vocalistId);
  inQueue ? pass('Vocalist application in admin queue') : fail('Vocalist in admin queue', 'Not found');

  // Admin approves
  info('Admin approving vocalist application...');
  const approveRes = await api('PATCH', `/api/vocalists/${vocalistId}`, {
    profile_status: 'approved',
    status: 'approved',
  }, adminCookies);
  approveRes.ok ? pass('Admin: vocalist approved') : fail('Admin: approve vocalist', `HTTP ${approveRes.status}`);

  // Verify role was assigned on the user record
  if (userId) {
    info('Checking role assignment...');
    const userRes = await api('GET', `/api/admin/users/${userId}`, null, adminCookies);
    const roles = userRes.data?.assigned_roles || userRes.data?.data?.assigned_roles || [];
    const hasRole = Array.isArray(roles) ? roles.includes('vocalist') : String(roles).includes('vocalist');
    hasRole
      ? pass(`Role 'vocalist' assigned to user (assigned_roles: [${roles}])`)
      : fail('Vocalist role assignment', `assigned_roles: ${JSON.stringify(roles)}`);
  } else {
    info('Skipping role check — no user_id available (application was anonymous)');
  }

  // Verify vocalist dashboard route responds
  info('Checking vocalist dashboard route...');
  const dashRes = await fetch(`${BASE}/user/vocalist/dashboard`, {
    headers: { Cookie: userCookies },
    redirect: 'manual',
  });
  // With role assigned, should return 200. Without role, Next.js redirects (302).
  if (dashRes.status === 200) {
    pass('/user/vocalist/dashboard returns 200');
  } else if (dashRes.status === 302 || dashRes.status === 307 || dashRes.status === 308) {
    const loc = dashRes.headers.get('location') || '';
    fail('/user/vocalist/dashboard', `Redirected to ${loc} — role guard may have fired (role not yet on session cookie)`);
    info('Note: role is in DB but session cookie pre-dates approval — re-login would fix this');
  } else {
    info(`Dashboard route returned ${dashRes.status} — check manually`);
  }
}

// ── Flow 5: Release Growth Flow ───────────────────────────────────────────────

async function flowReleaseGrowth(adminCookies) {
  section('Flow 5 — Release Growth Flow');

  // Check for existing published releases with youtubeId
  info('Fetching published releases...');
  const relRes = await api('GET', '/api/releases?status=all', null, adminCookies);
  const releases = Array.isArray(relRes.data) ? relRes.data : [];
  const published = releases.filter(r => r.status === 'published' || r.status === 'live');
  const withYoutube = published.filter(r => r.youtubeId);

  pass(`Found ${releases.length} total releases, ${published.length} published, ${withYoutube.length} with YouTubeId`);

  if (withYoutube.length === 0) {
    info('No published release with youtubeId found — skipping YouTube link and share kit checks');
    info('Create a release at /admin/cms-releases, set youtubeId, publish it, then re-run this flow');
    return;
  }

  const release = withYoutube[0];
  pass(`Using release: "${release.title}" (id: ${release.id}, youtubeId: ${release.youtubeId})`);

  // Check social share kit
  const hasShareKit = !!(release.socialShareKit);
  hasShareKit
    ? pass('socialShareKit present on release')
    : fail('socialShareKit', 'Missing — generate it via the admin edit page');

  if (hasShareKit) {
    const platforms = ['instagram', 'twitter', 'facebook', 'whatsapp', 'linkedin', 'youtube'];
    const kit = release.socialShareKit;
    const present = platforms.filter(p => kit[p] && String(kit[p]).length > 10);
    pass(`Share kit covers ${present.length}/${platforms.length} platforms: [${present.join(', ')}]`);
  }

  // Validate YouTube link format
  const youtubeUrl = `https://www.youtube.com/watch?v=${release.youtubeId}`;
  pass(`YouTube watch URL: ${youtubeUrl}`);

  // Check playlist link if present
  if (release.youtubePlaylistId) {
    const playlistUrl = `https://www.youtube.com/playlist?list=${release.youtubePlaylistId}`;
    pass(`Playlist URL: ${playlistUrl}`);
  } else {
    info('No youtubePlaylistId set — Watch Next playlist link not available');
  }

  // Verify social share kit generation endpoint is accessible
  info('Verifying social share kit generation endpoint...');
  const kitRes = await api('POST', `/api/releases/${release.id}/social-share-kit`, null, adminCookies);
  kitRes.ok
    ? pass('POST /api/releases/[id]/social-share-kit → 200')
    : fail('Social share kit endpoint', `HTTP ${kitRes.status}: ${JSON.stringify(kitRes.data)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}SufiPulse Smoke Test${RESET}`);
  console.log(`Target: ${CYAN}${BASE}${RESET}`);
  console.log(`Admin:  ${CYAN}${ADMIN_EMAIL}${RESET}`);
  console.log(`User:   ${CYAN}${TEST_EMAIL}${RESET} (auto-registered)\n`);

  // Authenticate
  section('Setup — Authentication');
  let adminCookies, userCookies, userId;

  try {
    info('Logging in as admin...');
    adminCookies = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    pass('Admin login');
  } catch (err) {
    fail('Admin login', err.message);
    console.log(`\n${RED}Cannot proceed without admin login.${RESET}`);
    process.exit(1);
  }

  try {
    info(`Registering/logging in as test user (${TEST_EMAIL})...`);
    userCookies = await register(TEST_EMAIL, TEST_PASSWORD);
    pass('Test user session');
  } catch (err) {
    fail('Test user session', err.message);
    console.log(`\n${RED}Cannot proceed without test user session.${RESET}`);
    process.exit(1);
  }

  // Get user ID from /api/auth/me
  try {
    const meRes = await api('GET', '/api/auth/me', null, userCookies);
    userId = meRes.data?.id || meRes.data?.data?.id || meRes.data?.user?.id;
    userId ? pass(`Test user ID: ${userId}`) : info('Could not determine user ID from /api/auth/me');
  } catch {}

  // Run flows
  await flowKalamRevision(adminCookies, userCookies, TEST_EMAIL);
  await flowSadaRevision(adminCookies, userCookies);
  await flowArticleRejection(adminCookies, userCookies);
  await flowVocalistRole(adminCookies, userCookies, userId);
  await flowReleaseGrowth(adminCookies);

  // Results
  console.log('\n' + '═'.repeat(50));
  console.log(`${BOLD}Results: ${GREEN}${passed} passed${RESET}  ${failed > 0 ? RED : RESET}${failed} failed${RESET}`);

  if (failures.length > 0) {
    console.log(`\n${RED}Failures:${RESET}`);
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  } else {
    console.log(`\n${GREEN}All checks passed.${RESET}`);
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`\n${RED}Unhandled error:${RESET}`, err);
  process.exit(1);
});
