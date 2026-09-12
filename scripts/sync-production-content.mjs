import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const args = process.argv.slice(2);
const options = {
  dryRun: !args.includes('--apply'),
  source: '.data',
  target: '.data-target',
  report: 'migration-report.json',
  remoteHashWriters: '',
  remoteHashVocalists: '',
  remoteHashReleases: ''
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--source') options.source = args[++i];
  if (args[i] === '--target') options.target = args[++i];
  if (args[i] === '--report') options.report = args[++i];
  if (args[i] === '--remote-hash-writers') options.remoteHashWriters = args[++i];
  if (args[i] === '--remote-hash-vocalists') options.remoteHashVocalists = args[++i];
  if (args[i] === '--remote-hash-releases') options.remoteHashReleases = args[++i];
}

const SOURCE_AUTHORITATIVE_FIELDS = [
  'title', 'subtitle', 'description', 'premiereTagline', 'premiereIntroduction',
  'visibility', 'premiereVisibility', 'isFeaturedPremiere',
  'tags', 'availableLanguages', 'defaultLanguage', 'enableLyrics', 'enableCommentary',
  'enableSponsors', 'enableAdoption', 'enableCredits', 'preReleaseAssets', 'lyrics',
  'canonicalStatus', 'releaseType', 'registryOrder', 'premiereThumbnail', 'notifyEnabled', 
  'lyricsTranslationsAvailable', 'creditsNotesAvailable', 'premiumTeaserAvailable', 
  'commentaryAvailable', 'publicCredits', 'commentary', 'releaseContributorCredits',
  'writer', 'lyricist', 'composer', 'musicDirector', 'vocalist'
];

const PRODUCTION_AUTHORITATIVE_FIELDS = [
  'id', 'slug', 'canonicalTitle', 'format', 'source', 'govType', 'governanceOrigin',
  'distribution', 'createdAt'
];

const CONDITIONAL_FIELDS = [
  'status', 'releaseLifecycle', 'officialReleaseAt', 'youtubeId', 'updatedAt', 
  'thumbnailUrl', 'canonicalThumbnail', 'publishedAt'
];

const report = {
  summary: {
    writersInserted: 0,
    writersUpdated: 0,
    writersUnchanged: 0,
    vocalistsInserted: 0,
    vocalistsUpdated: 0,
    vocalistsUnchanged: 0,
    vocalistConflicts: 0,
    duplicateVocalistIds: 0,
    duplicateVocalistNames: 0,
    releaseRelationshipsInserted: 0,
    releaseRelationshipsUpdated: 0,
    creditResolution: {
      EXACT_MATCH: 0,
      ALIAS_MATCH: 0,
      AMBIGUOUS: 0,
      UNRESOLVED: 0,
      CONFLICT: 0
    },
    premiereRecordsUpdated: 0,
    errors: 0
  },
  releaseStats: {
    total: 0,
    published: 0,
    upcoming: 0,
    draft: 0,
    private: 0,
    other: 0,
    sourceOnly: [],
    targetOnly: [],
    common: [],
    duplicateIds: [],
    duplicateSlugs: [],
    duplicateYoutubeIds: []
  },
  writers: [],
  vocalists: [],
  releaseCredits: [],
  premiere: []
};

function sha256(content) {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(content);
  return hashSum.digest('hex');
}

function backupTarget() {
  const backupDir = path.join('.backups', new Date().toISOString().replace(/:/g, '-'));
  fs.mkdirSync(backupDir, { recursive: true });
  ['writers.json', 'vocalists.json', 'cms-releases.json'].forEach(f => {
    const src = path.join(options.target, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(backupDir, f));
    }
  });
  console.log(`[BACKUP] Created backup at ${backupDir}`);
}

