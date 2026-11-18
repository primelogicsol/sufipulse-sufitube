/**
 * scripts/pre-deploy-verify.ts
 *
 * Automated Deployment Verification Gate for SufiPulse.
 * Validates critical routes, redirects, CMS data integrity, social share content,
 * and cutdown passages before code is committed or deployed.
 *
 * Run with: npx tsx scripts/pre-deploy-verify.ts
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import dotenv from 'dotenv';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

interface CheckResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: CheckResult[] = [];
let spawnedServer: ChildProcess | null = null;

function record(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${details ? ` (${details})` : ''}`);
}

async function isServerListening(port: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/version`, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      // Try root route if /api/version is not yet cached
      const reqRoot = http.get(`http://localhost:${port}/`, (res2) => {
        resolve(true);
      });
      reqRoot.on('error', () => resolve(false));
      reqRoot.setTimeout(1000, () => {
        reqRoot.destroy();
        resolve(false);
      });
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerRunning(): Promise<boolean> {
  const port = process.env.PORT || '3005';
  const listening = await isServerListening(port);
  if (listening) {
    console.log(`📡 Detected responsive server on port ${port}.`);
    return true;
  }

  console.log(`⏳ Server not detected on port ${port}. Launching Next.js instance...`);
  try {
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';
    spawnedServer = spawn(npxCmd, ['next', 'start', '-p', port], {
      stdio: 'ignore',
      detached: false,
      env: { ...process.env, PORT: port, NODE_ENV: 'production' }
    });

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (await isServerListening(port)) {
        console.log(`🚀 Automated test server ready on port ${port}.`);
        return true;
      }
    }
  } catch (err: any) {
    console.error(`Failed to launch automated test server: ${err.message}`);
  }
  return false;
}

async function fetchRoute(urlPath: string): Promise<{ status: number; location?: string; body: string }> {
  const port = process.env.PORT || '3005';
  const url = `http://localhost:${port}${urlPath}`;

  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          location: res.headers.location,
          body
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function verifyRoutes() {
  console.log('\n--- 1. Route & Redirect Verification ---');

  const serverReady = await ensureServerRunning();
  if (!serverReady) {
    record('Server route connectivity', false, 'Server could not be detected or spawned on port 3005');
    return;
  }

  // 1.1 Redirects
  try {
    const rMithaq = await fetchRoute('/mithaq');
    record('Redirect /mithaq -> /governance/mithaq', rMithaq.status === 308 && rMithaq.location === '/governance/mithaq', `status: ${rMithaq.status}, location: ${rMithaq.location}`);

    const rTos = await fetchRoute('/legal/terms-of-service');
    record('Redirect /legal/terms-of-service -> /terms-of-service', rTos.status === 308 && rTos.location === '/terms-of-service', `status: ${rTos.status}, location: ${rTos.location}`);

    const rProd = await fetchRoute('/production');
    record('Redirect /production -> /governance/production-oversight', rProd.status === 308 && rProd.location === '/governance/production-oversight', `status: ${rProd.status}, location: ${rProd.location}`);

    // 1.2 Intake portal
    const rApp = await fetchRoute('/applications');
    record('Route /applications returns 200', rApp.status === 200, `status: ${rApp.status}`);

    const rAppToken = await fetchRoute('/applications?token=verify_test');
    record('Route /applications?token=... returns 200', rAppToken.status === 200, `status: ${rAppToken.status}`);

    // 1.3 Footprints Behind public page
    const rFootprints = await fetchRoute('/release-detail/footprints-behind');
    record('Route /release-detail/footprints-behind returns 200', rFootprints.status === 200, `status: ${rFootprints.status}`);

    // 1.4 Anonymous Auth me
    const rAuth = await fetchRoute('/api/auth/me');
    record('Route /api/auth/me returns 200 for anonymous', rAuth.status === 200 && rAuth.body.includes('"data":null'), `status: ${rAuth.status}`);

    // 1.5 Releases list
    const rReleases = await fetchRoute('/releases');
    record('Route /releases returns 200', rReleases.status === 200, `status: ${rReleases.status}`);
  } catch (err: any) {
    record('Server route connectivity', false, `Dev server might not be running on port 3005: ${err.message}`);
  }
}

function verifyCmsData() {
  console.log('\n--- 2. CMS Releases Data Integrity ---');

  // 2.1 Verify Persistent Volume Data (.data/cms-releases.json)
  const volumePath = path.resolve('.data/cms-releases.json');
  if (!fs.existsSync(volumePath)) {
    record('Volume CMS data file exists', false, '.data/cms-releases.json missing');
  } else {
    try {
      const raw = fs.readFileSync(volumePath, 'utf8');
      const data = JSON.parse(raw);
      const list = Array.isArray(data) ? data : data.releases;
      record('Volume CMS JSON is valid array', Array.isArray(list) && list.length > 0, `Total releases: ${list?.length}`);

      const footprints = list.find((r: any) => r.slug === 'footprints-behind' || r.id === 'studio_draft_1794752884539_0eb391d5');
      record('Footprints Behind draft exists in Volume CMS', !!footprints, `ID: ${footprints?.id}`);

      if (footprints) {
        record('Footprints volume status is published', footprints.status === 'published', `status: ${footprints.status}`);
        record('Footprints volume visibility is public', footprints.visibility === 'public', `visibility: ${footprints.visibility}`);
        record('Footprints volume YouTube ID is G595CGkQ4jc', (footprints.youtubeVideoId || footprints.youtubeId) === 'G595CGkQ4jc', `youtube: ${footprints.youtubeVideoId || footprints.youtubeId}`);
      }
    } catch (err: any) {
      record('Volume CMS file read/parse', false, err.message);
    }
  }

  // 2.2 Verify Repo Seed Ground Truth (lib/cms-seed-releases.json)
  const seedPath = path.resolve('lib/cms-seed-releases.json');
  if (!fs.existsSync(seedPath)) {
    record('Repo Seed CMS data file exists', false, 'lib/cms-seed-releases.json missing');
  } else {
    try {
      const rawSeed = fs.readFileSync(seedPath, 'utf8');
      const seedList = JSON.parse(rawSeed);
      record('Repo Seed CMS JSON is valid array', Array.isArray(seedList) && seedList.length > 0, `Total releases: ${seedList?.length}`);

      const seedFootprints = seedList.find((r: any) => r.slug === 'footprints-behind' || r.id === 'studio_draft_1794752884539_0eb391d5');
      record('Footprints Behind exists in Repo Seed catalog', !!seedFootprints, `ID: ${seedFootprints?.id}`);

      if (seedFootprints) {
        record('Footprints seed status is published', seedFootprints.status === 'published', `status: ${seedFootprints.status}`);
        record('Footprints seed visibility is public', seedFootprints.visibility === 'public', `visibility: ${seedFootprints.visibility}`);
        record('Footprints seed YouTube ID is G595CGkQ4jc', (seedFootprints.youtubeVideoId || seedFootprints.youtubeId) === 'G595CGkQ4jc', `youtube: ${seedFootprints.youtubeVideoId || seedFootprints.youtubeId}`);
      }
    } catch (err: any) {
      record('Repo Seed CMS file read/parse', false, err.message);
    }
  }
}

function verifySocialShareAndCutdowns() {
  console.log('\n--- 3. Social Content & Viral Cutdown Runtime Logic ---');

  // 3.1 Runtime Social Share Generation
  try {
    const { generateSocialShareKit } = require('../lib/social-share-generator');

    // Test Pehchaan Khud Ko (non-leakage of fallback)
    const pehchaanRelease = {
      title: 'Pehchaan Khud Ko',
      slug: 'pehchaan-khud-ko',
      canonicalTitle: 'Pehchaan Khud Ko',
      artist: 'SufiPulse USA',
      excerpt: 'Know yourself through the inward mirror of Divine remembrance.'
    };
    const pehchaanKit = generateSocialShareKit(pehchaanRelease);
    const pWa = pehchaanKit.whatsapp || '';
    const hasKabTakFallback = pWa.toLowerCase().includes('kab tak khamosh');
    const hasUnrelatedPoetry = pWa.includes('دل کو منور کر دے');
    record('Runtime: Pehchaan Khud Ko does not leak Kab Tak Khamosh', !hasKabTakFallback);
    record('Runtime: Social share has no mismatched devotional poetry', !hasUnrelatedPoetry);

    // Test Footprints Behind
    const footprintsRelease = {
      id: 'studio_draft_1794752884539_0eb391d5',
      title: 'Some People Leave Footprints Behind',
      slug: 'footprints-behind',
      youtubeId: 'G595CGkQ4jc',
      writer: 'Dr. Zarf-e-Noori',
    };
    const fpKit = generateSocialShareKit(footprintsRelease);
    const fpWa = fpKit.whatsapp || '';
    const fpFb = fpKit.facebook || '';
    record('Runtime: Footprints WhatsApp text contains canonical title', fpWa.includes('SOME PEOPLE LEAVE FOOTPRINTS BEHIND'));
    record('Runtime: Footprints WhatsApp links to master video G595CGkQ4jc', fpWa.includes('G595CGkQ4jc'));
    record('Runtime: Footprints Facebook text acknowledges Mahmood Ahmad Shah', fpFb.includes('Mahmood Ahmad Shah'));
  } catch (err: any) {
    record('Social share generator runtime test', false, err.message);
  }

  // 3.2 Runtime Viral Cutdown Target Execution
  try {
    const { getContentAwareCutdownSpecs } = require('../lib/cutdown-specs');
    const specs = getContentAwareCutdownSpecs({ slug: 'footprints-behind' });

    record('Runtime: Viral Cutdowns return exactly 3 strategic targets', Array.isArray(specs) && specs.length === 3, `Count: ${specs?.length}`);

    const hook15 = specs.find((s: any) => s.id === 'hook_15s');
    record('Runtime: 15s Hook has correct duration and master binding',
      !!hook15 && Math.abs(hook15.duration - 15.30) < 0.1 && hook15.relatedVideoId === 'G595CGkQ4jc' && hook15.onScreenTitle === 'SOME PEOPLE LEAVE FOOTPRINTS BEHIND',
      `dur: ${hook15?.duration}s, id: ${hook15?.relatedVideoId}`);

    const craft30 = specs.find((s: any) => s.id === 'chorus_30s');
    record('Runtime: 30s Craft has correct duration and Kashmir artisans title',
      !!craft30 && Math.abs(craft30.duration - 27.52) < 0.1 && craft30.relatedVideoId === 'G595CGkQ4jc' && craft30.onScreenTitle === 'THE HANDS THAT KEEP KASHMIR ALIVE',
      `dur: ${craft30?.duration}s, id: ${craft30?.relatedVideoId}`);

    const legacy45 = specs.find((s: any) => s.id === 'climax_45s');
    record('Runtime: 45s Legacy has correct duration and philosophical climax title',
      !!legacy45 && Math.abs(legacy45.duration - 38.24) < 0.1 && legacy45.relatedVideoId === 'G595CGkQ4jc' && legacy45.onScreenTitle === 'WHAT WILL REMAIN OF YOUR LIFE?',
      `dur: ${legacy45?.duration}s, id: ${legacy45?.relatedVideoId}`);
  } catch (err: any) {
    record('Viral cutdown runtime test', false, err.message);
  }
}

async function verifyKashmirPartnerSecurity() {
  console.log('\n--- 4. Kashmir Partner Network Security & Authorization Gate ---');
  const port = process.env.PORT || '3005';
  const baseUrl = `http://localhost:${port}`;

  // 4.1 Anonymous access to admin endpoints must return 401
  try {
    const resGet = await fetch(`${baseUrl}/api/admin/kashmir-reach`);
    record('Security: Anonymous GET /api/admin/kashmir-reach returns 401', resGet.status === 401, `status: ${resGet.status}`);

    const resVerify = await fetch(`${baseUrl}/api/admin/kashmir-reach/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId: 'fake_id' })
    });
    record('Security: Anonymous POST /api/admin/kashmir-reach/verify returns 401', resVerify.status === 401, `status: ${resVerify.status}`);

    const resCampaign = await fetch(`${baseUrl}/api/admin/kashmir-reach/campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId: 'fake_id', releaseSlug: 'fake_slug' })
    });
    record('Security: Anonymous POST /api/admin/kashmir-reach/campaign returns 401', resCampaign.status === 401, `status: ${resCampaign.status}`);

    const resAi = await fetch(`${baseUrl}/api/admin/kashmir-reach/ai-engines`);
    record('Security: Anonymous GET /api/admin/kashmir-reach/ai-engines returns 401', resAi.status === 401, `status: ${resAi.status}`);

    const resReport = await fetch(`${baseUrl}/api/admin/kashmir-reach/report-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId: 'fake_id', releaseSlug: 'test', publishedUrl: 'https://test.com' })
    });
    record('Security: Anonymous POST /api/admin/kashmir-reach/report-url returns 401', resReport.status === 401, `status: ${resReport.status}`);

    // 4.2 Authenticated Admin Access
    const { generateAccessToken } = require('../server/services/auth');
    const { usersRepository } = require('../server/db/repositories/users');
    const adminUser = usersRepository.listAll().find((u: any) => u.role === 'admin' || u.role === 'super_admin');

    if (adminUser) {
      const adminToken = await generateAccessToken({ id: adminUser.id, role: adminUser.role, email: adminUser.email });
      const resAdmin = await fetch(`${baseUrl}/api/admin/kashmir-reach`, {
        headers: {
          'cookie': `access_token=${adminToken}`
        }
      });
      record('Security: Authenticated Admin retains access (HTTP 200)', resAdmin.status === 200, `status: ${resAdmin.status}`);

      // 4.3 Non-admin user (e.g. contributor role) must receive 403 Forbidden
      const nonAdminUser = usersRepository.listAll().find((u: any) => u.role !== 'admin' && u.role !== 'super_admin');
      if (nonAdminUser) {
        const nonAdminToken = await generateAccessToken({ id: nonAdminUser.id, role: nonAdminUser.role, email: nonAdminUser.email });
        const resForbidden = await fetch(`${baseUrl}/api/admin/kashmir-reach`, {
          headers: { 'Cookie': `access_token=${nonAdminToken}` }
        });
        record('Security: Authenticated non-admin receives 403 Forbidden', resForbidden.status === 403, `status: ${resForbidden.status}`);
      }
    }

    // 4.4 Public Directory Data Sanitization (Zero Private Leak)
    const resPublicDir = await fetch(`${baseUrl}/api/public/kpn-directory`);
    if (resPublicDir.status === 200) {
      const data = await resPublicDir.json();
      const partners: any[] = data.partners || [];
      const hasPrivateFields = partners.some(p =>
        'contactPerson' in p ||
        'contactValue' in p ||
        'contactChannel' in p ||
        'notes' in p ||
        'verificationNotes' in p ||
        'trackingCode' in p
      );
      record('Security: Public directory strips all private contacts & notes', !hasPrivateFields && partners.length > 0, `verified: ${partners.length}, leak: ${hasPrivateFields}`);
    } else {
      record('Security: Public directory endpoint responds HTTP 200', false, `status: ${resPublicDir.status}`);
    }

    // 4.5 Public Intake Validation
    const resApplyNoConsent = await fetch(`${baseUrl}/api/public/kpn-apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete Test' })
    });
    record('Security: Public partner apply rejects incomplete submission (400)', resApplyNoConsent.status === 400, `status: ${resApplyNoConsent.status}`);

  } catch (err: any) {
    record('Kashmir Partner Network Security Checks', false, err.message);
  }
}

async function verifyGlobalReachCounterGate() {
  console.log('\n--- 5. Automated Global Reach Counter & Growth Engine Gate ---');
  const port = process.env.PORT || '3005';
  const baseUrl = `http://localhost:${port}`;

  try {
    const {
      globalReachGrowthEngine,
      generateDeterministicSchedule,
      RATE_BOUNDS,
    } = require('../lib/global-reach-growth-engine');
    const { generateAccessToken } = require('../server/services/auth');
    const { usersRepository } = require('../server/db/repositories/users');

    // 5.1 Schedule determinism
    const s1 = generateDeterministicSchedule(4242, { views: 0.028, impressions: 0.035, watchHours: 0.022, geographies: 0.018 });
    const s2 = generateDeterministicSchedule(4242, { views: 0.028, impressions: 0.035, watchHours: 0.022, geographies: 0.018 });
    record('Global Reach: Deterministic seed produces invariant schedule', JSON.stringify(s1) === JSON.stringify(s2));

    // 5.2 Bounds validation
    const viewsOk = s1.views.every((r: number) => r >= RATE_BOUNDS.views.min && r <= RATE_BOUNDS.views.max);
    const impOk = s1.impressions.every((r: number) => r >= RATE_BOUNDS.impressions.min && r <= RATE_BOUNDS.impressions.max);
    record('Global Reach: Monthly rates strictly respect governance bounds', viewsOk && impOk);

    // 5.3 Stopping logic: 24-month horizon freeze
    const traj24 = globalReachGrowthEngine.calculateModeledTrajectory(24);
    const traj30 = globalReachGrowthEngine.calculateModeledTrajectory(30);
    record('Global Reach: Modeled growth freezes after 24 completed months', traj24.impressions === traj30.impressions);

    // 5.4 Geographic reach invariant: Actual verified country count is NEVER capped
    const testOverCap = { impressions: 1000000, views: 170000, watchHours: 11000, geographies: 145 };
    const overCapRes = globalReachGrowthEngine.computeReconciledIndex(testOverCap);
    record('Global Reach: Actual verified country count is never artificially capped', overCapRes.combinedIndex.geographies === 145 && overCapRes.modeledAdjustment.geographies === 0);

    // 5.5 Real-growth reconciliation: growth reduces adjustment without negative values
    const baseTest = { impressions: 994300, views: 160611, watchHours: 10410, geographies: 53 };
    const grownTest = { impressions: 1014300, views: 165611, watchHours: 10610, geographies: 55 };
    const r1 = globalReachGrowthEngine.computeReconciledIndex(baseTest);
    const r2 = globalReachGrowthEngine.computeReconciledIndex(grownTest);
    record('Global Reach: Real growth reduces modeled adjustment without negative values', r2.modeledAdjustment.impressions < r1.modeledAdjustment.impressions && r2.modeledAdjustment.impressions >= 0);

    // 5.6 Non-overwrite rule: verified baseline remains untouched
    const store = globalReachGrowthEngine.getStore();
    record('Global Reach: Verified baseline records remain completely intact', store.baseline.metrics.impressions === 994300);

    // 5.7 Public API integration & truth in labeling
    const pubRes = await fetch(`${baseUrl}/api/public/youtube/global-reach`);
    if (pubRes.status === 200) {
      const pubData = await pubRes.json();
      const hasIndex = !!pubData.globalReachIndex && pubData.globalReachIndex.label === 'Global Reach Index';
      const noLeak = !('seed' in pubData.globalReachIndex) && !('savedMonthlySchedule' in pubData.globalReachIndex);
      record('Global Reach: Public endpoint provides composite index without internal leak', hasIndex && noLeak);
    } else {
      record('Global Reach: Public endpoint responds HTTP 200', false, `status: ${pubRes.status}`);
    }

    // 5.8 Admin Security & Sync
    const unauthGet = await fetch(`${baseUrl}/api/admin/youtube-analytics/global-reach`);
    record('Security: Anonymous GET /api/admin/youtube-analytics/global-reach returns 401', unauthGet.status === 401, `status: ${unauthGet.status}`);

    const adminUser = usersRepository.listAll().find((u: any) => u.role === 'admin' || u.role === 'super_admin');
    if (adminUser) {
      const adminToken = await generateAccessToken({ id: adminUser.id, role: adminUser.role, email: adminUser.email });
      const authGet = await fetch(`${baseUrl}/api/admin/youtube-analytics/global-reach`, {
        headers: { cookie: `access_token=${adminToken}` }
      });
      record('Security: Authenticated Admin access to Global Reach hub (HTTP 200)', authGet.status === 200, `status: ${authGet.status}`);
    }

  } catch (err: any) {
    record('Global Reach Counter & Growth Engine Gate', false, err.message);
  }
}

async function run() {
  console.log('====================================================');
  console.log(' SufiPulse Pre-Deploy Verification Gate');
  console.log('====================================================');

  try {
    verifyCmsData();
    verifySocialShareAndCutdowns();
    await verifyRoutes();
    await verifyKashmirPartnerSecurity();
    await verifyGlobalReachCounterGate();
  } finally {
    if (spawnedServer) {
      console.log('🧹 Terminating automated test server instance...');
      try {
        spawnedServer.kill();
      } catch (e) {}
    }
  }

  const failed = results.filter(r => !r.passed);
  console.log('\n====================================================');
  if (failed.length === 0) {
    console.log(`🎉 ALL ${results.length} CHECKS PASSED! Safe for deployment.`);
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error(`🚨 ${failed.length} of ${results.length} CHECKS FAILED:`);
    failed.forEach(f => console.error(`  - ${f.name} (${f.details || 'failed'})`));
    console.log('====================================================\n');
    process.exit(1);
  }
}

run();
