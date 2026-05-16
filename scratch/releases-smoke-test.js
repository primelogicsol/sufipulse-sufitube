
async function runReleasesSmokeTest() {
  const BASE_URL = 'http://localhost:3000';
  const API_URL = `${BASE_URL}/api/releases?status=published&t=${Date.now()}`;
  const TARGET_IDS = ['q58mRXIsi-Y', 'wMxWfsst48Q', 'LjmOxu1AVAg'];
  
  console.log('--- SufiPulse Releases Smoke Test (Local) ---');

  try {
    console.log(`Fetching from ${API_URL}...`);
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    
    const data = await res.json();
    const releases = Array.isArray(data) ? data : (data.items || []);
    
    console.log('\n[1] Count Verification');
    console.log(`Total Published Releases: ${releases.length}`);
    if (releases.length >= 87) {
      console.log('✓ Count matches expected (>= 87)');
    } else {
      console.log(`✗ Count mismatch! Expected >= 87, got ${releases.length}`);
    }

    console.log('\n[2] Sorting Verification (Newest First)');
    const top5 = releases.slice(0, 5);
    top5.forEach((r, i) => {
      console.log(`${i+1}. ${r.title} [${r.publishedAt || r.releaseDate}]`);
    });
    
    const firstTitle = top5[0]?.title || '';
    if (firstTitle.includes('Lord of the Mysteries')) {
      console.log('✓ "Lord of the Mysteries" is at the top.');
    } else {
      console.log(`✗ Unexpected top release: ${firstTitle}`);
    }

    console.log('\n[3] Target ID Verification');
    TARGET_IDS.forEach(id => {
      const found = releases.find(r => (r.id + (r.youtubeId || '')).includes(id));
      if (found) {
        console.log(`✓ ID ${id} found: ${found.title}`);
      } else {
        console.log(`✗ ID ${id} NOT FOUND in API response`);
      }
    });

    console.log('\n[4] "Default" Length Filter Logic Simulation');
    const filteredDefault = releases.filter(r => {
      const seconds = r.durationSeconds || 0;
      const isShortFormat = r.format === 'short';
      return !(seconds < 180 || isShortFormat);
    });
    
    console.log(`Total in Default View: ${filteredDefault.length}`);
    const shortInDefault = filteredDefault.find(r => r.format === 'short' || r.durationSeconds < 180);
    if (!shortInDefault) {
      console.log('✓ No shorts found in simulated "Default" view.');
    } else {
      console.log(`✗ Found a short in "Default" view: ${shortInDefault.title} (${shortInDefault.durationSeconds}s)`);
    }

    console.log('\n[5] "Any Length" Logic Simulation');
    const hasShorts = releases.some(r => r.format === 'short' || r.durationSeconds < 180);
    if (hasShorts) {
      console.log('✓ "Any Length" (full list) contains short-form content.');
    } else {
      console.log('✗ No shorts found in the entire list. (Are they imported?)');
    }

    console.log('\n--- Smoke Test Complete ---');

  } catch (err) {
    console.error('Smoke Test FAILED:', err.message);
  }
}

runReleasesSmokeTest();
