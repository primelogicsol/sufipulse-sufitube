import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

// ---------------------------------------------------------------------------
//  Shared helper: coerce string env values into booleans
//  Accepts: "true", "1", "yes", "on"  (case-insensitive)
// ---------------------------------------------------------------------------
const booleanSchema = z
  .string()
  .transform((val) => /^true|1|yes|on$/i.test(val));

// ---------------------------------------------------------------------------
//  Environment validation schema
//
//  Rules:
//    - `server`   variables are only accessible in server components / API
//      routes. They are validated at build time and at runtime.
//    - `client`   variables (must start with NEXT_PUBLIC_*) are exposed to
//      the browser bundle and validated at runtime.
//    - `experimental__runtimeEnv` tells the library which client-side values
//      to forward at runtime. Every client key must appear here.
//    - `emptyStringAsUndefined` treats any empty-string env var as undefined
//      so that `.default()` and `.optional()` behave correctly.
//    - `onValidationError` produces a human-readable error block listing every
//      missing or invalid variable.
// ---------------------------------------------------------------------------

export const env = createEnv({
  emptyStringAsUndefined: true,

  // ======================== SERVER-ONLY VARIABLES ============================
  server: {
    // ── Database ─────────────────────────────────────────────────────────────
    /**
     * Primary database connection string.
     * For file-based (standalone): file:./.data
     * For PostgreSQL: postgresql://user:pass@host:port/dbname
     *
     * For Vercel/Neon: use the pooled connection string.
     * For direct TCP (migrations, Prisma Studio): see DIRECT_URL.
     */
    DATABASE_URL: z.string(),

    /**
     * Direct (non-pooled) database connection for migrations & CLI tools.
     * Optional — only required when running Prisma migrate or similar.
     * Format: postgresql://user:pass@host:port/dbname?sslmode=require
     */
    DIRECT_URL: z.string().optional(),

    // ── Authentication ───────────────────────────────────────────────────────
    /**
     * Secret used to sign and verify JWT access tokens.
     * Generate with: openssl rand -base64 32
     * Minimum 32 characters recommended.
     */
    JWT_SECRET: z.string().min(32),

    /**
     * Secret used to sign and verify JWT refresh tokens.
     * Should be different from JWT_SECRET for defense-in-depth.
     * Generate with: openssl rand -base64 32
     */
    JWT_REFRESH_SECRET: z.string().min(32),

    // ── Email (SMTP) ─────────────────────────────────────────────────────────
    /**
     * SMTP server hostname for sending notification emails.
     * Default: smtp.gmail.com
     */
    SMTP_HOST: z.string().default("smtp.gmail.com"),

    /**
     * SMTP server port.
     * 587 = STARTTLS (recommended), 465 = TLS, 25 = plaintext.
     * Default: 587
     */
    SMTP_PORT: z.coerce.number().int().positive().default(587),

    /**
     * SMTP authentication username (usually the full email address).
     * Required if SMTP_HOST is set and SMTP is enabled.
     */
    SMTP_USER: z.string().email().optional(),

    /**
     * SMTP authentication password (Gmail: use an App Password, not your
     * regular Google password).
     */
    SMTP_PASS: z.string().optional(),

    /**
     * The "From" address shown on outgoing notification emails.
     * Default: noreply@sufipulse.com
     */
    FROM_EMAIL: z.string().email().default("noreply@sufipulse.com"),

    // ── Stripe Payments ──────────────────────────────────────────────────────
    /**
     * Stripe secret API key for server-side payment operations.
     * Get from: https://dashboard.stripe.com/apikeys
     * Format: sk_live_... (production) or sk_test_... (development)
     */
    STRIPE_SECRET_KEY: z.string().min(1),

    /**
     * Stripe webhook signing secret for verifying event authenticity.
     * Get from: Stripe Dashboard > Developers > Webhooks > your endpoint
     * Format: whsec_...
     */
    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    // ── YouTube Data API ─────────────────────────────────────────────────────
    /**
     * YouTube Data API v3 key for fetching video metadata, channel info, etc.
     * Get from: https://console.cloud.google.com/apis/credentials
     * Required for SufiTube video integration.
     */
    YOUTUBE_API_KEY: z.string().min(1),

    // ── Google Ads API (optional) ────────────────────────────────────────────
    /**
     * Google Ads developer token for managed campaign features.
     * Get from: https://ads.google.com/home/tools/developer-token/
     * Optional — only needed if using Google Ads admin features.
     */
    GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),

    /**
     * Google Ads OAuth2 client ID for sponsor "Use My Google Ads" flow.
     * Get from: https://console.cloud.google.com/apis/credentials
     * Optional — only needed if sponsors authenticate via Google Ads OAuth.
     */
    GOOGLE_ADS_CLIENT_ID: z.string().optional(),

    /**
     * Google Ads OAuth2 client secret (paired with GOOGLE_ADS_CLIENT_ID).
     * Get from: https://console.cloud.google.com/apis/credentials
     * Optional — only needed if sponsors authenticate via Google Ads OAuth.
     */
    GOOGLE_ADS_CLIENT_SECRET: z.string().optional(),

    // ── Application Settings (server-only) ───────────────────────────────────
    /**
     * Allowed CORS origins (comma-separated).
     * Default: http://localhost:3000
     */
    CORS_ORIGINS: z.string().default("http://localhost:3000"),

    /**
     * Enable verbose environment validation logging on startup.
     * Set to "true", "1", "yes", or "on" to enable.
     */
    DEBUG_ENV: booleanSchema.default(false),

    /**
     * Node environment — determines feature flags, logging level, etc.
     * Values: development | production | test
     * Default: development
     */
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // ── Backward-compat: legacy API_URL ──────────────────────────────────────
    /**
     * Legacy API base URL (kept for backward compatibility with existing code).
     * Default: http://localhost:5000/api
     */
    API_URL: z.string().url().default("http://localhost:5000/api"),

    /**
     * Legacy YouTube API key alias (backward compatibility).
     */
    YOUTUBE_API_KEY_LEGACY: z.string().default(""),
  },

  // ======================== CLIENT (BROWSER) VARIABLES =======================
  client: {
    // ── Supabase (client SDK) ────────────────────────────────────────────────
    /**
     * Supabase project URL — used by the client-side Supabase SDK.
     * Get from: Supabase Dashboard > Project Settings > API
     * Format: https://<project-ref>.supabase.co
     */
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),

    /**
     * Supabase anon (public) key — safe to expose in the browser.
     * Get from: Supabase Dashboard > Project Settings > API
     * Format: eyJhbGciOi... (JWT)
     *
     * Row Level Security (RLS) policies protect your data; this key is
     * intentionally public.
     */
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

    // ── Application URL ──────────────────────────────────────────────────────
    /**
     * Canonical base URL of the deployed application.
     * Used for generating absolute links (emails, OG tags, redirects).
     * Default: http://localhost:3000
     * Production example: https://sufipulse.com
     */
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3000/api"),
  },

  // ============================================================
  //  Runtime forwarding for client-side variables.
  //  Next.js >= 13.4.4: use experimental__runtimeEnv.
  //  Only NEXT_PUBLIC_* keys need to be listed here.
  // ============================================================
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // ======================== ERROR REPORTING ==================================
  onValidationError: (error) => {
    // In Zod v4, the error passed to onValidationError is a ZodError
    // which has a .format() method (not .flatten()).
    const formatted = (error as { format?: () => Record<string, unknown> })
      .format?.();

    const fieldErrors: Record<string, string[]> = {};
    if (formatted && typeof formatted === "object") {
      for (const [key, value] of Object.entries(formatted)) {
        if (key === "_errors") continue;
        if (Array.isArray((value as { _errors?: string[] })?._errors)) {
          fieldErrors[key] = (value as { _errors: string[] })._errors;
        }
      }
    }

    const lines = Object.entries(fieldErrors).map(
      ([key, msgs]) => `  - ${key}: ${msgs.join(", ")}`
    );

    console.error(
      [
        "",
        "  [red]❌  Environment validation failed[/red]",
        "  The following variables are missing or invalid:",
        "",
        ...lines,
        "",
        "  Fix the variables above in your .env file and restart.",
        "  See .env.example for documentation on every variable.",
        "",
      ]
        .join("\n")
        .replace(/\[red\]/g, "\x1b[31m")
        .replace(/\[\/red\]/g, "\x1b[0m")
    );

    // eslint-disable-next-line no-restricted-syntax -- intentional process exit
    process.exit(1);
  },
});

