import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';
import { PostgresReleaseRepository } from '../server/db/release-repository.js';
import { projectRelease } from '../server/db/release-mapper.js';

const { Pool } = pg;
const RECONCILED_FILE = '.phase2/reconciled-cms-releases.json';

// P0 JS EVALUATOR FROM /api/releases/route.ts
function runP0Query(allReleases, searchParamsObj) {
  let releases = [...allReleases];

  const status = searchParamsObj.status;
  const type = searchParamsObj.type;
  const governance = searchParamsObj.governance;
  const search = searchParamsObj.search;
  const format = searchParamsObj.format;
  const duration = searchParamsObj.duration;
  const year = searchParamsObj.year;
  const sort = searchParamsObj.sort;

  // 1. status
  if (status) {
    releases = releases.filter(r => r.status === status);
  }

  // 2. type
  if (type && type !== 'all') {
    releases = releases.filter(r => r.releaseType === type);
  }

  // 3. governance
  if (governance && governance !== 'all') {
    releases = releases.filter(r => {
      const govOrigin = r.governanceOrigin || r.govType;
      return govOrigin === governance;
    });
  }

  // 4. search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    releases = releases.filter(r => {
      const canonical = (r.canonicalTitle || r.title || '').toLowerCase();
      const youtube  = (r.youtubeTitle || r.youtubeStats?.title || '').toLowerCase();
      const desc     = (r.description || '').toLowerCase();
      const vocalist = typeof r.vocalist === 'string'
        ? r.vocalist.toLowerCase()
        : ([r.vocalist?.name, r.vocalist?.nameUrdu].filter(Boolean).join(' ').toLowerCase());
      const writer   = typeof r.writer === 'string'
        ? r.writer.toLowerCase()
        : ([r.writer?.name, r.writer?.nameUrdu].filter(Boolean).join(' ').toLowerCase());
      const tags     = Array.isArray(r.tags)
        ? r.tags.join(' ').toLowerCase()
        : '';
      const ytId     = (r.youtubeId || '').toLowerCase();
      const slug     = (r.slug || '').toLowerCase();
      return canonical.includes(q) || youtube.includes(q) || desc.includes(q) ||
             vocalist.includes(q) || writer.includes(q) || tags.includes(q) ||
             ytId.includes(q) || slug.includes(q);
    });
  }

  // 5. format
  if (format && format !== 'all') {
    releases = releases.filter(r => r.format === format);
  }

  // 6. duration
  if (duration && duration !== 'all') {
    releases = releases.filter(r => {
      const secs = r.durationSeconds || 0;
      if (duration === 'default')  return secs >= 180 && r.format !== 'short';
      if (duration === 'short')    return secs > 0 && secs < 180;
      if (duration === 'standard') return secs >= 180 && secs <= 480;
      if (duration === 'long')     return secs > 480;
      return true;
    });
  }

  // 7. year
  if (year && year !== 'all') {
    const y = parseInt(year, 10);
    releases = releases.filter(r => {
      const d = new Date(r.releaseDate || r.publishedAt || r.createdAt);
      return d.getFullYear() === y;
    });
  }

  // 8. sort
  const sortParam = sort || 'newest';

  // tie-breaker based on original array index (registryOrder) for deterministic sorting
  // The P0 API relied on Array.prototype.sort stability, which we mimic by explicitly
  // doing a stable sort in case JS runtime sort isn't perfectly stable across runs.
  releases.sort((a, b) => {
    let diff = 0;
    if (sortParam === 'newest' || sortParam === 'oldest') {
      let dA = new Date(a.releaseDate || a.createdAt).getTime();
      let dB = new Date(b.releaseDate || b.createdAt).getTime();
      
      // Mimic Postgres NULLS LAST
      if (isNaN(dA)) dA = sortParam === 'newest' ? -Infinity : Infinity;
      if (isNaN(dB)) dB = sortParam === 'newest' ? -Infinity : Infinity;
      
      diff = sortParam === 'newest' ? dB - dA : dA - dB;
    } else if (sortParam === 'popular') {
      diff = (b.viewCount || 0) - (a.viewCount || 0);
    }
    if (diff === 0) {
      return a._registryOrder - b._registryOrder;
    }
    return diff;
  });

  const count = releases.length;

  const yearFacets = Array.from(new Set(
    releases.map(r => {
      const d = new Date(r.releaseDate || r.publishedAt || r.createdAt);
      const y = d.getFullYear();
      return isNaN(y) ? null : y;
    }).filter(y => y !== null)
  )).sort((a, b) => b - a);
  const facets = { years: yearFacets };

  const pageParam = searchParamsObj.page;
  const pageSizeParam = searchParamsObj.pageSize || searchParamsObj.limit;

  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1);
  const pageSize = Math.max(1, parseInt(pageSizeParam || '12', 10) || 12);
  const offset = parseInt(searchParamsObj.offset || '0', 10) || (page - 1) * pageSize;
  const totalPages = Math.ceil(count / pageSize);
  const items = releases.slice(offset, offset + pageSize);

  // Remove the injected order before returning so hashes match
  const cleanedItems = items.map(r => {
    const copy = { ...r };
    delete copy._registryOrder;
    return copy;
  });

  return { items: cleanedItems, count, page, pageSize, totalPages, facets };
}

