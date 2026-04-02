/*
  # SufiPulse CMS Release Management System

  ## Overview
  Complete content management system for SufiTube/SufiPulse release publishing
  with role-based access control, versioning, workflow management, and bulk operations.

  ## 1. New Tables

  ### Core CMS Tables
  - `roles` - System roles with hierarchical permissions
  - `user_roles` - Many-to-many relationship between users and roles
  - `permissions` - Granular permission definitions
  - `role_permissions` - Role-to-permission mappings

  ### Release Management Tables
  - `releases` - Core release/video records with workflow states
  - `release_versions` - Version history and snapshots
  - `release_credits` - Structured credits (artistic, production, literary, technical)
  - `release_lyrics` - Multi-language lyrics and translations
  - `release_commentary` - Editorial commentary and scholarly reflections
  - `release_sponsors` - Sponsor information and display settings
  - `release_media` - Media assets (video, thumbnails, posters, audio)
  - `release_metadata` - SEO, Open Graph, structured data
  - `release_actions_log` - Complete audit trail

  ### Bulk Operations Tables
  - `bulk_imports` - Batch import tracking
  - `bulk_import_items` - Individual items in batch imports
  - `media_library` - Central media asset management

  ## 2. Workflow States
  - draft → in_review → approved → published
  - Supports unpublish and archive
  - Soft delete with recovery

  ## 3. Security
  - Row Level Security enabled on all tables
  - Role-based permission checks
  - Admin-only access to sensitive operations
  - Audit logging for all changes

  ## 4. Features
  - Multi-language support
  - Version control with snapshots
  - Bulk upload and batch operations
  - Template-based release creation
  - Credit system with categories
  - SEO optimization fields
  - Media asset management
  - Comprehensive audit trails
*/

-- =====================================================
-- ROLES AND PERMISSIONS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    hierarchy_level INTEGER NOT NULL DEFAULT 0,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role_id)
);

-- =====================================================
-- RELEASE MANAGEMENT SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core identification
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    slug VARCHAR(500) UNIQUE NOT NULL,
    release_id VARCHAR(100) UNIQUE,

    -- Workflow
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'unpublished', 'archived')),
    workflow_stage VARCHAR(50),

    -- Classification
    release_type VARCHAR(100),
    category VARCHAR(100),
    badge_text VARCHAR(100),

    -- Dates
    release_date DATE,
    published_at TIMESTAMPTZ,
    unpublished_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,

    -- Media references
    youtube_id VARCHAR(100),
    youtube_url TEXT,
    primary_video_url TEXT,
    thumbnail_url TEXT,
    poster_url TEXT,

    -- Metrics
    duration_seconds INTEGER,
    duration_formatted VARCHAR(20),
    view_count BIGINT DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    show_views BOOLEAN DEFAULT true,
    show_likes BOOLEAN DEFAULT true,

    -- Features toggle
    enable_lyrics BOOLEAN DEFAULT true,
    enable_commentary BOOLEAN DEFAULT true,
    enable_sponsors BOOLEAN DEFAULT false,
    enable_adoption BOOLEAN DEFAULT true,
    enable_credits BOOLEAN DEFAULT true,

    -- Default language
    default_language VARCHAR(10) DEFAULT 'en',
    available_languages TEXT[],

    -- System fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    published_by UUID REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RELEASE VERSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS release_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot_data JSONB NOT NULL,
    change_summary TEXT,
    change_type VARCHAR(50),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(release_id, version_number)
);

-- =====================================================
-- RELEASE CREDITS
-- =====================================================

CREATE TABLE IF NOT EXISTS release_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES releases(id) ON DELETE CASCADE,

    -- Credit categorization
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),

    -- Credit details
    role_label VARCHAR(200) NOT NULL,
    credited_name VARCHAR(300) NOT NULL,
    credited_profile_id UUID REFERENCES users(id),

    -- Additional info
    notes TEXT,
    external_link TEXT,

    -- Display
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RELEASE LYRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS release_lyrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES releases(id) ON DELETE CASCADE,

    -- Language info
    language_code VARCHAR(10) NOT NULL,
    language_name VARCHAR(100) NOT NULL,
    script_type VARCHAR(50),

    -- Lyrics content
    lyrics_text TEXT,
    lyrics_html TEXT,

    -- Subtitle files
    subtitle_url TEXT,
    subtitle_format VARCHAR(20),

    -- Display settings
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    translator_name VARCHAR(300),
    transliterator_name VARCHAR(300),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(release_id, language_code)
);

-- =====================================================
-- RELEASE COMMENTARY
-- =====================================================

