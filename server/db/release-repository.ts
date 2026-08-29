import { Pool, PoolClient } from 'pg';
import { PersistedCMSRelease, ReleaseRow } from './release-types';
import { toRow, fromRow } from './release-mapper';
import { db } from './pool';

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
  pageSize?: number;
  offset?: number;
  limit?: number;
  facets?: boolean;
  paginate?: boolean;
  requirePublicEligibility?: boolean;
}

export interface ReleaseQueryResult {
  items: PersistedCMSRelease[];
  count: number;
  page: number;
  pageSize: number;
  limit?: number;
  totalPages: number;
  facets?: any;
}

export class PostgresReleaseRepository {
  private pool: Pool;

  constructor(injectedPool?: Pool) {
    this.pool = injectedPool ?? db;
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
      ) RETURNING *
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
    const res = await this.pool.query<ReleaseRow>(sql, values);
    return fromRow(res.rows[0]);
  }

    async bulkUpsert(releases: PersistedCMSRelease[]): Promise<PersistedCMSRelease[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const results: PersistedCMSRelease[] = [];
      
      for (const release of releases) {
        const row = toRow(release);
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
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
            $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48
          )
          ON CONFLICT (id) DO UPDATE SET
            slug = EXCLUDED.slug, title = EXCLUDED.title, canonical_title = EXCLUDED.canonical_title, canonical_status = EXCLUDED.canonical_status, governance_origin = EXCLUDED.governance_origin, metadata_status = EXCLUDED.metadata_status,
            canonical_thumbnail = EXCLUDED.canonical_thumbnail, thumbnail_url = EXCLUDED.thumbnail_url, youtube_id = EXCLUDED.youtube_id, youtube_title = EXCLUDED.youtube_title, youtube_thumbnail_url = EXCLUDED.youtube_thumbnail_url,
            youtube_url = EXCLUDED.youtube_url, youtube_channel_id = EXCLUDED.youtube_channel_id, youtube_channel_url = EXCLUDED.youtube_channel_url, youtube_playlist_id = EXCLUDED.youtube_playlist_id,
            status = EXCLUDED.status, visibility = EXCLUDED.visibility, format = EXCLUDED.format, release_type = EXCLUDED.release_type, category = EXCLUDED.category, source = EXCLUDED.source, content_readiness_state = EXCLUDED.content_readiness_state, web_only = EXCLUDED.web_only,
            description = EXCLUDED.description, writer_name = EXCLUDED.writer_name, writer_name_urdu = EXCLUDED.writer_name_urdu, vocalist_name = EXCLUDED.vocalist_name, vocalist_name_urdu = EXCLUDED.vocalist_name_urdu, producer_name = EXCLUDED.producer_name, tags = EXCLUDED.tags,
            release_date = EXCLUDED.release_date, published_at = EXCLUDED.published_at, duration_seconds = EXCLUDED.duration_seconds, duration_formatted = EXCLUDED.duration_formatted, view_count = EXCLUDED.view_count, like_count = EXCLUDED.like_count,
            available_languages = EXCLUDED.available_languages, default_language = EXCLUDED.default_language, enable_lyrics = EXCLUDED.enable_lyrics, enable_commentary = EXCLUDED.enable_commentary, enable_sponsors = EXCLUDED.enable_sponsors, enable_adoption = EXCLUDED.enable_adoption, enable_credits = EXCLUDED.enable_credits,
            created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at, registry_order = EXCLUDED.registry_order, payload = EXCLUDED.payload
          RETURNING *;
        `;
        
        const res = await client.query<ReleaseRow>(sql, values);
        results.push(fromRow(res.rows[0]));
      }
      
      await client.query('COMMIT');
      return results;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  
  async update(id: string, release: PersistedCMSRelease): Promise<PersistedCMSRelease> {
    const row = toRow(release);
    const sql = `
      UPDATE releases SET
        slug = $2, title = $3, canonical_title = $4, canonical_status = $5, governance_origin = $6, metadata_status = $7,
        canonical_thumbnail = $8, thumbnail_url = $9, youtube_id = $10, youtube_title = $11, youtube_thumbnail_url = $12,
        youtube_url = $13, youtube_channel_id = $14, youtube_channel_url = $15, youtube_playlist_id = $16,
        status = $17, visibility = $18, format = $19, release_type = $20, category = $21, source = $22, content_readiness_state = $23, web_only = $24,
        description = $25, writer_name = $26, writer_name_urdu = $27, vocalist_name = $28, vocalist_name_urdu = $29, producer_name = $30, tags = $31,
        release_date = $32, published_at = $33, duration_seconds = $34, duration_formatted = $35, view_count = $36, like_count = $37,
        available_languages = $38, default_language = $39, enable_lyrics = $40, enable_commentary = $41, enable_sponsors = $42, enable_adoption = $43, enable_credits = $44,
        created_at = $45, updated_at = $46, registry_order = $47, payload = $48,
        db_updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const values = [
      id, row.slug, row.title, row.canonical_title, row.canonical_status, row.governance_origin, row.metadata_status,
      row.canonical_thumbnail, row.thumbnail_url, row.youtube_id, row.youtube_title, row.youtube_thumbnail_url,
      row.youtube_url, row.youtube_channel_id, row.youtube_channel_url, row.youtube_playlist_id,
      row.status, row.visibility, row.format, row.release_type, row.category, row.source, row.content_readiness_state, row.web_only,
      row.description, row.writer_name, row.writer_name_urdu, row.vocalist_name, row.vocalist_name_urdu, row.producer_name, row.tags,
      row.release_date, row.published_at, row.duration_seconds, row.duration_formatted, row.view_count, row.like_count,
      row.available_languages, row.default_language, row.enable_lyrics, row.enable_commentary, row.enable_sponsors, row.enable_adoption, row.enable_credits,
      row.created_at, row.updated_at, row.registry_order, row.payload
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

    if (query.requirePublicEligibility) {
      whereSql += ` AND visibility = 'public' AND (release_lifecycle NOT IN ('upcoming', 'teaser_live', 'premiere_scheduled') OR premiere_visibility = 'public')`;
    }

    // Status
    if (query.status && query.status !== 'all') {
      const statuses = Array.isArray(query.status) ? query.status : [query.status];
      whereSql += ` AND status = ANY($${paramIndex++})`;
      values.push(statuses);
    }

    // Format
    if (query.format && query.format !== 'all') {
      const formats = Array.isArray(query.format) ? query.format : [query.format];
      whereSql += ` AND format = ANY($${paramIndex++})`;
      values.push(formats);
    }
    
    // Type (Release Type)
    if (query.type && query.type !== 'all') {
      const types = Array.isArray(query.type) ? query.type : [query.type];
      whereSql += ` AND release_type = ANY($${paramIndex++})`;
      values.push(types);
    }

    // Governance
    const gov = query.governance || query.govType;
    if (gov && gov !== 'all') {
      whereSql += ` AND governance_origin = $${paramIndex++}`;
      values.push(gov);
    }

    // Duration
    if (query.duration && query.duration !== 'all') {
      if (query.duration === 'default') {
        whereSql += ` AND duration_seconds >= 180 AND format IS DISTINCT FROM 'short'`;
      } else if (query.duration === 'short') {
        whereSql += ` AND duration_seconds > 0 AND duration_seconds < 180 AND format IS DISTINCT FROM 'short'`;
      } else if (query.duration === 'standard') {
        whereSql += ` AND duration_seconds >= 180 AND duration_seconds <= 480 AND format IS DISTINCT FROM 'short'`;
      } else if (query.duration === 'long') {
        whereSql += ` AND duration_seconds > 480 AND format IS DISTINCT FROM 'short'`;
      }
    }

    // Year
    if (query.year && query.year.toLowerCase() !== 'all') {
      whereSql += ` AND EXTRACT(YEAR FROM (CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END)) = $${paramIndex++}`;
      values.push(parseInt(query.year, 10));
    }

    // Search
    const search = (query.search || query.q || '').trim().toLowerCase();
    if (search) {
      whereSql += ` AND (
        COALESCE(NULLIF(canonical_title, ''), title, '') ILIKE $${paramIndex} OR
        COALESCE(NULLIF(youtube_title, ''), NULLIF(payload->'youtubeStats'->>'title', ''), '') ILIKE $${paramIndex} OR
        slug ILIKE $${paramIndex} OR
        youtube_id ILIKE $${paramIndex} OR
        description ILIKE $${paramIndex} OR
        COALESCE(vocalist_name, '') || ' ' || COALESCE(vocalist_name_urdu, '') ILIKE $${paramIndex} OR
        COALESCE(writer_name, '') || ' ' || COALESCE(writer_name_urdu, '') ILIKE $${paramIndex} OR
        array_to_string(tags, ' ') ILIKE $${paramIndex}
      )`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    // Default base order matches cmsStorage.ts sortReleases('all') which prefers publishedAt
    let orderBy = `(CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST`;
    
    if (query.sort === 'newest' || !query.sort) {
      // route.ts specifically overrides newest to prefer releaseDate and strips time tiebreaker
      orderBy = `(CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST`;
    } else if (query.sort === 'oldest') {
      // route.ts specifically overrides oldest to prefer releaseDate
      orderBy = `(CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) ASC NULLS LAST, registry_order ASC NULLS LAST`;
    } else if (query.sort === 'popular') {
      // route.ts sorts by viewCount, relying on stable sort from cmsStorage.ts (prefers publishedAt)
      orderBy = `COALESCE(view_count, 0) DESC, (CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST`;
    } else if (query.sort === 'default') {
      // sort=default ignores route.ts sorting and relies entirely on cmsStorage.ts sortReleases('all')
      orderBy = `(CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) DESC NULLS LAST, registry_order ASC NULLS LAST`;
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.pageSize || query.limit || 12;
    const computedOffset = (page - 1) * limit;
    const offset = query.offset && query.offset > 0 ? query.offset : computedOffset;

    const countSql = `SELECT COUNT(*) as total FROM releases WHERE ${whereSql}`;
    const countRes = await this.pool.query(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    let dataSql = `SELECT * FROM releases WHERE ${whereSql} ORDER BY ${orderBy}`;
    if (query.paginate !== false) {
      dataSql += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const dataRes = await this.pool.query<ReleaseRow>(dataSql, values);
    
    let facets = undefined;
    if (query.facets) {
      const facetSql = `
        SELECT EXTRACT(YEAR FROM (CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END)) as year, COUNT(*) as count 
        FROM releases 
        WHERE ${whereSql} AND (CASE WHEN governance_origin = 'native_governed' THEN COALESCE(published_at, release_date, created_at) ELSE COALESCE(release_date, published_at, created_at) END) IS NOT NULL
        GROUP BY year 
        ORDER BY year DESC
      `;
      const facetRes = await this.pool.query(facetSql, values);
      facets = {
        years: facetRes.rows.map(r => parseInt(r.year.toString(), 10))
      };
    }

    return {
      items: dataRes.rows.map(row => fromRow(row)),
      count: total,
      page: query.paginate === false ? 1 : page,
      pageSize: query.paginate === false ? total : limit,
      limit: query.paginate === false ? undefined : limit,
      totalPages: query.paginate === false ? 1 : totalPages,
      facets
    };
  }
}
