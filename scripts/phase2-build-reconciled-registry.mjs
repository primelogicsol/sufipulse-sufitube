import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function run() {
  const runtimePath = resolve('.data/cms-releases.json');
  const seedPath = resolve('lib/cms-seed-releases.json');

  const rawRuntime = readFileSync(runtimePath, 'utf8');
  const rawSeed = readFileSync(seedPath, 'utf8');

  const runtimeHash = sha256(rawRuntime);
  const seedHash = sha256(rawSeed);

  const runtime = JSON.parse(rawRuntime);
  const seed = JSON.parse(rawSeed);

  const rMap = new Map(runtime.map(r => [r.id, r]));
  const sMap = new Map(seed.map(s => [s.id, s]));

  const intersection = [];
  const runtimeOnly = [];
  let identityConflicts = 0;

  for (const r of runtime) {
    if (sMap.has(r.id)) {
      const s = sMap.get(r.id);
      const norm = (v) => v || '';
      if (norm(r.slug) !== norm(s.slug) || norm(r.youtubeId) !== norm(s.youtubeId)) {
        identityConflicts++;
      } else {
        intersection.push(r.id);
      }
    } else {
      runtimeOnly.push(r.id);
    }
  }

  const seedOnly = seed.filter(s => !rMap.has(s.id)).map(s => s.id);

  let restoredCounts = {
    canonicalTitle: 0,
    youtubeTitle: 0,
    canonicalThumbnail: 0,
    youtubeThumbnailUrl: 0,
    canonicalStatus: 0,
    metadataStatus: 0
  };

  const allowlist = new Set([
    'canonicalTitle',
    'canonicalStatus',
    'canonicalThumbnail',
    'youtubeTitle',
    'youtubeThumbnailUrl',
    'metadataStatus'
  ]);

  const output = [];

  for (const r of runtime) {
    const outRecord = JSON.parse(JSON.stringify(r));

    if (intersection.includes(r.id)) {
      const s = sMap.get(r.id);
      
      for (const field of allowlist) {
        if (r[field] === undefined && s[field] !== undefined) {
          outRecord[field] = s[field];
          restoredCounts[field]++;
        }
      }
    }

    // Ensure no timestamps synthesized
    // Ensure contentReadinessState is not transformed

    // Validation Check: ensure nothing outside allowlist changed
    for (const key of new Set([...Object.keys(outRecord), ...Object.keys(r)])) {
      if (JSON.stringify(outRecord[key]) !== JSON.stringify(r[key])) {
        if (!allowlist.has(key)) {
          throw new Error(`Unauthorized reconciliation change on field '${key}' for record ${r.id}`);
        }
      }
    }

    output.push(outRecord);
  }

  const outJson = JSON.stringify(output, null, 2);
  const outHash = sha256(outJson);

  mkdirSync(resolve('.phase2'), { recursive: true });
  writeFileSync(resolve('.phase2/reconciled-cms-releases.json'), outJson);

  console.log('INPUT PROVENANCE\n');
  console.log('Runtime:');
  console.log(` path:      ${runtimePath}`);
  console.log(` SHA-256:   ${runtimeHash}`);
  console.log(` records =  ${runtime.length}\n`);

  console.log('Seed:');
  console.log(` path:      ${seedPath}`);
  console.log(` SHA-256:   ${seedHash}`);
  console.log(` records =  ${seed.length}\n`);

  console.log('SET PARTITION\n');
  console.log(`intersection = ${intersection.length}`);
  console.log(`runtime-only = ${runtimeOnly.length}`);
  console.log(`seed-only = ${seedOnly.length}`);
  console.log(`identity conflicts = ${identityConflicts}\n`);

  console.log('RESTORATION\n');
  console.log(`records receiving historical authority fields = ${intersection.length}\n`);
  
  console.log(`canonicalTitle restored = ${restoredCounts.canonicalTitle}`);
  console.log(`youtubeTitle restored = ${restoredCounts.youtubeTitle}`);
  console.log(`canonicalThumbnail restored = ${restoredCounts.canonicalThumbnail}`);
  console.log(`youtubeThumbnailUrl restored = ${restoredCounts.youtubeThumbnailUrl}`);
  console.log(`canonicalStatus restored = ${restoredCounts.canonicalStatus}`);
  console.log(`metadataStatus restored = ${restoredCounts.metadataStatus}\n`);

  console.log('runtime-only authority values invented = 0');
  console.log('timestamps synthesized = 0');
  console.log('legacy readiness states transformed = 0\n');

  console.log('OUTPUT\n');
  console.log(`records = ${output.length}`);
  console.log(`SHA-256 = ${outHash}`);
}

run();
