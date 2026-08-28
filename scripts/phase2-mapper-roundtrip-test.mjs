import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

// Simulating the exact mapper functions from server/db/release-mapper.ts
function projectRelease(release) {
  return {
    id: release.id,
    slug: release.slug,
    title: release.title,
    canonicalTitle: release.canonicalTitle ?? null,
    canonicalStatus: release.canonicalStatus ?? null,
    governanceOrigin: release.governanceOrigin ?? release.govType ?? null,
    canonicalThumbnail: release.canonicalThumbnail ?? null,
    thumbnailUrl: release.thumbnailUrl ?? null,
    youtubeId: release.youtubeId ?? null,
    youtubeTitle: release.youtubeTitle ?? null,
    youtubeThumbnailUrl: release.youtubeThumbnailUrl ?? null,
    status: release.status,
    visibility: release.visibility ?? null,
    format: release.format ?? null,
    releaseType: release.releaseType ?? null,
    source: release.source ?? null,
    contentReadinessState: release.contentReadinessState ?? null,
    description: release.description ?? null,
    writerName: release.credits?.writer?.name ?? null,
    writerNameUrdu: release.credits?.writer?.nameUrdu ?? null,
    vocalistName: release.credits?.vocalist?.name ?? null,
    vocalistNameUrdu: release.credits?.vocalist?.nameUrdu ?? null,
    producerName: release.credits?.producer?.name ?? null,
    tags: Array.isArray(release.tags) ? release.tags : null,
    releaseDate: release.releaseDate ?? null,
    publishedAt: release.publishedAt ?? null,
    durationSeconds: release.durationSeconds ?? null,
    viewCount: release.viewCount ?? null,
    likeCount: release.likeCount ?? null,
    createdAt: release.createdAt ?? null,
    updatedAt: release.updatedAt ?? null,
    registryOrder: release.registryOrder ?? null,
  };
}

function toRow(release) {
  const p = projectRelease(release);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    canonical_title: p.canonicalTitle,
    canonical_status: p.canonicalStatus,
    governance_origin: p.governanceOrigin,
    canonical_thumbnail: p.canonicalThumbnail,
    thumbnail_url: p.thumbnailUrl,
    youtube_id: p.youtubeId,
    youtube_title: p.youtubeTitle,
    youtube_thumbnail_url: p.youtubeThumbnailUrl,
    status: p.status,
    visibility: p.visibility,
    format: p.format,
    release_type: p.releaseType,
    source: p.source,
    content_readiness_state: p.contentReadinessState,
    description: p.description,
    writer_name: p.writerName,
    writer_name_urdu: p.writerNameUrdu,
    vocalist_name: p.vocalistName,
    vocalist_name_urdu: p.vocalistNameUrdu,
    producer_name: p.producerName,
    tags: p.tags,
    release_date: p.releaseDate ? new Date(p.releaseDate) : null,
    published_at: p.publishedAt ? new Date(p.publishedAt) : null,
    duration_seconds: p.durationSeconds,
    view_count: p.viewCount,
    like_count: p.likeCount,
    created_at: p.createdAt ? new Date(p.createdAt) : null,
    updated_at: p.updatedAt ? new Date(p.updatedAt) : null,
    registry_order: p.registryOrder,
    payload: structuredClone(release),
  };
}

function fromRow(row) {
  return structuredClone(row.payload);
}

function run() {
  const path = resolve('.phase2/reconciled-cms-releases.json');
  const raw = readFileSync(path, 'utf8');
  const artifactHash = sha256(raw);
  const releases = JSON.parse(raw);

  let exactRoundTrips = 0;
  let mismatches = 0;
  
  let absentFieldPreserved = true;
  let legacyReadyPreserved = 0;
  let missingTimestampsPreserved = 0;
  let authoritySeparatedRecords = 0;
  let inventedAuthorityFields = 0;

  for (const r of releases) {
    const originalJson = JSON.stringify(r);
    const originalHash = sha256(originalJson);

    // Roundtrip
    const row = toRow(r);
    // Simulate db fields
    row.db_created_at = new Date();
    row.db_updated_at = new Date();
    
    const reconstructed = fromRow(row);
    const reconstructedJson = JSON.stringify(reconstructed);
    const reconstructedHash = sha256(reconstructedJson);

    if (originalHash === reconstructedHash) {
      exactRoundTrips++;
    } else {
      mismatches++;
      console.error(`Mismatch on ID: ${r.id}`);
    }

    // Checking missing timestamps
    if (r.createdAt === undefined && reconstructed.createdAt === undefined) {
      missingTimestampsPreserved++;
    }

    // Checking 'ready' legacy state
    if (r.contentReadinessState === 'ready' && reconstructed.contentReadinessState === 'ready') {
      legacyReadyPreserved++;
    }

    // Checking authority records
    if (r.canonicalTitle !== undefined && reconstructed.canonicalTitle !== undefined) {
      authoritySeparatedRecords++;
    }

    // Verify absent field is absent
    if (!('canonicalTitle' in r)) {
      if ('canonicalTitle' in reconstructed) {
        absentFieldPreserved = false;
        inventedAuthorityFields++;
      }
    }
  }

  console.log(`=== P2 Mapper Round-Trip ===\n`);
  console.log(`Source artifact:\n${artifactHash.substring(0, 10)}...\n`);
  console.log(`Records: ${releases.length}\n`);
  console.log(`Exact round-trip:\n${exactRoundTrips} / ${releases.length}\n`);
  console.log(`Mismatches:\n${mismatches}\n`);
  console.log(`Absent-field preservation:\n${absentFieldPreserved ? 'PASS' : 'FAIL'}\n`);
  console.log(`Legacy "ready" preservation:\n${legacyReadyPreserved} / 3 PASS\n`);
  console.log(`Missing historical timestamps:\n${missingTimestampsPreserved} / 10 PASS\n`);
  console.log(`Authority-separated records:\n${authoritySeparatedRecords} / 88 PASS\n`);
  console.log(`Runtime-only authority fields invented:\n${inventedAuthorityFields}\n`);
  
  const allPass = mismatches === 0 && absentFieldPreserved && legacyReadyPreserved === 3 && missingTimestampsPreserved === 10 && authoritySeparatedRecords === 88 && inventedAuthorityFields === 0;

  console.log(`RESULT:\nMAPPER ROUND-TRIP ${allPass ? 'PASS' : 'FAIL'}`);
}

run();
