// lib/cms-types.ts
// CMS Type Definitions - Used by both frontend and backend

export interface Release {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  release_id?: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'unpublished' | 'archived';
  workflow_stage?: string;
  release_type?: string;
  category?: string;
  badge_text?: string;
  release_date?: string;
  published_at?: string;
  unpublished_at?: string;
  archived_at?: string;
  youtube_id?: string;
  youtube_url?: string;
  primary_video_url?: string;
  thumbnail_url?: string;
  poster_url?: string;
  chorus_vocalists?: string[];
  duration_seconds?: number;
  duration_formatted?: string;
  view_count: number;
  like_count: number;
  show_views: boolean;
  show_likes: boolean;
  enable_lyrics: boolean;
  enable_commentary: boolean;
  enable_sponsors: boolean;
  enable_adoption: boolean;
  enable_credits: boolean;
  // Subtitle timeline and multilingual cue text
  subtitle_cues?: SubtitleCue[];
  subtitle_translations?: Record<string, Record<string, string>>;
  subtitle_language_statuses?: Record<string, SubtitleLanguageStatus>;
  master_timing_version?: number;
  lyrics_structure?: Record<string, Array<{
    id: string;
    type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'hook' | 'refrain' | 'outro' | 'other';
    heading?: string;
    lines: string[];
    order?: number;
    is_published?: boolean;
  }>>;
  description?: string;
  featured?: boolean;
  featured_image_url?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type SubtitleLanguageStatus =
  | 'draft'
  | 'in_translation'
  | 'under_review'
  | 'verified'
  | 'published'
  | 'archived';

export interface SubtitleCue {
  id: string;
  cue_number: number;
  start_time: string; // HH:MM:SS.mmm
  end_time: string; // HH:MM:SS.mmm
  line_ref?: string;
  source_type?: 'manual' | 'srt' | 'vtt' | 'ass';
  active?: boolean;
}

export interface ReleaseVersion {
  id: string;
  release_id: string;
  version_number: number;
  status?: string;
  snapshot: Release;
  change_summary?: string;
  changed_fields?: string[];
  changed_by?: string;
  created_at?: string;
}

export interface ReleaseCredit {
  id: string;
  release_id: string;
  role: string;
  name: string;
  bio?: string;
  image_url?: string;
  social_links?: Record<string, string>;
  order?: number;
  created_at?: string;
}

export interface ReleaseLyrics {
  id: string;
  release_id: string;
  language: string;
  title?: string;
  lyrics_text: string;
  transliteration?: string;
  translation?: string;
  metadata?: Record<string, any>;
  order?: number;
  created_at?: string;
}

export interface ReleaseCommentary {
  id: string;
  release_id: string;
  title: string;
  content: string;
  author?: string;
  link_url?: string;
  is_featured?: boolean;
  order?: number;
  created_at?: string;
}

export interface ReleaseSponsor {
  id: string;
  release_id: string;
  sponsor_name: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  sponsor_type?: string;
  order?: number;
  created_at?: string;
}

export interface ReleaseMedia {
  id: string;
  release_id?: string;
  file_name: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  file_size: number;
  file_url: string;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
  uploaded_by?: string;
  created_at?: string;
}

export interface ReleaseMetadata {
  id: string;
  release_id: string;
  key: string;
  value: any;
  metadata_type?: string;
  created_at?: string;
}

export interface BulkImport {
  id: string;
  import_type: 'releases' | 'credits' | 'lyrics' | 'media' | 'commentaries' | 'sponsors';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name?: string;
  file_url?: string;
  total_items: number;
  successful_items: number;
  failed_items: number;
  error_log?: string;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at?: string;
}

export interface BulkImportItem {
  id: string;
  bulk_import_id: string;
  row_number: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: Record<string, any>;
  error_message?: string;
  created_at?: string;
}

export interface MediaLibrary {
  id: string;
  file_name: string;
  file_type: 'image' | 'video' | 'audio' | 'document';
  file_size: number;
  file_url: string;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
  uploaded_by?: string;
  usage_count?: number;
  last_used_at?: string;
  created_at?: string;
}

export interface Role {
  id: string;
  role_name: string;
  role_slug: string;
  description?: string;
  hierarchy_level: number;
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  role_id: string;
  resource: string;
  action: string;
  granted: boolean;
  created_at?: string;
}

export interface ReleaseActionLog {
  id: string;
  release_id: string;
  action: string;
  old_value?: any;
  new_value?: any;
  action_by?: string;
  created_at?: string;
}
