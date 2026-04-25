/**
 * server/middleware/validate.ts
 *
 * Request validation helpers for Next.js API routes.
 *
 * Usage:
 *   const body = await parseBody(req, loginSchema);
 *   if (body instanceof Response) return body;      // validation error
 *   const { email, password } = body;               // typed data
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ─── Body parsing ─────────────────────────────────────────────────────────────

/** Parse and validate the request JSON body against a Zod schema. */
export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T | NextResponse> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON', code: 'INVALID_JSON' } },
      { status: 400 }
    );
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const issues = result.error.issues ?? [];
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: issues.map(e => ({ field: e.path.join('.'), message: e.message })),
          fieldErrors: result.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  return result.data;
}

// ─── Query param parsing ──────────────────────────────────────────────────────

/** Parse and validate URL search params against a Zod schema. */
export function parseQuery<T>(
  params: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: NextResponse } {
  const raw: Record<string, string> = {};
  params.forEach((v, k) => { raw[k] = v; });

  const result = schema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues ?? [];
    return {
      success: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid query parameters',
            code: 'INVALID_QUERY',
            details: issues.map(e => ({ field: e.path.join('.'), message: e.message })),
          },
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, message?: string, status = 200): NextResponse {
  return NextResponse.json({ success: true, data, ...(message && { message }) }, { status });
}

export function created<T>(data: T): NextResponse {
  return ok(data, undefined, 201);
}

export function notFound(message = 'Not found'): NextResponse {
  return NextResponse.json(
    { success: false, error: { message, code: 'NOT_FOUND' } },
    { status: 404 }
  );
}

export function badRequest(message: string, code?: string): NextResponse {
  return NextResponse.json(
    { success: false, error: { message, ...(code && { code }) } },
    { status: 400 }
  );
}

export function serverError(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : 'Internal server error';
  return NextResponse.json(
    { success: false, error: { message, code: 'INTERNAL_ERROR' } },
    { status: 500 }
  );
}
