const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id, registry_order FROM releases WHERE id IN (\'release_1775203218447_Sp4cG8TI7i8\', \'release_1775203218447_nn3gXZQqX84\') ORDER BY COALESCE(release_date, published_at, created_at) DESC NULLS LAST, COALESCE(published_at, release_date, created_at) DESC NULLS LAST, registry_order ASC NULLS LAST').then(res => { console.log(res.rows); pool.end(); });
