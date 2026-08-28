/**
 * migrate-governance-origin.mjs
 *
 * One-shot idempotent migration: stamps governanceOrigin and govType on every
 * CMS release that does not already have an explicit classification.
 *
 * AUTHORITY MODEL:
 *   Distribution/import source and governance provenance are INDEPENDENT domains.
 *   - source field describes HOW a record entered the system
 *   - governanceOrigin describes WHO governs the content
 *   source MUST NOT be used to infer governance.
 *
 * CLASSIFICATION RULES (enforced in code, not just comments):
 *   1. IF governanceOrigin already exists → preserve it
 *   2. IF record has r.explicitLegacyMarker === true → legacy_registry
 *   3. IF record.id is in confirmedCatalogueIds → native_governed
 *   4. ELSE → unresolved  (requires explicit admin review before governance is assigned)
 *
 * confirmedCatalogueIds is built from records that already carry an explicit
 * native_governed stamp from a prior run. New imports arriving after this migration
 * has run will not be in that set, so they will receive 'unresolved' rather than
 * being silently promoted to native_governed.
 *
 * IDEMPOTENT: records with existing governanceOrigin are never overwritten.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', '.data', 'cms-releases.json');

const raw = fs.readFileSync(DATA_FILE, 'utf8');
const arr = JSON.parse(raw);

// Build confirmed catalogue from records already explicitly stamped native_governed.
// This set is the authoritative boundary: IDs outside it that lack governanceOrigin
// will be classified as 'unresolved', not silently promoted to native_governed.
const confirmedCatalogueIds = new Set(
  arr
    .filter(r => r.governanceOrigin === 'native_governed')
    .map(r => r.id)
);

function classifyGovernance(r) {
  // Rule 1: Preserve existing explicit classification — never overwrite
  if (r.governanceOrigin) return r.governanceOrigin;

  // Rule 2: Explicit institutional legacy marker (set by admin, never derived from source)
  if (r.explicitLegacyMarker === true) return 'legacy_registry';

  // Rule 3: Record is in the confirmed SufiPulse catalogue
  if (confirmedCatalogueIds.has(r.id)) return 'native_governed';

  // Rule 4: Unknown provenance — requires explicit admin review
  // Do NOT default to native_governed. Future imports that have not been reviewed
  // must surface as 'unresolved' rather than being silently classified.
  return 'unresolved';
}

let preserved = 0;
let stamped   = 0;
const distribution = {};

const migrated = arr.map(r => {
  const before = r.governanceOrigin;
  const gov = classifyGovernance(r);
  if (before) preserved++; else stamped++;
  distribution[gov] = (distribution[gov] || 0) + 1;
  return { ...r, governanceOrigin: gov, govType: gov };
});

fs.writeFileSync(DATA_FILE, JSON.stringify(migrated, null, 2), 'utf8');

// Disjoint-set assertion — every record classified in exactly one category
const byCategory = { native_governed: [], legacy_registry: [], unresolved: [] };
migrated.forEach(r => {
  const cat = r.governanceOrigin;
  if (byCategory[cat] !== undefined) byCategory[cat].push(r.id);
});

const ngSet = new Set(byCategory.native_governed);
const lrSet = new Set(byCategory.legacy_registry);
const urSet = new Set(byCategory.unresolved);

const ngLrIntersection = [...ngSet].filter(id => lrSet.has(id)).length;
const ngUrIntersection = [...ngSet].filter(id => urSet.has(id)).length;
const lrUrIntersection = [...lrSet].filter(id => urSet.has(id)).length;
const unionCount = ngSet.size + lrSet.size + urSet.size;
const allClassified = !migrated.some(r => !r.governanceOrigin);

const assertionPassed =
  ngLrIntersection === 0 &&
  ngUrIntersection === 0 &&
  lrUrIntersection === 0 &&
  unionCount === migrated.length &&
  allClassified;

console.log('\u2705 Governance migration complete');
console.log(`   Confirmed catalogue (native_governed source set): ${confirmedCatalogueIds.size} records`);
console.log(`   Preserved (had governanceOrigin): ${preserved}`);
console.log(`   Stamped  (newly classified):      ${stamped}`);
console.log(`   Total records:                    ${migrated.length}`);
console.log('\n   Distribution:');
Object.entries(distribution).sort().forEach(([k, v]) => console.log(`     ${k}: ${v}`));
console.log('\n   Disjoint-set assertion:');
console.log(`     native_governed \u2229 legacy_registry: ${ngLrIntersection} (must be 0)`);
console.log(`     native_governed \u2229 unresolved:      ${ngUrIntersection} (must be 0)`);
console.log(`     legacy_registry \u2229 unresolved:      ${lrUrIntersection} (must be 0)`);
console.log(`     \u222a all categories: ${unionCount} (must equal ${migrated.length})`);
console.log(`     all records classified: ${allClassified}`);
console.log(`\n   ${assertionPassed ? '\u2705 Assertion PASSED' : '\u274c Assertion FAILED'}`);

if (!assertionPassed) process.exit(1);
