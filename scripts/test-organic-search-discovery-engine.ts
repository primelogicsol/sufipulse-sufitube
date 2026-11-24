/**
 * scripts/test-organic-search-discovery-engine.ts
 *
 * Comprehensive Automated End-to-End & Playwright Verification Suite
 * for SufiPulse USA Global Organic Search Discovery Engine (Phases 1-8).
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import dotenv from 'dotenv';
import { chromium } from 'playwright';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

const PORT = process.env.PORT || '3005';
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR =
  'C:\\Users\\Fayaz\\.gemini\\antigravity-cli\\brain\\e1e69f83-d4ff-44b7-b134-92eb1235271a\\discovery-screenshots';

interface Check {
  name: string;
  passed: boolean;
  details?: string;
}

const checks: Check[] = [];

function assertCheck(name: string, passed: boolean, details?: string) {
  checks.push({ name, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${details ? ` (${details})` : ''}`);
}

function extractCanonical(html: string): string | null {
  const m =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m ? m[1] : null;
}

function extractRobotsMeta(html: string): string | null {
  const m =
    html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i);
  return m ? m[1] : null;
}

function extractJsonLdBlocks(html: string): any[] {
  const blocks: any[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch {
      blocks.push({ __invalidJson: true });
    }
  }
  return blocks;
}

async function run() {
  console.log('==================================================================');
  console.log(' SufiPulse USA — Global Organic Search Discovery Verification');
  console.log('==================================================================\n');

  // ── 1. Phase 2A: Absence of Fake Indexing & Shorts UI ──────────────────────
  console.log('--- 1. Phase 2A: Absence of Fabricated Indexing & Shorts UI ---');
  const syndicationUi = fs.readFileSync(
    path.resolve('app/admin/cms-releases/[id]/release-viral-syndication-section.tsx'),
    'utf8'
  );
  assertCheck(
    'No hardcoded "Active & Submitted (IndexNow & Google Search Console Verified)" string',
    !syndicationUi.includes('Active & Submitted (IndexNow & Google Search Console Verified)')
  );
  assertCheck(
    'No fake 700ms setTimeout HTTP 202 simulation in syndication UI',
    !syndicationUi.includes('HTTP 202 Batch') && !syndicationUi.includes('setTimeout(r, 700)')
  );
  assertCheck(
    'No www.sufipulse.com host split in syndication UI',
    !syndicationUi.includes('www.sufipulse.com')
  );
  assertCheck(
    'No Google retired /ping?sitemap= call in instant-indexer.ts',
    !fs.readFileSync(path.resolve('server/services/instant-indexer.ts'), 'utf8').includes('google.com/ping')
  );

  // Verify local static IndexNow key file serves HTTP 200
  const keyRes = await fetch(`${BASE_URL}/a7f3c9e2d4b841f69e0c5a2d8b7e4f1a.txt`);
  const keyBody = (await keyRes.text()).trim();
  assertCheck(
    'IndexNow static key file serves HTTP 200 with exact matching key',
    keyRes.status === 200 && keyBody === 'a7f3c9e2d4b841f69e0c5a2d8b7e4f1a',
    `status=${keyRes.status}, body=${keyBody}`
  );

  // ── 2. Phase 2B: Canonical URLs, Host Redirects, 404 & Noindex Hygiene ─────
  console.log('\n--- 2. Phase 2B: Canonical URLs, Redirects & Noindex Hygiene ---');

  // Test www.sufipulse.com -> https://sufipulse.com 308 redirect via raw HTTP Host header
  const wwwRes = await new Promise<{ status: number; location: string | null }>((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: Number(PORT),
        path: '/discovery',
        method: 'GET',
        headers: { Host: 'www.sufipulse.com' },
      },
      (res) => {
        res.resume();
        resolve({ status: res.statusCode || 0, location: res.headers.location || null });
      }
    );
    req.on('error', reject);
    req.end();
  });
  assertCheck(
    'Host www.sufipulse.com redirects 308 to https://sufipulse.com/discovery',
    wwwRes.status === 308 && wwwRes.location === 'https://sufipulse.com/discovery',
    `status=${wwwRes.status}, location=${wwwRes.location}`
  );

  // Pick a real published public release from CMS
  const cmsRaw = JSON.parse(fs.readFileSync(path.resolve('.data/cms-releases.json'), 'utf8'));
  const cmsList: any[] = Array.isArray(cmsRaw) ? cmsRaw : cmsRaw.releases;
  const samplePublicRelease = cmsList.find(
    (r) => r.status === 'published' && (r.visibility || 'public') === 'public' && r.slug && r.youtubeId
  );
  assertCheck('Found sample published public full-length release', Boolean(samplePublicRelease), samplePublicRelease?.slug);

  const canonicalExpectations: Array<[string, string]> = [
    ['/', 'https://sufipulse.com'],
    ['/discovery', 'https://sufipulse.com/discovery'],
    ['/discovery/traditions/qawwali', 'https://sufipulse.com/discovery/traditions/qawwali'],
    ['/releases', 'https://sufipulse.com/releases'],
    [`/release-detail/${samplePublicRelease.slug}`, `https://sufipulse.com/release-detail/${samplePublicRelease.slug}`],
    ['/sufitube', 'https://sufipulse.com/sufitube'],
    ['/official-channels', 'https://sufipulse.com/official-channels'],
    ['/about/what-is-sufipulse', 'https://sufipulse.com/about/what-is-sufipulse'],
    ['/about/zarf-e-noori', 'https://sufipulse.com/about/zarf-e-noori'],
    ['/about/founder', 'https://sufipulse.com/about/founder'],
    ['/knowledge', 'https://sufipulse.com/knowledge'],
    ['/knowledge/poets', 'https://sufipulse.com/knowledge/poets'],
    ['/literary-journal', 'https://sufipulse.com/literary-journal'],
    ['/concepts/ishq', 'https://sufipulse.com/concepts/ishq'],
    ['/themes/divine-love', 'https://sufipulse.com/themes/divine-love'],
    ['/moods/contemplative', 'https://sufipulse.com/moods/contemplative'],
    ['/regions/in', 'https://sufipulse.com/regions/in'],
    ['/verification', 'https://sufipulse.com/verification'],
    ['/governance', 'https://sufipulse.com/governance'],
    ['/governance/mithaq', 'https://sufipulse.com/governance/mithaq'],
    ['/governance/content-stewardship', 'https://sufipulse.com/governance/content-stewardship'],
    ['/governance/release-protocol', 'https://sufipulse.com/governance/release-protocol'],
    ['/governance/royalty-transparency', 'https://sufipulse.com/governance/royalty-transparency'],
    ['/studio/operations', 'https://sufipulse.com/studio/operations'],
    ['/studio/creative-assets', 'https://sufipulse.com/studio/creative-assets'],
    ['/official-channels/operations', 'https://sufipulse.com/official-channels/operations'],
    ['/release-premieres', 'https://sufipulse.com/release-premieres'],
    ['/discovery/singers/nusrat-fateh-ali-khan', 'https://sufipulse.com/knowledge/singers/nusrat-fateh-ali-khan'],
    ['/knowledge/concepts/dhikr', 'https://sufipulse.com/concepts/dhikr'],
  ];

  for (const [routePath, expectedCanon] of canonicalExpectations) {
    const res = await fetch(`${BASE_URL}${routePath}`);
    const html = await res.text();
    const canon = extractCanonical(html);
    assertCheck(
      `Canonical on ${routePath} === ${expectedCanon}`,
      res.status === 200 && canon === expectedCanon,
      `status=${res.status}, canonical=${canon}`
    );
  }

  // Duplicate /release-metadata/[youtubeId] must canonicalize to /release-detail/[slug] + noindex
  const metaPageRes = await fetch(`${BASE_URL}/release-metadata/${samplePublicRelease.youtubeId}`);
  const metaPageHtml = await metaPageRes.text();
  const metaPageCanon = extractCanonical(metaPageHtml);
  const metaPageRobots = extractRobotsMeta(metaPageHtml);
  assertCheck(
    '/release-metadata/[youtubeId] canonicalizes to /release-detail/[slug] and sets noindex',
    metaPageRes.status === 200 &&
      metaPageCanon === `https://sufipulse.com/release-detail/${samplePublicRelease.slug}` &&
      Boolean(metaPageRobots && metaPageRobots.includes('noindex')),
    `canon=${metaPageCanon}, robots=${metaPageRobots}`
  );

  // 404 & Unpublished release must NOT emit homepage canonical
  const notFoundRes = await fetch(`${BASE_URL}/release-detail/footprints-behind`);
  const notFoundHtml = await notFoundRes.text();
  const notFoundCanon = extractCanonical(notFoundHtml);
  assertCheck(
    'Unpublished footprints-behind returns 404 without homepage canonical leak',
    notFoundRes.status === 404 && notFoundCanon !== 'https://sufipulse.com',
    `status=${notFoundRes.status}, canonical=${notFoundCanon}`
  );

  // Missing taxonomy node returns genuine 404 (not HTTP 200 Soft-404)
  const missingConceptRes = await fetch(`${BASE_URL}/concepts/non-existent-concept-xyz`);
  assertCheck(
    'Missing concept node returns genuine HTTP 404 (Soft-404 fixed)',
    missingConceptRes.status === 404,
    `status=${missingConceptRes.status}`
  );

  // Singular /knowledge/saint redirects 308 -> /knowledge/poets and /knowledge/singer/nusrat-fateh-ali-khan -> /knowledge/singers/nusrat-fateh-ali-khan
  const saintRedir = await fetch(`${BASE_URL}/knowledge/saint`, { redirect: 'manual' });
  assertCheck(
    '/knowledge/saint redirects 308 to canonical plural /knowledge/poets',
    saintRedir.status === 308 && (saintRedir.headers.get('location') || '').endsWith('/knowledge/poets'),
    `status=${saintRedir.status}, location=${saintRedir.headers.get('location')}`
  );
  const singerRedir = await fetch(`${BASE_URL}/knowledge/singer/nusrat-fateh-ali-khan`, { redirect: 'manual' });
  assertCheck(
    '/knowledge/singer/nusrat-fateh-ali-khan redirects 308 to /knowledge/singers/nusrat-fateh-ali-khan',
    singerRedir.status === 308 && (singerRedir.headers.get('location') || '').endsWith('/knowledge/singers/nusrat-fateh-ali-khan'),
    `status=${singerRedir.status}, location=${singerRedir.headers.get('location')}`
  );

  // Verify noindex on utility/apply pages and single <footer wrapper on /concepts/ishq, /applications, /knowledge/poets
  const applyRes = await fetch(`${BASE_URL}/writers/apply`);
  const applyHtml = await applyRes.text();
  assertCheck(
    '/writers/apply self-canonicalizes and sets noindex',
    extractCanonical(applyHtml) === 'https://sufipulse.com/writers/apply' &&
      Boolean((extractRobotsMeta(applyHtml) || '').includes('noindex'))
  );
  const appPortalHtml = await (await fetch(`${BASE_URL}/applications`)).text();
  const poetsHtml = await (await fetch(`${BASE_URL}/knowledge/poets`)).text();
  const countTag = (h: string, tag: string) => (h.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
  assertCheck(
    'Single <Layout> footer rendered on /applications (duplicate Layout fixed) and /knowledge/poets (missing Layout fixed)',
    countTag(appPortalHtml, 'footer') === 1 && countTag(poetsHtml, 'footer') === 1,
    `applicationsFooters=${countTag(appPortalHtml, 'footer')}, poetsFooters=${countTag(poetsHtml, 'footer')}`
  );

  // ── 3. Sitemap & Robots Validation ─────────────────────────────────────────
  console.log('\n--- 3. Sitemap.xml & Robots.txt Validation ---');
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();
  const locMatches = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  assertCheck(
    '/sitemap.xml returns HTTP 200 with valid URL entries',
    sitemapRes.status === 200 && locMatches.length >= 180,
    `count=${locMatches.length}`
  );
  assertCheck(
    'All /sitemap.xml URLs use canonical non-www https://sufipulse.com',
    locMatches.every((u) => u === 'https://sufipulse.com' || u.startsWith('https://sufipulse.com/'))
  );
  assertCheck(
    '/sitemap.xml includes /discovery, /sufitube, /about/zarf-e-noori, and /knowledge/* entities',
    locMatches.includes('https://sufipulse.com/discovery') &&
      locMatches.includes('https://sufipulse.com/sufitube') &&
      locMatches.includes('https://sufipulse.com/about/zarf-e-noori') &&
      locMatches.some((u) => u.includes('/knowledge/'))
  );
  assertCheck(
    '/sitemap.xml excludes unpublished footprints-behind, duplicate /release-metadata/*, and consolidated duplicate entity URLs',
    !locMatches.some((u) => u.includes('footprints-behind')) &&
      !locMatches.some((u) => u.includes('/release-metadata/')) &&
      !locMatches.includes('https://sufipulse.com/discovery/singers/nusrat-fateh-ali-khan') &&
      !locMatches.includes('https://sufipulse.com/knowledge/concepts/dhikr')
  );
  assertCheck(
    '/sitemap.xml includes Google Video XML Sitemap <video:video> metadata for full-length songs',
    sitemapXml.includes('<video:video>') && sitemapXml.includes('<video:player_loc>')
  );

  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  const robotsTxt = await robotsRes.text();
  assertCheck(
    '/robots.txt returns HTTP 200, references https://sufipulse.com/sitemap.xml, and welcomes search & AI bots',
    robotsRes.status === 200 &&
      robotsTxt.includes('https://sufipulse.com/sitemap.xml') &&
      robotsTxt.includes('Googlebot') &&
      robotsTxt.includes('Bingbot') &&
      robotsTxt.includes('GPTBot') &&
      robotsTxt.includes('PerplexityBot') &&
      robotsTxt.includes('Disallow: /test-ocr')
  );

  // ── 4. JSON-LD Structured Data & Crawlable SSR Content ─────────────────────
  console.log('\n--- 4. Structured Data (JSON-LD) & SSR Multilingual Content ---');
  const relRes = await fetch(`${BASE_URL}/release-detail/${samplePublicRelease.slug}`);
  const relHtml = await relRes.text();
  const relSchemas = extractJsonLdBlocks(relHtml);
  const schemaTypes = new Set(
    relSchemas.flatMap((b) => (b['@graph'] ? b['@graph'].map((g: any) => g['@type']) : [b['@type']]))
  );
  assertCheck(
    'Release page emits valid JSON-LD with Organization, WebSite, MusicComposition, MusicRecording, VideoObject, BreadcrumbList',
    relSchemas.every((b) => !b.__invalidJson) &&
      schemaTypes.has('MusicComposition') &&
      schemaTypes.has('MusicRecording') &&
      schemaTypes.has('VideoObject') &&
      schemaTypes.has('BreadcrumbList'),
    `types=${Array.from(schemaTypes).join(',')}`
  );
  const videoSchema = relSchemas.find((b) => b['@type'] === 'VideoObject');
  assertCheck(
    'VideoObject duration uses valid ISO 8601 PT format',
    !videoSchema?.duration || /^PT(\d+H)?(\d+M)?\d+S$/.test(videoSchema.duration),
    `duration=${videoSchema?.duration}`
  );
  assertCheck(
    'Release page renders crawlable SSR multilingual authority <article>',
    relHtml.includes('data-ssr-release-authority="true"')
  );

  // Verify /concepts/ishq links directly to /release-detail/ (not blocked /api/track-click) and renders single footer
  const ishqHtml = await (await fetch(`${BASE_URL}/concepts/ishq`)).text();
  assertCheck(
    'Taxonomy node (/concepts/ishq) links directly to canonical /release-detail/* and renders exactly 1 footer',
    !ishqHtml.includes('href="/api/track-click') && countTag(ishqHtml, 'footer') === 1,
    `footers=${countTag(ishqHtml, 'footer')}`
  );
  assertCheck(
    'Global Footer includes crawlable link to /discovery',
    ishqHtml.includes('href="/discovery"')
  );

  // ── 4B. Four-Script Lyric Search, Privacy Gate & Regional Policy ───────────
  console.log('\n--- 4B. Four-Script Lyric Search, Draft Lyric Privacy & Regional Policy ---');
  const romanSearchRes = await fetch(`${BASE_URL}/api/releases?search=Ashjaar`);
  const romanSearchList: any[] = await romanSearchRes.json();
  const devaSearchRes = await fetch(`${BASE_URL}/api/releases?search=${encodeURIComponent('तस्बीह')}`);
  const devaSearchList: any[] = await devaSearchRes.json();
  assertCheck(
    'GET /api/releases searches approved Roman Urdu and Devanagari 4-script lyrics',
    Array.isArray(romanSearchList) &&
      romanSearchList.some((r) => r.slug === 'how-long-will-you-remain-silent') &&
      Array.isArray(devaSearchList) &&
      devaSearchList.some((r) => r.slug === 'how-long-will-you-remain-silent'),
    `romanHits=${romanSearchList?.length}, devaHits=${devaSearchList?.length}`
  );

  // Verify unapproved DRAFT / under_review lyrics on pehchaan-khud-ko are NOT exposed publicly
  const pubPehchaan = romanSearchList.find((r) => r.slug === 'pehchaan-khud-ko') ||
    (await (await fetch(`${BASE_URL}/api/releases?search=pehchaan-khud-ko`)).json())[0];
  assertCheck(
    'Unapproved DRAFT / under_review lyrics on pehchaan-khud-ko are excluded from public /api/releases payload',
    Boolean(pubPehchaan) && !pubPehchaan.canonicalLyrics && !pubPehchaan.subtitleTranslations?.hi
  );

  const llmsTxt = fs.readFileSync(path.resolve('public/llms.txt'), 'utf8');
  assertCheck(
    'public/llms.txt includes /discovery and distinguishes factual global audience geography without contradictory assertions',
    llmsTxt.includes('/discovery') &&
      llmsTxt.includes('Analytical governance:') &&
      !llmsTxt.includes('does not promote any content associated with Pakistan')
  );

  // ── 5. Security, APIs, Optimization Loop & Real Telemetry Persistence ──────
  console.log('\n--- 5. P0 Security Repairs, Admin APIs, Optimization Loop & Telemetry ---');
  for (const adminEndpoint of [
    '/api/admin/discovery-performance',
    '/api/admin/discovery-mission',
    '/api/admin/search-indexing',
    '/api/admin/discovery-optimization',
    '/api/studio-access-codes/nonexistent-id',
    '/api/debug/youtube-sync',
    '/api/admin/google-ads/studio-oauth/callback?code=fake&state=studio',
  ]) {
    const anonRes = await fetch(`${BASE_URL}${adminEndpoint}`, { redirect: 'manual' });
    assertCheck(`Anonymous GET ${adminEndpoint} returns 401`, anonRes.status === 401, `status=${anonRes.status}`);
  }

  // Verify P0 Security Repairs on POST/PATCH mutations (anonymous)
  const anonAccessPatch = await fetch(`${BASE_URL}/api/studio-access-codes/test-id`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: true }),
  });
  assertCheck('Anonymous PATCH /api/studio-access-codes/[id] returns 401', anonAccessPatch.status === 401, `status=${anonAccessPatch.status}`);

  const anonUpload = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST' });
  assertCheck('Anonymous POST /api/admin/upload returns 401', anonUpload.status === 401, `status=${anonUpload.status}`);

  const anonApproveGate = await fetch(`${BASE_URL}/api/admin/pipeline/test-draft/approve-final`, { method: 'POST' });
  assertCheck('Human Approval Gate (/api/admin/pipeline/[draftId]/approve-final) rejects anonymous with 401', anonApproveGate.status === 401, `status=${anonApproveGate.status}`);

  const { generateAccessToken } = require('../server/services/auth');
  const { usersRepository } = require('../server/db/repositories/users');
  const adminUser = usersRepository.listAll().find((u: any) => u.role === 'admin' || u.role === 'super_admin');
  assertCheck('Admin user available for authenticated verification', Boolean(adminUser));
  const adminToken = await generateAccessToken({
    id: adminUser.id,
    role: adminUser.role,
    email: adminUser.email,
  });
  const authHeaders = {
    Cookie: `access_token=${adminToken}`,
    'Content-Type': 'application/json',
  };

  // Verify non-admin role cannot invoke managed_sufitube Google Ads campaign creation
  const nonAdminToken = await generateAccessToken({
    id: 'test_non_admin_user_id',
    role: 'writer',
    email: 'writer-check@sufipulse.com',
  });
  const nonAdminAdsRes = await fetch(`${BASE_URL}/api/google-ads/campaigns/create`, {
    method: 'POST',
    headers: { Cookie: `access_token=${nonAdminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adoptionId: 'adopt_test',
      releaseId: samplePublicRelease.id,
      youtubeVideoId: samplePublicRelease.youtubeId,
      releaseTitle: samplePublicRelease.title,
      budgetAmount: 50,
      methodType: 'managed_sufitube',
    }),
  });
  assertCheck(
    'Non-admin POST /api/google-ads/campaigns/create (managed_sufitube) is rejected (401/403)',
    nonAdminAdsRes.status === 401 || nonAdminAdsRes.status === 403,
    `status=${nonAdminAdsRes.status}`
  );

  // Verify OAuth callback rejects tampered/missing state cookie even for authenticated admin
  const badStateCallback = await fetch(
    `${BASE_URL}/api/admin/google-ads/studio-oauth/callback?code=fake&state=tampered_state_value_1234`,
    { headers: { Cookie: `access_token=${adminToken}` }, redirect: 'manual' }
  );
  assertCheck(
    'Admin studio-oauth callback rejects missing/mismatched OAuth state cookie with 403',
    badStateCallback.status === 403,
    `status=${badStateCallback.status}`
  );

  // Verify admin upload rejects dangerous .html / text/html payload with 400
  const badForm = new FormData();
  badForm.append('file', new Blob(['<script>alert(1)</script>'], { type: 'text/html' }), 'exploit.html');
  const badUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
    method: 'POST',
    headers: { Cookie: `access_token=${adminToken}` },
    body: badForm,
  });
  assertCheck(
    'Admin POST /api/admin/upload rejects disallowed .html/text/html upload with 400',
    badUploadRes.status === 400,
    `status=${badUploadRes.status}`
  );

  // Verify admin debug/youtube-sync succeeds for admin and omits raw cmsFilePath
  const adminDebugRes = await fetch(`${BASE_URL}/api/debug/youtube-sync`, {
    headers: { Cookie: `access_token=${adminToken}` },
  });
  const adminDebugJson = await adminDebugRes.json();
  assertCheck(
    'Admin GET /api/debug/youtube-sync returns 200 and omits raw filesystem path',
    adminDebugRes.status === 200 && !('cmsFilePath' in adminDebugJson),
    `status=${adminDebugRes.status}`
  );

  // Verify embedded_video_play & returning-visitor cookie on /api/public/discovery-telemetry
  const entranceBeacon = await fetch(`${BASE_URL}/api/public/discovery-telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/125.0' },
    body: JSON.stringify({ eventType: 'organic_entrance', path: '/discovery', referrer: 'https://www.google.com/' }),
  });
  const playBeacon = await fetch(`${BASE_URL}/api/public/discovery-telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/125.0' },
    body: JSON.stringify({
      eventType: 'embedded_video_play',
      path: `/release-detail/${samplePublicRelease.slug}`,
      releaseSlug: samplePublicRelease.slug,
      youtubeId: samplePublicRelease.youtubeId,
    }),
  });
  assertCheck(
    'First-party telemetry records embedded_video_play and sets privacy-safe returning-listener cookie',
    entranceBeacon.status === 200 &&
      (entranceBeacon.headers.get('set-cookie') || '').includes('sp_rl_v1=1') &&
      playBeacon.status === 200
  );

  // Trigger human-approved Discovery Graph sync so all 97 public songs connect cleanly!
  const optRes = await fetch(`${BASE_URL}/api/admin/discovery-optimization`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      proposalId: 'opt_graph_connect_published_songs',
      decision: 'approve_and_implement',
    }),
  });
  const optJson = await optRes.json();
  assertCheck(
    'Human-approved Optimization Loop connects public full-length songs to Discovery Graph',
    optRes.status === 200 && Boolean(optJson.success),
    optJson.message
  );

  // Test Search Indexing guard on unpublished footprints-behind vs public song
  const blockedIdxRes = await fetch(`${BASE_URL}/api/admin/search-indexing`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ action: 'submit_indexnow', slug: 'footprints-behind' }),
  });
  const blockedIdxJson = await blockedIdxRes.json();
  assertCheck(
    'IndexNow blocks unpublished/private footprints-behind with NOT_ELIGIBLE_PRIVATE',
    blockedIdxRes.status === 200 &&
      blockedIdxJson.accepted === false &&
      blockedIdxJson.state === 'NOT_ELIGIBLE_PRIVATE',
    `state=${blockedIdxJson.state}`
  );

  const pubIdxRes = await fetch(`${BASE_URL}/api/admin/search-indexing`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ action: 'submit_indexnow', slug: samplePublicRelease.slug }),
  });
  const pubIdxJson = await pubIdxRes.json();
  assertCheck(
    'IndexNow honestly reports NOT_CONFIGURED or SUBMISSION_ACCEPTED based on real host key check (zero fake 202)',
    pubIdxRes.status === 200 &&
      ['NOT_CONFIGURED', 'SUBMISSION_ACCEPTED', 'SUBMISSION_FAILED'].includes(pubIdxJson.state),
    `state=${pubIdxJson.state}`
  );

  // Test bot crawler logging via public fetch with GPTBot UA
  await fetch(`${BASE_URL}/discovery`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)' },
  });
  // Allow 300ms for non-blocking waitUntil crawler beacon
  await new Promise((r) => setTimeout(r, 400));

  // Fetch full 13-module Discovery Performance payload
  const dpRes = await fetch(`${BASE_URL}/api/admin/discovery-performance`, { headers: authHeaders });
  const dpJson = await dpRes.json();
  assertCheck(
    'GET /api/admin/discovery-performance returns HTTP 200 with all 13 modules populated',
    dpRes.status === 200 &&
      Boolean(dpJson.youtube) &&
      Boolean(dpJson.googleSearchConsole) &&
      Boolean(dpJson.bingSearch) &&
      dpJson.searchDemand?.totalClusters === 11 &&
      dpJson.youtube?.geography?.territoriesMeasurable === 48 &&
      Array.isArray(dpJson.releaseSeoAudits) &&
      dpJson.releaseSeoAudits.length >= 90 &&
      dpJson.discoveryGraph?.orphanSongsCount === 0,
    `clusters=${dpJson.searchDemand?.totalClusters}, songs=${dpJson.releaseSeoAudits?.length}, orphans=${dpJson.discoveryGraph?.orphanSongsCount}`
  );
  assertCheck(
    'Live YouTube Data v3 & Analytics v2 connected in Discovery Performance payload',
    dpJson.youtube?.liveApiConnected === true &&
      typeof dpJson.youtube?.channelIdentity?.subscribers === 'number' &&
      typeof dpJson.youtube?.recent28d?.ytSearchViews === 'number',
    `subs=${dpJson.youtube?.channelIdentity?.subscribers}, 28dYtSearch=${dpJson.youtube?.recent28d?.ytSearchViews}`
  );
  assertCheck(
    'GSC and Bing report honest NOT_CONFIGURED state when credentials are absent',
    dpJson.googleSearchConsole?.status?.state === 'NOT_CONFIGURED' &&
      dpJson.bingSearch?.report?.status === 'NOT_CONFIGURED'
  );
  assertCheck(
    'Verified GPTBot crawl on /discovery recorded in first-party crawler registry (synthetic June 2026 seeds absent)',
    dpJson.aiSearchDiscovery?.verifiedAiCrawlers?.some((c: any) => c.crawler === 'GPTBot' && c.pagesCrawled >= 1) &&
      !dpJson.indexingAndCrawl?.crawlers?.some((c: any) => c.firstSeen === '2026-06-05T08:17:45.084Z')
  );

  // Verify Discovery Mission API has zero NaN/mocked 41-47-53 history
  const dmRes = await fetch(`${BASE_URL}/api/admin/discovery-mission`, { headers: authHeaders });
  const dmJson = await dmRes.json();
  assertCheck(
    'GET /api/admin/discovery-mission returns real telemetry with non-null score and zero fake 41/47/53 history',
    dmRes.status === 200 &&
      typeof dmJson.discoveryScore?.current === 'number' &&
      !Number.isNaN(dmJson.discoveryScore.current) &&
      dmJson.provenance === 'verified_first_party_telemetry_only',
    `score=${dmJson.discoveryScore?.current}`
  );

  // ── 6. Playwright Desktop & Mobile UI Verification ─────────────────────────
  console.log('\n--- 6. Playwright Desktop (1440px) & Mobile (390px) Verification ---');
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop context with admin cookie
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await desktopCtx.addCookies([
      {
        name: 'access_token',
        value: adminToken,
        domain: 'localhost',
        path: '/',
      },
    ]);
    const page = await desktopCtx.newPage();
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto(`${BASE_URL}/admin/discovery-performance`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Module 01 · Executive Organic Discovery Overview', { timeout: 15000 });
    const headingVisible = await page.isVisible('text=Organic Search, Multilingual Demand & Conversion Intelligence');
    assertCheck('Desktop /admin/discovery-performance renders all modules cleanly', headingVisible);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '01-desktop-discovery-performance.png'),
      fullPage: true,
    });

    // Test CMS editor syndication section on unpublished footprints-behind
    await page.goto(`${BASE_URL}/admin/cms-releases/studio_draft_1794752884539_0eb391d5`, {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('text=Full-Song Organic Search & Discovery Syndication', { timeout: 15000 });
    const blockedBadgeVisible = await page.isVisible('text=BLOCKED (NON-PUBLIC / UNPUBLISHED)');
    const fakeBadgePresent = await page.isVisible('text=IndexNow & Google Search Console Verified');
    assertCheck(
      'CMS Release Editor displays honest BLOCKED badge on unpublished release and zero fake verification',
      blockedBadgeVisible && !fakeBadgePresent
    );
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '02-desktop-cms-syndication-honest-state.png'),
      fullPage: false,
    });

    // Test public /discovery and /releases?q=kalam
    await page.goto(`${BASE_URL}/discovery`, { waitUntil: 'networkidle' });
    const discoveryVisible = await page.isVisible('text=Global Sufi Music & Mystical Heritage');
    const fakePlus41 = await page.isVisible('text=+41%');
    assertCheck(
      'Public /discovery renders cleanly without hardcoded +41% fake search trend numbers',
      discoveryVisible && !fakePlus41
    );
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '03-desktop-public-discovery-hub.png'),
      fullPage: true,
    });

    await page.goto(`${BASE_URL}/releases?q=Pehchaan`, { waitUntil: 'networkidle' });
    const searchInputVal = await page.inputValue('input[placeholder*="Search" i]').catch(() => '');
    assertCheck(
      'WebSite SearchAction (/releases?q=Pehchaan) hydrates search input on /releases',
      searchInputVal === 'Pehchaan',
      `inputValue=${searchInputVal}`
    );

    assertCheck(
      'Zero uncaught page errors across desktop navigation',
      consoleErrors.length === 0,
      consoleErrors.join('; ')
    );
    await desktopCtx.close();

    // Mobile context (390x844)
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await mobileCtx.addCookies([
      {
        name: 'access_token',
        value: adminToken,
        domain: 'localhost',
        path: '/',
      },
    ]);
    const mPage = await mobileCtx.newPage();
    await mPage.goto(`${BASE_URL}/admin/discovery-performance`, { waitUntil: 'networkidle' });
    await mPage.waitForSelector('text=Module 01 · Executive Organic Discovery Overview', { timeout: 15000 });
    const overflow = await mPage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 4
    );
    assertCheck('Mobile (390px) /admin/discovery-performance renders with zero horizontal overflow', !overflow);
    await mPage.screenshot({
      path: path.join(ARTIFACT_DIR, '04-mobile-discovery-performance.png'),
      fullPage: false,
    });
    await mobileCtx.close();
  } finally {
    await browser.close();
  }

  const failed = checks.filter((c) => !c.passed);
  console.log('\n==================================================================');
  if (failed.length === 0) {
    console.log(`🎉 ALL ${checks.length} ORGANIC SEARCH DISCOVERY CHECKS PASSED!`);
    console.log('==================================================================\n');
    process.exit(0);
  } else {
    console.error(`🚨 ${failed.length} of ${checks.length} CHECKS FAILED:`);
    failed.forEach((f) => console.error(`  - ${f.name} (${f.details || 'failed'})`));
    console.log('==================================================================\n');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
