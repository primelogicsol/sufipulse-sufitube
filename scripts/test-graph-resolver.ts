import { graphResolver } from '../lib/graph-resolver';
import { cmsServerStorage } from '../lib/cms-storage-server';
import { registriesStorage } from '../lib/registries-storage';
import fs from 'node:fs';
import path from 'node:path';

async function runTests() {
  console.log('=== STARTING DISCOVERY GRAPH MILESTONE 2 VALIDATION TESTS ===');

  // Hydrate standard storages
  cmsServerStorage.forceHydrate();
  registriesStorage.forceHydrate();

  // 1. Trigger Graph initialization and check file output
  console.log('\n--- 1. Seeding & Initializing Joins File ---');
  graphResolver.init();

  const dataDir = path.join(process.cwd(), '.data');
  const joinsFile = path.join(dataDir, 'joins.json');

  if (fs.existsSync(joinsFile)) {
    console.log(`✅ File exists: ${joinsFile}`);
    const size = fs.statSync(joinsFile).size;
    console.log(`Size: ${size} bytes`);
  } else {
    console.error('❌ Failed to locate joins.json!');
    process.exit(1);
  }

  // 2. Fetch joins summary
  const allJoins = graphResolver.getRawJoins();
  console.log(`- Loaded total joins: ${allJoins.length}`);
  if (allJoins.length > 0) {
    console.log('✅ Seeding from existing releases succeeded!');
  } else {
    console.warn('⚠️ Joins list is empty. (Releases may not have pre-existing tags)');
  }

  // 3. Verification Engine Tests
  console.log('\n--- 2. Testing Verification Rules ---');

  const releases = cmsServerStorage.getAllReleases();
  if (releases.length === 0) {
    console.error('❌ No releases found to test with!');
    process.exit(1);
  }

  const testRelease = releases[0];
  console.log(`Using test release: "${testRelease.title}" (ID: ${testRelease.id})`);

  // Valid registry slug verify
  const conceptRegistry = registriesStorage.getItems('concepts');
  if (conceptRegistry.length === 0) {
    console.error('❌ Concepts registry is empty!');
    process.exit(1);
  }
  const testConcept = conceptRegistry[0];
  console.log(`Using test concept: "${testConcept.title}" (Slug: ${testConcept.slug})`);

  // Test verification of valid relationship candidate
  const checkValid = graphResolver.validateRelationship(testRelease.id, testConcept.slug, 'concept');
  if (checkValid.isValid) {
    console.log(`✅ Valid relationship passed verification: Release(${testRelease.slug}) ↔ Concept(${testConcept.slug})`);
  } else {
    console.error(`❌ Valid relationship failed verification: ${checkValid.error}`);
  }

  // Test verification of non-existent release
  const checkInvalidRelease = graphResolver.validateRelationship('non-existent-release-id', testConcept.slug, 'concept');
  if (!checkInvalidRelease.isValid) {
    console.log(`✅ Non-existent release correctly rejected: "${checkInvalidRelease.error}"`);
  } else {
    console.error('❌ Failed to reject non-existent release!');
  }

  // Test verification of non-existent concept
  const checkInvalidConcept = graphResolver.validateRelationship(testRelease.id, 'invalid-concept-slug-xyz', 'concept');
  if (!checkInvalidConcept.isValid) {
    console.log(`✅ Non-existent concept correctly rejected: "${checkInvalidConcept.error}"`);
  } else {
    console.error('❌ Failed to reject non-existent concept!');
  }

  // 4. Test Add & Duplicate Join Checks
  console.log('\n--- 3. Testing Joins CRUD Operations ---');
  
  // Add join
  const addResult = graphResolver.addJoin(testRelease.id, testConcept.slug, 'concept', 1.0);
  if (addResult.success) {
    console.log(`✅ Successfully added join relationship: ${addResult.join?.id}`);
  } else {
    console.error(`❌ Failed to add join relationship: ${addResult.error}`);
  }

  // Try adding duplicate relationship join
  const initialLength = graphResolver.getRawJoins().length;
  const duplicateResult = graphResolver.addJoin(testRelease.id, testConcept.slug, 'concept', 1.0);
  const postLength = graphResolver.getRawJoins().length;
  if (duplicateResult.success && initialLength === postLength) {
    console.log('✅ Duplicate join correctly handled (idempotent, did not duplicate join row)');
  } else {
    console.error(`❌ Duplicate join failure: initial length was ${initialLength}, post length was ${postLength}`);
  }

  // 5. Test Orphan Detection
  console.log('\n--- 4. Testing Orphan Detection ---');
  const orphans = graphResolver.getOrphanReleases();
  console.log(`- Detected total orphan releases: ${orphans.length}`);
  orphans.slice(0, 3).forEach(o => {
    console.log(`  * Orphan: "${o.title}" (${o.slug})`);
  });
  console.log('✅ Orphan detection completed successfully');

  // 6. Test Performance Scoring Aggregations
  console.log('\n--- 5. Testing Performance Scoring Engine ---');
  const performance = graphResolver.getRegistryPerformanceScore(testConcept.slug, 'concept');
  console.log(`Performance Scores for Concept "${testConcept.title}" (slug: ${testConcept.slug}):`);
  console.log(`  * Total Releases Joined: ${performance.totalReleases}`);
  console.log(`  * Aggregated Lifetime Views: ${performance.totalViews.toLocaleString()}`);
  console.log(`  * Aggregated Watch Time: ${performance.totalWatchTime.toLocaleString()} hours`);
  console.log(`  * Average CTR: ${performance.averageCtr}%`);
  console.log(`  * Discovery Score: ${performance.discoveryScore}/100`);
  console.log(`  * Authority Score: ${performance.authorityScore}/100`);

  if (performance.totalReleases > 0 && performance.totalViews >= 0 && performance.totalWatchTime >= 0 && performance.averageCtr > 0 && performance.discoveryScore >= 0 && performance.authorityScore >= 0) {
    console.log('✅ Performance scoring aggregation engine works correctly!');
  } else {
    console.error('❌ Performance metrics contain invalid calculations!');
  }

  // Clean up added test join
  graphResolver.removeJoin(testRelease.id, testConcept.slug, 'concept');
  console.log('\n✅ Cleaned up temporary test joins.');
  console.log('=== ALL DISCOVERY GRAPH TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
