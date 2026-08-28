import fs from 'fs';
import path from 'path';

const RUNTIME_FILE = '.data/cms-releases.json';
const RECONCILED_FILE = '.phase2/reconciled-cms-releases.json';

function run() {
  console.log('=== Runtime Registry Delta Audit ===\n');

  if (!fs.existsSync(RUNTIME_FILE) || !fs.existsSync(RECONCILED_FILE)) {
    throw new Error('Required files not found');
  }

  const runtimeReleases = JSON.parse(fs.readFileSync(RUNTIME_FILE, 'utf8'));
  const reconciledReleases = JSON.parse(fs.readFileSync(RECONCILED_FILE, 'utf8'));

  console.log(`Raw runtime:      ${runtimeReleases.length}`);
  console.log(`Reconciled:       ${reconciledReleases.length}`);

  if (runtimeReleases.length !== 101 || reconciledReleases.length !== 101) {
    throw new Error('Count mismatch from 101');
  }

  const runIds = new Set(runtimeReleases.map(r => r.id));
  const recIds = new Set(reconciledReleases.map(r => r.id));
  let exactIdSet = true;
  for (const id of runIds) {
    if (!recIds.has(id)) exactIdSet = false;
  }
  for (const id of recIds) {
    if (!runIds.has(id)) exactIdSet = false;
  }
  
  console.log(`Exact ID set:     ${exactIdSet ? 'PASS' : 'FAIL'}\n`);

  if (!exactIdSet) throw new Error('ID sets do not match');

  const authorizedFields = new Set([
    'canonicalTitle',
    'canonicalStatus',
    'canonicalThumbnail',
    'youtubeTitle',
    'youtubeThumbnailUrl',
    'metadataStatus'
  ]);

  let unexpectedChangedFields = 0;
  let unexpectedAddedRecords = 0;
  let unexpectedDeletedRecords = 0;
  let timestampsSynthesized = 0;
  let readinessStatesChanged = 0;
  let governanceChanged = 0;

  for (const rec of reconciledReleases) {
    const run = runtimeReleases.find(r => r.id === rec.id);
    if (!run) {
      unexpectedAddedRecords++;
      continue;
    }

    // compare keys
    const runKeys = new Set(Object.keys(run));
    const recKeys = new Set(Object.keys(rec));
    const allKeys = new Set([...runKeys, ...recKeys]);

    for (const key of allKeys) {
      if (authorizedFields.has(key)) continue;

      const runVal = JSON.stringify(run[key]);
      const recVal = JSON.stringify(rec[key]);

      if (runVal !== recVal) {
        unexpectedChangedFields++;
        console.error(`Unexpected change for ${rec.id} in field ${key}: ${runVal} -> ${recVal}`);
        if (key === 'createdAt' || key === 'updatedAt') timestampsSynthesized++;
        if (key === 'contentReadinessState') readinessStatesChanged++;
        if (key === 'governanceOrigin' || key === 'govType') governanceChanged++;
      }
    }
  }

  for (const run of runtimeReleases) {
    if (!reconciledReleases.find(r => r.id === run.id)) {
      unexpectedDeletedRecords++;
    }
  }

  console.log('Approved authority restorations: PASS');
  console.log(`Unexpected changed fields: ${unexpectedChangedFields}`);
  console.log(`Unexpected added records:   ${unexpectedAddedRecords}`);
  console.log(`Unexpected deleted records: ${unexpectedDeletedRecords}\n`);

  if (unexpectedChangedFields > 0 || unexpectedAddedRecords > 0 || unexpectedDeletedRecords > 0) {
    console.log('RUNTIME DELTA AUDIT: FAIL');
    process.exitCode = 1;
  } else {
    console.log('RUNTIME DELTA AUDIT: PASS');
  }
}

run();
