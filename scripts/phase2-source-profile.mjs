import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DATA_FILE = resolve('.data/cms-releases.json');

function run() {
  console.log('=== Phase 2 Source Profiler ===\n');

  if (!existsSync(DATA_FILE)) {
    console.error(`❌ Registry Storage not found at ${DATA_FILE}`);
    process.exit(1);
  }

  const raw = readFileSync(DATA_FILE, 'utf8');
  let releases;
  try {
    releases = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to parse Registry Storage JSON:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(releases)) {
    console.error('❌ Registry Storage is not an array.');
    process.exit(1);
  }

  const total = releases.length;

  // --- IDENTITY ---
  const idCounts = {};
  const slugCounts = {};
  const ytCounts = {};
  let missingIds = 0;
  let missingTitles = 0;
  let missingSlugs = 0;

  // --- AUTHORITY ---
  const authCounts = {
    native_governed: 0,
    legacy_registry: 0,
    unresolved: 0,
    missing: 0,
    invalid: 0
  };
  const sourceGovCombos = {};

  // --- CANONICAL / YOUTUBE ---
  let missingCanTitle = 0;
  let missingYtTitle = 0;
  let missingCanThumb = 0;
  let missingYtThumb = 0;
  let canYtTitleDiff = 0;
  let canYtThumbDiff = 0;

  // --- ENUM COMPATIBILITY ---
  const validStatuses = new Set(['draft', 'in_review', 'approved', 'published', 'unpublished', 'archived']);
  const validFormats = new Set(['video', 'audio', 'short', 'live', 'playlist']);
  const validVisibilities = new Set(['public', 'private', 'unlisted']);
  let invalidStatus = 0;
  let invalidFormat = 0;
  let invalidVisibility = 0;
  let invalidContentReadiness = 0;

  // --- NUMERIC COMPATIBILITY ---
  let negDuration = 0;
  let negView = 0;
  let negLike = 0;
  let nonIntDuration = 0;

  // --- TIMESTAMP COMPATIBILITY ---
  let invReleaseDate = 0;
  let invPublishedAt = 0;
  let invCreatedAt = 0;
  let invUpdatedAt = 0;

  const isValidDate = (d) => {
    if (!d) return true; // Nulls allowed if schema allows, but checking parseability
    const parsed = new Date(d).getTime();
    return !isNaN(parsed);
  };

  const isMandatoryDateValid = (d) => {
    if (!d) return false;
    const parsed = new Date(d).getTime();
    return !isNaN(parsed);
  };

  // --- FORECAST ---
  let pkViolations = 0;
  let slugViolations = 0;
  let ytViolations = 0;
  let checkViolations = 0;

  for (const r of releases) {
    // Identity
    if (!r.id) missingIds++;
    else idCounts[r.id] = (idCounts[r.id] || 0) + 1;

    if (!r.title) missingTitles++;
    
    if (!r.slug) missingSlugs++;
    else slugCounts[r.slug] = (slugCounts[r.slug] || 0) + 1;

    if (r.youtubeId && r.youtubeId.trim() !== '') {
      ytCounts[r.youtubeId] = (ytCounts[r.youtubeId] || 0) + 1;
    }

    // Authority
    const gov = r.governanceOrigin || r.govType;
    if (!gov) {
      authCounts.missing++;
    } else if (authCounts[gov] !== undefined) {
      authCounts[gov]++;
    } else {
      authCounts.invalid++;
    }

    const s = r.source || 'unknown';
    const combo = `${s} → ${gov || 'missing'}`;
    sourceGovCombos[combo] = (sourceGovCombos[combo] || 0) + 1;

    // Canonical / YouTube
    if (!r.canonicalTitle) missingCanTitle++;
    if (!r.youtubeTitle) missingYtTitle++;
    if (!r.canonicalThumbnail) missingCanThumb++;
    if (!r.youtubeThumbnailUrl) missingYtThumb++;

    if (r.canonicalTitle && r.youtubeTitle && r.canonicalTitle !== r.youtubeTitle) canYtTitleDiff++;
    if (r.canonicalThumbnail && r.youtubeThumbnailUrl && r.canonicalThumbnail !== r.youtubeThumbnailUrl) canYtThumbDiff++;

    // Enums
    let hasCheckViolation = false;

    if (!validStatuses.has(r.status)) {
      invalidStatus++;
      hasCheckViolation = true;
    }
    if (r.format && !validFormats.has(r.format)) {
      invalidFormat++;
      hasCheckViolation = true;
    }
    if (r.visibility && !validVisibilities.has(r.visibility)) {
      invalidVisibility++;
      hasCheckViolation = true;
    }
    // contentReadinessState is not checked by SQL, but profiled
    if (r.contentReadinessState && !['draft', 'editorial_ready', 'web_published', 'youtube_delivery_in_progress', 'fully_delivered', 'delivery_attention_required'].includes(r.contentReadinessState)) {
      invalidContentReadiness++;
    }
    if (gov && !['native_governed', 'legacy_registry', 'unresolved'].includes(gov)) {
      hasCheckViolation = true;
    }

    // Numerics
    if (r.durationSeconds < 0) {
      negDuration++;
      hasCheckViolation = true;
    }
    if (r.durationSeconds && !Number.isInteger(r.durationSeconds)) {
      nonIntDuration++;
      // Wait, integer types in Postgres reject decimals unless truncated. We'll flag it.
    }
    if (r.viewCount < 0) {
      negView++;
      hasCheckViolation = true;
    }
    if (r.likeCount < 0) negLike++;

    // Timestamps
    if (!isValidDate(r.releaseDate)) invReleaseDate++;
    if (!isValidDate(r.publishedAt)) invPublishedAt++;
    if (!isMandatoryDateValid(r.createdAt)) invCreatedAt++;
    if (!isMandatoryDateValid(r.updatedAt)) invUpdatedAt++;

    if (hasCheckViolation) checkViolations++;
  }

  const dupIds = Object.values(idCounts).filter(c => c > 1).length;
  const dupSlugs = Object.values(slugCounts).filter(c => c > 1).length;
  const dupYt = Object.values(ytCounts).filter(c => c > 1).length;

  pkViolations = dupIds + missingIds;
  slugViolations = dupSlugs + missingSlugs;
  ytViolations = dupYt;

  const totalErrors = 
    pkViolations + slugViolations + ytViolations + checkViolations +
    authCounts.invalid + authCounts.missing +
    invalidStatus + invalidFormat + invalidVisibility +
    negDuration + negView + nonIntDuration +
    invReleaseDate + invPublishedAt + invCreatedAt + invUpdatedAt;

  console.log(`SOURCE RECORD COUNT`);
  console.log(`Total records: ${total}\n`);

  console.log(`IDENTITY`);
  console.log(`duplicate IDs:                     ${dupIds}`);
  console.log(`duplicate slugs:                   ${dupSlugs}`);
  console.log(`duplicate non-empty youtubeIds:    ${dupYt}`);
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
  for (const [k, v] of Object.entries(sourceGovCombos)) {
    console.log(`  - ${k}: ${v}`);
  }
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

  console.log(`POSTGRES CONSTRAINT FORECAST`);
  console.log(`rows that would violate PRIMARY KEY:           ${pkViolations}`);
  console.log(`rows that would violate slug UNIQUE:           ${slugViolations}`);
  console.log(`rows that would violate YouTube partial UNIQUE: ${ytViolations}`);
  console.log(`rows that would violate CHECK constraints:     ${checkViolations}\n`);

  console.log(`FINAL:`);
  console.log(`IMPORTABLE WITHOUT SEMANTIC TRANSFORMATION: ${totalErrors === 0 ? 'YES' : 'NO'}`);
}

run();
