import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

async function run() {
  console.log('=== Phase 2 Preflight Check & Migration ===\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  let client;
  try {
    client = await pool.connect();
    
    // 1 & 2. Connect and Report
    const info = await client.query('SELECT version(), current_database(), current_user;');
    console.log(`Connection:          PASS (${info.rows[0].current_user} @ ${info.rows[0].current_database})`);
    console.log(`PostgreSQL version:  ${info.rows[0].version.split(' ')[1]}`);

    // 3. Ensure schema_migrations exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version       text PRIMARY KEY,
        checksum      text NOT NULL,
        applied_at    timestamptz NOT NULL DEFAULT now()
      );
    `);
    console.log(`schema_migrations:   PASS`);

    // 4. Read & Hash SQL
    const sqlPath = resolve('db/migrations/001_phase2_foundation.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    
    // 5. Check Migration Ledger
    const ledger = await client.query(`SELECT checksum FROM schema_migrations WHERE version = '001_phase2_foundation'`);
    
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'releases'
      );
    `);
    const releasesExists = tableCheck.rows[0].exists;

    if (ledger.rowCount === 0) {
      if (releasesExists) {
        throw new Error('Inconsistent database: "releases" table exists but no ledger entry for 001_phase2_foundation.');
      }
      
      console.log(`\nExecuting 001_phase2_foundation.sql...`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        
        await client.query(
          `INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)`,
          ['001_phase2_foundation', checksum]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
      console.log(`001 checksum:        PASS (recorded ${checksum.substring(0, 8)}...)`);
    } else {
      const storedChecksum = ledger.rows[0].checksum;
      if (storedChecksum !== checksum) {
        throw new Error(`Checksum mismatch for 001_phase2_foundation. Expected ${checksum}, found ${storedChecksum}`);
      }
      console.log(`001 checksum:        PASS (matched ${checksum.substring(0, 8)}...)`);
    }

    // --- SCHEMA VERIFICATION ---
    console.log('\n--- Schema Assertions ---');

    // pg_trgm extension
    const ext = await client.query(`SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'`);
    if (ext.rowCount === 0) throw new Error('pg_trgm extension missing');
    console.log(`pg_trgm extension:               PASS`);

    // releases table
    const relTable = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'releases'`);
    if (relTable.rowCount === 0) throw new Error('releases table missing');
    console.log(`releases table:                  PASS`);

    // release_graph_joins table
    const graphTable = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = 'release_graph_joins'`);
    if (graphTable.rowCount === 0) throw new Error('release_graph_joins table missing');
    console.log(`release_graph_joins table:       PASS`);

    // slug unique constraint
    const slugConst = await client.query(`SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'releases' AND constraint_name = 'releases_slug_unique'`);
    if (slugConst.rowCount === 0) throw new Error('releases_slug_unique missing');
    console.log(`slug unique constraint:          PASS`);

    // YouTube partial unique index
    const ytIdx = await client.query(`SELECT 1 FROM pg_indexes WHERE indexname = 'releases_youtube_id_unique'`);
    if (ytIdx.rowCount === 0) throw new Error('releases_youtube_id_unique missing');
    console.log(`YouTube partial unique index:    PASS`);

    // governance constraint
    const govConst = await client.query(`SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'releases' AND constraint_name = 'releases_governance_check'`);
    if (govConst.rowCount === 0) throw new Error('releases_governance_check missing');
    console.log(`governance constraint:           PASS`);

    // status constraint
    const statusConst = await client.query(`SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'releases' AND constraint_name = 'releases_status_check'`);
    if (statusConst.rowCount === 0) throw new Error('releases_status_check missing');
    console.log(`status constraint:               PASS`);

    // expected indexes
    const expectedIndexes = [
      'releases_status_idx',
      'releases_governance_idx',
      'releases_format_idx',
      'releases_release_date_idx',
      'releases_popularity_idx',
      'releases_duration_idx',
      'releases_status_governance_date_idx',
      'releases_canonical_title_trgm_idx',
      'releases_youtube_title_trgm_idx',
      'releases_description_trgm_idx',
      'graph_release_idx',
      'graph_registry_idx',
      'graph_target_entity_idx',
      'graph_relationship_idx'
    ];
    const foundIndexes = await client.query(`SELECT indexname FROM pg_indexes WHERE indexname = ANY($1)`, [expectedIndexes]);
    if (foundIndexes.rowCount !== expectedIndexes.length) throw new Error(`Missing indexes. Found ${foundIndexes.rowCount} of ${expectedIndexes.length}`);
    console.log(`expected indexes:                PASS`);

    console.log('\n✅ P2-G1 — Schema migration applies cleanly to empty PostgreSQL: PASS');
  } catch (err) {
    console.error('\n❌ P2-G1 Execution Failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

run();
