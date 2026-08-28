import fs from 'fs';
import path from 'path';

const BACKEND = process.env.RELEASE_STORAGE_BACKEND || 'filesystem';
const OUTPUT_FILE = `.phase2/http-${BACKEND}-snapshot.json`;
const API_BASE = 'http://localhost:3005/api/releases';

// Generate URLs for all scenarios
const urls = [
  '/',
  '/?page=1&pageSize=12',
  '/?page=2&pageSize=12',
  '/?limit=12',
  '/?pageSize=1',
  '/?page=2&pageSize=12&offset=5',
  '/?sort=default',
  '/?sort=newest',
  '/?sort=oldest',
  '/?sort=popular',
  '/?duration=all',
  '/?duration=default',
  '/?duration=short',
  '/?duration=standard',
  '/?duration=long',
  '/?governance=all',
  '/?format=all',
  '/?type=all',
  '/?year=all',
  // Some realistic filters
  '/?status=published',
  '/?status=draft',
  '/?format=video',
  '/?format=article',
  '/?governance=native_governed',
  '/?year=2025',
  '/?year=2023',
  '/?releaseType=flagship',
  // Canonical title search
  '/?search=nund rishi',
  '/?search=nusrat',
  // tags, slugs, whitespace, etc
  '/?search=  qawwali  ',
  '/?search=invalid_search_no_match',
  // Combos
  '/?status=published&format=video',
  '/?status=published&governance=native_governed',
  '/?format=video&duration=standard',
  '/?governance=native_governed&year=2025',
  '/?status=published&search=nusrat',
  '/?status=published&governance=native_governed&format=video&year=2025',
  // Error handling
  '/?sort=invalid', // Invalid query
];

// Add single lookups
const reconciled = JSON.parse(fs.readFileSync('.phase2/reconciled-cms-releases.json', 'utf8'));

for (const r of reconciled) {
  urls.push(`?slug=${r.slug}`);
  urls.push(`?key=${r.id}`);
  urls.push(`/${r.id}`); // Direct path lookup
  if (r.youtubeId) {
    urls.push(`?youtubeId=${r.youtubeId}`);
  }
}

urls.push('?slug=unknown-slug');
urls.push('?key=unknown-key');
urls.push('/unknown-id');

async function run() {
  const snapshot = {};
  console.log(`Gathering ${urls.length} snapshots for backend: ${BACKEND}`);
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const url = API_BASE + (u.startsWith('?') ? u : u.substring(1));
    
    try {
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
      const status = res.status;
      const headers = {
        'cache-control': res.headers.get('cache-control')
      };
      
      let bodyText = await res.text();
      let body;
      try {
        body = JSON.parse(bodyText);
      } catch (e) {
        body = bodyText;
      }
      
      snapshot[u] = { status, headers, body };
    } catch (e) {
      console.error(`Failed on ${u}: ${e.message}`);
      snapshot[u] = { error: e.message };
    }
    
    if (i % 50 === 0) console.log(`Processed ${i}/${urls.length}`);
  }
  
  fs.mkdirSync('.phase2', { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2));
  console.log(`Saved snapshot to ${OUTPUT_FILE}`);
}

run().catch(console.error);