function processEntityArray(sourceArray, targetPath, remoteHash, reportKey, summaryKeys, idField = 'id', nameField = 'public_name') {
  const targetArray = fs.existsSync(targetPath) ? JSON.parse(fs.readFileSync(targetPath, 'utf8') || '[]') : [];
  
  if (!options.dryRun && remoteHash) {
    const currentHash = fs.existsSync(targetPath) ? sha256(fs.readFileSync(targetPath)) : '';
    if (currentHash !== remoteHash) {
      throw new Error(`PRODUCTION_CHANGED_SINCE_SNAPSHOT: ${path.basename(targetPath)} hash mismatch. Expected ${remoteHash}, got ${currentHash}`);
    }
  }

  const merged = [...targetArray];
  
  for (const srcItem of sourceArray) {
    const existingIdx = merged.findIndex(t => t[idField] === srcItem[idField]);
    
    // Check for stage name conflicts (different canonical ID, same name)
    const nameConflict = merged.find(t => t[idField] !== srcItem[idField] && t[nameField] && srcItem[nameField] && t[nameField].toLowerCase() === srcItem[nameField].toLowerCase());
    
    if (nameConflict) {
       report[reportKey].push({ sourceId: srcItem[idField], name: srcItem[nameField], targetState: 'conflict_name', action: 'CONFLICT', status: 'error' });
       report.summary[summaryKeys.conflict] = (report.summary[summaryKeys.conflict] || 0) + 1;
       continue;
    }

    if (existingIdx !== -1) {
      const existing = merged[existingIdx];
      if (JSON.stringify(existing) === JSON.stringify(srcItem)) {
        report[reportKey].push({ sourceId: srcItem[idField], name: srcItem[nameField], targetState: 'exists', action: 'NO_CHANGE', status: 'success' });
        report.summary[summaryKeys.unchanged]++;
      } else {
        merged[existingIdx] = { ...existing, ...srcItem }; 
        report[reportKey].push({ sourceId: srcItem[idField], name: srcItem[nameField], targetState: 'exists_diff', action: 'UPDATE', status: 'success' });
        report.summary[summaryKeys.updated]++;
      }
    } else {
      merged.push(srcItem);
      report[reportKey].push({ sourceId: srcItem[idField], name: srcItem[nameField], targetState: 'missing', action: 'INSERT', status: 'success' });
      report.summary[summaryKeys.inserted]++;
    }
  }
  
  // Duplication tracking (if required by requirements)
  const idSet = new Set();
  const nameSet = new Set();
  for (const item of merged) {
    if (idSet.has(item[idField])) report.summary[summaryKeys.duplicateIds] = (report.summary[summaryKeys.duplicateIds] || 0) + 1;
    idSet.add(item[idField]);
    if (item[nameField]) {
      const lowName = item[nameField].toLowerCase();
      if (nameSet.has(lowName)) report.summary[summaryKeys.duplicateNames] = (report.summary[summaryKeys.duplicateNames] || 0) + 1;
      nameSet.add(lowName);
    }
  }

  return merged;
}

function processWriters(sourceData, targetData) {
  const sourceWriters = JSON.parse(fs.readFileSync(path.join(sourceData, 'writers.json'), 'utf8') || '[]');
  const targetWritersPath = path.join(targetData, 'writers.json');
  return processEntityArray(sourceWriters, targetWritersPath, options.remoteHashWriters, 'writers', {
    unchanged: 'writersUnchanged', updated: 'writersUpdated', inserted: 'writersInserted', conflict: 'errors', duplicateIds: 'errors', duplicateNames: 'errors'
  });
}

function processVocalists(sourceData, targetData) {
  const sourceVocalists = JSON.parse(fs.readFileSync(path.join(sourceData, 'vocalists.json'), 'utf8') || '[]');
  const targetVocalistsPath = path.join(targetData, 'vocalists.json');
  return processEntityArray(sourceVocalists, targetVocalistsPath, options.remoteHashVocalists, 'vocalists', {
    unchanged: 'vocalistsUnchanged', updated: 'vocalistsUpdated', inserted: 'vocalistsInserted', conflict: 'vocalistConflicts', duplicateIds: 'duplicateVocalistIds', duplicateNames: 'duplicateVocalistNames'
  });
}

