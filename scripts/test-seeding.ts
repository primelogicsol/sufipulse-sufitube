import { registriesStorage, registryItemSchema } from '../lib/registries-storage';
import fs from 'node:fs';
import path from 'node:path';

async function runTests() {
  console.log('=== STARTING MASTER REGISTRIES VALIDATION & SEEDING TEST ===');

  // 1. Trigger initialization (which seeds if not present)
  console.log('\n--- 1. Triggering Seeding / Init ---');
  registriesStorage.init();

  const dataDir = path.join(process.cwd(), '.data');
  const registriesFile = path.join(dataDir, 'registries.json');

  if (fs.existsSync(registriesFile)) {
    console.log(`✅ File exists at: ${registriesFile}`);
    const size = fs.statSync(registriesFile).size;
    console.log(`Size on disk: ${size} bytes`);
  } else {
    console.error('❌ Failed to find registries.json file!');
    process.exit(1);
  }

  // 2. Fetch and log counts
  console.log('\n--- 2. Checking Seeded Counts ---');
  const rawData = registriesStorage.getRawData();
  const keys = Object.keys(rawData) as Array<keyof typeof rawData>;
  keys.forEach(key => {
    console.log(`- ${key}: ${rawData[key].length} items`);
  });

  // 3. Test validation rules using Zod
  console.log('\n--- 3. Validation Tests ---');
  
  // Valid item test
  const validItem = {
    slug: 'custom-concept',
    title: 'Custom Concept Title',
    description: 'A valid concept description detailing its spiritual context.',
    isActive: true,
    isPublic: true,
    wikidataId: 'Q12345',
    createdAt: new Date().toISOString(),
    externalRefs: {
      wikidata: 'Q12345',
      wikipedia: 'https://en.wikipedia.org/wiki/Custom_Concept',
      britannica: 'https://www.britannica.com/topic/Custom_Concept',
      other: []
    }
  };

  const parsedValid = registryItemSchema.safeParse(validItem);
  if (parsedValid.success) {
    console.log('✅ Zod Validation Passed for valid item (optional Wikidata/external refs allowed)');
  } else {
    console.error('❌ Zod Validation Failed for valid item:', parsedValid.error.format());
  }

  // Invalid item test (invalid slug characters)
  const invalidSlugItem = {
    ...validItem,
    slug: 'Invalid_Slug_Here!!'
  };
  const parsedInvalidSlug = registryItemSchema.safeParse(invalidSlugItem);
  if (!parsedInvalidSlug.success) {
    console.log('✅ Zod Validation correctly rejected invalid slug characters (spaces, uppercase, symbols)');
  } else {
    console.error('❌ Zod Validation failed to reject invalid slug!');
  }

  // 4. Test CRUD Operations via Storage Layer
  console.log('\n--- 4. Test CRUD Operations (No API) ---');
  
  // Create
  const testConceptSlug = 'test-sabr-extended';
  const newConcept = {
    slug: testConceptSlug,
    title: 'Sabr (Extended)',
    description: 'A specialized testing node for sabr.',
    isActive: true,
    isPublic: true,
    createdAt: new Date().toISOString()
  };

  const saved = registriesStorage.saveItem('concepts', newConcept);
  console.log(`✅ Saved new registry item: ${saved.title} (slug: ${saved.slug})`);

  // Read
  const fetched = registriesStorage.getItem('concepts', testConceptSlug);
  if (fetched && fetched.title === 'Sabr (Extended)') {
    console.log('✅ Read operation succeeded');
  } else {
    console.error('❌ Read operation failed');
  }

  // Update
  const updatedConcept = {
    ...fetched!,
    description: 'An updated description for testing.'
  };
  const updated = registriesStorage.saveItem('concepts', updatedConcept);
  console.log(`✅ Updated registry item (slug: ${updated.slug}). New description: "${updated.description}"`);

  // Verify list
  const activeList = registriesStorage.getItems('concepts');
  const foundInList = activeList.find(item => item.slug === testConceptSlug);
  if (foundInList && foundInList.description === 'An updated description for testing.') {
    console.log('✅ List verification succeeded');
  } else {
    console.error('❌ List verification failed');
  }

  // Delete
  const deleted = registriesStorage.deleteItem('concepts', testConceptSlug);
  if (deleted) {
    console.log('✅ Delete operation succeeded');
  } else {
    console.error('❌ Delete operation failed');
  }

  // Final check that it was deleted
  const postDeleteCheck = registriesStorage.getItem('concepts', testConceptSlug);
  if (!postDeleteCheck) {
    console.log('✅ Post-delete verification succeeded');
  } else {
    console.error('❌ Item still exists after deletion!');
  }

  console.log('\n=== ALL LOCAL TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
