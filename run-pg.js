const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:pass@localhost:5434/sufipulse_phase2' });
(async () => {
  const { rows } = await pool.query(`
    SELECT title, youtube_id, published_at, release_date, created_at, 
    (CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) as effective_date
    FROM releases 
    ORDER BY effective_date DESC NULLS LAST
    LIMIT 10
  `);
  console.table(rows);
  process.exit(0);
})();
