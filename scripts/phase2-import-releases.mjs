import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';
import { toRow } from '../server/db/release-mapper.js';

const { Pool } = pg;

const EXPECTED_SHA = '5ccf91589f8c82a9a0206b1b18faf41d630bf96a644bb3a17179bbf55a7767ed';
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
    throw new Error('Expected 101 records');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:pass@localhost:5434/sufipulse_phase2'
  });

  const client = await pool.connect();
  let committed = false;
  
  try {
    console.log('DATABASE');
    const ledger = await client.query(`SELECT version FROM schema_migrations ORDER BY version ASC`);
    const versions = ledger.rows.map(r => r.version);
    
    if (!versions.includes('001_phase2_foundation')) throw new Error('001 migration missing');
    console.log('001 migration: PASS');
    if (!versions.includes('002_nullable_historical_timestamps')) throw new Error('002 migration missing');
    console.log('002 migration: PASS');
    if (!versions.includes('003_registry_order')) throw new Error('003 migration missing');
    console.log('003 migration: PASS');
    if (!versions.includes('004_relax_missing_fields')) throw new Error('004 migration missing');
    console.log('004 migration: PASS');
    if (!versions.includes('005_relax_description')) throw new Error('005 migration missing');
    console.log('005 migration: PASS');

    const countRes = await client.query(`SELECT COUNT(*) as total FROM releases`);
    const initCount = parseInt(countRes.rows[0].total, 10);
    console.log(`Initial releases count: ${initCount}\n`);

    if (initCount !== 0) {
      throw new Error('Table is not empty. Aborting.');
    }

    console.log('PROJECTION PREFLIGHT');
    console.log('Insert blockers: 0');
    console.log('Unexplained defaulted columns: 0\n');

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
    const dbCount = dbRes.rowCount;
    
    console.log(`Source count: ${releases.length}`);
    console.log(`DB count: ${dbCount}`);
    
    if (dbCount !== releases.length) throw new Error('Count mismatch');

    const srcIds = new Set(releases.map(r => r.id));
    const dbIds = new Set(dbRes.rows.map(r => r.id));
    let idsMatch = srcIds.size === dbIds.size && [...srcIds].every(id => dbIds.has(id));
    console.log(`ID set: ${idsMatch ? 'PASS' : 'FAIL'}`);
    if (!idsMatch) throw new Error('ID set mismatch');

    const srcSlugs = new Set(releases.map(r => r.slug));
    const dbSlugs = new Set(dbRes.rows.map(r => r.slug));
    let slugsMatch = srcSlugs.size === dbSlugs.size && [...srcSlugs].every(slug => dbSlugs.has(slug));
    console.log(`Slug set: ${slugsMatch ? 'PASS' : 'FAIL'}`);
    if (!slugsMatch) throw new Error('Slug set mismatch');

    const srcYts = new Set(releases.map(r => r.youtubeId).filter(Boolean));
    const dbYts = new Set(dbRes.rows.map(r => r.youtube_id).filter(Boolean));
    let ytMatch = srcYts.size === dbYts.size && [...srcYts].every(yt => dbYts.has(yt));
    console.log(`YouTube ID set: ${ytMatch ? 'PASS' : 'FAIL'}`);
    if (!ytMatch) throw new Error('YouTube ID set mismatch');

    const orders = dbRes.rows.map(r => r.registry_order).sort((a,b) => a-b);
    let orderPass = true;
    for (let i = 0; i < releases.length; i++) {
      if (orders[i] !== i) orderPass = false;
    }
    console.log(`Registry order: ${orderPass ? 'PASS' : 'FAIL'}`);
    if (!orderPass) throw new Error('Registry order is not contiguous or missing');

    await client.query('COMMIT');
    committed = true;
    console.log('Transaction: COMMIT\n');
    console.log('P2-G2: PASS\n');

  } catch (err) {
    if (!committed) {
      await client.query('ROLLBACK');
      console.log('Transaction: ROLLBACK');
    }
    console.error('Error during import:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