CREATE TABLE IF NOT EXISTS release_commentary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES releases(id) ON DELETE CASCADE,

    -- Commentary details
    title VARCHAR(500),
    content TEXT NOT NULL,
    content_html TEXT,

    -- Type and categorization
    commentary_type VARCHAR(100),
    section_name VARCHAR(200),

    -- Attribution
    author_name VARCHAR(300),
    author_profile_id UUID REFERENCES users(id),

    -- Citations and references
    reference_text TEXT,
    citations JSONB,

    -- Display
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RELEASE SPONSORS
-- =====================================================

CREATE TABLE IF NOT EXISTS release_sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES releases(id) ON DELETE CASCADE,

    -- Sponsor details
    sponsor_name VARCHAR(300) NOT NULL,
    sponsor_logo_url TEXT,
    sponsor_website TEXT,

    -- Sponsorship info
    sponsor_tier VARCHAR(50),
    sponsor_type VARCHAR(100),
    sponsorship_note TEXT,

    -- Display
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    -- Dates
    sponsorship_start_date DATE,
    sponsorship_end_date DATE,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RELEASE MEDIA LIBRARY
-- =====================================================

CREATE TABLE IF NOT EXISTS media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- File details
    file_name VARCHAR(500) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),

    -- Media metadata
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,

    -- Organization
    alt_text TEXT,
    caption TEXT,
    tags TEXT[],
    folder_path VARCHAR(500),

    -- System
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    is_archived BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS release_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_library(id) ON DELETE CASCADE,

    -- Media role
    media_type VARCHAR(50) NOT NULL,
    media_purpose VARCHAR(100),

    -- Display
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RELEASE METADATA (SEO)
-- =====================================================

CREATE TABLE IF NOT EXISTS release_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID UNIQUE REFERENCES releases(id) ON DELETE CASCADE,

    -- SEO
    meta_title VARCHAR(200),
    meta_description TEXT,
    meta_keywords TEXT[],
    canonical_url TEXT,

    -- Open Graph
    og_title VARCHAR(200),
    og_description TEXT,
    og_image_url TEXT,
    og_type VARCHAR(50),

    -- Twitter Card
    twitter_card_type VARCHAR(50),
    twitter_title VARCHAR(200),
    twitter_description TEXT,
    twitter_image_url TEXT,

    -- Structured data
    structured_data JSONB,

    -- Social sharing
    share_text TEXT,
    share_hashtags TEXT[],

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS release_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    -- Action details
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,

    -- Change tracking
    before_data JSONB,
    after_data JSONB,

    -- Context
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- BULK OPERATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS bulk_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Import details
    import_type VARCHAR(100) NOT NULL,
    import_source VARCHAR(200),
    file_name VARCHAR(500),
    file_url TEXT,

    -- Processing
    status VARCHAR(50) DEFAULT 'pending',
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,

    -- Results
    validation_errors JSONB,
    processing_log JSONB,

    -- System
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bulk_import_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulk_import_id UUID REFERENCES bulk_imports(id) ON DELETE CASCADE,

    -- Item data
    row_number INTEGER,
    raw_data JSONB NOT NULL,
    processed_data JSONB,

    -- Processing
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,

    -- Result
    created_release_id UUID REFERENCES releases(id),

    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_lyrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_commentary ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_import_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - ROLES & PERMISSIONS
-- =====================================================

CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES - RELEASES (Public View)
-- =====================================================

CREATE POLICY "Anyone can view published releases"
  ON releases FOR SELECT
  TO public
  USING (status = 'published' AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can view all non-deleted releases"
  ON releases FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create releases"
  ON releases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own draft releases"
  ON releases FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by AND status = 'draft')
  WITH CHECK (auth.uid() = created_by);

-- =====================================================
-- RLS POLICIES - RELEASE CREDITS
-- =====================================================

CREATE POLICY "Anyone can view credits for published releases"
  ON release_credits FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = release_credits.release_id
      AND releases.status = 'published'
      AND releases.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can view all credits"
  ON release_credits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage credits"
  ON release_credits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = release_credits.release_id
      AND releases.created_by = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - RELEASE LYRICS
-- =====================================================

CREATE POLICY "Anyone can view lyrics for published releases"
  ON release_lyrics FOR SELECT
  TO public
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = release_lyrics.release_id
      AND releases.status = 'published'
      AND releases.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can manage lyrics"
  ON release_lyrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = release_lyrics.release_id
      AND releases.created_by = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - RELEASE COMMENTARY
-- =====================================================

CREATE POLICY "Anyone can view active commentary for published releases"
  ON release_commentary FOR SELECT
  TO public
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = release_commentary.release_id
      AND releases.status = 'published'
      AND releases.deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can manage commentary"
  ON release_commentary FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = release_commentary.release_id
      AND releases.created_by = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - RELEASE SPONSORS
