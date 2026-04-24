import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate request body against a Zod schema in Next.js API routes
 */
export async function validateRequestBody(req: NextRequest, schema: z.ZodType<any, any>) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const zodError = result.error as z.ZodError;
      const issues = zodError.issues || [];
      const errors = issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors,
            fieldErrors: zodError.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
        },
      },
      { status: 400 }
    );
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQueryParams(searchParams: URLSearchParams, schema: z.ZodType<any, any>) {
  const params: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const zodError = result.error as z.ZodError;
    const issues = zodError.issues || [];
    const errors = issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return {
      success: false,
      error: {
        message: 'Invalid query parameters',
        code: 'INVALID_QUERY_PARAMS',
        details: errors,
      },
    };
  }

  return { success: true, data: result.data };
}

/**
 * Sanitize string inputs to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Create API error response
 */
export function apiError(message: string, statusCode: number = 500, code?: string, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status: statusCode }
  );
}

/**
 * Create API success response
 */
export function apiSuccess(data: any, message?: string, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  );
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  rateLimitStore.set(identifier, record);
  return true;
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  rateLimitStore.forEach((record, key) => {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}

// Run cleanup every hour
if (typeof global !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}

export default {
  validateRequestBody,
  validateQueryParams,
  sanitizeString,
  isValidEmail,
  isValidSlug,
  apiError,
  apiSuccess,
  checkRateLimit,
};
