const fs = require('fs');
const file = 'server/db/release-repository.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /async update\(/g;
const newCode = `  async bulkUpsert(releases: PersistedCMSRelease[]): Promise<PersistedCMSRelease[]> {
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
        
        const sql = \`
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
        \`;
        
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
  
  async update(`;

content = content.replace(regex, newCode);
fs.writeFileSync(file, content);
