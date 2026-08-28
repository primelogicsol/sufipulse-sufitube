import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function run() {
  console.log('=== Phase 2 Preflight Check ===');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Please provide a valid PostgreSQL connection string.');
    console.log('Example: DATABASE_URL=postgres://user:pass@localhost:5432/sufipulse node scripts/phase2-db-preflight.mjs');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully.');
    
    // Check if migration has already been run by looking for the releases table
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'releases'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('⚠️ Migration 001_phase2_foundation.sql appears to be already applied (releases table exists). Skipping schema creation.');
    } else {
      console.log('Applying 001_phase2_foundation.sql migration...');
      const sqlPath = resolve('db/migrations/001_phase2_foundation.sql');
      const sql = readFileSync(sqlPath, 'utf8');
      
      await client.query(sql);
      console.log('✅ Migration applied successfully.');
    }

    client.release();
    console.log('\nPreflight checks passed. Database is ready for Phase 2 data import.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection or migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
