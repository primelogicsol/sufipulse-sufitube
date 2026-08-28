/**
 * migrate-governance-origin.mjs
 *
 * One-shot idempotent migration: stamps governanceOrigin and govType on every
 * CMS release that does not already have an explicit classification.
 *
 * AUTHORITY MODEL:
 *   Distribution/import source and governance provenance are INDEPENDENT domains.
 *   - source field describes HOW a record entered the system (youtube, cms, import, etc.)
 *   - governanceOrigin describes WHO governs the content (SufiPulse vs. third-party)
 *   A SufiPulse-governed release can be imported from YouTube.
 *   source MUST NOT be used to infer governance.
 *
 * CLASSIFICATION RULES:
 *   1. IF governanceOrigin already exists → preserve it (do not overwrite)
 *   2. IF record carries an explicit institutional marker indicating non-SufiPulse
 *      governance (e.g., explicitLegacyMarker: true) → legacy_registry
 *   3. FOR the confirmed SufiPulse catalogue (records that exist in this registry
 *      by virtue of institutional inclusion, not inferred from source field)
 *      → native_governed
 *   4. FUTURE records with no governance context → unresolved (not legacy, not native)
 *
 * This script handles rule 3 for the current known catalogue.
 * All 101 records in the current dataset have been institutionally established
 * as SufiPulse-governed works (confirmed by operator).
 *
 * IDEMPOTENT: records with existing governanceOrigin are never overwritten.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', '.data', 'cms-releases.json');

function classifyGovernance(r) {
  // Rule 1: Preserve explicit existing classification — do not overwrite
  if (r.governanceOrigin) return r.governanceOrigin;

  // Rule 2: Explicit institutional legacy marker (must be set explicitly by admin,
  // never derived from source/import mechanism)
  if (r.explicitLegacyMarker === true) return 'legacy_registry';

  // Rule 3: Confirmed SufiPulse catalogue (this script is only run on confirmed
  // institutional records). Do NOT infer from r.source.
  // The operator confirms these records are SufiPulse-governed.
  return 'native_governed';

  // NOTE: For future records of unknown provenance, the safe default is 'unresolved'.
  // This script stamps 'native_governed' only because the operator has confirmed
  // the current 101-record catalogue. Extend this script or add a separate pass
  // for imported records that require admin review before governance is assigned.
}

const raw = fs.readFileSync(DATA_FILE, 'utf8');
const arr = JSON.parse(raw);

let preserved = 0;
let stamped   = 0;
const distribution = {};

const migrated = arr.map(r => {
  const before = r.governanceOrigin;
  const gov = classifyGovernance(r);

  if (before) {
    preserved++;
  } else {
    stamped++;
  }

  distribution[gov] = (distribution[gov] || 0) + 1;
  return { ...r, governanceOrigin: gov, govType: gov };
});

fs.writeFileSync(DATA_FILE, JSON.stringify(migrated, null, 2), 'utf8');

// Disjoint-set assertion: every record classified in exactly one category
const allIds = new Set(migrated.map(r => r.id));
const byCategory = { native_governed: [], legacy_registry: [], unresolved: [] };
migrated.forEach(r => {
  const cat = r.governanceOrigin;
  if (byCategory[cat] !== undefined) byCategory[cat].push(r.id);
});

const ngSet  = new Set(byCategory.native_governed);
const lrSet  = new Set(byCategory.legacy_registry);
const urSet  = new Set(byCategory.unresolved);
const ngLrIntersection = [...ngSet].filter(id => lrSet.has(id));
const ngUrIntersection = [...ngSet].filter(id => urSet.has(id));
const lrUrIntersection = [...lrSet].filter(id => urSet.has(id));
const unionCount = ngSet.size + lrSet.size + urSet.size;

console.log('\n✅ Governance migration complete');
console.log(`   Preserved (had governanceOrigin): ${preserved}`);
console.log(`   Stamped (newly classified):        ${stamped}`);
console.log(`   Total records:                     ${migrated.length}`);
console.log('\n   Distribution:');
Object.entries(distribution).sort().forEach(([k, v]) => console.log(`     ${k}: ${v}`));
console.log('\n   Disjoint-set assertion:');
console.log(`     native_governed ∩ legacy_registry = ${ngLrIntersection.length} (must be 0)`);
console.log(`     native_governed ∩ unresolved      = ${ngUrIntersection.length} (must be 0)`);
console.log(`     legacy_registry ∩ unresolved      = ${lrUrIntersection.length} (must be 0)`);
console.log(`     ∪ all categories = ${unionCount} (must equal ${migrated.length})`);

const assertionPassed =
  ngLrIntersection.length === 0 &&
  ngUrIntersection.length === 0 &&
  lrUrIntersection.length === 0 &&
  unionCount === migrated.length &&
  !migrated.some(r => !r.governanceOrigin);

console.log(`\n   ${assertionPassed ? '✅ Assertion PASSED' : '❌ Assertion FAILED'}`);

if (!assertionPassed) process.exit(1);
