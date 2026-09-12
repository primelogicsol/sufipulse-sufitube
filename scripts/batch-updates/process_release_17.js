const fs = require('fs');

// 1. Process Vocalists
const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const names = ['Raghav Mehra', 'Ananya Iyer'];
for (const name of names) {
  let v = vocalists.find(x => x.public_name === name);
  if (v) {
    v.legacy_appearances = (v.legacy_appearances || 0) + 1;
  }
}
fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');

// 2. Process Release
const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

const ytId = '_zx1N_xZzys';
const newTitle = 'Nazar-e-Karam Kar De | A Prayer for Inner Elevation | SufiPulse USA';
const voc = 'Raghav Mehra, Ananya Iyer';

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
      // Use releaseDate to derive year if present, otherwise 2026
      let year = r.releaseDate ? r.releaseDate.substring(0, 4) : '2026';
      r.releaseRights.registeredReleaseId = `SP-KS-${year}-017`;
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
  console.log('RELEASE FOUND AND PATCHED');
}