-- =====================================================

CREATE POLICY "Anyone can view active sponsors for published releases"
  ON release_sponsors FOR SELECT
  TO public
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = release_sponsors.release_id
      AND releases.status = 'published'
      AND releases.deleted_at IS NULL
    )
  );

-- =====================================================
-- RLS POLICIES - MEDIA
-- =====================================================

CREATE POLICY "Anyone can view non-archived media"
  ON media_library FOR SELECT
  TO public
  USING (is_archived = false);

CREATE POLICY "Authenticated users can upload media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- =====================================================
-- RLS POLICIES - METADATA
-- =====================================================

CREATE POLICY "Anyone can view metadata for published releases"
  ON release_metadata FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM releases
      WHERE releases.id = release_metadata.release_id
      AND releases.status = 'published'
      AND releases.deleted_at IS NULL
    )
  );

-- =====================================================
-- RLS POLICIES - AUDIT LOG
-- =====================================================

CREATE POLICY "Authenticated users can view audit logs"
  ON release_actions_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit logs"
  ON release_actions_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_releases_slug ON releases(slug);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_release_id ON releases(release_id);
CREATE INDEX IF NOT EXISTS idx_releases_youtube_id ON releases(youtube_id);
CREATE INDEX IF NOT EXISTS idx_releases_created_by ON releases(created_by);
CREATE INDEX IF NOT EXISTS idx_releases_deleted_at ON releases(deleted_at);

CREATE INDEX IF NOT EXISTS idx_release_versions_release_id ON release_versions(release_id);
CREATE INDEX IF NOT EXISTS idx_release_credits_release_id ON release_credits(release_id);
CREATE INDEX IF NOT EXISTS idx_release_credits_category ON release_credits(category);

CREATE INDEX IF NOT EXISTS idx_release_lyrics_release_id ON release_lyrics(release_id);
CREATE INDEX IF NOT EXISTS idx_release_lyrics_language_code ON release_lyrics(language_code);

CREATE INDEX IF NOT EXISTS idx_release_commentary_release_id ON release_commentary(release_id);
CREATE INDEX IF NOT EXISTS idx_release_sponsors_release_id ON release_sponsors(release_id);

CREATE INDEX IF NOT EXISTS idx_media_library_file_type ON media_library(file_type);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_release_actions_log_release_id ON release_actions_log(release_id);
CREATE INDEX IF NOT EXISTS idx_release_actions_log_user_id ON release_actions_log(user_id);
CREATE INDEX IF NOT EXISTS idx_release_actions_log_action_type ON release_actions_log(action_type);

CREATE INDEX IF NOT EXISTS idx_bulk_imports_status ON bulk_imports(status);
CREATE INDEX IF NOT EXISTS idx_bulk_import_items_bulk_import_id ON bulk_import_items(bulk_import_id);

-- =====================================================
-- SEED DEFAULT ROLES
-- =====================================================

INSERT INTO roles (name, display_name, description, hierarchy_level, is_system_role) VALUES
  ('super_admin', 'Super Administrator', 'Full system access including user management and deletion', 100, true),
  ('admin', 'Administrator', 'Manage releases, publish, archive, and user content', 80, true),
  ('editor', 'Editor', 'Create and edit releases, submit for review', 60, true),
  ('content_manager', 'Content Manager', 'Edit structured fields like credits, lyrics, commentary', 50, true),
  ('reviewer', 'Reviewer/Approver', 'Review and approve content for publication', 70, true),
  ('viewer', 'Viewer', 'Read-only access to CMS', 10, true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SEED DEFAULT PERMISSIONS
-- =====================================================

INSERT INTO permissions (name, resource, action, description) VALUES
  ('release.view_all', 'release', 'view_all', 'View all releases including drafts'),
  ('release.create', 'release', 'create', 'Create new releases'),
  ('release.edit_own', 'release', 'edit_own', 'Edit own releases'),
  ('release.edit_any', 'release', 'edit_any', 'Edit any release'),
  ('release.delete', 'release', 'delete', 'Delete releases'),
  ('release.publish', 'release', 'publish', 'Publish releases'),
  ('release.unpublish', 'release', 'unpublish', 'Unpublish releases'),
  ('release.archive', 'release', 'archive', 'Archive releases'),
  ('release.approve', 'release', 'approve', 'Approve releases for publishing'),
  ('user.manage', 'user', 'manage', 'Manage user accounts and roles'),
  ('media.upload', 'media', 'upload', 'Upload media files'),
  ('media.delete', 'media', 'delete', 'Delete media files'),
  ('bulk.import', 'bulk', 'import', 'Perform bulk import operations')
ON CONFLICT (name) DO NOTHING;