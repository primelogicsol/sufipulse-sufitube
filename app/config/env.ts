import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

/**
 * app/config/env.ts
 *
 * Runtime environment validation using @t3-oss/env-nextjs.
 *
 * REQUIRED  → app crashes at startup if missing (only truly critical vars)
 * OPTIONAL  → feature degrades gracefully when not set
 *
 * Standalone-first: the app runs without any external service configured.
 * Set optional vars to enable the corresponding features.
 */

export const env = createEnv({
  // Skip validation during Docker build and CI — secrets are only available at runtime.
  skipValidation: process.env.CI === 'true' || process.env.SKIP_ENV_VALIDATION === 'true',
  emptyStringAsUndefined: true,

  // ── Server-only variables ───────────────────────────────────────────────────
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // Auth — REQUIRED: without these JWT signing fails
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),

    // Database — optional: defaults to file-based JSON (.data/)
    DATABASE_URL: z.string().optional(),
    DIRECT_URL: z.string().optional(),
    DB_TYPE: z.enum(["file", "postgres"]).default("file"),

    // Email — optional: defaults to console logging
    EMAIL_PROVIDER: z
      .enum(["console", "smtp", "sendgrid", "resend"])
      .default("console"),
    SMTP_HOST: z.string().default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .string()
      .transform((v) => v === "true")
      .default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    FROM_EMAIL: z.string().email().default("noreply@sufipulse.com"),
    SENDGRID_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),

    // YouTube — optional: enables release imports and metadata
    YOUTUBE_API_KEY: z.string().optional(),
    YOUTUBE_CHANNEL_ID: z.string().optional(),

    // Stripe — optional: enables song adoption / payment features
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Google Ads — optional
    GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),
    GOOGLE_ADS_CLIENT_ID: z.string().optional(),
    GOOGLE_ADS_CLIENT_SECRET: z.string().optional(),

    // Misc
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    API_URL: z.string().url().default("http://localhost:3000/api"),
  },

  // ── Client (browser-exposed) variables ────────────────────────────────────
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3000/api"),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_YOUTUBE_API_KEY: z.string().optional(),
    NEXT_PUBLIC_ENABLE_USER_GOOGLE_ADS: z.enum(['true', 'false']).optional(),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
    NEXT_PUBLIC_ENABLE_USER_GOOGLE_ADS: process.env.NEXT_PUBLIC_ENABLE_USER_GOOGLE_ADS,
  },

  onValidationError: (error) => {
    const formatted = (error as { format?: () => Record<string, unknown> }).format?.();
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
        "\x1b[31m❌  Environment validation failed\x1b[0m",
        "  The following required variables are missing:",
        "",
        ...lines,
        "",
        "  Fix the variables above in your .env.local file and restart.",
        "  See .env.example for documentation.",
        "",
      ].join("\n")
    );

    process.exit(1);
  },
});

export type Env = typeof env;

// Backward-compat: client-safe values (must use process.env directly — not the t3 proxy)
export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
  YOUTUBE_API_KEY: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
} as const;
