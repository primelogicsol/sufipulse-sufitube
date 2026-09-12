const fs = require('fs');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const RELEASES_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(RELEASES_FILE, 'utf8'));

// 1. Correct Track 14
const wrongNames = ['Ayaan Qureshi', 'Zayd Al-Farsi', 'Omar Rahman', 'Sara Al-Masri'];
const rightNames = ['Kaifi Khalil', 'Talha Anjum', 'Abdul Hannan', 'Asim Azhar'];

// Remove wrong names
vocalists = vocalists.filter(v => !wrongNames.includes(v.public_name));

// Add right names
const crypto = require('crypto');
for (const name of rightNames) {
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

// Update release 14
let r14 = releases.find(x => x.youtubeId === 'UcV7rMQ7XGg');
if (r14) {
  r14.publicCredits.artistic.leadVocalist = rightNames.join(', ');
}

// 2. Merge Zarif Ali into Zarif Ali Shah
let zarifAli = vocalists.find(v => v.public_name === 'Zarif Ali');
let zarifAliShah = vocalists.find(v => v.public_name === 'Zarif Ali Shah');

if (zarifAli && zarifAliShah) {
  // Combine appearances
  zarifAliShah.legacy_appearances = (zarifAliShah.legacy_appearances || 0) + (zarifAli.legacy_appearances || 0);
  
  // Add alias
  if (!zarifAliShah.known_aliases) zarifAliShah.known_aliases = [];
  if (!zarifAliShah.known_aliases.includes('Zarif Ali')) {
      zarifAliShah.known_aliases.push('Zarif Ali');
  }

  // Remove Zarif Ali
  vocalists = vocalists.filter(v => v.public_name !== 'Zarif Ali');
}

// Update release 1 to use Zarif Ali Shah
let r1 = releases.find(x => x.youtubeId === 'Dbd0fhJty4A');
if (r1) {
  r1.publicCredits.artistic.leadVocalist = r1.publicCredits.artistic.leadVocalist.replace('Zarif Ali', 'Zarif Ali Shah');
}

fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');
fs.writeFileSync(RELEASES_FILE, JSON.stringify(releases, null, 2), 'utf8');

console.log('Correction and merge completed.');
