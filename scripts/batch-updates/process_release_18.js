const fs = require('fs');
const crypto = require('crypto');

// 1. Process Vocalists
const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const newNames = ['Rehan Mir', 'Daniyal Kashfi'];
for (const name of newNames) {
  let v = vocalists.find(x => x.public_name === name);
  if (v) {
    v.legacy_appearances = (v.legacy_appearances || 0) + 1;
  } else {
    vocalists.push({
      id: 'vocalists_' + crypto.randomUUID(),
      public_name: name,
      stage_name: name,
      public_name_type: 'STAGE_NAME',
      contributor_role: 'VOCALIST',
      identity_type: 'STUDIO_PSEUDONYM',
      managed_by: 'SufiPulse Studio USA',
      profile_status: 'approved_as_vocalist',
      contributor_status: 'ACTIVE',
      catalog_assignment: 'PENDING_LEGACY_MAPPING',
      legacy_appearances: 1,
      joined_at: new Date('2025-05-20T00:00:00Z').toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email: 'Internal Workflow'
    });
  }
}
fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');

// 2. Process Release
const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

const ytId = 'n6q_g4bY_sA';
const newTitle = 'Main Hoon Sufi Researcher | A Reflection for Those Who Study the World | SufiPulse USA';
const voc = 'Rehan Mir, Daniyal Kashfi';

let r = releases.find(x => x.youtubeId === ytId);

if (!r) {
  console.log('RELEASE NOT FOUND');
} else {
  r.canonicalTitle = newTitle;
  
  if (!r.publicCredits) r.publicCredits = {};
  if (!r.publicCredits.artistic) r.publicCredits.artistic = {};
  if (!r.publicCredits.production) r.publicCredits.production = {};
  if (!r.publicCredits.visual) r.publicCredits.visual = {};
  if (!r.publicCredits.literary) r.publicCredits.literary = {};

  r.publicCredits.artistic.lyricist = 'Dr. Zarf-e-Noori';
  r.publicCredits.artistic.composer = 'Dr. Zarf-e-Noori';
  r.publicCredits.artistic.musicProducer = 'Dr. Zarf-e-Noori';
  r.publicCredits.artistic.leadVocalist = voc;

  r.publicCredits.production.recordedAt = 'SufiPulse Studio';
  r.publicCredits.production.recordingEngineer = 'Lucas Ray, Michael "SufiPulse" Hartman';
  r.publicCredits.production.mixMaster = 'Ryan Cole, Elijah James';
  r.publicCredits.production.soundDesign = 'Elijah James';
  r.publicCredits.production.productionSupervision = 'SufiPulse Studio USA';

  r.publicCredits.visual.videoDirection = 'SufiPulse Visuals';
  r.publicCredits.visual.editing = 'SufiPulse Media Team';
  r.publicCredits.visual.thumbnailDesign = 'SufiPulse Design Team';
  r.publicCredits.visual.artwork = 'SufiPulse Design Team';

  r.publicCredits.literary.romanTransliteration = 'SufiPulse Editorial';
  r.publicCredits.literary.englishTranslation = 'Literary Committee';
  r.publicCredits.literary.thematicInterpretation = 'Literary Committee';
  r.publicCredits.literary.proofreading = 'SufiPulse Editorial';

  if (!r.releaseRights) r.releaseRights = {};
  r.releaseRights.publishedBy = 'SufiPulse USA';
  r.releaseRights.platform = 'SufiTube';
  r.releaseRights.copyrightHolder = 'SufiPulse USA';
  r.releaseRights.licensingPermissions = 'Standard SufiPulse License';
  
  if (!r.releaseRights.registeredReleaseId && !r.registeredReleaseId) {
      r.releaseRights.registeredReleaseId = 'SP-KS-2026-018';
  }
  
  r.releaseDate = '2026-01-18';
  r.releaseRights.releaseDate = '2026-01-18';

  fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
  console.log('RELEASE FOUND AND PATCHED');
}
