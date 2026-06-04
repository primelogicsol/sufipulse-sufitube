import { knowledgeStorage, type KnowledgeEntity } from '../lib/knowledge-storage';
import { graphResolver } from '../lib/graph-resolver';
import { cmsServerStorage } from '../lib/cms-storage-server';
import { registriesStorage } from '../lib/registries-storage';
import fs from 'node:fs';
import path from 'node:path';

async function runTests() {
  console.log('=== STARTING SUFIPULSE KNOWLEDGE REGISTRY (LAYER 4) VALIDATION TESTS ===');

  // Hydrate standard storages
  knowledgeStorage.forceHydrate();
  cmsServerStorage.forceHydrate();
  registriesStorage.forceHydrate();
  graphResolver.forceHydrate();

  // 1. Verify Pre-seeded Data
  console.log('\n--- 1. Verifying Pre-seeded Knowledge Entities ---');
  const allEntities = knowledgeStorage.getEntities();
  console.log(`Total entities registered: ${allEntities.length}`);
  
  const rumi = knowledgeStorage.getEntity('rumi', 'poet');
  const dhikr = knowledgeStorage.getEntity('dhikr', 'practice');

  if (rumi) {
    console.log(`✅ Seeded Poet Found: "${rumi.name}" (${rumi.id})`);
  } else {
    console.error('❌ Rumi poet seed not found!');
    process.exit(1);
  }

  if (dhikr) {
    console.log(`✅ Seeded Practice Found: "${dhikr.name}" (${dhikr.id})`);
  } else {
    console.error('❌ Dhikr practice seed not found!');
    process.exit(1);
  }

  // 2. Test Quality Gate Validation Rules (validatePublishReady)
  console.log('\n--- 2. Testing Quality Validation Gates (validatePublishReady) ---');

  // Base invalid drafts to test each rule sequentially
  const baseDraft: KnowledgeEntity = {
    id: 'saint_test-saint',
    type: 'saint',
    slug: 'test-saint',
    name: 'Test Saint',
    alternateNames: [],
    shortDescription: 'Too short.', // Under 40 words
    longDescription: 'Too short long description.', // Under 150 words
    regionLinks: [],
    languageLinks: [],
    relatedConcepts: [],
    relatedReleases: [],
    relatedArticles: [],
    relatedPlaylists: [],
    sameAs: [],
    isActive: true,
    isPublic: true, // Attempting to publish
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Rule A: Short description under 40 words
  const checkShortDesc = knowledgeStorage.validatePublishReady(baseDraft);
  console.log('Test Short Description (< 40 words):');
  console.log(`  * Ready: ${checkShortDesc.ready}`);
  console.log(`  * Errors: ${JSON.stringify(checkShortDesc.errors)}`);
  if (!checkShortDesc.ready && checkShortDesc.errors?.some(e => e.includes('Short description'))) {
    console.log('✅ Correctly rejected short description limit.');
  } else {
    console.error('❌ Failed to reject short description word count!');
    process.exit(1);
  }

  // Rule B: Long description under 150 words
  const checkLongDesc = knowledgeStorage.validatePublishReady({
    ...baseDraft,
    shortDescription: 'This is a long enough short description to bypass the first rule of the word counter. It has exactly forty words to pass the check cleanly. One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven.'
  });
  console.log('Test Long Description (< 150 words):');
  console.log(`  * Ready: ${checkLongDesc.ready}`);
  console.log(`  * Errors: ${JSON.stringify(checkLongDesc.errors)}`);
  if (!checkLongDesc.ready && checkLongDesc.errors?.some(e => e.includes('Long description'))) {
    console.log('✅ Correctly rejected long description limit.');
  } else {
    console.error('❌ Failed to reject long description word count!');
    process.exit(1);
  }

  // Rule C: No connected release or article
  const checkConnections = knowledgeStorage.validatePublishReady({
    ...baseDraft,
    shortDescription: 'This is a long enough short description to bypass the first rule of the word counter. It has exactly forty words to pass the check cleanly. One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven.',
    longDescription: 'This is a sufficiently long description that satisfies the second rule requiring at least one hundred and fifty words of text content. We will write arbitrary text to satisfy the validator. Announcing that Sufism or Tasawwuf is the inward, mystical dimension of Islam. A practitioner of this tradition is generally known as a Sufi. Sufis belong to various orders (turuq) which were formed around a grand master. We are adding words, words, words, and more words until the count exceeds the one hundred and fifty word mark. Let\'s continue typing a narrative about the poetry of Rumi and how Qawwali music expresses the love of Divine. Almost there, we are adding more sentences, talking about the historical spread of Islam through the subcontinent via Sufi saints, their shrines, and devotional assemblies. Done.'
  });
  console.log('Test Connection Rules:');
  console.log(`  * Ready: ${checkConnections.ready}`);
  console.log(`  * Errors: ${JSON.stringify(checkConnections.errors)}`);
  if (!checkConnections.ready && checkConnections.errors?.some(e => e.includes('connected to at least one release'))) {
    console.log('✅ Correctly rejected lack of connections.');
  } else {
    console.error('❌ Failed to reject lack of connections!');
    process.exit(1);
  }

  // Rule D: Under 3 internal links
  const checkLinks = knowledgeStorage.validatePublishReady({
    ...baseDraft,
    shortDescription: 'This is a long enough short description to bypass the first rule of the word counter. It has exactly forty words to pass the check cleanly. One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six twenty-seven.',
    longDescription: 'This is a sufficiently long description that satisfies the second rule requiring at least one hundred and fifty words of text content. We will write arbitrary text to satisfy the validator. Announcing that Sufism or Tasawwuf is the inward, mystical dimension of Islam. A practitioner of this tradition is generally known as a Sufi. Sufis belong to various orders (turuq) which were formed around a grand master. We are adding words, words, words, and more words until the count exceeds the one hundred and fifty word mark. Let\'s continue typing a narrative about the poetry of Rumi and how Qawwali music expresses the love of Divine. Almost there, we are adding more sentences, talking about the historical spread of Islam through the subcontinent via Sufi saints, their shrines, and devotional assemblies. Done.',
    relatedReleases: ['release_1779542779861_4HZbA2sfGmY']
  });
  console.log('Test Link Density Rules:');
  console.log(`  * Ready: ${checkLinks.ready}`);
  console.log(`  * Errors: ${JSON.stringify(checkLinks.errors)}`);
  if (!checkLinks.ready && checkLinks.errors?.some(e => e.includes('at least 3 internal link references'))) {
    console.log('✅ Correctly rejected low internal link density.');
  } else {
    console.error('❌ Failed to reject low internal link density!');
    process.exit(1);
  }

  // 3. Save Entity Failure and Success Gates
  console.log('\n--- 3. Testing Entity Persistence Failure and Success Gates ---');

  // Verify saveEntity throws error if isPublic: true but violates quality criteria
  try {
    knowledgeStorage.saveEntity(baseDraft);
    console.error('❌ Failed to throw validation error on thin public entity!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ Correctly blocked saving invalid public entity. Error: \n${err.message}`);
  }

  // Valid entity data passing all rules
  const validSaint: KnowledgeEntity = {
    id: 'saint_lal-ded',
    type: 'saint',
    slug: 'lal-ded',
    name: 'Lal Ded (Lalleshwari)',
    alternateNames: ['Lalla', 'Lala Arifa', 'Lalleshwari'],
    shortDescription: 'Lal Ded was an eminent fourteenth-century Kashmiri mystic poetess and saint who pioneered the spiritual literary tradition of Kashmir, celebrated for her profound Vakhs (verses) detailing the soul\'s union with the Divine, patience, perseverance, and non-dual mystical contemplation across generations.',
    longDescription: 'Lalla Lalleshwari, popularly known as Lal Ded, was a towering mystic saint from Kashmir in the 14th century. She lived during a period of profound socio-cultural transition, and her verses represent the synthesis of Kashmiri Trika Shaivism and Sufi mysticism. Discarding conventional rituals, she expressed her intense longing for the Divine through short poetic verses called Vakhs. Her poetry represents the earliest Kashmiri vernacular literature, establishing a tradition that influenced both the Rishi order of Sufism and subsequent mystic poets like Nund Rishi. Her verses on the annihilation of the ego, patience (Sabr), and direct experiential union with the Divine Source are recited and sung across cultural and religious divisions, making her a foundational figure in Kashmiri spiritual culture. By articulating the universal journey of the soul back to its source, her legacy bridges different faiths and spiritual paths, emphasizing direct love and realization over scholastic dogmatism. Her verses remain highly relevant today for scholars and seekers alike.',
    theologicalNotes: 'Lal Ded’s Vakhs emphasize the path of the heart and the collapse of external religious distinctions in the fire of Divine Love.',
    regionLinks: ['kashmir'],
    languageLinks: ['kas'],
    relatedConcepts: ['sabr', 'fana', 'ishq'],
    relatedReleases: ['release_1779542779861_4HZbA2sfGmY'],
    relatedArticles: [],
    relatedPlaylists: [],
    sameAs: ['https://en.wikipedia.org/wiki/Lalleshwari'],
    wikidataId: 'Q3632297',
    isActive: true,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Test successful saving
  try {
    const saved = knowledgeStorage.saveEntity(validSaint);
    console.log(`✅ Successfully saved and published entity: ${saved.name}`);
  } catch (err: any) {
    console.error(`❌ Failed to save valid public entity: ${err.message}`);
    process.exit(1);
  }

  // 4. Test Relationship Schema Validation (graphResolver)
  console.log('\n--- 4. Testing Relationship Schema Validation ---');

  // Verify linking release to entity
  const testReleaseId = 'release_1779542779861_4HZbA2sfGmY'; // Aahista Aahista
  const testEntitySlug = 'lal-ded';

  const checkRelToEnt = graphResolver.validateRelationship(testReleaseId, testEntitySlug, 'release_to_entity');
  console.log(`Release to Entity validation: ${checkRelToEnt.isValid}`);
  if (checkRelToEnt.isValid) {
    console.log('✅ Validated release_to_entity successfully.');
  } else {
    console.error(`❌ Failed to validate release_to_entity: ${checkRelToEnt.error}`);
    process.exit(1);
  }

  // Verify linking concept to entity
  const checkConceptToEnt = graphResolver.validateRelationship('sabr', testEntitySlug, 'concept_to_entity');
  console.log(`Concept to Entity validation: ${checkConceptToEnt.isValid}`);
  if (checkConceptToEnt.isValid) {
    console.log('✅ Validated concept_to_entity successfully.');
  } else {
    console.error(`❌ Failed to validate concept_to_entity: ${checkConceptToEnt.error}`);
    process.exit(1);
  }

  // Verify linking theme to entity
  const checkThemeToEnt = graphResolver.validateRelationship('spiritual-journey', testEntitySlug, 'theme_to_entity');
  console.log(`Theme to Entity validation: ${checkThemeToEnt.isValid}`);
  if (checkThemeToEnt.isValid) {
    console.log('✅ Validated theme_to_entity successfully.');
  } else {
    console.error(`❌ Failed to validate theme_to_entity: ${checkThemeToEnt.error}`);
    process.exit(1);
  }

  // Verify linking region to entity
  const checkRegionToEnt = graphResolver.validateRelationship('pk', testEntitySlug, 'region_to_entity');
  console.log(`Region to Entity validation: ${checkRegionToEnt.isValid}`);
  if (checkRegionToEnt.isValid) {
    console.log('✅ Validated region_to_entity successfully.');
  } else {
    console.error(`❌ Failed to validate region_to_entity: ${checkRegionToEnt.error}`);
    process.exit(1);
  }

  // Verify linking entity to entity (Lal Ded to Rumi)
  const checkEntToEnt = graphResolver.validateRelationship('rumi', testEntitySlug, 'entity_to_entity');
  console.log(`Entity to Entity validation (Rumi ↔ Lal Ded): ${checkEntToEnt.isValid}`);
  if (checkEntToEnt.isValid) {
    console.log('✅ Validated entity_to_entity successfully.');
  } else {
    console.error(`❌ Failed to validate entity_to_entity: ${checkEntToEnt.error}`);
    process.exit(1);
  }

  // Verify linking article to entity
  const checkArticleToEnt = graphResolver.validateRelationship('kashmiri-mysticism', testEntitySlug, 'article_to_entity');
  console.log(`Article to Entity validation: ${checkArticleToEnt.isValid}`);
  if (checkArticleToEnt.isValid) {
    console.log('✅ Validated article_to_entity successfully.');
  } else {
    console.error(`❌ Failed to validate article_to_entity: ${checkArticleToEnt.error}`);
    process.exit(1);
  }

  // Verify linking playlist to entity
  const checkPlaylistToEnt = graphResolver.validateRelationship('sufi-poets', testEntitySlug, 'playlist_to_entity');
  console.log(`Playlist to Entity validation: ${checkPlaylistToEnt.isValid}`);
  if (checkPlaylistToEnt.isValid) {
    console.log('✅ Validated playlist_to_entity successfully.');
  } else {
    console.error(`❌ Failed to validate playlist_to_entity: ${checkPlaylistToEnt.error}`);
    process.exit(1);
  }

  // 5. Test Authority Score Dynamics
  console.log('\n--- 5. Testing Authority Score Dynamics ---');

  // Let's first clean up any existing joins for 'lal-ded'
  graphResolver.removeAllJoinsForRegistry('lal-ded');

  // Score before any graph connections
  const initialScore = graphResolver.getRegistryPerformanceScore('lal-ded', 'release_to_entity');
  console.log(`Initial Authority Score for "lal-ded": ${initialScore.authorityScore}`);

  // Add 1 release join (confidence 1.0)
  const addJoin1 = graphResolver.addJoin(testReleaseId, 'lal-ded', 'release_to_entity', 1.0);
  if (addJoin1.success) {
    console.log('Added 1 release connection to "lal-ded".');
  }

  // Score after 1 release connection
  const scoreAfterOne = graphResolver.getRegistryPerformanceScore('lal-ded', 'release_to_entity');
  console.log(`Authority Score after 1 release join: ${scoreAfterOne.authorityScore}`);
  if (scoreAfterOne.authorityScore > initialScore.authorityScore) {
    console.log('✅ Score correctly increased with connectivity.');
  } else {
    console.error('❌ Score did not increase after adding a join!');
    process.exit(1);
  }

  // Add concept connection to create overlapping path
  const addJoin2 = graphResolver.addJoin('sabr', 'lal-ded', 'concept_to_entity', 1.0);
  if (addJoin2.success) {
    console.log('Added concept connection (sabr ↔ lal-ded) to increase overlap density.');
  }

  const scoreAfterOverlap = graphResolver.getRegistryPerformanceScore('lal-ded', 'release_to_entity');
  console.log(`Authority Score after overlap join: ${scoreAfterOverlap.authorityScore}`);
  if (scoreAfterOverlap.authorityScore > scoreAfterOne.authorityScore) {
    console.log('✅ Score correctly increased with overlap weight.');
  } else {
    console.error('❌ Score did not increase after adding overlap relation!');
    process.exit(1);
  }

  // 6. Test Knowledge Density Score calculations
  console.log('\n--- 6. Testing Knowledge Density Score Calculations ---');
  const rumiEntity = knowledgeStorage.getEntity('rumi', 'poet');
  if (rumiEntity) {
    console.log(`Rumi Knowledge Density Score: ${rumiEntity.knowledgeDensityScore}/100`);
    if (rumiEntity.knowledgeDensityScore !== undefined && rumiEntity.knowledgeDensityScore > 50) {
      console.log('✅ Density Score calculated and attached successfully on read.');
    } else {
      console.error('❌ Density Score is missing or too low!');
      process.exit(1);
    }
  }

  // Clean up
  graphResolver.removeJoin(testReleaseId, 'lal-ded', 'release_to_entity');
  graphResolver.removeJoin('sabr', 'lal-ded', 'concept_to_entity');
  knowledgeStorage.deleteEntity('lal-ded', 'saint');

  console.log('\n✅ Successfully cleaned up test data.');
  console.log('=== ALL KNOWLEDGE REGISTRY TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
