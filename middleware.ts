import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders } from '@/app/lib/security-headers';
import { logger } from '@/app/lib/logger';

const middlewareLogger = logger.middleware;

const PROTECTED_PREFIXES = ['/admin', '/user', '/dashboard', '/api/admin'];
const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password'];
const ADMIN_ROLES = ['admin', 'administrator', 'super_admin', 'governance_admin'];

const BOT_SUBSTRINGS = [
  'googlebot',
  'google-extended',
  'googleother',
  'bingbot',
  'oai-searchbot',
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'claude-web',
  'anthropic-ai',
  'perplexity',
  'applebot',
  'duckduckbot',
  'yandexbot',
  'facebookexternalhit',
  'linkedinbot',
  'twitterbot',
];

function isKnownCrawlerUa(ua: string): boolean {
  const lower = (ua || '').toLowerCase();
  return BOT_SUBSTRINGS.some((b) => lower.includes(b));
}

interface TokenPayload {
  userId?: string;
  email?: string;
  role?: string;
  exp?: number;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return atob(base64);
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production-must-be-32-chars';
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

    const sig = Uint8Array.from(base64UrlDecode(sigB64), (c) => c.charCodeAt(0));

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

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    const { pathname, search } = request.nextUrl;
    const rawHost = (
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase()
      .replace(/:\d+$/, '');

    // 1. Canonical host redirect: www.sufipulse.com -> https://sufipulse.com (308 Permanent)
    if (rawHost === 'www.sufipulse.com') {
      return NextResponse.redirect(`https://sufipulse.com${pathname}${search}`, 308);
    }

    // 2. Dynamic IndexNow key verification endpoint support when custom INDEXNOW_KEY env var is set
    const customIndexNowKey = (process.env.INDEXNOW_KEY || '').trim();
    if (
      customIndexNowKey &&
      /^[A-Za-z0-9-]{8,128}$/.test(customIndexNowKey) &&
      pathname === `/${customIndexNowKey}.txt`
    ) {
      return new NextResponse(customIndexNowKey, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 3. Non-blocking sitewide search & AI crawler hit capture on public document routes
    const userAgent = request.headers.get('user-agent') || '';
    if (
      request.method === 'GET' &&
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/user') &&
      isKnownCrawlerUa(userAgent)
    ) {
      const logUrl = new URL('/api/internal/crawler-log', request.url);
      event.waitUntil(
        fetch(logUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-sp-internal-crawler': '1',
          },
          body: JSON.stringify({ userAgent, path: pathname }),
        }).catch(() => {})
      );
    }

    const response = NextResponse.next();
    addSecurityHeaders(response);

    try {
      response.headers.set('X-Request-Id', crypto.randomUUID());
    } catch {
      response.headers.set('X-Request-Id', Math.random().toString(36).substring(7));
    }

    if (pathname.startsWith('/api/auth') || pathname.startsWith('/admin')) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      middlewareLogger.info(`${request.method} ${pathname}`, {
        ip,
        userAgent,
      });
    }

    if (
      pathname.includes('/.git') ||
      pathname.includes('/.env') ||
      pathname.includes('/node_modules')
    ) {
      middlewareLogger.warn('Blocked access to sensitive path', { path: pathname });
      return new NextResponse(null, { status: 404 });
    }

    if (pathname === '/user/profile/royalties') {
      const url = new URL('/user/royalties', request.url);
      return NextResponse.redirect(url);
    }

    // Allow public/user OAuth callbacks to reach their route handlers, but NEVER bypass admin paths
    if (
      pathname.includes('/callback') &&
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/api/admin')
    ) {
      return response;
    }

    const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    const isAuthRoute = AUTH_ONLY_PATHS.includes(pathname);

    if (isProtected || isAuthRoute) {
      const token = request.cookies.get('access_token')?.value;
      const payload = token ? await verifyToken(token) : null;

      if (isProtected && !payload) {
        if (pathname.startsWith('/api/')) {
          const unauthorizedRes = NextResponse.json(
            { error: 'Not authenticated', code: 'NO_TOKEN' },
            { status: 401 }
          );
          addSecurityHeaders(unauthorizedRes);
          return unauthorizedRes;
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search);
        const redirectRes = NextResponse.redirect(loginUrl);
        addSecurityHeaders(redirectRes);
        return redirectRes;
      }

      if (isAdminPath && payload && !ADMIN_ROLES.includes(payload.role || '')) {
        if (pathname.startsWith('/api/')) {
          const forbiddenRes = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          addSecurityHeaders(forbiddenRes);
          return forbiddenRes;
        }
        return new NextResponse('Forbidden', { status: 403 });
      }

      if (isAuthRoute && payload) {
        const returnTo = request.nextUrl.searchParams.get('returnTo');
        if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
          const redirectRes = NextResponse.redirect(new URL(returnTo, request.url));
          addSecurityHeaders(redirectRes);
          return redirectRes;
        }

        const role = payload.role;
        const dest = ADMIN_ROLES.includes(role || '')
          ? '/admin'
          : role === 'writer'
            ? '/user/writer/dashboard'
            : role === 'vocalist'
              ? '/user/vocalist/dashboard'
              : role === 'producer'
                ? '/user/producer/dashboard'
                : role === 'literary'
                  ? '/user/literary-contributor/dashboard'
                  : role === 'studio'
                    ? '/user/studio/dashboard'
                    : '/user/profile';

        const redirectRes = NextResponse.redirect(new URL(dest, request.url));
        addSecurityHeaders(redirectRes);
        return redirectRes;
      }
    }

    return response;
  } catch (err: any) {
    console.error('Middleware critical error:', err);
    const reqPath = request.nextUrl?.pathname || '';
    if (PROTECTED_PREFIXES.some((p) => reqPath.startsWith(p))) {
      if (reqPath.startsWith('/api/')) {
        return NextResponse.json({ error: 'Authentication check failed' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
