CREATE TABLE producer_profiles (
    id SERIAL PRIMARY KEY,

    -- Identity & Background
    full_name VARCHAR(255),
    professional_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    years_experience VARCHAR(20),

    -- Musical Competence (summary fields)
	primary_production_focus TEXT[],
    primary_tools TEXT,
    musical_background TEXT,
    portfolio_link TEXT,

    -- Workflow Alignment
    worked_structured_production BOOLEAN,
    willing_defined_sequence BOOLEAN,
    acknowledge_centralized_control BOOLEAN,

    -- Governance
    accept_framework BOOLEAN,

    -- System
    profile_status VARCHAR(50) DEFAULT 'pending',
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
