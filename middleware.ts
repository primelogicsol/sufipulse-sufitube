import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders } from '@/app/lib/security-headers';
import { logger } from '@/app/lib/logger';

const middlewareLogger = logger.middleware;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Add security headers to all responses
  addSecurityHeaders(response);

  // Add common security headers
  response.headers.set('X-Request-Id', crypto.randomUUID());

  // Log requests to sensitive paths
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/admin')) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    middlewareLogger.info(`${request.method} ${pathname}`, { ip, userAgent: request.headers.get('user-agent') });
  }

  // Prevent access to internal files
  if (pathname.includes('/.git') || pathname.includes('/.env') || pathname.includes('/node_modules')) {
    middlewareLogger.warn('Blocked access to sensitive path', { path: pathname });
    return new NextResponse(null, { status: 404 });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
