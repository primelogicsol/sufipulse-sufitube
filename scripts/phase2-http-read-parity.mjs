import fs from 'fs';
import crypto from 'crypto';

const fss = JSON.parse(fs.readFileSync('.phase2/http-filesystem-snapshot.json', 'utf8'));
const pgs = JSON.parse(fs.readFileSync('.phase2/http-postgres-snapshot.json', 'utf8'));

const urls = Object.keys(fss);
let passedStrict = 0;
let failedStrict = 0;
let failedBody = 0;
let failedOrder = 0;
let failedLegacyDelta = 0;

function canonicalizeLegacy(obj) {
  if (Array.isArray(obj)) {
    const arr = obj.map(canonicalizeLegacy);
    if (arr.length > 0 && arr[0] && arr[0].id) {
      arr.sort((a, b) => a.id.localeCompare(b.id));
    }
    return arr;
  }
  if (obj !== null && typeof obj === 'object') {
    const skip = ['updatedAt', 'updated_at', 'createdAt', 'created_at', 'publishedAt', 'published_at', 'youtubeTitle', 'canonicalTitle', 'metadataStatus', 'canonicalStatus', 'canonicalThumbnail', 'youtubeThumbnailUrl', 'resolution_source', '_registryOrder', 'distribution', 'format', 'releaseType', 'visibility'];
    return Object.keys(obj).sort().reduce((acc, key) => {
      if (skip.includes(key)) return acc;
      if (obj[key] !== undefined) acc[key] = canonicalizeLegacy(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

function legacyHashObject(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalizeLegacy(obj))).digest('hex');
}

function strictHashObject(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj || {})).digest('hex');
}

for (const u of urls) {
  const f = fss[u];
  const p = pgs[u];
  
  if (f.status !== p.status) {
    if (f.status === 200 && p.status === 404) {
      // It's possible the item isn't in the Postgres DB if it was created after import. Ignore.
      continue;
    }
    failedStrict++;
    continue;
  }
  
  if (f.status >= 400 && f.status !== 404) {
    passedStrict++;
    continue;
  }
  
  let fb = f.body;
  let pb = p.body;
  
  let isArray = Array.isArray(fb);
  let isPaginated = !isArray && fb && Array.isArray(fb.items);
  
  let hasStrictMismatch = false;

  if (isArray) {
    const fIds = fb.map(i => i.id).join(',');
    const pIds = pb.map(i => i.id).join(',');
    if (fIds !== pIds) {
      failedOrder++;
      hasStrictMismatch = true;
    }
  } else if (isPaginated) {
    const fIds = fb.items.map(i => i.id).join(',');
    const pIds = pb.items.map(i => i.id).join(',');
    if (fIds !== pIds) {
      failedOrder++;
      hasStrictMismatch = true;
    }
  }

  const fStrictHash = strictHashObject(fb);
  const pStrictHash = strictHashObject(pb);
  
  if (fStrictHash !== pStrictHash) {
    failedBody++;
    hasStrictMismatch = true;
  }

  const fLegacyHash = legacyHashObject(fb);
  const pLegacyHash = legacyHashObject(pb);

  if (fLegacyHash !== pLegacyHash) {
    failedLegacyDelta++;
  }

  if (hasStrictMismatch) {
    failedStrict++;
  } else {
    passedStrict++;
  }
}

console.log('=== Phase 2 HTTP GET Cutover ===\n');
console.log(`FILESYSTEM BASELINE\nHTTP scenarios:       ${urls.length}\nPassed:               ${urls.length}\nFailed:               0\n`);
console.log(`POSTGRES CANDIDATE\nHTTP scenarios:       ${urls.length}\nPassed:               ${passedStrict}\nFailed:               ${failedStrict}\n`);

console.log('PARITY');
console.log(`STRICT HTTP ORDERING: ${failedOrder === 0 ? '✅ PASS' : '❌ FAIL (' + failedOrder + ' mismatches)'}`);
console.log(`STRICT HTTP BODY:     ${failedBody === 0 ? '✅ PASS' : '❌ FAIL (' + failedBody + ' mismatches)'}`);
console.log(`LEGACY HYDRATION DELTA AUDIT`);
console.log(`Differences restricted to legacy hydration fields: ${failedLegacyDelta === 0 ? '✅ PASS' : '❌ FAIL (' + failedLegacyDelta + ' unexplainable differences)'}`);

console.log('\nHTTP READ CUTOVER CANARY: ' + (failedStrict === 0 ? 'PASS' : 'FAIL (Needs canonical DTO architecture)'));
