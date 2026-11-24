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
    if (!Array.isArray(seedReleases) || seedReleases.length === 0) {
      throw new Error('Seed JSON is empty or not an array — aborting to protect persistent volume');
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
      // Release already exists in volume -> Reconcile publication status safely
      const existing = mergedReleases[existingIdx];
      let modified = false;

      const seedTime = new Date(seedRel.updatedAt || seedRel.createdAt || 0).getTime();
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();

      if (seedTime > existingTime) {
        // Repo seed has a newer explicit editorial decision (e.g., unpublish/visibility update)
        if (seedRel.status && existing.status !== seedRel.status) {
          existing.status = seedRel.status;
          modified = true;
        }
        if (seedRel.visibility && existing.visibility !== seedRel.visibility) {
          existing.visibility = seedRel.visibility;
          modified = true;
        }
        if (seedRel.unpublishedAt !== undefined) existing.unpublishedAt = seedRel.unpublishedAt;
        if (seedRel.archivedAt !== undefined) existing.archivedAt = seedRel.archivedAt;
        if (seedRel.publicationOverride !== undefined) existing.publicationOverride = seedRel.publicationOverride;
        existing.updatedAt = seedRel.updatedAt;
        modified = true;
      } else if (!existing.publicationOverride && existingTime === 0) {
        // Legacy record with no runtime override or timestamp
        if (seedRel.status === 'published' && existing.status !== 'published') {
          existing.status = 'published';
          modified = true;
        }
        if (seedRel.visibility === 'public' && existing.visibility !== 'public') {
          existing.visibility = 'public';
          modified = true;
        }
      }

      // Ensure canonical video ID is synchronized if missing
      const seedYt = seedRel.youtubeVideoId || seedRel.youtubeId;
      const existingYt = existing.youtubeVideoId || existing.youtubeId;
      if (seedYt && !existingYt) {
        existing.youtubeVideoId = seedYt;
        existing.youtubeId = seedYt;
        modified = true;
      }

      // Non-destructively backfill missing taxonomy & approved multilingual fields from repo seed
      for (const arrField of ['sufiConcepts', 'themes', 'moods', 'targetLanguages', 'availableLanguages']) {
        if (
          Array.isArray(seedRel[arrField]) &&
          seedRel[arrField].length > 0 &&
          (!Array.isArray(existing[arrField]) || existing[arrField].length === 0)
        ) {
          existing[arrField] = seedRel[arrField];
          modified = true;
        }
      }

      // Clean legacy auto-injected default listener country tags (['in','pk','bd','us']) when seed cleared them
      if (
        Array.isArray(existing.targetRegions) &&
        existing.targetRegions.length === 4 &&
        ['bd', 'in', 'pk', 'us'].every(c => existing.targetRegions.includes(c)) &&
        Array.isArray(seedRel.targetRegions) &&
        seedRel.targetRegions.length === 0
      ) {
        existing.targetRegions = [];
        modified = true;
      }

      if (seedRel.defaultAudioLanguage && !existing.defaultAudioLanguage) {
        existing.defaultAudioLanguage = seedRel.defaultAudioLanguage;
        modified = true;
      }

      for (const objField of ['subtitleTranslations', 'subtitleLanguageStatuses', 'lyricsStructure', 'lyrics']) {
        if (seedRel[objField] && typeof seedRel[objField] === 'object') {
          if (!existing[objField] || typeof existing[objField] !== 'object') {
            existing[objField] = seedRel[objField];
            modified = true;
          } else {
            for (const [k, v] of Object.entries(seedRel[objField])) {
              if (!(k in existing[objField])) {
                existing[objField][k] = v;
                modified = true;
              }
            }
          }
        }
      }

      if (modified) {
        updatedCount++;
        console.log(`  🔄 UPDATED publication/taxonomy fields for: "${existing.title}" (ID: ${existing.id}, status=${existing.status}, visibility=${existing.visibility})`);
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

  // 7. Reconcile .data/joins.json for active public releases so Discovery Graph links persist across restarts
  const joinsFile = path.join(dataDir, 'joins.json');
  try {
    let existingJoins = [];
    if (fs.existsSync(joinsFile)) {
      try {
        const parsedJoins = JSON.parse(fs.readFileSync(joinsFile, 'utf8') || '[]');
        if (Array.isArray(parsedJoins)) existingJoins = parsedJoins;
      } catch {}
    }
    const publicIds = new Set(
      mergedReleases
        .filter(r => r && r.status === 'published' && (r.visibility || 'public') === 'public')
        .map(r => r.id)
    );
    // Preserve any manual non-orphaned playlist joins while rebuilding canonical taxonomy joins
    const nextJoins = existingJoins.filter(
      j => j && publicIds.has(j.releaseId) && j.relationshipType === 'playlist'
    );
    const seenJoinIds = new Set(nextJoins.map(j => j.id));
    const nowIso = new Date().toISOString();
    const pushJoin = (releaseId, registryId, relationshipType) => {
      if (!registryId) return;
      const cleanReg = relationshipType === 'theme' ? String(registryId).replace(/_/g, '-') : String(registryId);
      const id = `${releaseId}_${cleanReg}_${relationshipType}`;
      if (seenJoinIds.has(id)) return;
      seenJoinIds.add(id);
      nextJoins.push({
        id,
        releaseId,
        registryId: cleanReg,
        relationshipType,
        confidence: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    };
    for (const r of mergedReleases) {
      if (!r || !publicIds.has(r.id)) continue;
      (r.sufiConcepts || []).forEach(c => pushJoin(r.id, c, 'concept'));
      (r.themes || []).forEach(t => pushJoin(r.id, t, 'theme'));
      (r.moods || []).forEach(m => pushJoin(r.id, m, 'mood'));
      (r.targetRegions || []).forEach(reg => pushJoin(r.id, reg, 'region'));
      (r.targetLanguages || []).forEach(lang => pushJoin(r.id, lang, 'language'));
    }
    const joinsTmp = `${joinsFile}.tmp.${Date.now()}`;
    fs.writeFileSync(joinsTmp, JSON.stringify(nextJoins, null, 2), 'utf8');
    fs.renameSync(joinsTmp, joinsFile);
    console.log(`🔗 Reconciled ${nextJoins.length} active Discovery Graph joins in ${joinsFile}`);
  } catch (joinErr) {
    console.warn(`⚠️ Warning reconciling joins.json: ${joinErr.message}`);
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
