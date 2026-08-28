import { PostgresReleaseRepository } from '../server/db/release-repository.js';
import { projectRelease, toRow } from '../server/db/release-mapper.js';
// We'll stub the pool directly
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
  console.log('=== P2 Repository Contract Test ===\n');
  const pool = new MockPool();
  const repo = new PostgresReleaseRepository(pool);

  // 1. type != format, handle 'all'
  await repo.query({
    status: 'published',
    governance: 'all',
    format: 'all',
    duration: 'all',
    year: 'all',
    type: 'video'
  });
  
  const q1 = pool.queries[pool.queries.length - 1];
  console.log('Test 1: handle "all" + type filter');
  if (q1.sql.includes('governance_origin = ')) throw new Error('Governance "all" not ignored');
  if (q1.sql.includes('format = ANY')) throw new Error('Format "all" not ignored');
  if (q1.sql.includes('duration_seconds')) throw new Error('Duration "all" not ignored');
  if (q1.sql.includes('EXTRACT(YEAR')) throw new Error('Year "all" not ignored');
  if (!q1.sql.includes('release_type = ANY')) throw new Error('Type filter missing');
  console.log('PASS\n');

  // 2. phrase search
  await repo.query({ search: 'Mariam Bennett' });
  const q2 = pool.queries[pool.queries.length - 1];
  console.log('Test 2: Phrase Search');
  if (!q1.sql.includes('AND (')) {
    if (!q2.values.includes('%mariam bennett%')) throw new Error('Did not preserve exact phrase search');
  }
  console.log('PASS\n');

  // 3. Sorting (newest, oldest, popular) + registry_order stable ties
  await repo.query({ sort: 'newest' });
  let sortQ = pool.queries[pool.queries.length - 1];
  if (!sortQ.sql.includes('ORDER BY COALESCE(release_date, created_at) DESC NULLS LAST, registry_order ASC')) throw new Error('newest sorting wrong');
  
  await repo.query({ sort: 'oldest' });
  sortQ = pool.queries[pool.queries.length - 1];
  if (!sortQ.sql.includes('ORDER BY COALESCE(release_date, created_at) ASC NULLS LAST, registry_order ASC')) throw new Error('oldest sorting wrong');
  
  await repo.query({ sort: 'popular' });
  sortQ = pool.queries[pool.queries.length - 1];
  if (!sortQ.sql.includes('ORDER BY COALESCE(view_count, 0) DESC, registry_order ASC')) throw new Error('popular sorting wrong');
  
  console.log('Test 3: Sorting semantics');
  console.log('PASS\n');

  // 4. Pagination (count, pageSize, offset, facets)
  const res = await repo.query({ page: 2, pageSize: 12, facets: true });
  console.log('Test 4: Pagination contract');
  if (res.count === undefined || res.pageSize !== 12 || res.facets?.years === undefined) {
    throw new Error('Pagination return interface mismatch');
  }
  console.log('PASS\n');
  
  console.log('RESULT:\nREPOSITORY CONTRACT PASS');
}

// Ensure TypeScript is compiled before running this, or we run it via tsx.
// Since we are running via node, let's just assert we run it compiled.
run().catch(e => {
  console.error(e);
  process.exit(1);
});