function resolveCredit(creditStr, role, sourceWriters, sourceVocalists) {
  if (!creditStr) return [];
  const names = creditStr.split(/,| & | and /i).map(s => s.trim()).filter(Boolean);
  const resolved = [];
  for (const name of names) {
    let match = null;
    const wMatch = sourceWriters.find(w => w.public_name?.toLowerCase() === name.toLowerCase() || w.pen_name?.toLowerCase() === name.toLowerCase() || w.id === name);
    if (wMatch) match = wMatch.id;
    else {
      const vMatch = sourceVocalists.find(v => v.public_name?.toLowerCase() === name.toLowerCase() || v.stage_name?.toLowerCase() === name.toLowerCase() || v.id === name);
      if (vMatch) match = vMatch.id;
    }
    
    if (match) {
      resolved.push({ contributorId: match, role: role, resolutionClass: 'EXACT_MATCH' });
      report.summary.creditResolution.EXACT_MATCH++;
    } else {
      resolved.push({ contributorId: name, role: role, resolutionClass: 'UNRESOLVED' });
      report.summary.creditResolution.UNRESOLVED++;
    }
  }
  return resolved;
}

function processReleases(sourceData, targetData, sourceWriters, sourceVocalists) {
  const sourceReleases = JSON.parse(fs.readFileSync(path.join(sourceData, 'cms-releases.json'), 'utf8') || '[]');
  const targetReleasesPath = path.join(targetData, 'cms-releases.json');
  let targetReleases = [];
  if (fs.existsSync(targetReleasesPath)) {
    const raw = fs.readFileSync(targetReleasesPath, 'utf8');
    targetReleases = JSON.parse(raw || '[]');
    if (!options.dryRun && options.remoteHashReleases) {
      const currentHash = sha256(raw);
      if (currentHash !== options.remoteHashReleases) {
        throw new Error(`PRODUCTION_CHANGED_SINCE_SNAPSHOT: cms-releases.json hash mismatch. Expected ${options.remoteHashReleases}, got ${currentHash}`);
      }
    }
  }
  
  const idMap = new Map();
  const slugMap = new Map();
  const ytMap = new Map();
  
  targetReleases.forEach(r => {
    report.releaseStats.total++;
    if (r.status === 'published') report.releaseStats.published++;
    else if (r.status === 'draft') report.releaseStats.draft++;
    else if (r.releaseLifecycle === 'upcoming') report.releaseStats.upcoming++;
    else report.releaseStats.other++;
    
    if (idMap.has(r.id)) report.releaseStats.duplicateIds.push(r.id);
    else idMap.set(r.id, 'target');
    
    if (slugMap.has(r.slug)) report.releaseStats.duplicateSlugs.push(r.slug);
    else slugMap.set(r.slug, r.id);
    
    if (r.youtubeId) {
      if (ytMap.has(r.youtubeId)) report.releaseStats.duplicateYoutubeIds.push(r.youtubeId);
      else ytMap.set(r.youtubeId, r.id);
    }
  });

  const mergedReleases = [...targetReleases];
  
  for (const sr of sourceReleases) {
    if (idMap.get(sr.id) === 'target') report.releaseStats.common.push(sr.id);
    else {
      report.releaseStats.sourceOnly.push(sr.id);
      report.releaseStats.total++;
      if (sr.status === 'published') report.releaseStats.published++;
      else if (sr.releaseLifecycle === 'upcoming') report.releaseStats.upcoming++;
      else report.releaseStats.other++;
    }
    
    const existingIdx = mergedReleases.findIndex(tr => tr.id === sr.id);
    let tr = existingIdx !== -1 ? { ...mergedReleases[existingIdx] } : { ...sr };
    
    if (existingIdx !== -1) {
      for (const field of SOURCE_AUTHORITATIVE_FIELDS) if (sr[field] !== undefined) tr[field] = sr[field];
      for (const field of PRODUCTION_AUTHORITATIVE_FIELDS) if (mergedReleases[existingIdx][field] !== undefined) tr[field] = mergedReleases[existingIdx][field];
      for (const field of CONDITIONAL_FIELDS) {
        const prodVal = mergedReleases[existingIdx][field];
        const srcVal = sr[field];
        if (prodVal !== undefined && prodVal !== null && prodVal !== '') tr[field] = prodVal;
        else if (srcVal !== undefined) tr[field] = srcVal;
      }
    }
    
    let credits = tr.releaseContributorCredits || [];
    const legacyFields = [
      { key: 'writer', role: 'writer' },
      { key: 'lyricist', role: 'lyricist' },
      { key: 'composer', role: 'composer' },
      { key: 'musicDirector', role: 'musicDirector' },
      { key: 'vocalist', role: 'vocalist' }
    ];
    let creditsAdded = 0;
    
    legacyFields.forEach(({key, role}) => {
      const val = tr[key];
      if (val) {
        const resolved = resolveCredit(val, role, sourceWriters, sourceVocalists);
        resolved.forEach(r => {
          report.releaseCredits.push({
            releaseId: tr.id, legacyCredit: val, role: r.role,
            resolvedContributor: r.contributorId, resolutionClass: r.resolutionClass
          });
          if (r.resolutionClass === 'EXACT_MATCH' || r.resolutionClass === 'ALIAS_MATCH') {
            const exists = credits.find(c => c.contributorId === r.contributorId && c.role === r.role);
            if (!exists) {
              credits.push({ contributorId: r.contributorId, role: r.role });
              creditsAdded++;
            }
          }
        });
      }
    });
    
    tr.releaseContributorCredits = credits;
    if (creditsAdded > 0) report.summary.releaseRelationshipsUpdated += creditsAdded;
    
    const isUpcoming = tr.releaseLifecycle === 'upcoming';
    const isFeaturedPremiere = tr.isFeaturedPremiere === true;
    report.premiere.push({
      releaseId: tr.id,
      classifierResult: isUpcoming && isFeaturedPremiere ? 'PREMIERE_ROOM' : 'STANDARD',
      expectedCatalogEligibility: isUpcoming ? 'EXCLUDED_WHILE_UPCOMING' : 'ELIGIBLE'
    });
    
    if (existingIdx !== -1) mergedReleases[existingIdx] = tr;
    else mergedReleases.push(tr);
  }
  
  targetReleases.forEach(tr => {
    if (!report.releaseStats.common.includes(tr.id)) report.releaseStats.targetOnly.push(tr.id);
  });
  return mergedReleases;
}

