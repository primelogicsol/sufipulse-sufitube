import { Pool, PoolClient } from 'pg';
import { PersistedCMSRelease, ReleaseRow } from './release-types';
import { toRow, fromRow } from './release-mapper';
import pool from './pool';

export interface ReleaseQuery {
  status?: string | string[];
  type?: string | string[];
  govType?: string;
  governance?: string; // used interchangeably with govType in API
  search?: string;
  q?: string;
  format?: string | string[];
  duration?: string;
  year?: string;
  sort?: string;
  page?: number;
  limit?: number;
  facets?: boolean;
}

export interface ReleaseQueryResult {
  items: PersistedCMSRelease[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: any;
}

export class PostgresReleaseRepository {
  private pool: Pool;

  constructor(injectedPool?: Pool) {
    this.pool = injectedPool || pool;
  }

  async getById(id: string): Promise<PersistedCMSRelease | null> {
    const res = await this.pool.query<ReleaseRow>(`SELECT * FROM releases WHERE id = $1`, [id]);
    if (res.rowCount === 0) return null;
    return fromRow(res.rows[0]);
  }

  async getBySlug(slug: string): Promise<PersistedCMSRelease | null> {
    const res = await this.pool.query<ReleaseRow>(`SELECT * FROM releases WHERE slug = $1`, [slug]);
    if (res.rowCount === 0) return null;
    return fromRow(res.rows[0]);
  }

  async getByYoutubeId(youtubeId: string): Promise<PersistedCMSRelease | null> {
    const res = await this.pool.query<ReleaseRow>(`SELECT * FROM releases WHERE youtube_id = $1`, [youtubeId]);
    if (res.rowCount === 0) return null;
    return fromRow(res.rows[0]);
  }

  async insert(release: PersistedCMSRelease): Promise<PersistedCMSRelease> {
    const row = toRow(release);
    const sql = `
      INSERT INTO releases (
        id, slug, title, canonical_title, canonical_status, governance_origin, 
        canonical_thumbnail, thumbnail_url, youtube_id, youtube_title, youtube_thumbnail_url, 
        status, visibility, format, source, content_readiness_state, 
        release_date, published_at, duration_seconds, view_count, like_count, 
        created_at, updated_at, payload
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *
    `;
    const values = [
      row.id, row.slug, row.title, row.canonical_title, row.canonical_status, row.governance_origin,
      row.canonical_thumbnail, row.thumbnail_url, row.youtube_id, row.youtube_title, row.youtube_thumbnail_url,
      row.status, row.visibility, row.format, row.source, row.content_readiness_state,
      row.release_date, row.published_at, row.duration_seconds, row.view_count, row.like_count,
      row.created_at, row.updated_at, row.payload
    ];
    const res = await this.pool.query<ReleaseRow>(sql, values);
    return fromRow(res.rows[0]);
  }

  async update(id: string, release: PersistedCMSRelease): Promise<PersistedCMSRelease> {
    const row = toRow(release);
    const sql = `
      UPDATE releases SET
        slug = $2, title = $3, canonical_title = $4, canonical_status = $5, governance_origin = $6, 
        canonical_thumbnail = $7, thumbnail_url = $8, youtube_id = $9, youtube_title = $10, youtube_thumbnail_url = $11, 
        status = $12, visibility = $13, format = $14, source = $15, content_readiness_state = $16, 
        release_date = $17, published_at = $18, duration_seconds = $19, view_count = $20, like_count = $21, 
        created_at = $22, updated_at = $23, payload = $24,
        db_updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const values = [
      id, row.slug, row.title, row.canonical_title, row.canonical_status, row.governance_origin,
      row.canonical_thumbnail, row.thumbnail_url, row.youtube_id, row.youtube_title, row.youtube_thumbnail_url,
      row.status, row.visibility, row.format, row.source, row.content_readiness_state,
      row.release_date, row.published_at, row.duration_seconds, row.view_count, row.like_count,
      row.created_at, row.updated_at, row.payload
    ];
    const res = await this.pool.query<ReleaseRow>(sql, values);
    if (res.rowCount === 0) throw new Error('Not found');
    return fromRow(res.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM releases WHERE id = $1`, [id]);
    return res.rowCount !== null && res.rowCount > 0;
  }

