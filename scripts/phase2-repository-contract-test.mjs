import { PostgresReleaseRepository } from '../server/db/release-repository.js';
import { projectRelease, toRow } from '../server/db/release-mapper.js';

class MockPool {
  queries = [];
  async query(sql, values) {
    this.queries.push({ sql, values });
    if (sql.includes('as total FROM')) {
      return { rowCount: 1, rows: [{ total: '0' }] };
    }
    if (sql.includes('GROUP BY year')) {
      return { rowCount: 1, rows: [{ year: 2026, count: '10' }] };
    }
    return { rowCount: 0, rows: [] };
  }
}

async function run() {
  console.log('=== P2 Repository Contract Test (Adversarial) ===\n');
  const pool = new MockPool();
  const repo = new PostgresReleaseRepository(pool);

  // 1. Phrase Search unconditional test & artists
  await repo.query({ search: 'Mariam Bennett' });
  let q = pool.queries[pool.queries.length - 1];
  console.log('Test 1: Phrase Search & Artist search logic');
  if (!q.values.includes('%mariam bennett%')) throw new Error('Did not preserve exact phrase search');
  if (!q.sql.includes('COALESCE(NULLIF(canonical_title, \'\'), title, \'\') ILIKE $')) throw new Error('canonicalTitle fallback incorrect');
  if (!q.sql.includes("COALESCE(NULLIF(youtube_title, ''), NULLIF(payload->'youtubeStats'->>'title', ''), '') ILIKE $")) throw new Error('youtubeStats fallback incorrect');
  if (!q.sql.includes("COALESCE(writer_name, '') || ' ' || COALESCE(writer_name_urdu, '') ILIKE $")) throw new Error('writer Urdu search missing');
  if (!q.sql.includes("COALESCE(vocalist_name, '') || ' ' || COALESCE(vocalist_name_urdu, '') ILIKE $")) throw new Error('vocalist Urdu search missing');
  console.log('PASS\n');

  // 2. Duration=default with format NULL
  await repo.query({ duration: 'default' });
  q = pool.queries[pool.queries.length - 1];
  console.log('Test 2: Duration=default with NULL-safe format');
  if (!q.sql.includes("format IS DISTINCT FROM 'short'")) throw new Error('duration=default not NULL-safe');
  console.log('PASS\n');

  // 3. Sorting semantics
  await repo.query({});
  q = pool.queries[pool.queries.length - 1];
  console.log('Test 3: Sort semantics');
  if (!q.sql.includes('ORDER BY COALESCE(release_date, created_at) DESC NULLS LAST, registry_order ASC')) throw new Error('sort absent missing newest default');
  
  await repo.query({ sort: 'default' });
  q = pool.queries[pool.queries.length - 1];
  if (!q.sql.includes('ORDER BY registry_order ASC NULLS LAST')) throw new Error('sort=default missing registry_order override');
  console.log('PASS\n');

  // 4. Pagination contract (pageSize=12 default, explicit offset)
  let res = await repo.query({ page: 2 });
  q = pool.queries[pool.queries.length - 1]; 
  console.log('Test 4: Pagination defaults');
  if (res.pageSize !== 12) throw new Error(`Default pageSize is not 12, got ${res.pageSize}`);
  if (!q.sql.includes('LIMIT 12 OFFSET 12')) {
    console.error('SQL WAS:', q.sql);
    throw new Error('Computed offset for page 2 incorrect');
  }
  
  res = await repo.query({ offset: 42 });
  q = pool.queries[pool.queries.length - 1];
  if (!q.sql.includes('LIMIT 12 OFFSET 42')) throw new Error('Explicit offset ignored');
  console.log('PASS\n');

  // 5. Mapper Artists Test
  console.log('Test 5: Mapper Artists fallback logic');
  // top-level writer string
  let mapped = projectRelease({ writer: 'John Doe', vocalist: 'Jane Doe' });
  if (mapped.writerName !== 'John Doe' || mapped.vocalistName !== 'Jane Doe') throw new Error('Legacy artist string not mapped');
  
  // top-level writer object
  mapped = projectRelease({ writer: { name: 'John Obj', nameUrdu: 'UrduJohn' } });
  if (mapped.writerName !== 'John Obj' || mapped.writerNameUrdu !== 'UrduJohn') throw new Error('Artist object not mapped');
  
  console.log('PASS\n');
  
  console.log('RESULT:\nREPOSITORY CONTRACT PASS');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
