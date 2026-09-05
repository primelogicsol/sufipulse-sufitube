/**
 * scripts/export-seed.js
 * Deterministic seed export from the authoritative canonical disk store.
 *
 * CONTRACT:
 *   Input:  .data/cms-releases.json  (canonical persistent store)
 *   Output: lib/cms-seed-releases.json  (committed repo seed, bootstrap fallback)
 *
 * FILTER: published records only. Draft (cms-segmentation-test) excluded.
 * FIELD SCOPE: established seed field contract + defaultAudioLanguage (new
 *   authoritative language field used by layout.tsx inLanguage output).
 *
 * USAGE: node scripts/export-seed.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const DISK_FILE = path.join(process.cwd(), ".data", "cms-releases.json");
const SEED_FILE = path.join(process.cwd(), "lib", "cms-seed-releases.json");
const isDryRun = process.argv.includes("--dry-run");

const disk = JSON.parse(fs.readFileSync(DISK_FILE, "utf8"));
console.log("[export-seed] Disk records:", disk.length);

const currentSeed = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
const seedFieldSet = new Set();
currentSeed.forEach(r => Object.keys(r).forEach(k => seedFieldSet.add(k)));
seedFieldSet.add("defaultAudioLanguage");
console.log("[export-seed] Seed field contract:", seedFieldSet.size, "fields");

const publishedRecords = disk.filter(r => r.status === "published");
const draftRecords = disk.filter(r => r.status !== "published");
console.log("[export-seed] Published:", publishedRecords.length, "| Excluded drafts:", draftRecords.length);
draftRecords.forEach(r => console.log("  [EXCLUDED DRAFT] slug=" + r.slug));

const exported = publishedRecords.map(r => {
  const projected = {};
  for (const field of seedFieldSet) {
    if (field in r) projected[field] = r[field];
  }
  return projected;
});

const diskPublicSlugs = new Set(publishedRecords.filter(r => r.visibility === "public").map(r => r.slug));
const exportedSlugs = new Set(exported.filter(r => r.visibility === "public").map(r => r.slug));
const inExportedNotDisk = [...exportedSlugs].filter(s => !diskPublicSlugs.has(s));
const inDiskNotExported = [...diskPublicSlugs].filter(s => !exportedSlugs.has(s));
const slugArr = exported.map(r => r.slug);
const duplicateSlugs = slugArr.filter((s, i) => slugArr.indexOf(s) !== i);
const ytIds = exported.map(r => r.youtubeId).filter(Boolean);
const duplicateYtIds = ytIds.filter((id, i) => ytIds.indexOf(id) !== i);

console.log("\n=== RECONCILIATION ===");
console.log("Canonical disk total:", disk.length);
console.log("Canonical published:", publishedRecords.length);
console.log("Canonical published+public:", diskPublicSlugs.size);
console.log("Exported (seed) total:", exported.length);
console.log("Exported published+public:", exportedSlugs.size);
console.log("In exported not in disk:", inExportedNotDisk.length);
console.log("In disk not in exported:", inDiskNotExported.length);
console.log("Duplicate slugs:", duplicateSlugs.length);
console.log("Duplicate YouTube IDs:", duplicateYtIds.length);

if (inDiskNotExported.length > 0) {
  console.log("\nSlug gaps (missing from export):");
  inDiskNotExported.forEach(s => console.log("  -", s));
}

const pass = inExportedNotDisk.length === 0 && inDiskNotExported.length === 0 && duplicateSlugs.length === 0;
console.log("\nSEED_PUBLIC_SET == CANONICAL_PUBLIC_SET:", pass ? "PASS" : "FAIL");
console.log("97 == 97:", exportedSlugs.size + " == " + diskPublicSlugs.size + " ->", (exportedSlugs.size === diskPublicSlugs.size) ? "PASS" : "FAIL");

if (!pass) { console.error("Validation failed. NOT written."); process.exit(1); }

if (isDryRun) {
  console.log("\n[DRY RUN] Would write", exported.length, "records. Seed NOT written.");
} else {
  fs.writeFileSync(SEED_FILE, JSON.stringify(exported, null, 2), "utf8");
  console.log("\n[export-seed] Written", exported.length, "records to", SEED_FILE);
}
