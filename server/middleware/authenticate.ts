/**
 * server/middleware/authenticate.ts
 *
 * JWT authentication helpers for Next.js API route handlers.
 *
 * Usage in a route:
 *   const user = await getAuthUser(request);
 *   if (!user) return unauthorized();
 *
 *   const admin = await requireRole(request, 'admin');
 *   if (admin instanceof Response) return admin; // 401/403 response
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '../services/auth';
import { usersRepository } from '../db/repositories/users';
import type { User } from '../types';

type AuthUser = Omit<User, 'password_hash'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string | null {
  return req.cookies.get('access_token')?.value ?? null;
}

/** Returns the authenticated user or null (no side effects). */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = extractToken(req);
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload?.userId) return null;

  const user = usersRepository.findById(payload.userId as string);
  if (!user || user.is_blocked) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

/** Returns the user or a 401 Response. */
export async function requireAuth(
  req: NextRequest
): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
  return user;
}

/** Returns the user or a 401/403 Response if role doesn't match. */
export async function requireRole(
  req: NextRequest,
  ...roles: User['role'][]
): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;

  if (!roles.includes(result.role as User['role'])) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  return result;
}

/** Convenience — require admin role. */
export const requireAdmin = (req: NextRequest) => requireRole(req, 'admin', 'administrator' as any, 'super_admin' as any, 'governance_admin' as any);
