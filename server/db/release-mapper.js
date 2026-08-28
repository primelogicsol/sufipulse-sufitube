"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRelease = projectRelease;
exports.toRow = toRow;
exports.fromRow = fromRow;
function projectRelease(release) {
    return {
        id: release.id,
        slug: release.slug,
        title: release.title,
        canonicalTitle: release.canonicalTitle ?? null,
        canonicalStatus: release.canonicalStatus ?? null,
        governanceOrigin: release.governanceOrigin ?? release.govType ?? null,
        metadataStatus: release.metadataStatus ?? null,
        canonicalThumbnail: release.canonicalThumbnail ?? null,
        thumbnailUrl: release.thumbnailUrl ?? null,
        youtubeId: release.youtubeId ?? null,
        youtubeTitle: release.youtubeTitle ?? null,
        youtubeThumbnailUrl: release.youtubeThumbnailUrl ?? null,
        youtubeUrl: release.youtubeUrl ?? null,
        youtubeChannelId: release.youtubeChannelId ?? null,
        youtubeChannelUrl: release.youtubeChannelUrl ?? null,
        youtubePlaylistId: release.youtubePlaylistId ?? null,
        status: release.status || 'published',
        visibility: release.visibility || 'public',
        format: release.format || (release.durationSeconds <= 60 ? 'short' : 'video'),
        releaseType: release.releaseType || 'studio-release',
        category: release.category ?? null,
        source: release.source ?? null,
        contentReadinessState: release.contentReadinessState ?? null,
        webOnly: release.webOnly ?? null,
        description: release.description ?? null,
        writerName: typeof release.writer === 'string' ? release.writer : (release.writer?.name ?? null),
        writerNameUrdu: typeof release.writer === 'string' ? null : (release.writer?.nameUrdu ?? null),
        vocalistName: typeof release.vocalist === 'string' ? release.vocalist : (release.vocalist?.name ?? null),
        vocalistNameUrdu: typeof release.vocalist === 'string' ? null : (release.vocalist?.nameUrdu ?? null),
        producerName: release.producer?.name ?? null,
        tags: Array.isArray(release.tags) ? release.tags : null,
        releaseDate: (release.releaseDate || release.release_date) ?? null,
        publishedAt: (release.publishedAt || release.published_at) ?? null,
        durationSeconds: release.durationSeconds ?? null,
        durationFormatted: release.durationFormatted ?? null,
        viewCount: release.viewCount ?? null,
        likeCount: release.likeCount ?? null,
        availableLanguages: Array.isArray(release.availableLanguages) ? release.availableLanguages : null,
        defaultLanguage: release.defaultLanguage ?? null,
        enableLyrics: release.enableLyrics ?? null,
        enableCommentary: release.enableCommentary ?? null,
        enableSponsors: release.enableSponsors ?? null,
        enableAdoption: release.enableAdoption ?? null,
        enableCredits: release.enableCredits ?? null,
        createdAt: (release.createdAt || release.created_at) ?? null,
        updatedAt: (release.updatedAt || release.updated_at) ?? null,
        registryOrder: release.registryOrder ?? null,
    };
}
function toRow(release) {
    const p = projectRelease(release);
    return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        canonical_title: p.canonicalTitle,
        canonical_status: p.canonicalStatus,
        governance_origin: p.governanceOrigin,
        metadata_status: p.metadataStatus,
        canonical_thumbnail: p.canonicalThumbnail,
        thumbnail_url: p.thumbnailUrl,
        youtube_id: p.youtubeId,
        youtube_title: p.youtubeTitle,
        youtube_thumbnail_url: p.youtubeThumbnailUrl,
        youtube_url: p.youtubeUrl,
        youtube_channel_id: p.youtubeChannelId,
        youtube_channel_url: p.youtubeChannelUrl,
        youtube_playlist_id: p.youtubePlaylistId,
        status: p.status,
        visibility: p.visibility,
        format: p.format,
        release_type: p.releaseType,
        category: p.category,
        source: p.source,
        content_readiness_state: p.contentReadinessState,
        web_only: p.webOnly,
        description: p.description,
        writer_name: p.writerName,
        writer_name_urdu: p.writerNameUrdu,
        vocalist_name: p.vocalistName,
        vocalist_name_urdu: p.vocalistNameUrdu,
        producer_name: p.producerName,
        tags: p.tags,
        release_date: p.releaseDate ? new Date(p.releaseDate) : null,
        published_at: (p.publishedAt || release.published_at) ? new Date(p.publishedAt || release.published_at) : null,
        duration_seconds: p.durationSeconds,
        duration_formatted: p.durationFormatted,
        view_count: p.viewCount,
        like_count: p.likeCount,
        available_languages: p.availableLanguages,
        default_language: p.defaultLanguage,
        enable_lyrics: p.enableLyrics,
        enable_commentary: p.enableCommentary,
        enable_sponsors: p.enableSponsors,
        enable_adoption: p.enableAdoption,
        enable_credits: p.enableCredits,
        created_at: (p.createdAt || release.created_at) ? new Date(p.createdAt || release.created_at) : null,
        updated_at: (p.updatedAt || release.updated_at) ? new Date(p.updatedAt || release.updated_at) : null,
        registry_order: p.registryOrder,
        payload: structuredClone(release),
    };
}
function fromRow(row) {
    // Rely purely on the exact preserved payload, do not reconstruct from columns
    // This preserves exact original representation of undefined vs null etc.
    const obj = structuredClone(row.payload);
    if (typeof row.registry_order === 'number') {
        obj.registry_order = row.registry_order;
    }
    return obj;
}
