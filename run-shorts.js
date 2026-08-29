const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:pass@localhost:5434/sufipulse_phase2' });
(async () => {
  const { rows } = await pool.query("SELECT title, youtube_id FROM releases WHERE format = 'short'");
  console.log('Shorts count in DB:', rows.length);
  process.exit(0);
})();