  async query(query: ReleaseQuery): Promise<ReleaseQueryResult> {
    let whereSql = `1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    // Status
    if (query.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      whereSql += ` AND status = ANY($${paramIndex++})`;
      values.push(statuses);
    }

    // Format
    let formats = query.format ? (Array.isArray(query.format) ? query.format : [query.format]) : [];
    if (query.type) {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      formats = [...formats, ...types];
    }
    if (formats.length > 0) {
      whereSql += ` AND format = ANY($${paramIndex++})`;
      values.push(formats);
    }

    // Governance
    const gov = query.governance || query.govType;
    if (gov) {
      whereSql += ` AND governance_origin = $${paramIndex++}`;
      values.push(gov);
    }

    // Duration
    if (query.duration) {
      if (query.duration === 'default') {
        whereSql += ` AND duration_seconds >= 180 AND format != 'short'`;
      } else if (query.duration === 'short') {
        whereSql += ` AND duration_seconds > 0 AND duration_seconds < 180`;
      } else if (query.duration === 'standard') {
        whereSql += ` AND duration_seconds >= 180 AND duration_seconds <= 480`;
      } else if (query.duration === 'long') {
        whereSql += ` AND duration_seconds > 480`;
      }
    }

    // Year
    if (query.year) {
      if (query.year.toLowerCase() !== 'all') {
        whereSql += ` AND EXTRACT(YEAR FROM COALESCE(release_date, published_at, created_at)) = $${paramIndex++}`;
        values.push(parseInt(query.year, 10));
      }
    }

    // Search
    const search = query.search || query.q;
    if (search) {
      // Using simple ILIKE for exact P0 parity mapping in this test wrapper
      // Real pg_trgm could be used here. For semantic parity, ILIKE captures the string check.
      const searchTerms = search.toLowerCase().split(' ').filter(t => t.trim().length > 0);
      for (const term of searchTerms) {
        whereSql += ` AND (
          title ILIKE $${paramIndex} OR
          canonical_title ILIKE $${paramIndex} OR
          youtube_title ILIKE $${paramIndex} OR
          slug ILIKE $${paramIndex} OR
          youtube_id ILIKE $${paramIndex} OR
          payload->>'description' ILIKE $${paramIndex} OR
          payload->>'vocalist' ILIKE $${paramIndex} OR
          payload->>'writer' ILIKE $${paramIndex} OR
          payload->'tags'::text ILIKE $${paramIndex}
        )`;
        values.push(\`%\${term}%\`);
        paramIndex++;
      }
    }

    // Sorting
    let orderBy = 'COALESCE(release_date, published_at, created_at) DESC NULLS LAST';
    if (query.sort === 'newest') {
      orderBy = 'COALESCE(release_date, published_at, created_at) DESC NULLS LAST';
    } else if (query.sort === 'oldest') {
      orderBy = 'COALESCE(release_date, published_at, created_at) ASC NULLS LAST';
    } else if (query.sort === 'popular') {
      orderBy = 'view_count DESC NULLS LAST';
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 24;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*) as total FROM releases WHERE ${whereSql}`;
    const countRes = await this.pool.query(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    const dataSql = `SELECT * FROM releases WHERE ${whereSql} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;
    const dataRes = await this.pool.query<ReleaseRow>(dataSql, values);
    
    let facets = undefined;
    if (query.facets) {
      // Fetch year facets
      const facetSql = `
        SELECT EXTRACT(YEAR FROM COALESCE(release_date, published_at, created_at)) as year, COUNT(*) as count 
        FROM releases 
        WHERE ${whereSql} AND COALESCE(release_date, published_at, created_at) IS NOT NULL
        GROUP BY year 
        ORDER BY year DESC
      `;
      const facetRes = await this.pool.query(facetSql, values);
      facets = {
        years: facetRes.rows.map(r => ({
          year: r.year.toString(),
          count: parseInt(r.count, 10)
        }))
      };
    }

    return {
      items: dataRes.rows.map(row => fromRow(row)),
      total,
      page,
      limit,
      totalPages,
      facets
    };
  }
}
