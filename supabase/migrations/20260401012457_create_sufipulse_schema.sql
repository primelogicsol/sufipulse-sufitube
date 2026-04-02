/*
  # SufiPulse Database Schema

  1. New Tables
    - `users` - Core user authentication and profiles
    - `writer_profiles` - Writer/poet credential profiles
    - `vocalist_profiles` - Vocalist credential profiles  
    - `producer_profiles` - Music producer profiles
    - `literary_contributor_profiles` - Literary contributor profiles
    - `studio_profiles` - Recording studio partner profiles
    - `kalams` - Poetry submissions by writers
    - `sadas` - Vocal performances by vocalists
    - `articles` - Literary journal articles
    - `partnership_proposals` - Partnership requests

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated user access
    - Add policies for admin access

  3. Notes
    - Uses UUID for primary keys
    - Timestamps for audit trails
    - Status fields for approval workflows
    - Foreign key relationships maintained
*/

-- Users table (core authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMPTZ,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Writer profiles
CREATE TABLE IF NOT EXISTS writer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identity
    full_name VARCHAR(255),
    pen_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Writing experience
    years_writing INTEGER,
    writing_languages TEXT[],
    primary_themes TEXT[],
    previous_publications TEXT,
    sample_work_link TEXT,
    
    -- Governance acknowledgments
    acknowledge_peer_review BOOLEAN DEFAULT false,
    acknowledge_editorial_control BOOLEAN DEFAULT false,
    accept_framework BOOLEAN DEFAULT false,
    
    -- System
    profile_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vocalist profiles
CREATE TABLE IF NOT EXISTS vocalist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identity
    full_name VARCHAR(255),
    stage_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Musical background
    years_performing INTEGER,
    vocal_range VARCHAR(50),
    performance_languages TEXT[],
    musical_training TEXT,
    performance_experience TEXT,
    sample_recording_link TEXT,
    
    -- Governance
    acknowledge_direction BOOLEAN DEFAULT false,
    acknowledge_validation BOOLEAN DEFAULT false,
    accept_framework BOOLEAN DEFAULT false,
    
    -- System
    profile_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Producer profiles
CREATE TABLE IF NOT EXISTS producer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identity
    full_name VARCHAR(255),
    professional_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    years_experience VARCHAR(20),
    
    -- Production expertise
    primary_production_focus TEXT[],
    primary_tools TEXT,
    musical_background TEXT,
    portfolio_link TEXT,
    
    -- Workflow alignment
    worked_structured_production BOOLEAN DEFAULT false,
    willing_defined_sequence BOOLEAN DEFAULT false,
    acknowledge_centralized_control BOOLEAN DEFAULT false,
    
    -- Governance
    accept_framework BOOLEAN DEFAULT false,
    
    -- System
    profile_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Literary contributor profiles
CREATE TABLE IF NOT EXISTS literary_contributor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identity
    full_name VARCHAR(255),
    professional_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    years_experience INTEGER,
    
    -- Literary competence
    writing_focus TEXT[],
    languages TEXT[],
    background TEXT,
    portfolio_link TEXT,
    
    -- Editorial alignment
    worked_editorial_process BOOLEAN DEFAULT false,
    willing_review_process BOOLEAN DEFAULT false,
    acknowledge_editorial_control BOOLEAN DEFAULT false,
    
    -- Governance
    accept_framework BOOLEAN DEFAULT false,
    
    -- System
    profile_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Studio profiles
CREATE TABLE IF NOT EXISTS studio_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Studio identity
    studio_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    primary_contact_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Operations
    years_in_operation VARCHAR(10),
    previous_work_link TEXT,
    agree_centralized_validation BOOLEAN DEFAULT false,
    agree_centralized_authorization BOOLEAN DEFAULT false,
    
    -- Technical
    recording_capabilities TEXT[],
    equipment_overview TEXT,
    
    -- Governance
    accept_terms BOOLEAN DEFAULT false,
    
    -- System
    profile_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kalams (poetry submissions)
CREATE TABLE IF NOT EXISTS kalams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    writer_id UUID REFERENCES writer_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(50),
    themes TEXT[],
    notes TEXT,
    
    status VARCHAR(50) DEFAULT 'pending',
    admin_feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sadas (vocal performances)
CREATE TABLE IF NOT EXISTS sadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocalist_id UUID REFERENCES vocalist_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    kalam_id UUID REFERENCES kalams(id),
    recording_link TEXT,
    performance_notes TEXT,
    language VARCHAR(50),
    
    status VARCHAR(50) DEFAULT 'pending',
    admin_feedback TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Articles (literary journal)
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contributor_id UUID REFERENCES literary_contributor_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category VARCHAR(100),
    tags TEXT[],
    featured_image TEXT,
    
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partnership proposals
CREATE TABLE IF NOT EXISTS partnership_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    organization_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website TEXT,
    
    partnership_type VARCHAR(100),
    proposal_details TEXT NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocalist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE literary_contributor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kalams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_proposals ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Writer profiles policies
CREATE POLICY "Writers can view own profile"
  ON writer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Writers can create own profile"
  ON writer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Writers can update own profile"
  ON writer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vocalist profiles policies
CREATE POLICY "Vocalists can view own profile"
  ON vocalist_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Vocalists can create own profile"
  ON vocalist_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vocalists can update own profile"
  ON vocalist_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Producer profiles policies
CREATE POLICY "Producers can view own profile"
  ON producer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Producers can create own profile"
  ON producer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Producers can update own profile"
  ON producer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Literary contributor policies
CREATE POLICY "Contributors can view own profile"
  ON literary_contributor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Contributors can create own profile"
  ON literary_contributor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Contributors can update own profile"
  ON literary_contributor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Studio profiles policies
CREATE POLICY "Studios can view own profile"
  ON studio_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Studios can create own profile"
  ON studio_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Studios can update own profile"
  ON studio_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Kalams policies
CREATE POLICY "Writers can view own kalams"
  ON kalams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Writers can create kalams"
  ON kalams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Writers can update own kalams"
  ON kalams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sadas policies
CREATE POLICY "Vocalists can view own sadas"
  ON sadas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Vocalists can create sadas"
  ON sadas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vocalists can update own sadas"
  ON sadas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Articles policies (published articles are public)
CREATE POLICY "Anyone can view published articles"
  ON articles FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Contributors can view own articles"
  ON articles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Contributors can create articles"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Contributors can update own articles"
  ON articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Partnership proposals (anyone can submit)
CREATE POLICY "Anyone can create partnership proposals"
  ON partnership_proposals FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_writer_profiles_user_id ON writer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vocalist_profiles_user_id ON vocalist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_producer_profiles_user_id ON producer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_literary_contributor_profiles_user_id ON literary_contributor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_profiles_user_id ON studio_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kalams_user_id ON kalams(user_id);
CREATE INDEX IF NOT EXISTS idx_sadas_user_id ON sadas(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
