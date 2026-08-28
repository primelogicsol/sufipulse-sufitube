import { PersistedCMSRelease, ReleaseProjection, ReleaseRow } from './release-types';

export function projectRelease(release: PersistedCMSRelease): ReleaseProjection {
  return {
    id: release.id,
    slug: release.slug,

    title: release.title,
    canonicalTitle: release.canonicalTitle ?? null,

    canonicalStatus: release.canonicalStatus ?? null,
    governanceOrigin: release.governanceOrigin ?? release.govType ?? null,

    canonicalThumbnail: release.canonicalThumbnail ?? null,
    thumbnailUrl: release.thumbnailUrl ?? null,

    youtubeId: release.youtubeId ?? null,
    youtubeTitle: release.youtubeTitle ?? null,
    youtubeThumbnailUrl: release.youtubeThumbnailUrl ?? null,

    status: release.status,
    visibility: release.visibility || 'public',
    format: release.format || 'video',
    source: release.source || 'manual',

    contentReadinessState: release.contentReadinessState ?? null,

    releaseDate: release.releaseDate ?? null,
    publishedAt: release.publishedAt ?? null,

    durationSeconds: release.durationSeconds ?? null,
    viewCount: release.viewCount ?? null,
    likeCount: release.likeCount ?? null,

    createdAt: release.createdAt ?? null,
    updatedAt: release.updatedAt ?? null,
  };
}

export function toRow(release: PersistedCMSRelease): Omit<ReleaseRow, 'db_created_at' | 'db_updated_at'> {
  const p = projectRelease(release);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    canonical_title: p.canonicalTitle,
    canonical_status: p.canonicalStatus,
    governance_origin: p.governanceOrigin,
    canonical_thumbnail: p.canonicalThumbnail,
    thumbnail_url: p.thumbnailUrl,
    youtube_id: p.youtubeId,
    youtube_title: p.youtubeTitle,
    youtube_thumbnail_url: p.youtubeThumbnailUrl,
    status: p.status,
    visibility: p.visibility,
    format: p.format,
    source: p.source,
    content_readiness_state: p.contentReadinessState,
    
    release_date: p.releaseDate ? new Date(p.releaseDate) : null,
    published_at: p.publishedAt ? new Date(p.publishedAt) : null,
    
    duration_seconds: p.durationSeconds,
    view_count: p.viewCount,
    like_count: p.likeCount,
    
    created_at: p.createdAt ? new Date(p.createdAt) : null,
    updated_at: p.updatedAt ? new Date(p.updatedAt) : null,
    
    payload: structuredClone(release),
  };
}

export function fromRow(row: ReleaseRow): PersistedCMSRelease {
  // Rely purely on the exact preserved payload, do not reconstruct from columns
  // This preserves exact original representation of undefined vs null etc.
  return structuredClone(row.payload);
}
