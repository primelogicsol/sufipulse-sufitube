
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { syncCmsReleases } = require('./sync-cms-releases');

async function migrate() {
  // 1. Filesystem CMS Releases Persistent Sync (Idempotent, non-destructive, with backup)
  try {
    syncCmsReleases();
  } catch (syncErr) {
    console.error('Failed to sync CMS releases to persistent storage:', syncErr);
    // Non-fatal if read-only, but log prominently
  }

  // 2. Postgres Migrations (if enabled)
  if (process.env.RELEASE_STORAGE_BACKEND !== 'postgres') {
    console.log('Skipping Postgres migration: RELEASE_STORAGE_BACKEND is not postgres');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
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

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
