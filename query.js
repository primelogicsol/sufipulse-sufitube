const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:pass@localhost:5434/sufipulse_phase2' });
pool.query("SELECT id, release_date, published_at, created_at, registry_order FROM releases WHERE id IN ('LjmOxu1AVAg', 'release_1778705546287_q58mRXIsi-Y')").then(res => {
  console.log(res.rows);
  pool.end();
});
