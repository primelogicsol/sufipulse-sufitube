const fs = require('fs');
const releases = JSON.parse(fs.readFileSync('releases_dump.json', 'utf8'));

const SP_CHANNEL = 'UCraDr3i5A3k0j7typ6tOOsQ';

const buckets = {
  KEEP: [],
  QUARANTINE: [],
  REMOVE: []
};

const classifications = {
  'CHANNEL VERIFIED': [],
  'SUFIPULSE NATIVE': [],
  'FOREIGN YOUTUBE': [],
  'EDITORIAL / RESEARCH': [],
  'DEMO / TEST / SEED': [],
  'ORPHANED': [],
  'DUPLICATE': []
};

const seenYoutubeIds = new Set();
const seenSlugs = new Set();

releases.forEach(r => {
  let cls = 'ORPHANED';
  let bucket = 'QUARANTINE';

  const t = (r.title || '').toLowerCase();
  
  if (r.youtube_id && seenYoutubeIds.has(r.youtube_id)) {
    cls = 'DUPLICATE';
    bucket = 'QUARANTINE';
  } else if (seenSlugs.has(r.slug)) {
    cls = 'DUPLICATE';
    bucket = 'QUARANTINE';
  } else if (r.youtube_channel_id === SP_CHANNEL) {
    cls = 'CHANNEL VERIFIED';
    bucket = 'KEEP';
  } else if (r.youtube_channel_id && r.youtube_channel_id !== SP_CHANNEL) {
    cls = 'FOREIGN YOUTUBE';
    bucket = 'QUARANTINE';
  } else if (r.format === 'article' || t.includes('globalization') || t.includes('history') || t.includes('cambridge') || r.category === 'article' || r.release_type === 'editorial') {
    cls = 'EDITORIAL / RESEARCH';
    bucket = 'REMOVE'; // or QUARANTINE to be safe
  } else if (t.includes('test') || t.includes('demo') || t.includes('placeholder')) {
    cls = 'DEMO / TEST / SEED';
    bucket = 'REMOVE';
  } else if (!r.youtube_id && r.governance_origin === 'native_governed') {
    cls = 'SUFIPULSE NATIVE';
    bucket = 'KEEP';
  } else {
    // maybe it is a valid native release but lacks some fields? Let's check format
    if (r.youtube_id) {
       cls = 'FOREIGN YOUTUBE'; // If it has youtube_id but no channel ID, probably foreign or unverified
       bucket = 'QUARANTINE';
    }
  }

  if (r.youtube_id) seenYoutubeIds.add(r.youtube_id);
  seenSlugs.add(r.slug);

  classifications[cls].push({
    id: r.id,
    title: r.title,
    youtubeId: r.youtube_id,
    channelId: r.youtube_channel_id,
    governance: r.governance_origin,
    format: r.format
  });

  // Re-adjust buckets if editorial should be quarantine
  if (cls === 'EDITORIAL / RESEARCH') bucket = 'QUARANTINE';
  
  buckets[bucket].push(r.id);
});

console.log('=== CLASSIFICATION SUMMARY ===');
for (const [k, v] of Object.entries(classifications)) {
  console.log(k + ':', v.length);
}

console.log('\n=== EDITORIAL / RESEARCH ===');
console.log(classifications['EDITORIAL / RESEARCH'].map(r => r.title));

console.log('\n=== FOREIGN YOUTUBE ===');
console.log(classifications['FOREIGN YOUTUBE'].map(r => r.title));

console.log('\n=== ORPHANED ===');
console.log(classifications['ORPHANED'].map(r => r.title));

console.log('\n=== DUPLICATE ===');
console.log(classifications['DUPLICATE'].map(r => r.title));

