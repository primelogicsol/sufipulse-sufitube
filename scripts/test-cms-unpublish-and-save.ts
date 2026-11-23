/**
 * End-to-End Verification Suite:
 * SufiPulse CMS Unpublish, Archive, Save, Public Visibility & Reimport Protection
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });
dotenv.config({ path: '.env.local', override: true });

import { SignJWT } from 'jose';
import { cmsReleaseSchema } from '../app/lib/validation-schemas';
import { mapVideoToRelease } from '../lib/release-mapping';
import { usersRepository } from '../server/db/repositories/users';

const BASE_URL = 'http://localhost:3005';
const TARGET_ID = 'studio_draft_1794752884539_0eb391d5';
const TARGET_SLUG = 'footprints-behind';
const TARGET_YT_ID = 'G595CGkQ4jc';
const DATA_FILE = path.join(process.cwd(), '.data', 'cms-releases.json');

let passed = 0;
let failed = 0;

function assert(condition: unknown, label: string, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL: ${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function main() {
  console.log('=== 1. SCHEMA COMPATIBILITY AUDIT ACROSS ALL PERSISTED RELEASES ===');
  const rawBefore = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const entriesBefore: any[] = Array.isArray(rawBefore) ? rawBefore : [];
  assert(entriesBefore.length === 99, `Loaded 99 canonical releases from .data/cms-releases.json (got ${entriesBefore.length})`);

  let schemaFailures = 0;
  for (const rel of entriesBefore) {
    const parsed = cmsReleaseSchema.safeParse(rel);
    if (!parsed.success) {
      schemaFailures += 1;
      console.error(`  Schema failure on ${rel.id}:`, parsed.error.format());
    }
  }
  assert(schemaFailures === 0, `All ${entriesBefore.length} persisted CMS releases pass cmsReleaseSchema validation (failures: ${schemaFailures})`);

  const targetEntryBefore = entriesBefore.find((r: any) => r.id === TARGET_ID);
  assert(Boolean(targetEntryBefore), `Found target release ${TARGET_ID} on disk`);

  // Snapshot editorial fields before unpublish
  const editorialSnapshot = {
    title: targetEntryBefore.title,
    canonicalTitle: targetEntryBefore.canonicalTitle,
    slug: targetEntryBefore.slug,
    youtubeId: targetEntryBefore.youtubeId,
    description: targetEntryBefore.description,
    releaseDate: targetEntryBefore.releaseDate,
    publishedAt: targetEntryBefore.publishedAt,
    writer: JSON.stringify(targetEntryBefore.writer),
    vocalist: JSON.stringify(targetEntryBefore.vocalist),
    canonicalLyrics: JSON.stringify(targetEntryBefore.canonicalLyrics),
    availableLanguages: JSON.stringify(targetEntryBefore.availableLanguages),
    publicCommentary: JSON.stringify(targetEntryBefore.publicCommentary),
    publicSponsorsIntro: targetEntryBefore.publicSponsorsIntro,
    seoKeywords: JSON.stringify(targetEntryBefore.seoKeywords),
    studioProduction: JSON.stringify(targetEntryBefore.studioProduction),
  };

  // Mint admin JWT using live .env.local JWT_SECRET
  const admin = usersRepository.listAll().find((u: any) => u.role === 'super_admin' || u.role === 'admin');
  if (!admin) throw new Error('No admin user found');
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET missing after dotenv load');
  const token = await new SignJWT({ userId: admin.id, email: admin.email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(jwtSecret));
  const adminHeaders = {
    'Content-Type': 'application/json',
    cookie: `access_token=${token}`,
  };

  console.log('\n=== 2. UNPUBLISH TARGET RELEASE VIA PATCH /api/releases/[id] ===');
  const patchRes = await fetch(`${BASE_URL}/api/releases/${TARGET_ID}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify({ action: 'unpublish' }),
  });
  const patchBody = await patchRes.json();
  assert(patchRes.status === 200, `PATCH /api/releases/${TARGET_ID} returned HTTP 200 (got ${patchRes.status})`);
  assert(patchBody.status === 'unpublished', `Returned status === "unpublished" (got "${patchBody.status}")`);
  assert(patchBody.visibility === 'private', `Returned visibility === "private" (got "${patchBody.visibility}")`);
  assert(Boolean(patchBody.unpublishedAt), `Returned unpublishedAt timestamp (${patchBody.unpublishedAt})`);
  assert(patchBody.publicationOverride === true, `Returned publicationOverride === true`);

  // Verify persistence on disk & preservation of all editorial content
  const rawAfterUnpublish = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const diskTarget = rawAfterUnpublish.find((r: any) => r.id === TARGET_ID);
  assert(diskTarget?.status === 'unpublished', `Disk persisted status === "unpublished"`);
  assert(diskTarget?.visibility === 'private', `Disk persisted visibility === "private"`);
  assert(Boolean(diskTarget?.unpublishedAt), `Disk persisted unpublishedAt (${diskTarget?.unpublishedAt})`);
  assert(diskTarget?.title === editorialSnapshot.title, `Preserved title ("${diskTarget?.title}")`);
  assert(diskTarget?.canonicalTitle === editorialSnapshot.canonicalTitle, `Preserved canonicalTitle`);
  assert(diskTarget?.slug === editorialSnapshot.slug, `Preserved slug ("${diskTarget?.slug}")`);
  assert(diskTarget?.youtubeId === editorialSnapshot.youtubeId, `Preserved youtubeId ("${diskTarget?.youtubeId}")`);
  assert(diskTarget?.description === editorialSnapshot.description, `Preserved 710-char description (${diskTarget?.description?.length} chars)`);
  assert(diskTarget?.releaseDate === editorialSnapshot.releaseDate, `Preserved original releaseDate (${diskTarget?.releaseDate})`);
  assert(diskTarget?.publishedAt === editorialSnapshot.publishedAt, `Preserved historical publishedAt (${diskTarget?.publishedAt})`);
  assert(JSON.stringify(diskTarget?.writer) === editorialSnapshot.writer, `Preserved writer credit`);
  assert(JSON.stringify(diskTarget?.vocalist) === editorialSnapshot.vocalist, `Preserved vocalist credit`);
  assert(JSON.stringify(diskTarget?.canonicalLyrics) === editorialSnapshot.canonicalLyrics, `Preserved canonicalLyrics`);
  assert(JSON.stringify(diskTarget?.publicCommentary) === editorialSnapshot.publicCommentary, `Preserved publicCommentary`);
  assert(diskTarget?.publicSponsorsIntro === editorialSnapshot.publicSponsorsIntro, `Preserved publicSponsorsIntro`);
  assert(JSON.stringify(diskTarget?.seoKeywords) === editorialSnapshot.seoKeywords, `Preserved seoKeywords`);
  assert(JSON.stringify(diskTarget?.studioProduction) === editorialSnapshot.studioProduction, `Preserved studioProduction lock metadata`);

  console.log('\n=== 3. ADMIN ACCESS & EDITOR SAVE VERIFICATION (PUT + STALE CHECK) ===');
  const adminGetRes = await fetch(`${BASE_URL}/api/releases/${TARGET_ID}`, { headers: adminHeaders });
  const adminGetData = await adminGetRes.json();
  assert(adminGetRes.status === 200, `Authenticated Admin GET /api/releases/${TARGET_ID} returns 200`);
  assert(adminGetData.status === 'unpublished' && adminGetData.visibility === 'private', `Admin GET sees unpublished + private state`);

  // Test Save (PUT) with reversible edit + restore
  const tempIntro = `${editorialSnapshot.publicSponsorsIntro || ''} [CMS-SAVE-VERIFIED]`.trim();
  const putSaveRes = await fetch(`${BASE_URL}/api/releases/${TARGET_ID}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      ...adminGetData,
      publicSponsorsIntro: tempIntro,
      originalUpdatedAt: adminGetData.updatedAt,
    }),
  });
  const putSaveData = await putSaveRes.json();
  assert(putSaveRes.status === 200, `Admin Editor PUT Save succeeded with HTTP 200 (got ${putSaveRes.status})`);
  assert(putSaveData.publicSponsorsIntro === tempIntro, `PUT persisted updated field`);
  assert(putSaveData.status === 'unpublished' && putSaveData.visibility === 'private', `PUT preserved unpublished + private state`);

  // Test stale optimistic lock rejection when outdated originalUpdatedAt is sent
  const stalePutRes = await fetch(`${BASE_URL}/api/releases/${TARGET_ID}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      ...putSaveData,
      originalUpdatedAt: '2020-01-01T00:00:00.000Z',
    }),
  });
  const stalePutBody = await stalePutRes.json();
  assert(stalePutRes.status === 409 && stalePutBody.code === 'STALE_RELEASE', `Outdated originalUpdatedAt triggers HTTP 409 STALE_RELEASE`);

  // Restore exact original publicSponsorsIntro
  const restorePutRes = await fetch(`${BASE_URL}/api/releases/${TARGET_ID}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({
      ...putSaveData,
      publicSponsorsIntro: editorialSnapshot.publicSponsorsIntro,
      originalUpdatedAt: putSaveData.updatedAt,
    }),
  });
  const restorePutData = await restorePutRes.json();
  assert(restorePutRes.status === 200 && restorePutData.publicSponsorsIntro === editorialSnapshot.publicSponsorsIntro, `Cleanly restored exact original publicSponsorsIntro via PUT`);

  console.log('\n=== 4. ANONYMOUS PUBLIC-ACCESS TESTS (PAGES, APIS, SITEMAP, RECOMMENDATIONS) ===');
  const singleEndpointsMust404 = [
    `/release-detail/${TARGET_SLUG}`,
    `/release-detail/${TARGET_YT_ID}`,
    `/release-detail/${TARGET_ID}`,
    `/release-metadata/${TARGET_YT_ID}`,
    `/api/releases/${TARGET_ID}`,
    `/api/releases/${TARGET_SLUG}`,
    `/api/releases/${TARGET_YT_ID}`,
    `/api/releases?slug=${TARGET_SLUG}`,
    `/api/releases?youtubeId=${TARGET_YT_ID}`,
    `/api/releases?key=${TARGET_ID}`,
    `/api/releases/youtube/${TARGET_YT_ID}`,
    `/api/releases/${TARGET_ID}/runtime-media`,
    `/api/releases/${TARGET_ID}/next-up`,
  ];

  for (const endpoint of singleEndpointsMust404) {
    const res = await fetch(`${BASE_URL}${endpoint}`, { redirect: 'manual' });
    assert(res.status === 404, `Anonymous GET ${endpoint} returns HTTP 404 (got ${res.status})`);
  }

  // Check public listing/discovery surfaces for zero leakage
  const collectionEndpoints = [
    '/',
    '/releases',
    '/api/releases',
    '/api/releases?page=1&pageSize=100',
    '/api/releases?search=Footprints',
    '/api/cms/content',
    '/sitemap.xml',
  ];

  for (const endpoint of collectionEndpoints) {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    const text = await res.text();
    const leaked =
      text.includes(TARGET_ID) ||
      text.includes(TARGET_SLUG) ||
      text.includes(TARGET_YT_ID) ||
      text.includes('Some People Leave Footprints Behind');
    assert(res.status === 200 && !leaked, `Anonymous GET ${endpoint} (HTTP ${res.status}) contains zero trace of unpublished release`);
  }

  // Also verify http://localhost:3005/ and /releases?publicOnly=1 EVEN WHEN LOGGED IN AS ADMIN!
  for (const endpoint of ['/', '/releases', '/api/releases?status=published&publicOnly=1']) {
    const res = await fetch(`${BASE_URL}${endpoint}`, { headers: adminHeaders });
    const text = await res.text();
    const leaked =
      text.includes(TARGET_ID) ||
      text.includes(TARGET_SLUG) ||
      text.includes(TARGET_YT_ID) ||
      text.includes('Some People Leave Footprints Behind');
    assert(res.status === 200 && !leaked, `Logged-in Admin viewing public ${endpoint} (HTTP ${res.status}) sees ZERO trace of unpublished release`);
  }

  // Check recommendations from another public release
  const currentDiskAll = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const expectedPublicCount = currentDiskAll.filter((r: any) => {
    const st = r.status || 'published';
    const vis = r.visibility || 'public';
    if (st !== 'published' || vis !== 'public') return false;
    if (['upcoming', 'teaser_live', 'premiere_scheduled'].includes(r.releaseLifecycle || '')) {
      return r.premiereVisibility === 'public';
    }
    return true;
  }).length;
  const pubListRes = await fetch(`${BASE_URL}/api/releases`);
  const pubList = await pubListRes.json();
  assert(
    Array.isArray(pubList) && pubList.length === expectedPublicCount,
    `Public /api/releases returns exact eligible public count (${expectedPublicCount}; got ${pubList?.length})`
  );
  if (pubList[0]?.id) {
    const nextUpRes = await fetch(`${BASE_URL}/api/releases/${pubList[0].id}/next-up`);
    const nextUpText = await nextUpRes.text();
    assert(!nextUpText.includes(TARGET_ID) && !nextUpText.includes(TARGET_SLUG), `Recommendation endpoint /api/releases/${pubList[0].id}/next-up excludes unpublished release`);
  }

  console.log('\n=== 5. YOUTUBE REIMPORT / SYNC PROTECTION TESTS ===');
  const persistedAfterAll = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')).find((r: any) => r.id === TARGET_ID);
  const simulatedYouTubePayload = {
    id: TARGET_YT_ID,
    title: 'Some People Leave Footprints Behind | SufiPulse USA',
    description: 'Updated YouTube description during channel sync',
    thumbnailUrl: `https://i.ytimg.com/vi/${TARGET_YT_ID}/hqdefault.jpg`,
    durationSeconds: 312,
    durationFormatted: '5:12',
    views: 9999,
    likes: 500,
    comments: 45,
    publishedDate: '2026-11-17T00:00:00Z',
    privacyStatus: 'public', // Even though public on YouTube!
  };

  const remappedStudio = mapVideoToRelease(simulatedYouTubePayload, persistedAfterAll);
  assert(remappedStudio.status === 'unpublished', `mapVideoToRelease preserves status === "unpublished" on studio_pipeline release`);
  assert(remappedStudio.visibility === 'private', `mapVideoToRelease preserves visibility === "private" even when YouTube video is public`);
  assert(remappedStudio.unpublishedAt === persistedAfterAll.unpublishedAt, `mapVideoToRelease preserves unpublishedAt timestamp`);
  assert(remappedStudio.publicationOverride === true, `mapVideoToRelease preserves publicationOverride === true`);

  const simulatedYoutubeSourceUnpublished = {
    ...persistedAfterAll,
    source: 'youtube',
    status: 'unpublished' as const,
    visibility: 'private' as const,
  };
  const remappedRegular = mapVideoToRelease(simulatedYouTubePayload, simulatedYoutubeSourceUnpublished);
  assert(
    remappedRegular.status === 'unpublished' && remappedRegular.visibility === 'private',
    `mapVideoToRelease also preserves unpublished + private on standard source="youtube" releases`
  );

  console.log('\n=== 6. REGRESSION LIFECYCLE TEST ON EPHEMERAL TEST RELEASE ===');
  const tmpId = `test_regression_lifecycle_${Date.now()}`;
  const tmpSlug = `test-regression-lifecycle-${Date.now()}`;
  const createRes = await fetch(`${BASE_URL}/api/releases`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      id: tmpId,
      title: 'Temporary CMS Lifecycle Regression Test',
      slug: tmpSlug,
      youtubeId: 'dQw4w9WgXcQ',
      description: 'Ephemeral test record — deleted immediately after lifecycle checks.',
      durationSeconds: 180,
      durationFormatted: '3:00',
      status: 'draft',
      visibility: 'private',
    }),
  });
  assert(createRes.status === 200 || createRes.status === 201, `Created ephemeral draft test release (${createRes.status})`);

  try {
    // Draft -> anonymous 404
    const anonDraft = await fetch(`${BASE_URL}/api/releases/${tmpId}`);
    assert(anonDraft.status === 404, `Draft release is 404 to anonymous caller`);

    // Publish -> status=published, visibility=public -> anonymous 200
    const pubPatch = await fetch(`${BASE_URL}/api/releases/${tmpId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'publish' }),
    });
    const pubPatchData = await pubPatch.json();
    assert(pubPatch.status === 200 && pubPatchData.status === 'published' && pubPatchData.visibility === 'public', `PATCH publish -> published + public`);
    const anonPub = await fetch(`${BASE_URL}/api/releases/${tmpId}`);
    assert(anonPub.status === 200, `Published + public release is 200 to anonymous caller`);

    // Set visibility=private while status=published -> anonymous MUST get 404!
    const privPatch = await fetch(`${BASE_URL}/api/releases/${tmpId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'set_visibility', visibility: 'private' }),
    });
    const privPatchData = await privPatch.json();
    assert(privPatch.status === 200 && privPatchData.status === 'published' && privPatchData.visibility === 'private', `PATCH set_visibility -> published + private`);
    const anonPriv = await fetch(`${BASE_URL}/api/releases/${tmpId}`);
    assert(anonPriv.status === 404, `Published + PRIVATE release returns 404 to anonymous caller (strict status+visibility enforcement)`);

    // Unpublish -> status=unpublished, visibility=private
    const unpubPatch = await fetch(`${BASE_URL}/api/releases/${tmpId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'unpublish' }),
    });
    const unpubData = await unpubPatch.json();
    assert(unpubPatch.status === 200 && unpubData.status === 'unpublished' && unpubData.visibility === 'private' && Boolean(unpubData.unpublishedAt), `PATCH unpublish -> unpublished + private + unpublishedAt`);

    // Archive -> status=archived, visibility=private
    const archPatch = await fetch(`${BASE_URL}/api/releases/${tmpId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'archive' }),
    });
    const archData = await archPatch.json();
    assert(archPatch.status === 200 && archData.status === 'archived' && archData.visibility === 'private' && Boolean(archData.archivedAt), `PATCH archive -> archived + private + archivedAt`);

    // Restore to Draft -> status=draft, visibility=private
    const restorePatch = await fetch(`${BASE_URL}/api/releases/${tmpId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'restore_draft' }),
    });
    const restoreData = await restorePatch.json();
    assert(restorePatch.status === 200 && restoreData.status === 'draft' && restoreData.visibility === 'private', `PATCH restore_draft -> draft + private`);

    // Test full /admin/cms state-switcher cycle (set_status -> queued, in_review, approved, published, undo -> draft)
    for (const st of ['queued', 'in_review', 'approved', 'unpublished', 'archived'] as const) {
      const stRes = await fetch(`${BASE_URL}/api/releases/${tmpId}`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ action: 'set_status', status: st, visibility: 'private' }),
      });
      const stData = await stRes.json();
      assert(stRes.status === 200 && stData.status === st && stData.visibility === 'private', `/admin/cms set_status -> ${st} (private)`);

      const anonCheck = await fetch(`${BASE_URL}/release-detail/${tmpSlug}`, { redirect: 'manual' });
      const homeHtml = await (await fetch(`${BASE_URL}/`)).text();
      assert(anonCheck.status === 404 && !homeHtml.includes(tmpSlug), `Public frontend hides ${tmpSlug} when status === "${st}"`);
    }

    // Undo / switch back to published -> immediately live on public frontend!
    const undoPubRes = await fetch(`${BASE_URL}/api/releases/${tmpId}`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ action: 'set_status', status: 'published', visibility: 'public' }),
    });
    const undoPubData = await undoPubRes.json();
    assert(undoPubRes.status === 200 && undoPubData.status === 'published' && undoPubData.visibility === 'public', `/admin/cms undo/switch -> published (public)`);
    const liveDetailCheck = await fetch(`${BASE_URL}/release-detail/${tmpSlug}`, { redirect: 'manual' });
    const liveHomeHtml = await (await fetch(`${BASE_URL}/`)).text();
    assert(liveDetailCheck.status === 200 && liveHomeHtml.includes(tmpSlug), `Public frontend (/ and /release-detail/${tmpSlug}) immediately renders song when switched back to published!`);
  } finally {
    const delRes = await fetch(`${BASE_URL}/api/releases/${tmpId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert(delRes.status === 200, `Cleaned up ephemeral test release (${delRes.status})`);
  }

  const finalDiskEntries = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  assert(finalDiskEntries.length === 99, `Final .data/cms-releases.json count remains 99 (got ${finalDiskEntries.length})`);

  console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
