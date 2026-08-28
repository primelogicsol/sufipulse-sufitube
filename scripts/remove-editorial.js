const fs = require('fs');
const { Pool } = require('pg');

const titlesToRemove = [
  "Qawwali: The Sound of Devotional Ecstasy",
  "Nund Rishi and the Soul of Kashmir",
  "Tajdar-e-Haram: A Song Beyond Generations",
  "Abida Parveen: The Voice of Divine Love",
  "Nusrat Fateh Ali Khan: A Global Voice of Devotion",
  "Sufi Music: The Soundtrack of Spiritual Seeking",
  "Qawwali: The Sacred Art of Sama",
  "Bayazid Bastami: The Path of Fana",
  "Kashmiri Sufiyana: A Living Musical Tradition",
  "Shah Hamadan: The Saint Who Shaped Kashmir",
  "Lal Ded: Mysticism Beyond Boundaries",
  "Nund Rishi: The Voice of Kashmir's Spiritual Conscience"
];

(async () => {
  const dbPath = '.data/cms-releases.json';
  const releases = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const filtered = releases.filter(r => {
    // Check if title matches exactly or includes
    const titleMatch = titlesToRemove.some(title => r.title.includes(title));
    // Check if youtubeId has placeholder pattern
    const isPlaceholderId = r.youtubeId && r.youtubeId.startsWith('xVz_4h8oJ');
    const isUuidId = r.youtubeId && r.youtubeId.startsWith('rel_');
    return !titleMatch && !isPlaceholderId && !isUuidId;
  });

  console.log(`Original count: ${releases.length}`);
  console.log(`Removed: ${releases.length - filtered.length}`);
  console.log(`Remaining: ${filtered.length}`);

  if (filtered.length !== 88) {
    console.warn('WARNING: Remaining count is not 88! Something is wrong.');
  }

  // Update FS
  fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2), 'utf8');

  // Update PG
  const pool = new Pool({ connectionString: 'postgres://postgres:pass@localhost:5434/sufipulse_phase2' });
  await pool.query('TRUNCATE TABLE releases CASCADE');
  
  // Actually, we can use the Phase 2 import script to sync them and prove it works perfectly!
  // But wait, the Phase 2 import script reads from `.phase2/reconciled-cms-releases.json`.
  // I will just copy `.data/cms-releases.json` to `.phase2/reconciled-cms-releases.json`
  fs.writeFileSync('.phase2/reconciled-cms-releases.json', JSON.stringify(filtered, null, 2), 'utf8');
  process.exit(0);
})();
