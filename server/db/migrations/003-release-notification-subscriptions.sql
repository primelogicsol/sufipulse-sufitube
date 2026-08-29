CREATE TABLE IF NOT EXISTS release_notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id VARCHAR(255) NOT NULL,
    normalized_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'subscribed',
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (release_id, normalized_email)
);
CREATE INDEX IF NOT EXISTS idx_release_notification_subscriptions_release_id ON release_notification_subscriptions(release_id);