function main() {
  console.log(`Starting Data Parity Migration (${options.dryRun ? 'DRY RUN' : 'APPLY'})`);
  
  const sourceWriters = JSON.parse(fs.readFileSync(path.join(options.source, 'writers.json'), 'utf8') || '[]');
  const sourceVocalists = JSON.parse(fs.readFileSync(path.join(options.source, 'vocalists.json'), 'utf8') || '[]');
  
  const finalWriters = processWriters(options.source, options.target);
  const finalVocalists = processVocalists(options.source, options.target);
  const finalReleases = processReleases(options.source, options.target, sourceWriters, sourceVocalists);
  
  const gate = report.summary.creditResolution;
  if (!options.dryRun && (gate.AMBIGUOUS > 0 || gate.UNRESOLVED > 0 || gate.CONFLICT > 0 || report.summary.vocalistConflicts > 0)) {
    console.error("ABORT: Unresolved credits or vocalist conflicts exist. Fix mappings before applying.");
    process.exit(1);
  }
  
  if (!options.dryRun) {
    backupTarget();
    const tmpWriters = path.join(options.target, 'writers.json.migration-new');
    const tmpVocalists = path.join(options.target, 'vocalists.json.migration-new');
    const tmpReleases = path.join(options.target, 'cms-releases.json.migration-new');
    
    fs.writeFileSync(tmpWriters, JSON.stringify(finalWriters, null, 2));
    fs.writeFileSync(tmpVocalists, JSON.stringify(finalVocalists, null, 2));
    fs.writeFileSync(tmpReleases, JSON.stringify(finalReleases, null, 2));
    
    fs.renameSync(tmpWriters, path.join(options.target, 'writers.json'));
    fs.renameSync(tmpVocalists, path.join(options.target, 'vocalists.json'));
    fs.renameSync(tmpReleases, path.join(options.target, 'cms-releases.json'));
    console.log('[APPLY] Mutations committed atomically.');
  }
  
  fs.writeFileSync(options.report, JSON.stringify(report, null, 2));
  console.log(`Report generated at ${options.report}`);
}

main();
