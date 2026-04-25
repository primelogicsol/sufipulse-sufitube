/**
 * server/index.ts
 *
 * Top-level barrel for the server module.
 *
 * Directory layout:
 *   server/config.ts          — all environment variables
 *   server/types/             — TypeScript interfaces
 *   server/db/                — database layer
 *     drivers/                — file-based JSON (default) or Postgres
 *     repositories/           — typed CRUD per domain entity
 *   server/services/          — business logic
 *     auth.ts                 — JWT, bcrypt, OTP, user auth flows
 *     email.ts                — email sending (SMTP / SendGrid / Resend)
 *     youtube.ts              — YouTube Data API v3
 *     stripe.ts               — Stripe payments
 *   server/middleware/        — Next.js API route helpers
 *     authenticate.ts         — JWT verification, role guard
 *     rate-limit.ts           — in-memory rate limiting
 *     validate.ts             — Zod body/query parsing, response helpers
 *   server/validators/        — Zod schemas grouped by domain
 *     auth.ts                 — login, register, OTP
 *     profiles.ts             — contributor profiles
 *     content.ts              — kalams, sadas, articles
 *     releases.ts             — CMS releases
 *
 * Import pattern in API routes:
 *   import { loginUser }        from '@/server/services/auth';
 *   import { parseBody, ok }    from '@/server/middleware/validate';
 *   import { loginSchema }      from '@/server/validators/auth';
 *   import { usersRepository }  from '@/server/db';
 */

export { config } from './config';
export * from './types';
export * from './db';
export * from './services';
export * from './middleware';
export * from './validators';
