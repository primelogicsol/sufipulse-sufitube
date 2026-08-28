ALTER TABLE releases
    ALTER COLUMN created_at DROP NOT NULL,
    ALTER COLUMN updated_at DROP NOT NULL;

ALTER TABLE releases
    ADD COLUMN db_created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN db_updated_at timestamptz NOT NULL DEFAULT now();
