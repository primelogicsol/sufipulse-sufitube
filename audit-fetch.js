const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: 'postgres://postgres:pass@localhost:5434/sufipulse_phase2' });

(async () => {
  const { rows } = await pool.query('SELECT * FROM releases');
  fs.writeFileSync('releases_dump.json', JSON.stringify(rows, null, 2), 'utf8');
  process.exit(0);
})();
