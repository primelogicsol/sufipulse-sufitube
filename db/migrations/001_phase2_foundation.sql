BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE releases (
    id                      text PRIMARY KEY,
    slug                    text NOT NULL,

    -- Registry / canonical authority
    title                   text NOT NULL,
    canonical_title         text,
    canonical_status        text,
    governance_origin       text NOT NULL DEFAULT 'unresolved',
    metadata_status         text,

    canonical_thumbnail     text,
    thumbnail_url           text,

    -- YouTube packaging / distribution authority
    youtube_id              text,
    youtube_title           text,
    youtube_thumbnail_url   text,
    youtube_url             text,
    youtube_channel_id      text,
    youtube_channel_url     text,
    youtube_playlist_id     text,

    -- Public release classification
    status                  text NOT NULL,
    visibility              text,
    format                  text,
    release_type            text,
    category                text,
    source                  text,
    content_readiness_state text,
    web_only                boolean NOT NULL DEFAULT false,

    -- Public descriptive/search fields
    description             text NOT NULL DEFAULT '',

    writer_name             text,
    writer_name_urdu        text,
    vocalist_name           text,
    vocalist_name_urdu      text,
    producer_name           text,

    tags                    text[] NOT NULL DEFAULT '{}',

    -- Time / duration / popularity
    release_date            timestamptz,
    published_at            timestamptz,
    duration_seconds        integer NOT NULL DEFAULT 0,
    duration_formatted      text,
    view_count              bigint NOT NULL DEFAULT 0,
    like_count              bigint NOT NULL DEFAULT 0,

    -- Language/public feature fields used often
    available_languages     text[] NOT NULL DEFAULT '{}',
    default_language        text,
    enable_lyrics           boolean NOT NULL DEFAULT true,
    enable_commentary       boolean NOT NULL DEFAULT true,
    enable_sponsors         boolean NOT NULL DEFAULT false,
    enable_adoption         boolean NOT NULL DEFAULT true,
    enable_credits          boolean NOT NULL DEFAULT true,

    -- Long-tail CMS state
    payload                 jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at              timestamptz NOT NULL,
    updated_at              timestamptz NOT NULL,

    CONSTRAINT releases_slug_unique UNIQUE (slug),

    CONSTRAINT releases_status_check CHECK (
        status IN (
            'draft',
            'in_review',
            'approved',
            'published',
            'unpublished',
            'archived'
        )
    ),

    CONSTRAINT releases_governance_check CHECK (
        governance_origin IN (
            'native_governed',
            'legacy_registry',
            'unresolved'
        )
    ),

    CONSTRAINT releases_visibility_check CHECK (
        visibility IS NULL OR
        visibility IN ('public', 'private', 'unlisted')
    ),

    CONSTRAINT releases_format_check CHECK (
        format IS NULL OR
        format IN ('video', 'audio', 'short', 'live', 'playlist')
    ),

    CONSTRAINT releases_duration_nonnegative CHECK (
        duration_seconds >= 0
    ),

    CONSTRAINT releases_views_nonnegative CHECK (
        view_count >= 0
    )
);

CREATE UNIQUE INDEX releases_youtube_id_unique
    ON releases (youtube_id)
    WHERE youtube_id IS NOT NULL
      AND youtube_id <> '';

CREATE INDEX releases_status_idx
    ON releases (status);

CREATE INDEX releases_governance_idx
    ON releases (governance_origin);

CREATE INDEX releases_format_idx
    ON releases (format);

CREATE INDEX releases_release_date_idx
    ON releases (release_date DESC);

CREATE INDEX releases_popularity_idx
    ON releases (view_count DESC);

CREATE INDEX releases_duration_idx
    ON releases (duration_seconds);

CREATE INDEX releases_status_governance_date_idx
    ON releases (
        status,
        governance_origin,
        release_date DESC
    );

CREATE INDEX releases_canonical_title_trgm_idx
    ON releases
    USING gin (lower(canonical_title) gin_trgm_ops);

CREATE INDEX releases_youtube_title_trgm_idx
    ON releases
    USING gin (lower(youtube_title) gin_trgm_ops);

CREATE INDEX releases_description_trgm_idx
    ON releases
    USING gin (lower(description) gin_trgm_ops);


CREATE TABLE release_graph_joins (
    id                  text PRIMARY KEY,

    release_id          text REFERENCES releases(id)
                        ON DELETE CASCADE,

    registry_id         text,

    source_entity_id    text,
    target_entity_id    text,

    relationship_type   text NOT NULL,

    confidence          numeric(4,3)
                        NOT NULL DEFAULT 1.000,

    created_at          timestamptz NOT NULL,
    updated_at          timestamptz NOT NULL,

    CONSTRAINT graph_confidence_check
        CHECK (
            confidence >= 0
            AND confidence <= 1
        )
);

CREATE INDEX graph_release_idx
    ON release_graph_joins(release_id);

CREATE INDEX graph_registry_idx
    ON release_graph_joins(registry_id);

CREATE INDEX graph_target_entity_idx
    ON release_graph_joins(target_entity_id);

CREATE INDEX graph_relationship_idx
    ON release_graph_joins(relationship_type);

COMMIT;
