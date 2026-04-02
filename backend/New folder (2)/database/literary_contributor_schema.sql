CREATE TABLE literary_contributor_profiles (
    id SERIAL PRIMARY KEY,

    -- Identity & Background
    full_name VARCHAR(255),
    professional_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    years_experience INTEGER,

    -- Literary Competence (list + details)
    writing_focus TEXT[], -- e.g. ['spiritual_essays', 'sufi_thought_analysis']
    languages TEXT[], -- e.g. ['English', 'Urdu']
    background TEXT,
    portfolio_link TEXT,

    -- Editorial Alignment
    worked_editorial_process BOOLEAN,
    willing_review_process BOOLEAN,
    acknowledge_editorial_control BOOLEAN,

    -- Governance
    accept_framework BOOLEAN,

    -- System
    profile_status VARCHAR(50) DEFAULT 'pending',
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
