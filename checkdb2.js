const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id, registry_order FROM releases WHERE id IN (\'LjmOxu1AVAg\', \'release_1778705546287_q58mRXIsi-Y\') ORDER BY registry_order ASC').then(res => { console.log(res.rows); pool.end(); });