function canonicalize(obj) {
  if (Array.isArray(obj)) return obj.map(canonicalize);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc, key) => {
      if (obj[key] !== undefined) acc[key] = canonicalize(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

function hashPayload(payload) {
  const str = JSON.stringify(canonicalize(payload));
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function run() {
  console.log('=== Phase 2 Shadow Read Parity ===\n');

  if (!fs.existsSync(RECONCILED_FILE)) throw new Error('Source file missing');
  const fileBuffer = fs.readFileSync(RECONCILED_FILE);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const releases = JSON.parse(fileBuffer.toString());
  
  // Inject registryOrder explicitly for the oracle evaluator to simulate JS stable sort
  releases.forEach((r, i) => { r._registryOrder = i; });

  console.log('Source oracle:');
  console.log('reconciled-cms-releases.json');
  console.log(`SHA-256: ${fileHash}`);
  console.log(`\nDatabase records: ${releases.length}\n`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:pass@localhost:5434/sufipulse_phase2'
  });

  const repo = new PostgresReleaseRepository(pool);
  
  let singleLookupPasses = 0;
  let singleLookupFails = 0;

  console.log('Single-record lookups');

  // getById
  let idPass = 0;
  for (const src of releases) {
    const dbRes = await repo.getById(src.id);
    const cleanSrc = { ...src }; delete cleanSrc._registryOrder;
    if (dbRes && hashPayload(dbRes) === hashPayload(cleanSrc)) {
      idPass++;
    }
  }
  console.log(`ID:          ${idPass} / 101 ${idPass === 101 ? 'PASS' : 'FAIL'}`);

  // getBySlug
  let slugPass = 0;
  for (const src of releases) {
    const dbRes = await repo.getBySlug(src.slug);
    const cleanSrc = { ...src }; delete cleanSrc._registryOrder;
    if (dbRes && hashPayload(dbRes) === hashPayload(cleanSrc)) {
      slugPass++;
    }
  }
  console.log(`Slug:        ${slugPass} / 101 ${slugPass === 101 ? 'PASS' : 'FAIL'}`);

  // getByYoutubeId
  const yts = releases.filter(r => r.youtubeId);
  let ytPass = 0;
  for (const src of yts) {
    const dbRes = await repo.getByYoutubeId(src.youtubeId);
    const cleanSrc = { ...src }; delete cleanSrc._registryOrder;
    if (dbRes && hashPayload(dbRes) === hashPayload(cleanSrc)) {
      ytPass++;
    }
  }
  console.log(`YouTube ID:  ${ytPass} / ${yts.length} ${ytPass === yts.length ? 'PASS' : 'FAIL'}\n`);

  // Collection scenarios
  const statuses = [...new Set(releases.map(r => r.status).filter(Boolean))];
  const types = [...new Set(releases.map(r => r.releaseType).filter(Boolean))];
  const governances = [...new Set(releases.map(r => r.governanceOrigin || r.govType).filter(Boolean))];
  const formats = [...new Set(releases.map(r => r.format).filter(Boolean))];
  const years = [...new Set(releases.map(r => new Date(r.releaseDate || r.createdAt).getFullYear()))];

  const queries = [
    {}, // Unfiltered/default
    { sort: 'default' },
    { sort: 'newest' },
    { sort: 'oldest' },
    { sort: 'popular' },
    // Every status
    ...statuses.map(status => ({ status })),
    // Every releaseType
    ...types.map(type => ({ type })),
    // Every governance
    ...governances.map(governance => ({ governance })),
    // Every format
    ...formats.map(format => ({ format })),
    // Every year
    ...years.map(year => ({ year: year.toString() })),
    // Durations
    { duration: 'all' },
    { duration: 'default' },
    { duration: 'short' },
    { duration: 'standard' },
    { duration: 'long' },
    // All
    { governance: 'all' },
    { format: 'all' },
    { type: 'all' },
    { year: 'all' },
    // Pagination
    { page: 1 },
    { page: 2 },
    { page: 99 }, // last page behavior
    { pageSize: 1 },
    { pageSize: 12 },
    { pageSize: 500 }, // pageSize > count
    { offset: 10, pageSize: 5 },
    // Search
    { search: 'qawwali' }, // multi-word
    { search: '   Kashmir   ' }, // trailing whitespace
    { search: 'Nund Rishi' }, // phrase
    { search: 'nund rishi' }, // lower
    { search: 'NUND RISHI' }, // upper
    { search: releases[0].slug }, // slug
    { search: yts[0]?.youtubeId || 'nonexistent' }, // YT
    { search: 'totally_non_existent_term_xyz_123' },
    // Combinations
    { status: 'published', format: 'video' },
    { status: 'published', governance: 'native_governed' },
    { format: 'video', duration: 'default' },
    { governance: 'native_governed', year: '2024' },
    { status: 'published', search: 'nund' },
    { format: 'video', search: 'kashmir' },
    { status: 'published', governance: 'native_governed', format: 'video', year: '2024' }
  ].map(q => ({ ...q, facets: true }));

  let passed = 0;
  let failed = 0;

  for (const q of queries) {
    const p0 = runP0Query(releases, q);
    const db = await repo.query(q);

    let match = true;
    let reason = '';

    const p0Ids = p0.items.map(r => r.id).join(',');
    const dbIds = db.items.map(r => r.id).join(',');

    if (p0Ids !== dbIds) { match = false; reason = 'Ordered ID parity'; }
    if (p0.count !== db.count) { match = false; reason = 'Count parity'; }
    if (p0.page !== db.page) { match = false; reason = 'Page parity'; }
    if (p0.pageSize !== db.pageSize) { match = false; reason = 'PageSize parity'; }
    if (p0.totalPages !== db.totalPages) { match = false; reason = 'TotalPages parity'; }
    if (p0.facets.years.join(',') !== db.facets.years.join(',')) { match = false; reason = 'Facet parity'; }

    // payload hashes
    for (let i = 0; i < p0.items.length; i++) {
      if (hashPayload(p0.items[i]) !== hashPayload(db.items[i])) {
        match = false;
        reason = 'Payload hash parity';
      }
    }

    if (match) {
      passed++;
    } else {
      failed++;
      console.error(`Query failed: ${JSON.stringify(q)}`);
      console.error(`Reason: ${reason}`);
      console.error(`P0 items: ${p0.items.length}, DB items: ${db.items.length}`);
      if (p0.items.length > 0 && db.items.length > 0) {
        console.error(`P0 first ID: ${p0.items[0].id}`);
        console.error(`DB first ID: ${db.items[0].id}`);
      }
    }
  }

  console.log(`Collection scenarios: ${queries.length}`);
  console.log(`Passed:               ${passed}`);
  console.log(`Failed:               ${failed}\n`);

  console.log(`Ordered ID parity:        ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Count parity:             ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Pagination parity:        ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Facet parity:             ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Payload hash parity:      ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Search parity:            ${failed === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Sort parity:              ${failed === 0 ? 'PASS' : 'FAIL'}\n`);

  let success = failed === 0 && idPass === 101 && slugPass === 101 && ytPass === yts.length;

  if (success) {
    console.log('SHADOW READ PARITY: PASS');
  } else {
    console.log('SHADOW READ PARITY: FAIL');
    process.exitCode = 1;
  }

  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
