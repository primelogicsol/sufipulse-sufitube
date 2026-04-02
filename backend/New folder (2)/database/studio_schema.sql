CREATE TABLE studio_profiles (
    id SERIAL PRIMARY KEY,

    -- Studio Identity
    studio_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    primary_contact_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),

    -- Operational Alignment
    years_in_operation VARCHAR(10),
    previous_work_link TEXT,
    agree_centralized_validation BOOLEAN,
    agree_centralized_authorization BOOLEAN,

    -- Technical Profile
    recording_capabilities TEXT[], 
    equipment_overview TEXT,

    -- Governance
    accept_terms BOOLEAN,

    -- System
    profile_status VARCHAR(50) DEFAULT 'pending',
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
