const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:pass@localhost:5434/sufipulse_phase2' });

(async () => {
  const id = 'rel_05dfe093-88ad-4cfc-9cfa-7c4308a353af';
  await pool.query('DELETE FROM releases WHERE id = $1', [id]);
  const res = await pool.query('SELECT count(*) FROM releases');
  console.log('Count:', res.rows[0].count);
  process.exit(0);
})();