// ============================================================================
//  Re-export a convenience type so consumers can annotate function params.
//
//  Usage:
//    import type { Env } from "@/app/config/env";
//    function configureStripe(cfg: Env) { ... }
// ============================================================================
export type Env = typeof env;

// ============================================================================
//  BACKWARD-COMPATIBILITY: legacy ENV export
//
//  Existing code imports `{ ENV }` from this module. This object mirrors the
//  shape of the old env.ts so those imports keep working without changes.
//
//  Migration path: new code should import `env` directly.
//  NOTE: Only NEXT_PUBLIC_* variables are safe to expose to the client.
// ============================================================================
export const ENV = {
  // Client-safe variables only (NEXT_PUBLIC_*)
  SUPABASE_URL: typeof window !== 'undefined' ? env.NEXT_PUBLIC_SUPABASE_URL : undefined,
  SUPABASE_ANON_KEY: typeof window !== 'undefined' ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined,
  
  // Server-side variables - only available on server
  API_URL: typeof window === 'undefined' ? env.API_URL : (env.NEXT_PUBLIC_API_URL || '/api'),
  YOUTUBE_API_KEY: typeof window === 'undefined' ? env.YOUTUBE_API_KEY_LEGACY : undefined,
  
  // Full validated env for server-side code
  VALIDATED: typeof window === 'undefined' ? env : undefined,
} as const;
