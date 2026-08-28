import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function run() {
  console.log('=== Phase 2R: Pre-Migration Reconciliation Plan ===\n');

  const runtimePath = resolve('.data/cms-releases.json');
  const seedPath = resolve('lib/cms-seed-releases.json');

  if (!existsSync(runtimePath) || !existsSync(seedPath)) {
    console.error('❌ Missing runtime or seed registry file.');
    process.exit(1);
  }

  const runtime = JSON.parse(readFileSync(runtimePath, 'utf8'));
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));

  const rMap = new Map(runtime.map(r => [r.id, r]));
  const sMap = new Map(seed.map(s => [s.id, s]));

  const rIds = new Set(rMap.keys());
  const sIds = new Set(sMap.keys());

  const intersection = [...rIds].filter(id => sIds.has(id));
  const runtimeOnly = [...rIds].filter(id => !sIds.has(id));
  const seedOnly = [...sIds].filter(id => !rIds.has(id));

  let identityConflicts = 0;
  const conflictDetails = [];

  const timestampDeficient = [];
  const readyRecords = [];
  const authorityRecoverable = [];

  for (const id of intersection) {
    const r = rMap.get(id);
    const s = sMap.get(id);

    // Identity Checks
    const norm = (v) => v || '';
    if (norm(r.slug) !== norm(s.slug) || norm(r.youtubeId) !== norm(s.youtubeId)) {
      identityConflicts++;
      conflictDetails.push({
        id,
        rSlug: r.slug, sSlug: s.slug,
        rYt: r.youtubeId, sYt: s.youtubeId
      });
      continue; // Skip further reconciliation for conflicts
    }

    // Timestamps
    const isMissing = (d) => d === undefined || d === null || String(d).trim() === '';
    const isInvalidDate = (d) => d !== undefined && d !== null && isNaN(new Date(d).getTime());
    const isBad = (d) => isMissing(d) || isInvalidDate(d);

    if (isBad(r.createdAt) || isBad(r.updatedAt)) {
      const canRecoverCreated = !isBad(s.createdAt);
      const canRecoverUpdated = !isBad(s.updatedAt);
      timestampDeficient.push({
        id,
        slug: r.slug,
        rCreated: r.createdAt,
        sCreated: s.createdAt,
        rUpdated: r.updatedAt,
        sUpdated: s.updatedAt,
        recoverable: canRecoverCreated && canRecoverUpdated
      });
    }

    // "ready" state
    if (r.contentReadinessState === 'ready') {
      readyRecords.push({
        id,
        slug: r.slug,
        rState: r.contentReadinessState,
        sState: s.contentReadinessState
      });
    }

    // Authority recovery
    const recoveredFields = [];
    if (r.canonicalTitle === undefined && s.canonicalTitle !== undefined) recoveredFields.push('canonicalTitle');
    if (r.youtubeTitle === undefined && s.youtubeTitle !== undefined) recoveredFields.push('youtubeTitle');
    if (r.canonicalThumbnail === undefined && s.canonicalThumbnail !== undefined) recoveredFields.push('canonicalThumbnail');
    if (r.youtubeThumbnailUrl === undefined && s.youtubeThumbnailUrl !== undefined) recoveredFields.push('youtubeThumbnailUrl');
    if (r.canonicalStatus === undefined && s.canonicalStatus !== undefined) recoveredFields.push('canonicalStatus');
    if (r.metadataStatus === undefined && s.metadataStatus !== undefined) recoveredFields.push('metadataStatus');

    if (recoveredFields.length > 0) {
      authorityRecoverable.push({
        id,
        slug: r.slug,
        fields: recoveredFields
      });
    }
  }

  // Look for timestamp deficient or "ready" in runtime-only records too, just in case
  for (const id of runtimeOnly) {
    const r = rMap.get(id);
    const isMissing = (d) => d === undefined || d === null || String(d).trim() === '';
    const isInvalidDate = (d) => d !== undefined && d !== null && isNaN(new Date(d).getTime());
    const isBad = (d) => isMissing(d) || isInvalidDate(d);

    if (isBad(r.createdAt) || isBad(r.updatedAt)) {
      timestampDeficient.push({
        id,
        slug: r.slug,
        rCreated: r.createdAt,
        sCreated: 'N/A (Runtime Only)',
        rUpdated: r.updatedAt,
        sUpdated: 'N/A (Runtime Only)',
        recoverable: false
      });
    }

    if (r.contentReadinessState === 'ready') {
      readyRecords.push({
        id,
        slug: r.slug,
        rState: r.contentReadinessState,
        sState: 'N/A (Runtime Only)'
      });
    }
  }

  console.log(`SET PARTITION`);
  console.log(`Runtime records:             ${rMap.size}`);
  console.log(`Seed records:                ${sMap.size}`);
  console.log(`Intersection:                ${intersection.length}`);
  console.log(`Runtime-only:                ${runtimeOnly.length}`);
  console.log(`Seed-only:                   ${seedOnly.length}`);
  console.log(`Identity conflicts:          ${identityConflicts}\n`);

  if (identityConflicts > 0) {
    console.log(`=== IDENTITY CONFLICTS ===`);
    conflictDetails.forEach(c => {
      console.log(`${c.id}`);
      console.log(`  Runtime slug: ${c.rSlug} | Seed slug: ${c.sSlug}`);
      console.log(`  Runtime YT:   ${c.rYt} | Seed YT:   ${c.sYt}`);
    });
    console.log('');
  }

  console.log(`=== RUNTIME-ONLY IDs (12 Expected) ===`);
  runtimeOnly.forEach(id => console.log(`  - ${id}`));
  console.log('');

  if (seedOnly.length > 0) {
    console.log(`=== SEED-ONLY IDs ===`);
    seedOnly.forEach(id => console.log(`  - ${id}`));
    console.log('');
  }

  console.log(`=== TIMESTAMP-DEFICIENT RECORDS ===`);
  timestampDeficient.forEach(t => {
    console.log(`${t.id} (${t.slug})`);
    console.log(`  Runtime createdAt: ${t.rCreated} | Seed: ${t.sCreated}`);
    console.log(`  Runtime updatedAt: ${t.rUpdated} | Seed: ${t.sUpdated}`);
    console.log(`  Recoverable from Seed: ${t.recoverable ? 'YES' : 'NO'}`);
  });
  console.log('');

  console.log(`=== "READY" STATE RECORDS ===`);
  readyRecords.forEach(r => {
    console.log(`${r.id} (${r.slug})`);
    console.log(`  Runtime state: ${r.rState} | Historical Seed state: ${r.sState}`);
  });
  console.log('');

  console.log(`=== AUTHORITY FIELDS RECOVERABLE ===`);
  console.log(`Total records with recoverable authority fields: ${authorityRecoverable.length}`);
  if (authorityRecoverable.length > 0) {
    console.log(`Sample of recovered fields (first 3):`);
    authorityRecoverable.slice(0, 3).forEach(a => {
      console.log(`  ${a.id} (${a.slug}) -> ${a.fields.join(', ')}`);
    });
  }
}

run();
