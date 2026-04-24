import { NextRequest, NextResponse } from 'next/server';

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
};

const authConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10, // Strict limit for auth endpoints
};

const strictConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 20, // For sensitive operations
};

const cleanupInterval = 60 * 60 * 1000; // Clean up every hour

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, cleanupInterval);

export function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function createRateLimiter(config?: Partial<RateLimitConfig>) {
  const mergedConfig = { ...defaultConfig, ...config };

  return async function rateLimitMiddleware(req: NextRequest, res: NextResponse): Promise<boolean> {
    const key = getRateLimitKey(req);
    const result = checkRateLimit(key, mergedConfig);

    res.headers.set('X-RateLimit-Limit', mergedConfig.maxRequests.toString());
    res.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    res.headers.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

    if (!result.allowed) {
      res.headers.set('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000).toString());
      return false;
    }

    return true;
  };
}

export const rateLimiters = {
  default: createRateLimiter(),
  auth: createRateLimiter(authConfig),
  strict: createRateLimiter(strictConfig),
};
