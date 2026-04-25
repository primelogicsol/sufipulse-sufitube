import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders } from '@/app/lib/security-headers';
import { logger } from '@/app/lib/logger';

const middlewareLogger = logger.middleware;

const PROTECTED_PREFIXES = ['/admin', '/user', '/dashboard'];
const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password'];

// Verifies a HS256 JWT using the Web Crypto API (fully Edge-compatible, no jose import).
async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, sigB64] = parts;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sig = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    if (!valid) return false;

    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    );
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Security headers on every response
  addSecurityHeaders(response);
  response.headers.set('X-Request-Id', crypto.randomUUID());

  // Log sensitive path requests
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/admin')) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    middlewareLogger.info(`${request.method} ${pathname}`, {
      ip,
      userAgent: request.headers.get('user-agent'),
    });
  }

  // Block access to internal files
  if (
    pathname.includes('/.git') ||
    pathname.includes('/.env') ||
    pathname.includes('/node_modules')
  ) {
    middlewareLogger.warn('Blocked access to sensitive path', { path: pathname });
    return new NextResponse(null, { status: 404 });
  }

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthRoute = AUTH_ONLY_PATHS.includes(pathname);

  if (isProtected || isAuthRoute) {
    const token = request.cookies.get('access_token')?.value;
    const valid = token ? await verifyToken(token) : false;

    // Unauthenticated → redirect to login
    if (isProtected && !valid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Already authenticated → redirect away from login/register
    if (isAuthRoute && valid) {
      return NextResponse.redirect(new URL('/user/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
