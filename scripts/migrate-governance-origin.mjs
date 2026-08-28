/**
 * migrate-governance-origin.mjs
 * One-shot idempotent migration: stamps governanceOrigin and govType on every
 * CMS release that does not already have one set.
 *
 * Classification rules:
 *   source === 'youtube_import' | 'import' | 'legacy_import'  → legacy_registry
 *   everything else (SufiPulse Studio / native / no source)   → native_governed
 *
 * IDEMPOTENT: records with existing governanceOrigin are not overwritten.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', '.data', 'cms-releases.json');

function classifyGovernance(r) {
  if (r.governanceOrigin) return r.governanceOrigin;
  const source = (r.source || '').toLowerCase();
  if (source === 'youtube_import' || source === 'import' || source === 'legacy_import') {
    return 'legacy_registry';
  }
  return 'native_governed';
}

const raw = fs.readFileSync(DATA_FILE, 'utf8');
const arr = JSON.parse(raw);

let stamped = 0;
let skipped = 0;

const migrated = arr.map(r => {
  if (r.governanceOrigin && r.govType) { skipped++; return r; }
  const gov = classifyGovernance(r);
  stamped++;
  return { ...r, governanceOrigin: gov, govType: gov };
});

fs.writeFileSync(DATA_FILE, JSON.stringify(migrated, null, 2), 'utf8');

const counts = {};
migrated.forEach(r => {
  const g = r.governanceOrigin || 'NONE';
  counts[g] = (counts[g] || 0) + 1;
});

console.log('\u2705 Governance migration complete');
console.log('   Stamped:', stamped, '| Skipped (already set):', skipped, '| Total:', migrated.length);
console.log('   Distribution:', JSON.stringify(counts));
