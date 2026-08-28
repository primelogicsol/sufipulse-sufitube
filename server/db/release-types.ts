import { CMSRelease } from '@/lib/cms-storage';

export type PersistedCMSRelease = Omit<CMSRelease, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

export interface ReleaseProjection {
  id: string;
  slug: string;
  title: string;
  canonicalTitle: string | null;
  canonicalStatus: string | null;
  governanceOrigin: string | null;
  canonicalThumbnail: string | null;
  thumbnailUrl: string | null;
  youtubeId: string | null;
  youtubeTitle: string | null;
  youtubeThumbnailUrl: string | null;
  status: string;
  visibility: string;
  format: string;
  source: string;
  contentReadinessState: string | null;
  releaseDate: string | null;
  publishedAt: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  likeCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ReleaseRow {
  id: string;
  slug: string;
  title: string;
  canonical_title: string | null;
  canonical_status: string | null;
  governance_origin: string | null;
  canonical_thumbnail: string | null;
  thumbnail_url: string | null;
  youtube_id: string | null;
  youtube_title: string | null;
  youtube_thumbnail_url: string | null;
  status: string;
  visibility: string;
  format: string;
  source: string;
  content_readiness_state: string | null;
  release_date: Date | null;
  published_at: Date | null;
  duration_seconds: number | null;
  view_count: number | null;
  like_count: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  db_created_at: Date;
  db_updated_at: Date;
  payload: any;
}
