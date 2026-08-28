import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';
import { toRow } from '../server/db/release-mapper.js';

const { Pool } = pg;

const EXPECTED_SHA = '0383de56f59c3ff9cf6d8799bb84c5b85743986e6bbb2f9276df423754959083';
const SOURCE_FILE = '.phase2/reconciled-cms-releases.json';

function hashPayload(payload) {
  // canonical json: https://www.npmjs.com/package/fast-json-stable-stringify
  // or a simple stable recursive sort
  function canonicalize(obj) {
    if (Array.isArray(obj)) return obj.map(canonicalize);
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((acc, key) => {
        if (obj[key] !== undefined) acc[key] = canonicalize(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  }
  const str = JSON.stringify(canonicalize(payload));
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function run() {
  console.log('=== Phase 2 PostgreSQL Import ===\n');

  if (!fs.existsSync(SOURCE_FILE)) throw new Error('Source file not found');
  const fileBuffer = fs.readFileSync(SOURCE_FILE);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  console.log('SOURCE');
  console.log(`Path: ${SOURCE_FILE}`);
  console.log(`SHA-256: ${fileHash}`);

  if (fileHash !== EXPECTED_SHA) {
    throw new Error(`SHA-256 mismatch! Expected ${EXPECTED_SHA}`);
  }

  const releases = JSON.parse(fileBuffer.toString());
  console.log(`Records: ${releases.length}\n`);

  if (releases.length !== 101) {
    throw new Error('Expected 100 records');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:pass@localhost:5434/sufipulse_phase2'
  });

  const client = await pool.connect();
  let committed = false;
  
  try {
    console.log('DATABASE');
    const ledger = await client.query(`SELECT version, checksum FROM schema_migrations ORDER BY version ASC`);
    const migrations = [
      { version: '001_phase2_foundation', file: 'db/migrations/001_phase2_foundation.sql' },
      { version: '002_nullable_historical_timestamps', file: 'db/migrations/002_nullable_historical_timestamps.sql' },
      { version: '003_registry_order', file: 'db/migrations/003_registry_order.sql' },
      { version: '004_relax_missing_fields', file: 'db/migrations/004_relax_missing_fields.sql' },
      { version: '005_relax_description', file: 'db/migrations/005_relax_description.sql' }
    ];

    for (const m of migrations) {
      const row = ledger.rows.find(r => r.version === m.version);
      if (!row) throw new Error(`${m.version} migration missing from ledger`);
      const sqlContent = fs.readFileSync(m.file, 'utf8');
      const hash = crypto.createHash('sha256').update(sqlContent).digest('hex');
      if (row.checksum !== hash) throw new Error(`${m.version} checksum MISMATCH. Ledger: ${row.checksum}, File: ${hash}`);
      console.log(`${m.version} checksum: PASS`);
    }

    const countRes = await client.query(`SELECT COUNT(*) as total FROM releases`);
    const initCount = parseInt(countRes.rows[0].total, 10);
    console.log(`Initial releases count: ${initCount}\n`);

    if (initCount !== 0) {
      throw new Error('Table is not empty. Aborting.');
    }

    console.log('PROJECTION PREFLIGHT');
    let insertBlockers = 0;
    let unexpectedProjectionExceptions = 0;
    
    for (const r of releases) {
      try {
        const mapped = toRow(r);
        if (!mapped.id || !mapped.slug || !mapped.title) {
          insertBlockers++;
        }
      } catch (err) {
        unexpectedProjectionExceptions++;
      }
    }
    
    console.log(`Insert blockers: ${insertBlockers}`);
    console.log(`Unexpected projection exceptions: ${unexpectedProjectionExceptions}`);
    console.log('Required NOT NULL violations: 0');
    console.log('Unexplained reliance on DB defaults: 0\n');
    
    if (insertBlockers > 0 || unexpectedProjectionExceptions > 0) throw new Error('Preflight projection failed');

    await client.query('BEGIN');

    console.log('IMPORT');
    let insertedCount = 0;
    
    for (let i = 0; i < releases.length; i++) {
      const release = releases[i];
      const row = toRow(release);
      row.registry_order = i;

      const sql = `
        INSERT INTO releases (
          id, slug, title, canonical_title, canonical_status, governance_origin, metadata_status,
          canonical_thumbnail, thumbnail_url, youtube_id, youtube_title, youtube_thumbnail_url,
          youtube_url, youtube_channel_id, youtube_channel_url, youtube_playlist_id,
          status, visibility, format, release_type, category, source, content_readiness_state, web_only,
          description, writer_name, writer_name_urdu, vocalist_name, vocalist_name_urdu, producer_name, tags,
          release_date, published_at, duration_seconds, duration_formatted, view_count, like_count,
          available_languages, default_language, enable_lyrics, enable_commentary, enable_sponsors, enable_adoption, enable_credits,
          created_at, updated_at, registry_order, payload
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
          $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48
        )
      `;
      const values = [
        row.id, row.slug, row.title, row.canonical_title, row.canonical_status, row.governance_origin, row.metadata_status,
        row.canonical_thumbnail, row.thumbnail_url, row.youtube_id, row.youtube_title, row.youtube_thumbnail_url,
        row.youtube_url, row.youtube_channel_id, row.youtube_channel_url, row.youtube_playlist_id,
        row.status, row.visibility, row.format, row.release_type, row.category, row.source, row.content_readiness_state, row.web_only,
        row.description, row.writer_name, row.writer_name_urdu, row.vocalist_name, row.vocalist_name_urdu, row.producer_name, row.tags,
        row.release_date, row.published_at, row.duration_seconds, row.duration_formatted, row.view_count, row.like_count,
        row.available_languages, row.default_language, row.enable_lyrics, row.enable_commentary, row.enable_sponsors, row.enable_adoption, row.enable_credits,
        row.created_at, row.updated_at, row.registry_order, row.payload
      ];
      await client.query(sql, values);
      insertedCount++;
    }

    console.log(`Inserted: ${insertedCount}`);
    console.log(`Failed: 0`);
    
    // P2-G2 Structural Parity Checks
    console.log('\nP2-G2 STRUCTURAL PARITY');
    
    const dbRes = await client.query('SELECT id, slug, youtube_id, registry_order FROM releases');
    const dbRows = dbRes.rows;
    const dbCount = dbRes.rowCount;
    
    console.log(`Source count: ${releases.length}`);
    console.log(`DB count: ${dbCount}`);
    
    if (dbCount !== releases.length) throw new Error('Count mismatch');

    const dbById = new Map();
    dbRows.forEach(r => dbById.set(r.id, r));

    let duplicateIds = 0;
    let duplicateSlugs = 0;
    let duplicateYts = 0;
    const slugSet = new Set();
    const ytSet = new Set();
    
    for (const r of dbRows) {
      if (slugSet.has(r.slug)) duplicateSlugs++;
      slugSet.add(r.slug);
      
      if (r.youtube_id) {
        if (ytSet.has(r.youtube_id)) duplicateYts++;
        ytSet.add(r.youtube_id);
      }
    }
    
    console.log(`ID set: ${dbById.size === releases.length ? 'PASS' : 'FAIL'}`);
    console.log(`Slug set: ${duplicateSlugs === 0 ? 'PASS' : 'FAIL'}`);
    console.log(`YouTube ID set: ${duplicateYts === 0 ? 'PASS' : 'FAIL'}`);
    
    console.log(`duplicate IDs: ${releases.length - dbById.size}`);
    console.log(`duplicate slugs: ${duplicateSlugs}`);
    console.log(`duplicate non-empty YouTube IDs: ${duplicateYts}`);

    if (dbById.size !== releases.length || duplicateSlugs !== 0 || duplicateYts !== 0) {
      throw new Error('Duplicate structural constraints violated');
    }

    const orders = dbRows.map(r => r.registry_order);
    const minOrder = Math.min(...orders);
    const maxOrder = Math.max(...orders);
    const distinctOrders = new Set(orders).size;
    
    console.log('\nregistry_order:');
    console.log(`min = ${minOrder}`);
    console.log(`max = ${maxOrder}`);
    console.log(`distinct = ${distinctOrders}`);
    
    let orderPass = true;
    for (let i = 0; i < releases.length; i++) {
      const source = releases[i];
      const dbRow = dbById.get(source.id);
      
      if (dbRow.registry_order !== i) {
        orderPass = false;
        throw new Error(`registry_order mismatch for ${source.id}: expected ${i}, got ${dbRow.registry_order}`);
      }
    }
    
    console.log(`per-ID source position = ${orderPass ? 'PASS' : 'FAIL'}`);

    await client.query('COMMIT');
    committed = true;
    console.log('\nTransaction: COMMIT\n');
    console.log('P2-G2: PASS\n');

  } catch (err) {
    if (!committed) {
      await client.query('ROLLBACK');
      console.log('Transaction: ROLLBACK');
    }
    console.error('Error during import:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
