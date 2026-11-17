/**
 * scripts/sync-cms-releases.js
 *
 * Idempotent, Backed-up CMS Releases Synchronization.
 *
 * Ensures that version-controlled release records from `lib/cms-seed-releases.json`
 * are safely incorporated into persistent volume storage (`.data/cms-releases.json`)
 * without deleting or overwriting any existing production records.
 *
 * Run with: node scripts/sync-cms-releases.js
 */

const fs = require('fs');
const path = require('path');

function syncCmsReleases() {
  console.log('====================================================');
  console.log(' SufiPulse CMS Releases Persistent Volume Sync');
  console.log('====================================================');

  const rootDir = process.cwd();
  const dataDir = process.env.DATA_DIR || path.join(rootDir, '.data');
  const targetFile = path.join(dataDir, 'cms-releases.json');
  const backupDir = path.join(dataDir, 'backups');
  const seedFile = path.join(rootDir, 'lib', 'cms-seed-releases.json');

  if (!fs.existsSync(seedFile)) {
    console.error(`❌ FATAL: Seed file not found at ${seedFile}`);
    process.exit(1);
  }

  // 1. Read Seed Data (Repo Ground Truth)
  let seedReleases = [];
  try {
    const rawSeed = fs.readFileSync(seedFile, 'utf8');
    seedReleases = JSON.parse(rawSeed || '[]');
    if (!Array.isArray(seedReleases)) {
      throw new Error('Seed JSON is not an array');
    }
    console.log(`📦 Loaded ${seedReleases.length} releases from repo seed (${path.basename(seedFile)})`);
  } catch (err) {
    console.error(`❌ FATAL: Failed to read seed file: ${err.message}`);
    process.exit(1);
  }

  // 2. Ensure directories exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 3. Read Existing Volume / Disk Data
  let existingReleases = [];
  if (fs.existsSync(targetFile)) {
    try {
      const rawTarget = fs.readFileSync(targetFile, 'utf8');
      const parsed = JSON.parse(rawTarget || '[]');
      existingReleases = Array.isArray(parsed) ? parsed : (parsed.releases || []);
      console.log(`💾 Found existing volume storage with ${existingReleases.length} releases`);

      // 4. Create Pre-Sync Backup
      if (existingReleases.length > 0) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `cms-releases-pre-sync-${timestamp}.json`);
        fs.writeFileSync(backupFile, rawTarget, 'utf8');
        console.log(`🔒 Pre-sync backup saved to: ${backupFile}`);

        // Prune older backups keeping last 30
        try {
          const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('cms-releases-pre-sync-') && f.endsWith('.json'))
            .sort();
          if (files.length > 30) {
            const toDelete = files.slice(0, files.length - 30);
            for (const f of toDelete) {
              fs.unlinkSync(path.join(backupDir, f));
            }
          }
        } catch (pruneErr) {
          console.warn(`⚠️ Backup prune warning: ${pruneErr.message}`);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Warning reading existing file (${err.message}). Starting fresh.`);
      existingReleases = [];
    }
  } else {
    console.log(`ℹ️ No existing volume data file at ${targetFile}. Initializing.`);
  }

  // 5. Idempotent Non-Destructive Reconciliation
  // Build a lookup map of existing releases by ID, slug, and youtubeId
  const idMap = new Map();
  const slugMap = new Map();
  const ytMap = new Map();

  existingReleases.forEach((r, idx) => {
    if (r.id) idMap.set(r.id, idx);
    if (r.slug) slugMap.set(r.slug, idx);
    const yId = r.youtubeVideoId || r.youtubeId;
    if (yId) ytMap.set(yId, idx);
  });

  let addedCount = 0;
  let updatedCount = 0;
  const mergedReleases = [...existingReleases];

  for (const seedRel of seedReleases) {
    if (!seedRel || !seedRel.id) continue;

    const existingIdx = idMap.has(seedRel.id)
      ? idMap.get(seedRel.id)
      : (seedRel.slug && slugMap.has(seedRel.slug)
          ? slugMap.get(seedRel.slug)
          : (seedRel.youtubeId && ytMap.has(seedRel.youtubeId) ? ytMap.get(seedRel.youtubeId) : -1));

    if (existingIdx === -1 || existingIdx === undefined) {
      // New release from seed not present in volume -> Add it
      mergedReleases.push(seedRel);
      addedCount++;
      console.log(`  ➕ ADDED new release: "${seedRel.title}" (ID: ${seedRel.id}, Slug: ${seedRel.slug})`);
    } else {
      // Release already exists in volume -> Update publication status if seed is published
      const existing = mergedReleases[existingIdx];
      let modified = false;

      // If seed is published and public, ensure volume reflects this publication status
      if (seedRel.status === 'published' && existing.status !== 'published') {
        existing.status = 'published';
        modified = true;
      }
      if (seedRel.visibility === 'public' && existing.visibility !== 'public') {
        existing.visibility = 'public';
        modified = true;
      }
      // Ensure canonical video ID is synchronized if missing
      const seedYt = seedRel.youtubeVideoId || seedRel.youtubeId;
      const existingYt = existing.youtubeVideoId || existing.youtubeId;
      if (seedYt && !existingYt) {
        existing.youtubeVideoId = seedYt;
        existing.youtubeId = seedYt;
        modified = true;
      }

      if (modified) {
        updatedCount++;
        console.log(`  🔄 UPDATED publication fields for: "${existing.title}" (ID: ${existing.id})`);
      }
    }
  }

  // 6. Atomic Write to Target
  const tempFile = `${targetFile}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(mergedReleases, null, 2), 'utf8');
    fs.renameSync(tempFile, targetFile);
    console.log(`✅ Atomic write complete: ${targetFile}`);
  } catch (err) {
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch (e) {}
    }
    console.error(`❌ FATAL: Failed writing target file: ${err.message}`);
    process.exit(1);
  }

  console.log('----------------------------------------------------');
  console.log(`📊 Sync Summary:`);
  console.log(`   Initial volume releases: ${existingReleases.length}`);
  console.log(`   New releases added:      ${addedCount}`);
  console.log(`   Existing updated:        ${updatedCount}`);
  console.log(`   Final volume total:      ${mergedReleases.length}`);
  console.log('====================================================\n');
}

if (require.main === module) {
  syncCmsReleases();
}

module.exports = { syncCmsReleases };
