const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:pass@localhost:5434/sufipulse_phase2' });
(async () => {
  const { rows } = await pool.query(`SELECT title, youtube_id FROM releases WHERE youtube_id IN ('ooxUUEsh5Kg', 'dXqkrpP-41I', '1kOiOhzXtUY', 'Dbd0fhJty4A')`);
  console.log('Count found:', rows.length);
  process.exit(0);
})();
