require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  if (process.env.RELEASE_STORAGE_BACKEND !== 'postgres') {
    console.log('Skipping migration: RELEASE_STORAGE_BACKEND is not postgres');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  const migrationsDir = path.join(__dirname, '../server/db/migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Executing migration: ${file}`);
      await pool.query(sql);
    }
  }
  
  await pool.end();
  console.log('Migrations complete.');
}

migrate().catch(console.error);
