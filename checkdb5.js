const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id, registry_order FROM releases WHERE id IN (\'LjmOxu1AVAg\', \'release_1778705546287_q58mRXIsi-Y\') ORDER BY COALESCE(release_date, published_at, created_at) ASC NULLS LAST, COALESCE(published_at, release_date, created_at) DESC NULLS LAST, registry_order ASC NULLS LAST').then(res => { console.log(res.rows); pool.end(); });
