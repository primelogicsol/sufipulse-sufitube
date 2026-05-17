import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders } from '@/app/lib/security-headers';
import { logger } from '@/app/lib/logger';

const middlewareLogger = logger.middleware;

const PROTECTED_PREFIXES = ['/admin', '/user', '/dashboard'];
const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password'];
const ADMIN_ROLES = ['admin', 'super_admin', 'governance_admin'];

interface TokenPayload {
  userId?: string;
  email?: string;
  role?: string;
  exp?: number;
}

// Robust base64url decoding with padding support for Edge Runtime
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return atob(base64);
}

// Verifies a HS256 JWT using the Web Crypto API (fully Edge-compatible, no jose import).
// Returns the decoded payload on success, or null on failure.
async function verifyToken(token: string): Promise<TokenPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sig = Uint8Array.from(
      base64UrlDecode(sigB64),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    if (!valid) return null;

    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadB64));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Security headers on every response
    const response = NextResponse.next();
    addSecurityHeaders(response);
    
    try {
      response.headers.set('X-Request-Id', crypto.randomUUID());
    } catch {
      response.headers.set('X-Request-Id', Math.random().toString(36).substring(7));
    }

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

    // Redirect old royalties URL to new clean URL
    if (pathname === '/user/profile/royalties') {
      const url = new URL('/user/royalties', request.url);
      return NextResponse.redirect(url);
    }

    const isAdminPath = pathname.startsWith('/admin');
    const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
    const isAuthRoute = AUTH_ONLY_PATHS.includes(pathname);

    if (isProtected || isAuthRoute) {
      const token = request.cookies.get('access_token')?.value;
      const payload = token ? await verifyToken(token) : null;

      // Unauthenticated → redirect to login
      if (isProtected && !payload) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search);
        const redirectRes = NextResponse.redirect(loginUrl);
        addSecurityHeaders(redirectRes);
        return redirectRes;
      }

      // Authenticated but not admin → 403 for /admin routes (excluding setup)
      if (isAdminPath && !pathname.startsWith('/admin/setup') && payload && !ADMIN_ROLES.includes(payload.role || '')) {
        return new NextResponse('Forbidden', { status: 403 });
      }

      // Already authenticated → redirect away from login/register
      if (isAuthRoute && payload) {
        // Respect returnTo if provided, otherwise role-based dashboard
        const returnTo = request.nextUrl.searchParams.get('returnTo');
        if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
          const redirectRes = NextResponse.redirect(new URL(returnTo, request.url));
          addSecurityHeaders(redirectRes);
          return redirectRes;
        }

        const role = payload.role;
        const dest = ADMIN_ROLES.includes(role || '') ? '/admin'
          : role === 'writer' ? '/user/writer/dashboard'
          : role === 'vocalist' ? '/user/vocalist/dashboard'
          : role === 'producer' ? '/user/producer/dashboard'
          : role === 'literary' ? '/user/literary-contributor/dashboard'
          : role === 'studio' ? '/user/studio/dashboard'
          : '/user/profile';
        
        const redirectRes = NextResponse.redirect(new URL(dest, request.url));
        addSecurityHeaders(redirectRes);
        return redirectRes;
      }
    }

    return response;
  } catch (err: any) {
    console.error('Middleware critical error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

