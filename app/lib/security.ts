import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, rateLimiters } from '@/server/middleware/rate-limit';
import { sanitizeObject } from './sanitize';

/**
 * Universal Security Audit & Hardening Utilities
 */

interface SecurityOptions {
  rateLimit?: 'strict' | 'standard' | 'relaxed';
  honeypotField?: string;
  minTimeMs?: number; // Requires startTime in body
  sanitizationRules?: Record<string, 'text' | 'rich_text' | 'url' | 'email' | 'slug'>;
}

/**
 * Validates a public form submission with multiple security layers:
 * 1. Rate limiting
 * 2. Bot detection (Honeypot)
 * 3. Schema validation (Zod)
 * 4. Input sanitization
 */
export async function validatePublicSubmission<T extends z.ZodType<any, any>>(
  req: NextRequest,
  schema: T,
  options: SecurityOptions = {}
): Promise<{ success: true; data: z.infer<T> } | NextResponse> {
  
  // 1. Rate Limiting
  const limiter = options.rateLimit === 'strict' ? rateLimiters.strict : 
                 options.rateLimit === 'relaxed' ? rateLimiters.relaxed : 
                 rateLimiters.standard;
                 
  const limited = await applyRateLimit(req, limiter);
  if (limited) {
    logSecurityEvent(req, 'RATE_LIMIT_EXCEEDED', { endpoint: req.nextUrl.pathname });
    return limited;
  }

  try {
    const body = await req.json();

    // 2. Bot Detection (Honeypot)
    const honeypot = options.honeypotField || '_bot_check';
    if (body[honeypot]) {
      logSecurityEvent(req, 'BOT_DETECTED_HONEYPOT', { endpoint: req.nextUrl.pathname });
      // Return 201 to trick bot into thinking it succeeded, or 400. 
      // User prompt says "malicious payloads are rejected or safely neutralized".
      return NextResponse.json({ success: true, message: 'Institutional intake accepted' }, { status: 201 });
    }

    // 3. Schema Validation
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
          },
        },
        { status: 400 }
      );
    }

    // 4. Input Sanitization
    let data = result.data;
    if (options.sanitizationRules) {
      data = sanitizeObject(data, options.sanitizationRules as any);
    } else {
      // Default auto-sanitization for all string fields in the schema
      const autoRules: any = {};
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          if (key.includes('email')) autoRules[key] = 'email';
          else if (key.includes('url') || key.includes('website') || key.includes('link')) autoRules[key] = 'url';
          else autoRules[key] = 'text';
        }
      });
      data = sanitizeObject(data, autoRules);
    }

    return { success: true, data };

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON payload', code: 'INVALID_PAYLOAD' } },
      { status: 400 }
    );
  }
}

/**
 * Log security events for auditing
 */
export function logSecurityEvent(req: NextRequest, type: string, details: any) {
  const timestamp = new Date().toISOString();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  
  console.warn(`[SECURITY_EVENT] ${type} | ${timestamp} | IP: ${ip} | UA: ${ua} | Details: ${JSON.stringify(details)}`);
  
  // In production, this would go to a database or external logging service (Sentry, etc.)
}

/**
 * XSS-Safe Link Component Helper (Server-side check)
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return true;
  return /^(https?:\/\/|mailto:|\/)/i.test(url) && !/javascript:/i.test(url);
}
