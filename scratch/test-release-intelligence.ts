import { mapVideoToRelease } from '../lib/release-mapping';
import { cmsReleaseSchema } from '../app/lib/validation-schemas';

async function runTests() {
  console.log("=== RUNNING SUFIPULSE RELEASE INTELLIGENCE VERIFICATION ===");

  // 1. Test YouTube Sync Field Preservation
  console.log("\n--- TEST 1: YouTube Re-Sync Field Preservation ---");
  const existingRelease: any = {
    id: "release_test_123",
    title: "Original Governed Release Title",
    slug: "original-governed-release-title",
    youtubeId: "LXb3EKWsInQ",
    description: "Original description.",
    status: "published",
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    
    // Required fields to satisfy basic schema
    releaseDate: "2026-06-01",
    durationSeconds: 300,
    durationFormatted: "5:00",
    viewCount: 1000,
    likeCount: 50,

    // Release Intelligence Fields
    targetRegions: ["pk", "us"],
    targetDiaspora: ["urdu_diaspora"],
    targetLanguages: ["ur", "en"],
    sufiConcepts: ["fana", "ishq"],
    themes: ["divine_love", "seeking_union"],
    moods: ["ecstatic", "longing"],
    seoKeywords: ["sufism", "divine love", "wajd"],
    relatedReleases: ["release_456", "release_789"],
    relatedPlaylists: ["PL123", "PL456"],
    intelligenceStatus: "approved",
    intelligenceUpdatedAt: "2026-06-02T12:00:00Z"
  };

  const mockYoutubeVideo = {
    id: "LXb3EKWsInQ",
    title: "New YouTube Title (Sync)",
    thumbnailUrl: "https://i.ytimg.com/vi/LXb3EKWsInQ/maxresdefault.jpg",
    durationFormatted: "5:30",
    durationSeconds: 330,
    views: 12000,
    likes: 850,
    publishedDate: "2026-06-01T00:00:00Z",
    description: "New YouTube description updated on channel."
  };

  const syncedRelease = mapVideoToRelease(mockYoutubeVideo, existingRelease);

  console.log("Checking if YouTube fields updated correctly:");
  console.log(`- Title (governed release keeps original if existing): ${syncedRelease.title}`);
  console.log(`- View Count updated from YT: ${syncedRelease.viewCount} (Expected: 12000)`);
  console.log(`- Like Count updated from YT: ${syncedRelease.likeCount} (Expected: 850)`);

  console.log("\nChecking if Release Intelligence fields are preserved:");
  const preservedKeys = [
    'targetRegions', 'targetDiaspora', 'targetLanguages',
    'sufiConcepts', 'themes', 'moods', 'seoKeywords',
    'relatedReleases', 'relatedPlaylists', 'intelligenceStatus',
    'intelligenceUpdatedAt'
  ];

  let preservationOk = true;
  for (const key of preservedKeys) {
    const originalVal = JSON.stringify((existingRelease as any)[key]);
    const syncedVal = JSON.stringify((syncedRelease as any)[key]);
    const matches = originalVal === syncedVal;
    console.log(`- ${key}: Original: ${originalVal} | Synced: ${syncedVal} => ${matches ? "PRESERVED" : "OVERWRITTEN"}`);
    if (!matches) preservationOk = false;
  }

  if (preservationOk) {
    console.log("\nSUCCESS: All Release Intelligence fields were perfectly preserved during YouTube re-sync!");
  } else {
    console.error("\nFAILURE: Some Release Intelligence fields were overwritten during YouTube re-sync!");
  }

  // 2. Test Zod API Schema Validation
  console.log("\n--- TEST 2: Zod API Schema Validation ---");

  const validUpdate = {
    id: "release_test_123",
    title: "A Valid Government Release Title",
    slug: "a-valid-government-release-title",
    youtubeId: "LXb3EKWsInQ",
    status: "published",
    targetRegions: ["pk", "us"],
    sufiConcepts: ["fana", "baqa"],
    themes: ["divine_love"],
    moods: ["ecstatic"],
    seoKeywords: ["sufi music"],
    relatedReleases: ["release_other_999"], // Valid (different from ID)
    relatedPlaylists: ["PL999"],
    intelligenceStatus: "reviewed"
  };

  const validParse = cmsReleaseSchema.safeParse(validUpdate);
  console.log(`Valid update parse result: ${validParse.success ? "SUCCESS (Expected)" : "FAILED (Unexpected)"}`);
  if (!validParse.success) {
    console.error("Zod errors for valid update:", validParse.error.format());
  }

  // Test Zod constraints
  console.log("\nTesting constraint: Invalid concept code...");
  const invalidConcept = {
    ...validUpdate,
    sufiConcepts: ["non_existent_concept"]
  };
  const invalidConceptParse = cmsReleaseSchema.safeParse(invalidConcept);
  console.log(`Invalid concept update parse: ${invalidConceptParse.success ? "SUCCESS (Unexpected)" : "FAILED (Expected)"}`);
  if (!invalidConceptParse.success) {
    console.log("Errors:", invalidConceptParse.error.flatten().fieldErrors.sufiConcepts);
  }

  console.log("\nTesting constraint: relatedReleases containing current release ID...");
  const selfRelation = {
    ...validUpdate,
    relatedReleases: ["release_test_123"] // self ID
  };
  const selfRelationParse = cmsReleaseSchema.safeParse(selfRelation);
  console.log(`Self-relation update parse: ${selfRelationParse.success ? "SUCCESS (Unexpected)" : "FAILED (Expected)"}`);
  if (!selfRelationParse.success) {
    console.log("Errors (form-level refine):", selfRelationParse.error.flatten().formErrors);
  }

  console.log("\nTesting constraint: targetRegions as non-array...");
  const nonArrayRegion = {
    ...validUpdate,
    targetRegions: "pk" // string instead of array
  };
  const nonArrayRegionParse = cmsReleaseSchema.safeParse(nonArrayRegion);
  console.log(`Non-array targetRegions parse: ${nonArrayRegionParse.success ? "SUCCESS (Unexpected)" : "FAILED (Expected)"}`);
  if (!nonArrayRegionParse.success) {
    console.log("Errors:", nonArrayRegionParse.error.flatten().fieldErrors.targetRegions);
  }
}

runTests().catch(console.error);
