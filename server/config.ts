/**
 * server/config.ts
 *
 * Single source of truth for all environment variables.
 * Import `config` anywhere in server code — never read process.env directly.
 *
 * Add new env vars here, not scattered throughout the codebase.
 */

const opt = (key: string, fallback = ''): string =>
  process.env[key]?.trim() || fallback;

// Throws at module load time in production if the variable is absent.
// Skips during Next.js build phase — secrets are only needed at runtime.
const requireSecret = (key: string, devFallback: string): string => {
  const v = process.env[key]?.trim();
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (!v && process.env.NODE_ENV === 'production' && !isBuildPhase) {
    throw new Error(`[startup] ${key} is required in production but is not set. Set it in your environment before starting the server.`);
  }
  return v || devFallback;
};

const optInt = (key: string, fallback: number): number => {
  const v = process.env[key];
  const n = v ? parseInt(v, 10) : NaN;
  return isNaN(n) ? fallback : n;
};

export const config = {
  // ─── App ──────────────────────────────────────────────────────────────────
  app: {
    url: opt('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    env: opt('NODE_ENV', 'development'),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
  },

  // ─── Auth / JWT ───────────────────────────────────────────────────────────
  auth: {
    jwtSecret: requireSecret('JWT_SECRET', 'dev-secret-change-in-production-must-be-32-chars'),
    jwtRefreshSecret: requireSecret('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production-32ch'),
    accessTokenExpiry: '7d',
    refreshTokenExpiry: '30d',
    otpExpiryMinutes: optInt('OTP_EXPIRY_MINUTES', 15),
    bcryptRounds: optInt('BCRYPT_ROUNDS', 12),
  },

  // ─── Database ─────────────────────────────────────────────────────────────
  db: {
    /**
     * DB_TYPE=file  → JSON file-based database (default, zero external deps)
     * DB_TYPE=postgres → Direct PostgreSQL connection (set DATABASE_URL)
     */
    type: opt('DB_TYPE', 'file') as 'file' | 'postgres',
    url: opt('DATABASE_URL'),
    directUrl: opt('DIRECT_URL'),
    dataDir: opt('DB_DATA_DIR', '.data'),
    backupDir: opt('DB_BACKUP_DIR', '.data/backups'),
    maxBackups: optInt('DB_MAX_BACKUPS', 10),
    backupIntervalMs: optInt('DB_BACKUP_INTERVAL_MS', 3_600_000), // 1 hour
  },

  // ─── Email ────────────────────────────────────────────────────────────────
  email: {
    /**
     * EMAIL_PROVIDER=console  → logs to stdout (default, no external deps)
     * EMAIL_PROVIDER=smtp     → SMTP via nodemailer
     * EMAIL_PROVIDER=sendgrid → SendGrid HTTP API
     * EMAIL_PROVIDER=resend   → Resend HTTP API
     */
    provider: opt('EMAIL_PROVIDER', 'console') as
      | 'console'
      | 'smtp'
      | 'sendgrid'
      | 'resend',
    from: opt('EMAIL_FROM', 'noreply@sufipulse.com'),
    fromName: opt('EMAIL_FROM_NAME', 'SufiPulse'),

    // SMTP
    smtpHost: opt('SMTP_HOST'),
    smtpPort: optInt('SMTP_PORT', 587),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: opt('SMTP_USER'),
    smtpPass: opt('SMTP_PASS'),

    // API-based providers
    sendgridKey: opt('SENDGRID_API_KEY'),
    resendKey: opt('RESEND_API_KEY'),
  },

  // ─── YouTube ──────────────────────────────────────────────────────────────
  youtube: {
    apiKey: opt('YOUTUBE_API_KEY'),
    defaultChannelId: opt('YOUTUBE_CHANNEL_ID', 'UCraDr3i5A3k0j7typ6tOOsQ'),
    cacheExpiryMs: optInt('YOUTUBE_CACHE_EXPIRY_MS', 4 * 60 * 60 * 1000), // 4 h
  },

  // ─── Stripe ───────────────────────────────────────────────────────────────
  stripe: {
    secretKey: opt('STRIPE_SECRET_KEY'),
    webhookSecret: opt('STRIPE_WEBHOOK_SECRET'),
    publishableKey: opt('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  },

  // ─── Google ───────────────────────────────────────────────────────────────
  google: {
    adsDevToken: opt('GOOGLE_ADS_DEVELOPER_TOKEN'),
    clientId: opt('GOOGLE_CLIENT_ID'),
    clientSecret: opt('GOOGLE_CLIENT_SECRET'),
  },

  // ─── Sentry ───────────────────────────────────────────────────────────────
  sentry: {
    dsn: opt('SENTRY_DSN'),
    org: opt('SENTRY_ORG'),
    project: opt('SENTRY_PROJECT'),
  },

  // ─── CORS ─────────────────────────────────────────────────────────────────
  cors: {
    origins: opt('CORS_ORIGINS', 'http://localhost:3000').split(',').map(s => s.trim()),
  },
} as const;

export default config;
