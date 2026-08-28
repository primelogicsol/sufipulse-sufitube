const fs = require('fs');
const https = require('https');

const API_KEY = process.env.YOUTUBE_API_KEY;
const SP_CHANNEL = 'UCraDr3i5A3k0j7typ6tOOsQ';

const releases = JSON.parse(fs.readFileSync('releases_dump.json', 'utf8'));

const classifications = {
  'CHANNEL VERIFIED': [],
  'SUFIPULSE NATIVE': [],
  'FOREIGN YOUTUBE': [],
  'EDITORIAL / RESEARCH': [],
  'DEMO / TEST / SEED': [],
  'ORPHANED': [],
  'DUPLICATE': []
};

async function fetchYoutubeSnippet(id) {
  return new Promise((resolve, reject) => {
    https.get('https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + id + '&key=' + API_KEY, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

(async () => {
  const seenIds = new Set();
  const seenSlugs = new Set();

  // process in batches so we don't spam api
  for (const r of releases) {
    const t = (r.title || '').toLowerCase();
    let cls = 'ORPHANED';

    if (r.youtube_id && seenIds.has(r.youtube_id)) {
      cls = 'DUPLICATE';
    } else if (seenSlugs.has(r.slug)) {
      cls = 'DUPLICATE';
    } else if (r.format === 'article' || t.includes('globalization') || t.includes('history') || t.includes('cambridge') || r.category === 'article' || r.release_type === 'editorial') {
      cls = 'EDITORIAL / RESEARCH';
    } else if (t.includes('test') || t.includes('demo') || t.includes('placeholder')) {
      cls = 'DEMO / TEST / SEED';
    } else if (!r.youtube_id && r.governance_origin === 'native_governed') {
      cls = 'SUFIPULSE NATIVE';
    } else if (r.youtube_id) {
      if (r.youtube_channel_id === SP_CHANNEL) {
         cls = 'CHANNEL VERIFIED';
      } else {
         try {
           const ytData = await fetchYoutubeSnippet(r.youtube_id);
           if (ytData && ytData.items && ytData.items.length > 0) {
              const channelId = ytData.items[0].snippet.channelId;
              if (channelId === SP_CHANNEL) {
                 cls = 'CHANNEL VERIFIED';
              } else {
                 cls = 'FOREIGN YOUTUBE';
                 r._foreignChannelId = channelId;
                 r._foreignChannelTitle = ytData.items[0].snippet.channelTitle;
              }
           } else {
              cls = 'ORPHANED';
           }
         } catch (err) {
           cls = 'ORPHANED';
         }
      }
    } else {
      cls = 'ORPHANED';
    }

    if (r.youtube_id) seenIds.add(r.youtube_id);
    seenSlugs.add(r.slug);

    classifications[cls].push(r);
  }

  console.log('=== CLASSIFICATION SUMMARY ===');
  for (const [k, v] of Object.entries(classifications)) {
    console.log(k + ':', v.length);
  }

  console.log('\n=== EDITORIAL / RESEARCH (Action: REMOVE/MOVE) ===');
  classifications['EDITORIAL / RESEARCH'].forEach(r => console.log(' - ' + r.title));

  console.log('\n=== FOREIGN YOUTUBE (Action: QUARANTINE) ===');
  classifications['FOREIGN YOUTUBE'].forEach(r => console.log(' - ' + r.title + ' (Channel: ' + r._foreignChannelTitle + ')'));

  console.log('\n=== DEMO / TEST / SEED (Action: REMOVE) ===');
  classifications['DEMO / TEST / SEED'].forEach(r => console.log(' - ' + r.title));

  console.log('\n=== ORPHANED (Action: QUARANTINE) ===');
  classifications['ORPHANED'].forEach(r => console.log(' - ' + r.title));

  console.log('\n=== DUPLICATE (Action: RECONCILE) ===');
  classifications['DUPLICATE'].forEach(r => console.log(' - ' + r.title));
})();
