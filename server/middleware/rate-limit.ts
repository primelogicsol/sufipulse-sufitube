/**
 * server/middleware/rate-limit.ts
 *
 * In-memory rate limiting for Next.js API routes.
 *
 * Presets:
 *   rateLimiters.default  → 100 req / 15 min
 *   rateLimiters.auth     → 10 req / 15 min  (login, register)
 *   rateLimiters.strict   → 20 req / 15 min  (sensitive ops)
 *
 * For distributed / multi-instance deployments, replace the
 * in-memory `store` Map with a Redis adapter here.
 */

import { type NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
}

export function getClientIp(req: NextRequest): string {
  // x-real-ip is set by Nginx to $remote_addr — not spoofable by the client
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // x-forwarded-for may contain client-supplied IPs prepended before our proxy's entry.
  // Take the LAST entry — that is the one our trusted proxy appended.
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    return parts[parts.length - 1].trim();
  }

  return 'unknown';
}

function check(
  key: string,
  cfg: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + cfg.windowMs });
    return { allowed: true, remaining: cfg.maxRequests - 1, resetAt: now + cfg.windowMs };
  }

  entry.count += 1;
  const allowed = entry.count <= cfg.maxRequests;
  return { allowed, remaining: Math.max(0, cfg.maxRequests - entry.count), resetAt: entry.resetAt };
}

export function createRateLimiter(cfg: RateLimitConfig) {
  return async function rateLimit(req: NextRequest, res: NextResponse): Promise<boolean> {
    const key = getClientIp(req);
    const result = check(key, cfg);

    res.headers.set('X-RateLimit-Limit', String(cfg.maxRequests));
    res.headers.set('X-RateLimit-Remaining', String(result.remaining));
    res.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      res.headers.set('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)));
    }

    return result.allowed;
  };
}

export const rateLimiters = {
  default: createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 }),
  auth:    createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 }),
  strict:  createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20 }),
};

/** Convenience — returns a 429 response with rate-limit headers if exceeded. */
export async function applyRateLimit(
  req: NextRequest,
  limiter: ReturnType<typeof createRateLimiter>
): Promise<NextResponse | null> {
  const res = NextResponse.next();
  const allowed = await limiter(req, res);
  if (allowed) return null;

  return NextResponse.json(
    { success: false, error: { message: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' } },
    { status: 429, headers: Object.fromEntries(res.headers.entries()) }
  );
}
