const pg = require('pg');
const pool = new pg.Pool({connectionString: "postgres://postgres:pass@localhost:5434/sufipulse_phase2"});

async function go() {
  const q = `
    SELECT id, release_date, created_at, registry_order 
    FROM releases 
    WHERE COALESCE(NULLIF(canonical_title, ''), title, '') ILIKE '%qawwali%' 
       OR COALESCE(NULLIF(youtube_title, ''), NULLIF(payload->'youtubeStats'->>'title', ''), '') ILIKE '%qawwali%'
       OR slug ILIKE '%qawwali%'
       OR youtube_id ILIKE '%qawwali%'
       OR description ILIKE '%qawwali%'
       OR COALESCE(vocalist_name, '') || ' ' || COALESCE(vocalist_name_urdu, '') ILIKE '%qawwali%'
       OR COALESCE(writer_name, '') || ' ' || COALESCE(writer_name_urdu, '') ILIKE '%qawwali%'
       OR array_to_string(tags, ' ') ILIKE '%qawwali%'
    ORDER BY COALESCE(release_date, created_at) DESC NULLS LAST, registry_order ASC NULLS LAST
  `;
  const res = await pool.query(q);
  console.log('Postgres:', res.rows.map(r => r.id));

  const fs = require('fs');
  const d = JSON.parse(fs.readFileSync('.phase2/reconciled-cms-releases.json'));
  d.forEach((x, i) => x._r = i);
  const qaw = d.filter(r => JSON.stringify(r).toLowerCase().includes('qawwali'));
  qaw.sort((a,b) => {
     let da = new Date(a.releaseDate || a.createdAt).getTime();
     let db = new Date(b.releaseDate || b.createdAt).getTime();
     if (da === db) return a._r - b._r;
     return db - da;
  });
  console.log('JS:', qaw.map(r => r.id));
  pool.end();
}
go();
