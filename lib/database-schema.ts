/**
 * SufiPulse Database Schema Definitions
 * 
 * Type-safe schema definitions for all database tables.
 * Used with the file-based database system.
 */

/**
 * User Schema
 */
export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string; // bcrypt hash
  role: 'admin' | 'writer' | 'vocalist' | 'producer' | 'literary' | 'studio' | 'user';
  assigned_roles?: string[]; // For users with multiple roles
  is_verified: boolean;
  is_blocked: boolean;
  otp_code?: string;
  otp_expires_at?: string; // ISO date string
  google_id?: string;
  profile_photo?: string; // base64 or URL
  created_at: string;
  updated_at: string;
}

/**
 * Writer Profile Schema
 */
export interface WriterProfile {
  id: string;
  user_id: string;
  full_name: string;
  pen_name?: string;
  country?: string;
  city?: string;
  email: string;
  phone?: string;
  years_writing?: number;
  writing_languages: string[];
  primary_themes?: string[];
  previous_publications?: string;
  sample_work_link?: string;
  acknowledge_peer_review: boolean;
  acknowledge_editorial_control: boolean;
  accept_framework: boolean;
  profile_status: 'pending' | 'approved' | 'revision' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Vocalist Profile Schema
 */
export interface VocalistProfile {
  id: string;
  user_id: string;
  full_name: string;
  stage_name?: string;
  country?: string;
  city?: string;
  email: string;
  phone?: string;
  years_performing?: number;
  vocal_range?: string;
  performance_languages: string[];
  musical_training?: string;
  performance_experience?: string;
  sample_recording_link?: string;
  acknowledge_direction: boolean;
  acknowledge_validation: boolean;
  accept_framework: boolean;
  profile_status: 'pending' | 'approved' | 'revision' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Producer Profile Schema
 */
export interface ProducerProfile {
  id: string;
  user_id: string;
  full_name: string;
  professional_name?: string;
  country?: string;
  city?: string;
  email: string;
  years_experience?: string;
  primary_production_focus: string[];
  primary_tools?: string;
  musical_background?: string;
  portfolio_link?: string;
  worked_structured_production?: boolean;
  willing_defined_sequence?: boolean;
  acknowledge_centralized_control: boolean;
  accept_framework: boolean;
  profile_status: 'pending' | 'approved' | 'revision' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Literary Contributor Profile Schema
 */
export interface LiteraryContributorProfile {
  id: string;
  user_id: string;
  full_name: string;
  professional_name?: string;
  country?: string;
  city?: string;
  email: string;
  years_experience?: number;
  writing_focus: string[];
  languages: string[];
  background?: string;
  portfolio_link?: string;
  worked_editorial_process?: boolean;
  willing_review_process?: boolean;
  acknowledge_editorial_control: boolean;
  accept_framework: boolean;
  profile_status: 'pending' | 'approved' | 'revision' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Studio Profile Schema
 */
export interface StudioProfile {
  id: string;
  user_id: string;
  studio_name: string;
  country?: string;
  city?: string;
  primary_contact_name: string;
  email: string;
  phone?: string;
  years_in_operation?: string;
  previous_work_link?: string;
  agree_centralized_validation: boolean;
  agree_centralized_authorization: boolean;
  recording_capabilities?: string[];
  equipment_overview?: string;
  accept_terms: boolean;
  profile_status: 'pending' | 'approved' | 'revision' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Kalam (Poetry) Schema
 */
export interface Kalam {
  id: string;
  writer_id: string;
  user_id: string;
  title: string;
  content: string;
  language: string;
  themes: string[];
  notes?: string;
  writing_style?: string;
  youtube_content_type?: 'SHORTS' | 'VIDEO_ON_DEMAND' | 'LIVE_STREAM' | 'STORY' | 'UNSPECIFIED';
  format_classification_source?: 'youtube_analytics' | 'channel_surface' | 'dashboard' | 'duration_heuristic';
  status: 'pending' | 'approved' | 'revision' | 'rejected';
  admin_feedback?: string;
  revision_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Sada (Vocal Performance) Schema
 */
export interface Sada {
  id: string;
  vocalist_id: string;
  user_id: string;
  kalam_id?: string;
  title: string;
  recording_link?: string;
  performance_notes?: string;
  language: string;
  performance_style?: string;
  status: 'pending' | 'approved' | 'revision' | 'rejected';
  admin_feedback?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Article Schema
 */
export interface Article {
  id: string;
  contributor_id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Partnership Proposal Schema
 */
export interface PartnershipProposal {
  id: string;
  organization_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  partnership_type: string;
  proposal_details: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * CMS Release Schema
 */
export interface CMSRelease {
  id: string;
  title: string;
  slug: string;
  youtube_id?: string;
  youtube_title?: string;
  youtube_title_variant_a?: string;
  youtube_title_variant_b?: string;
  youtube_title_variant_c?: string;
  youtube_winning_variant?: 'A' | 'B' | 'C' | 'pending';
  youtube_title_last_synced_at?: string;
  youtube_url?: string;
  thumbnail_url?: string;
  description?: string;
  duration_seconds?: number;
  duration_formatted?: string;
  view_count: number;
  like_count: number;
  show_views: boolean;
  show_likes: boolean;
  release_date?: string;
  published_at?: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'unpublished' | 'archived';
  release_type?: string;
  category?: string;
  badge_text?: string;
  writer?: string;
  vocalist?: string;
  producer?: string;
  enable_lyrics: boolean;
  enable_commentary: boolean;
  enable_sponsors: boolean;
  enable_adoption: boolean;
  enable_credits: boolean;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Song Adoption Schema
 */
export interface SongAdoption {
  id: string;
  release_id: string;
  sponsor_name: string;
  sponsor_email: string;
  sponsor_country: string;
  package_name: string;
  budget_amount: number;
  dedication_message?: string;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  payment_provider?: string;
  stripe_session_id?: string;
  google_ads_connected: boolean;
  campaign_status?: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'active' | 'completed';
  admin_notes?: string;
  event_log: Array<{
    event: string;
    timestamp: string;
    details?: string;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * Institutional Inquiry Schema
 */
export interface InstitutionalInquiry {
  id: string;
  inquiryId: string; // SP-INQ-XXXX
  name: string;
  email: string;
  subject: string;
  message: string;
  category: 'general_inquiry' | 'contributor_inquiry' | 'studio_coordination' | 'partnership' | 'technical_support' | 'governance' | 'media_press' | 'institutional_collaboration' | 'other';
  status: 'submitted' | 'under_review' | 'assigned' | 'awaiting_response' | 'resolved' | 'archived';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Studio Session Request Schema
 */
export interface SessionRequest {
  id: string;
  user_id: string;
  vocalist_id?: string;
  preferred_date?: string;
  preferred_time?: string;
  kalam_id?: string;
  notes?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  scheduled_date?: string;
  scheduled_time?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Studio Access Code Schema
 */
export interface StudioAccessCode {
  id: string;
  code: string;
  assigned_to?: string; // user_id
  valid_from: string;
  valid_until: string;
  is_used: boolean;
  used_at?: string;
  created_by: string;
  notes?: string;
  created_at: string;
}

/**
 * Performance Assignment Schema
 */
export interface PerformanceAssignment {
  id: string;
  kalam_id: string;
  assigned_vocalist_id: string;
  assigned_producer_id: string;
  assigned_writer_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Royalty Record Schema
 */
export interface RoyaltyRecord {
  id: string;
  user_id: string;
  release_id?: string;
  amount: number;
  currency: string;
  period_start: string;
  period_end: string;
  status: 'pending' | 'paid' | 'cancelled';
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Media Library Schema
 */
export interface MediaLibrary {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  alt_text?: string;
  caption?: string;
  tags: string[];
  folder_path?: string;
  uploaded_by: string;
  uploaded_at: string;
  is_archived: boolean;
}

/**
 * Notification Schema
 */
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

/**
 * YouTube Analytics Snapshot Schema
 */
export interface YouTubeAnalyticsSnapshot {
  id: string; // "lifetime"
  channelId: string;
  scope: 'lifetime';
  status: 'active' | 'stale' | 'error';
  title: string;
  subtitle: string;

  // 1. Institutional Source of Truth (Immutable verified totals)
  lifetimeSnapshot: {
    performance: {
      impressions: number;
      views: number;
      watchTimeHours: number;
      clickThroughRate: number;
      averageViewDurationFormatted: string;
    };
    ageGender: {
      gender: { female: number; male: number };
      ageGroups: { ageGroup: string; percentage: number }[];
    };
    recommendationEngine: {
      viewsPercentage: number;
    };
    geographies: {
      totalCountries: number;
    };
  };

  // 2. Live API Telemetry (Recent growth and health checks)
  recentAnalytics?: {
    lastQueryWindow: string; // e.g. "Last 90 Days" or "Last Year"
    views: number;
    watchTimeHours: number;
    averageViewDurationSeconds: number;
    topTrafficSources: { source: string; views: number }[];
  };

  // 3. Admin / System Metadata
  apiStatus: {
    connected: boolean;
    lastCheck: string;
    availableLiveMetrics: string[];
    restrictedMetrics: string[];
    lastError?: string;
  };

  lastUpdated: string;
  nextRefreshAt: string;
  errorMessage?: string; // Kept for backward compat with existing UI checks
}

/**
 * Export all schema types
 */
/**
 * Atlas Engine Types — imported from lib/atlas/atlas-types.ts
 * These represent the knowledge graph layer (entities + relationships + domains).
 */
import type { AtlasEntity, AtlasRelationship, StrategicDomain } from './atlas/atlas-types';

/** File-based entity storage type (extends AtlasEntity with id for DatabaseTable) */
export type AtlasEntityRecord = AtlasEntity & { id: string };

/** File-based relationship storage type */
export type AtlasRelationshipRecord = AtlasRelationship & { id: string };

/** File-based strategic domain storage type */
export type AtlasStrategicDomainRecord = StrategicDomain & { id: string };

export type DatabaseSchema = {
  users: User;
  writer_profiles: WriterProfile;
  vocalist_profiles: VocalistProfile;
  producer_profiles: ProducerProfile;
  literary_contributor_profiles: LiteraryContributorProfile;
  studio_profiles: StudioProfile;
  kalams: Kalam;
  sadas: Sada;
  articles: Article;
  partnership_proposals: PartnershipProposal;
  cms_releases: CMSRelease;
  song_adoptions: SongAdoption;
  inquiries: InstitutionalInquiry;
  session_requests: SessionRequest;
  studio_access_codes: StudioAccessCode;
  performance_assignments: PerformanceAssignment;
  royalty_records: RoyaltyRecord;
  media_library: MediaLibrary;
  notifications: Notification;
  youtube_analytics_snapshots: YouTubeAnalyticsSnapshot;

  // ── Atlas Knowledge Graph Engine ──────────────────────────────
  atlas_entities: AtlasEntityRecord;
  atlas_relationships: AtlasRelationshipRecord;
  atlas_strategic_domains: AtlasStrategicDomainRecord;
};

/**
 * Database table accessor
 */
import { db, DatabaseTable, generateId } from './database';

export function getTable<T extends { id: string }>(tableName: keyof DatabaseSchema): DatabaseTable<T> {
  return db.table<T>(tableName);
}

/**
 * Seed database with initial data
 */
export async function seedDatabase(): Promise<void> {
  const users = getTable<User>('users');
  
  // Only seed if no users exist
  if (users.count() === 0) {
    const now = new Date().toISOString();
    
    // Create admin user
    users.insert({
      id: generateId(),
      full_name: 'SufiPulse Admin',
      email: 'admin@sufipulse.local',
      password_hash: '$2b$10$dummy-hash-for-standalone-mode', // In standalone mode, password is not checked
      role: 'admin',
      assigned_roles: ['admin', 'writer', 'vocalist', 'producer', 'literary', 'studio'],
      is_verified: true,
      is_blocked: false,
      created_at: now,
      updated_at: now,
    });

    console.log('[Seed] Admin user created: admin@sufipulse.local');
  }
}

export default {
  getTable,
  seedDatabase,
};
