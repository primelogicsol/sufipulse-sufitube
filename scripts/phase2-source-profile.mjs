import { readFileSync, statSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function runDiscovery() {
  console.log('=== REGISTRY SOURCE DISCOVERY ===\n');

  const candidates = [
    { label: 'Candidate ENV', path: process.env.REGISTRY_SOURCE_FILE ? resolve(process.env.REGISTRY_SOURCE_FILE) : null },
    { label: 'Candidate A', path: resolve('.next/standalone/.data/cms-releases.json') },
    { label: 'Candidate B', path: resolve('.data/cms-releases.json') },
    { label: 'Candidate C', path: resolve('lib/cms-seed-releases.json') }
  ];

  const results = {};

  for (const c of candidates) {
    if (!c.path || !existsSync(c.path)) continue;

    const stat = statSync(c.path);
    const raw = readFileSync(c.path, 'utf8');
    const hash = sha256(raw);
    
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch(e) {
      console.log(`${c.label} (${c.path}) - INVALID JSON`);
      continue;
    }

    if (!Array.isArray(parsed)) continue;

    let canTitle = 0, ytTitle = 0, canThumb = 0, ytThumb = 0, govOrigin = 0;
    const ids = [];

    for (const r of parsed) {
      if (r.id) ids.push(r.id);
      if (r.canonicalTitle !== undefined) canTitle++;
      if (r.youtubeTitle !== undefined) ytTitle++;
      if (r.canonicalThumbnail !== undefined) canThumb++;
      if (r.youtubeThumbnailUrl !== undefined) ytThumb++;
      if (r.governanceOrigin !== undefined) govOrigin++;
    }

    ids.sort();
    const idHash = sha256(ids.join(','));

    results[c.label] = {
      path: c.path,
      size: stat.size,
      mtime: stat.mtime,
      hash,
      count: parsed.length,
      idHash,
      ids,
      canTitle, ytTitle, canThumb, ytThumb, govOrigin,
      parsed
    };

    console.log(`${c.label}`);
    console.log(`Path: ${c.path}`);
    console.log(`Size: ${stat.size} bytes (mtime: ${stat.mtime.toISOString()})`);
    console.log(`SHA-256: ${hash}`);
    console.log(`Records: ${parsed.length}`);
    console.log(`IDs hash: ${idHash}`);
    console.log(`Populated counts -> canonicalTitle: ${canTitle}, youtubeTitle: ${ytTitle}, canonicalThumbnail: ${canThumb}, youtubeThumbnailUrl: ${ytThumb}, governanceOrigin: ${govOrigin}\n`);
  }

  // Compare A and B if both exist
  if (results['Candidate A'] && results['Candidate B']) {
    const a = results['Candidate A'];
    const b = results['Candidate B'];
    
    const sameBytes = a.hash === b.hash;
    const sameCount = a.count === b.count;
    const sameIds = a.idHash === b.idHash;
    
    // Count diffing records based on deep equality of objects with same ID
    let differing = 0;
    const bMap = new Map(b.parsed.map(r => [r.id, r]));
    
    for (const rA of a.parsed) {
      const rB = bMap.get(rA.id);
      if (!rB) {
        differing++;
      } else if (JSON.stringify(rA) !== JSON.stringify(rB)) {
        differing++;
      }
    }
    // Add missing from A
    for (const rB of b.parsed) {
      if (!a.parsed.find(r => r.id === rB.id)) differing++;
    }

    console.log(`A vs B:`);
    console.log(`same bytes: ${sameBytes ? 'YES' : 'NO'}`);
    console.log(`same record count: ${sameCount ? 'YES' : 'NO'}`);
    console.log(`same ID set: ${sameIds ? 'YES' : 'NO'}`);
    console.log(`records differing: ${differing}\n`);
  }
}

function runProfile() {
  const targetFile = process.env.REGISTRY_SOURCE_FILE;
  if (!targetFile) {
    console.log('To run the detailed profile, you must explicitly set REGISTRY_SOURCE_FILE.');
    console.log('Example: $env:REGISTRY_SOURCE_FILE=".next/standalone/.data/cms-releases.json" node scripts/phase2-source-profile.mjs');
    process.exit(0);
  }

  const path = resolve(targetFile);
  if (!existsSync(path)) {
    console.error(`❌ File not found: ${path}`);
    process.exit(1);
  }

  console.log(`=== Phase 2 Source Profiler [${path}] ===\n`);
  const releases = JSON.parse(readFileSync(path, 'utf8'));
  const total = releases.length;

  const anomalies = [];
  const logAnomaly = (type, release, field, value, details = '') => {
    anomalies.push({ type, id: release.id, slug: release.slug, field, value, details });
  };

  const idCounts = {};
  const slugCounts = {};
  const ytCounts = {};

  let missingIds = 0, missingTitles = 0, missingSlugs = 0;
  
  const authCounts = { native_governed: 0, legacy_registry: 0, unresolved: 0, missing: 0, invalid: 0 };
  const sourceGovCombos = {};

  let missingCanTitle = 0, missingYtTitle = 0, missingCanThumb = 0, missingYtThumb = 0;
  let canYtTitleDiff = 0, canYtThumbDiff = 0;

  const validStatuses = new Set(['draft', 'in_review', 'approved', 'published', 'unpublished', 'archived']);
  const validFormats = new Set(['video', 'audio', 'short', 'live', 'playlist']);
  const validVisibilities = new Set(['public', 'private', 'unlisted']);
  
  let invalidStatus = 0, invalidFormat = 0, invalidVisibility = 0, invalidContentReadiness = 0;
  let negDuration = 0, negView = 0, negLike = 0, nonIntDuration = 0;
  let invReleaseDate = 0, invPublishedAt = 0, invCreatedAt = 0, invUpdatedAt = 0;

  let pkViolations = 0, slugViolations = 0, ytViolations = 0, checkViolations = 0, notNullViolations = 0, typeCastViolations = 0;

  const isInvalidDate = (d) => d !== undefined && d !== null && isNaN(new Date(d).getTime());
  const isMissing = (d) => d === undefined || d === null || String(d).trim() === '';

  for (const r of releases) {
    if (!r.id) { missingIds++; notNullViolations++; }
    else idCounts[r.id] = (idCounts[r.id] || 0) + 1;

    if (!r.title) missingTitles++;
    
    if (!r.slug) { missingSlugs++; notNullViolations++; }
    else slugCounts[r.slug] = (slugCounts[r.slug] || 0) + 1;

    if (r.youtubeId && r.youtubeId.trim() !== '') {
      ytCounts[r.youtubeId] = (ytCounts[r.youtubeId] || 0) + 1;
    }

    const gov = r.governanceOrigin || r.govType;
    if (isMissing(gov)) authCounts.missing++;
    else if (authCounts[gov] !== undefined) authCounts[gov]++;
    else {
      authCounts.invalid++;
      checkViolations++;
      logAnomaly('CHECK_VIOLATION', r, 'governanceOrigin', gov);
    }

    const s = r.source || 'unknown';
    const combo = `${s} → ${gov || 'missing'}`;
    sourceGovCombos[combo] = (sourceGovCombos[combo] || 0) + 1;

    if (r.canonicalTitle === undefined) missingCanTitle++;
    if (r.youtubeTitle === undefined) missingYtTitle++;
    if (r.canonicalThumbnail === undefined) missingCanThumb++;
    if (r.youtubeThumbnailUrl === undefined) missingYtThumb++;
    if (r.canonicalTitle && r.youtubeTitle && r.canonicalTitle !== r.youtubeTitle) canYtTitleDiff++;
    if (r.canonicalThumbnail && r.youtubeThumbnailUrl && r.canonicalThumbnail !== r.youtubeThumbnailUrl) canYtThumbDiff++;

    if (!validStatuses.has(r.status)) {
      invalidStatus++;
      checkViolations++;
      logAnomaly('CHECK_VIOLATION', r, 'status', r.status);
    }
    if (r.format && !validFormats.has(r.format)) {
      invalidFormat++;
      checkViolations++;
      logAnomaly('CHECK_VIOLATION', r, 'format', r.format);
    }
    if (r.visibility && !validVisibilities.has(r.visibility)) {
      invalidVisibility++;
      checkViolations++;
      logAnomaly('CHECK_VIOLATION', r, 'visibility', r.visibility);
    }
    
    if (r.contentReadinessState && !['draft', 'editorial_ready', 'web_published', 'youtube_delivery_in_progress', 'fully_delivered', 'delivery_attention_required'].includes(r.contentReadinessState)) {
      invalidContentReadiness++;
      logAnomaly('INVALID_ENUM', r, 'contentReadinessState', r.contentReadinessState);
    }

    if (r.durationSeconds < 0) { negDuration++; checkViolations++; logAnomaly('CHECK_VIOLATION', r, 'durationSeconds', r.durationSeconds); }
    if (r.durationSeconds && !Number.isInteger(r.durationSeconds)) { nonIntDuration++; typeCastViolations++; logAnomaly('TYPE_CAST', r, 'durationSeconds', r.durationSeconds); }
    if (r.viewCount < 0) { negView++; checkViolations++; logAnomaly('CHECK_VIOLATION', r, 'viewCount', r.viewCount); }
    if (r.likeCount < 0) { negLike++; }

    if (isInvalidDate(r.releaseDate)) { invReleaseDate++; typeCastViolations++; logAnomaly('TYPE_CAST', r, 'releaseDate', r.releaseDate); }
    if (isInvalidDate(r.publishedAt)) { invPublishedAt++; typeCastViolations++; logAnomaly('TYPE_CAST', r, 'publishedAt', r.publishedAt); }
    
    if (isMissing(r.createdAt)) {
      invCreatedAt++;
      notNullViolations++;
      logAnomaly('NOT_NULL', r, 'createdAt', r.createdAt);
    } else if (isInvalidDate(r.createdAt)) {
      invCreatedAt++;
      typeCastViolations++;
      logAnomaly('TYPE_CAST', r, 'createdAt', r.createdAt);
    }

    if (isMissing(r.updatedAt)) {
      invUpdatedAt++;
      notNullViolations++;
      logAnomaly('NOT_NULL', r, 'updatedAt', r.updatedAt);
    } else if (isInvalidDate(r.updatedAt)) {
      invUpdatedAt++;
      typeCastViolations++;
      logAnomaly('TYPE_CAST', r, 'updatedAt', r.updatedAt);
    }
  }

  const dupIds = Object.keys(idCounts).filter(k => idCounts[k] > 1);
  const dupSlugs = Object.keys(slugCounts).filter(k => slugCounts[k] > 1);
  const dupYt = Object.keys(ytCounts).filter(k => ytCounts[k] > 1);

  dupIds.forEach(id => { pkViolations += idCounts[id]; logAnomaly('PRIMARY_KEY', {id, slug: '?'}, 'id', id, `${idCounts[id]} occurrences`); });
  dupSlugs.forEach(slug => { slugViolations += slugCounts[slug]; logAnomaly('UNIQUE', {id: '?', slug}, 'slug', slug, `${slugCounts[slug]} occurrences`); });
  dupYt.forEach(yt => { ytViolations += ytCounts[yt]; logAnomaly('UNIQUE', {id: '?', slug: '?'}, 'youtubeId', yt, `${ytCounts[yt]} occurrences`); });

  const totalBlocks = pkViolations + slugViolations + ytViolations + checkViolations + notNullViolations + typeCastViolations;

  console.log(`SOURCE RECORD COUNT\nTotal records: ${total}\n`);

  console.log(`IDENTITY`);
  console.log(`duplicate IDs:                     ${dupIds.length}`);
  console.log(`duplicate slugs:                   ${dupSlugs.length}`);
  console.log(`duplicate non-empty youtubeIds:    ${dupYt.length}`);
  console.log(`missing IDs:                       ${missingIds}`);
  console.log(`missing titles:                    ${missingTitles}`);
  console.log(`missing slugs:                     ${missingSlugs}\n`);

  console.log(`AUTHORITY`);
  console.log(`native_governed:                   ${authCounts.native_governed}`);
  console.log(`legacy_registry:                   ${authCounts.legacy_registry}`);
  console.log(`unresolved:                        ${authCounts.unresolved}`);
  console.log(`missing governanceOrigin:          ${authCounts.missing}`);
  console.log(`invalid governanceOrigin:          ${authCounts.invalid}`);
  console.log(`source → governance combinations:`);
  for (const [k, v] of Object.entries(sourceGovCombos)) console.log(`  - ${k}: ${v}`);
  console.log('');

  console.log(`CANONICAL / YOUTUBE`);
  console.log(`missing canonicalTitle:            ${missingCanTitle}`);
  console.log(`missing youtubeTitle:              ${missingYtTitle}`);
  console.log(`missing canonicalThumbnail:        ${missingCanThumb}`);
  console.log(`missing youtubeThumbnailUrl:       ${missingYtThumb}`);
  console.log(`canonicalTitle != youtubeTitle:    ${canYtTitleDiff}`);
  console.log(`canonicalThumb != youtubeThumbUrl: ${canYtThumbDiff}\n`);

  console.log(`SQL ENUM COMPATIBILITY`);
  console.log(`invalid status:                    ${invalidStatus}`);
  console.log(`invalid format:                    ${invalidFormat}`);
  console.log(`invalid visibility:                ${invalidVisibility}`);
  console.log(`invalid contentReadinessState:     ${invalidContentReadiness}\n`);

  console.log(`NUMERIC COMPATIBILITY`);
  console.log(`negative durationSeconds:          ${negDuration}`);
  console.log(`negative viewCount:                ${negView}`);
  console.log(`negative likeCount:                ${negLike}`);
  console.log(`non-integer durationSeconds:       ${nonIntDuration}\n`);

  console.log(`TIMESTAMP COMPATIBILITY`);
  console.log(`invalid releaseDate:               ${invReleaseDate}`);
  console.log(`invalid publishedAt:               ${invPublishedAt}`);
  console.log(`invalid createdAt:                 ${invCreatedAt}`);
  console.log(`invalid updatedAt:                 ${invUpdatedAt}\n`);

  console.log(`POSTGRES INSERT BLOCKERS`);
  console.log(`PRIMARY KEY violations:        ${pkViolations}`);
  console.log(`UNIQUE violations:             ${slugViolations + ytViolations}`);
  console.log(`CHECK violations:              ${checkViolations}`);
  console.log(`NOT NULL violations:           ${notNullViolations}`);
  console.log(`TYPE-CAST violations:          ${typeCastViolations}`);
  console.log(`total rows blocked:            ${totalBlocks}\n`);

  if (anomalies.length > 0) {
    console.log(`=== ANOMALIES DETAIL ===\n`);
    const grouped = anomalies.reduce((acc, a) => {
      acc[a.id] = acc[a.id] || [];
      acc[a.id].push(a);
      return acc;
    }, {});

    for (const [id, list] of Object.entries(grouped)) {
      const slug = list[0].slug || 'N/A';
      console.log(`${id} (${slug})`);
      for (const a of list) {
        console.log(`  ${a.type} -> ${a.field} = ${JSON.stringify(a.value)} ${a.details ? `(${a.details})` : ''}`);
      }
      console.log('');
    }
  }

  console.log(`FINAL:`);
  console.log(`IMPORTABLE WITHOUT SEMANTIC TRANSFORMATION: ${totalBlocks === 0 ? 'YES' : 'NO'}`);
}

runDiscovery();
if (process.env.REGISTRY_SOURCE_FILE) {
  console.log('--------------------------------------------------\n');
  runProfile();
}
