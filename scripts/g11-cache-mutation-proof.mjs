/**
 * g11-cache-mutation-proof.mjs
 *
 * G11: Prove the cache contract — mutation is visible via an ordinary GET
 * without any cache-busting parameters.
 *
 * Test field: contentReadinessState
 * Chosen because:
 *   - Already exists on the release with a clear string value
 *   - Non-canonical (not title, slug, status, or governanceOrigin)
 *   - Exactly reversible: sentinel → restore → verify restoration
 *
 * PROOF STEPS (A–H per gate spec):
 *   A. GET /api/releases/{id} → record original contentReadinessState
 *   B. Admin PUT /api/releases/{id} with sentinel value
 *   C. PUT response contains sentinel
 *   D. Ordinary GET (no ?t= no forceHydrate) → sentinel visible
 *   E. .data/cms-releases.json contains sentinel (persistent registry)
 *   F. Admin PUT /api/releases/{id} with original value restored
 *   G. Ordinary GET → original value restored
 *   H. .data/cms-releases.json contains original value restored
 *
 * CONSTRAINTS (all must hold):
 *   - No ?t= or forceHydrate on any GET
 *   - No direct .data file modification
 *   - All mutations via authenticated PUT only
 *
 * NOTE: This script requires an admin session cookie (access_token).
 *       Provide it via ADMIN_TOKEN environment variable.
 *
 * Usage:
 *   $env:ADMIN_TOKEN="<your-access_token-cookie-value>"; node scripts/g11-cache-mutation-proof.mjs
 *
 * How to get ADMIN_TOKEN:
 *   1. Log in to admin at http://localhost:3000/login
 *   2. Open DevTools → Application → Cookies → localhost:3000
 *   3. Copy the value of the 'access_token' cookie
 *   4. Set $env:ADMIN_TOKEN="<that value>"
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const BASE = process.env.G11_BASE || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const RELEASE_ID = 'release_1775202913815_aMzdiIuYgK4';
const TEST_FIELD = 'contentReadinessState';
const SENTINEL = 'G11_CACHE_SENTINEL';
const DATA_FILE = resolve('.data/cms-releases.json');

function readRegistry(id) {
  const arr = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  return arr.find(r => r.id === id);
}

async function getRelease() {
  // Ordinary GET — no cache-busting parameters whatsoever
  const url = `${BASE}/api/releases/${RELEASE_ID}`;
  const res = await fetch(url);
  if (!res.status === 200) throw new Error(`GET failed: ${res.status}`);
  return { body: await res.json(), status: res.status, url };
}

async function putRelease(body) {
  if (!ADMIN_TOKEN) throw new Error('ADMIN_TOKEN not set — see script header for instructions');
  const url = `${BASE}/api/releases/${RELEASE_ID}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `access_token=${ADMIN_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { body: data, status: res.status, url };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('\n=== G11 — Cache Contract Proof ===');
  console.log(`Server:      ${BASE}`);
  console.log(`Release ID:  ${RELEASE_ID}`);
  console.log(`Test field:  ${TEST_FIELD}`);
  console.log(`Sentinel:    "${SENTINEL}"\n`);

  if (!ADMIN_TOKEN) {
    console.error('❌ ADMIN_TOKEN environment variable is required.');
    console.error('   1. Log into http://localhost:3000/login as admin');
    console.error('   2. DevTools → Application → Cookies → Copy "access_token" value');
    console.error('   3. Run: $env:ADMIN_TOKEN="<value>"; node scripts/g11-cache-mutation-proof.mjs');
    process.exit(1);
  }

  let ORIGINAL_VALUE;

  // ── Step A: Ordinary GET → record original value ─────────────────────────
  console.log('Step A: GET (no cache params) → record original value');
  const stepA = await getRelease();
  ORIGINAL_VALUE = stepA.body[TEST_FIELD];
  console.log(`  GET ${stepA.url}`);
  console.log(`  HTTP: ${stepA.status}`);
  console.log(`  ${TEST_FIELD}: ${JSON.stringify(ORIGINAL_VALUE)}`);

  if (ORIGINAL_VALUE === undefined) {
    console.error(`❌ Field "${TEST_FIELD}" is absent on this release. Choose a different field.`);
    process.exit(1);
  }
  console.log('  ✅ Original value recorded\n');

  // ── Step B: Authenticated PUT → set sentinel ──────────────────────────────
  console.log('Step B: Authenticated PUT → set sentinel');
  const stepB = await putRelease({ [TEST_FIELD]: SENTINEL });
  console.log(`  PUT ${stepB.url}`);
  console.log(`  HTTP: ${stepB.status}`);
  console.log(`  ${TEST_FIELD} in response: ${JSON.stringify(stepB.body[TEST_FIELD])}`);

  // ── Step C: PUT response contains sentinel ────────────────────────────────
  const stepC_pass = stepB.body[TEST_FIELD] === SENTINEL;
  console.log(`\nStep C: PUT response contains sentinel`);
  console.log(`  ${stepC_pass ? '✅ PASS' : '❌ FAIL'} — response.${TEST_FIELD} = ${JSON.stringify(stepB.body[TEST_FIELD])}\n`);

  // ── Step D: Ordinary GET → sentinel visible ───────────────────────────────
  await sleep(200); // Allow Next.js revalidatePath to process
  console.log('Step D: Ordinary GET (no ?t= no forceHydrate) → sentinel visible');
  const stepD = await getRelease();
  const stepD_pass = stepD.body[TEST_FIELD] === SENTINEL;
  console.log(`  GET ${stepD.url}`);
  console.log(`  HTTP: ${stepD.status}`);
  console.log(`  ${TEST_FIELD}: ${JSON.stringify(stepD.body[TEST_FIELD])}`);
  console.log(`  ${stepD_pass ? '✅ PASS' : '❌ FAIL'} — sentinel ${stepD_pass ? 'visible' : 'NOT visible'}\n`);

  // ── Step E: Persistent registry contains sentinel ─────────────────────────
  console.log('Step E: Persistent registry (.data/cms-releases.json) contains sentinel');
  const regAfterPut = readRegistry(RELEASE_ID);
  const stepE_pass = regAfterPut && regAfterPut[TEST_FIELD] === SENTINEL;
  console.log(`  Registry ${TEST_FIELD}: ${JSON.stringify(regAfterPut?.[TEST_FIELD])}`);
  console.log(`  ${stepE_pass ? '✅ PASS' : '❌ FAIL'} — sentinel ${stepE_pass ? 'persisted to registry' : 'NOT in registry'}\n`);

  // ── Step F: Authenticated PUT → restore original ──────────────────────────
  console.log('Step F: Authenticated PUT → restore original value');
  const stepF = await putRelease({ [TEST_FIELD]: ORIGINAL_VALUE });
  console.log(`  PUT ${stepF.url}`);
  console.log(`  HTTP: ${stepF.status}`);
  console.log(`  ${TEST_FIELD} in response: ${JSON.stringify(stepF.body[TEST_FIELD])}\n`);

  // ── Step G: Ordinary GET → original value restored ────────────────────────
  await sleep(200);
  console.log('Step G: Ordinary GET (no ?t= no forceHydrate) → original value restored');
  const stepG = await getRelease();
  const stepG_pass = stepG.body[TEST_FIELD] === ORIGINAL_VALUE;
  console.log(`  GET ${stepG.url}`);
  console.log(`  HTTP: ${stepG.status}`);
  console.log(`  ${TEST_FIELD}: ${JSON.stringify(stepG.body[TEST_FIELD])}`);
  console.log(`  ${stepG_pass ? '✅ PASS' : '❌ FAIL'} — original ${stepG_pass ? 'restored' : 'NOT restored'}\n`);

  // ── Step H: Registry contains original value ──────────────────────────────
  console.log('Step H: Persistent registry contains original value');
  const regAfterRestore = readRegistry(RELEASE_ID);
  const stepH_pass = regAfterRestore && regAfterRestore[TEST_FIELD] === ORIGINAL_VALUE;
  console.log(`  Registry ${TEST_FIELD}: ${JSON.stringify(regAfterRestore?.[TEST_FIELD])}`);
  console.log(`  ${stepH_pass ? '✅ PASS' : '❌ FAIL'} — original ${stepH_pass ? 'restored in registry' : 'NOT in registry'}\n`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const steps = { C: stepC_pass, D: stepD_pass, E: stepE_pass, G: stepG_pass, H: stepH_pass };
  const allPass = Object.values(steps).every(Boolean);

  console.log('═══════════════════════════════════════════════');
  console.log('GATE EVIDENCE — G11: Mutation/Cache Visibility');
  console.log('═══════════════════════════════════════════════');
  console.log(`Release:     ${RELEASE_ID}`);
  console.log(`Test field:  ${TEST_FIELD}`);
  console.log(`Original:    ${JSON.stringify(ORIGINAL_VALUE)}`);
  console.log(`Sentinel:    "${SENTINEL}"\n`);
  console.log(`Step C (PUT response has sentinel):      ${steps.C ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`Step D (ordinary GET sees sentinel):     ${steps.D ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`Step E (registry has sentinel):          ${steps.E ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`Step G (ordinary GET sees original):     ${steps.G ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`Step H (registry has original restored): ${steps.H ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`\nNo ?t=, no forceHydrate, no direct .data file modification.`);
  console.log(`\nG11: ${allPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════');

  if (!allPass) process.exit(1);
}

run().catch(err => {
  console.error('\n❌ G11 script error:', err.message);
  process.exit(1);
});
