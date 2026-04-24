/**
 * Next.js Middleware for Route Protection
 * 
 * - Protects /admin and /user routes
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated users away from /login and /register
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes: require authentication
  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/user') ||
    pathname.startsWith('/dashboard');

  // Auth routes: redirect if already logged in
  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

  // If protected route and no token, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If auth route and already logged in, redirect to dashboard
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/user/dashboard', request.url));
  }

  return NextResponse.next();
}

// Matcher configuration
export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/dashboard/:path*',
    '/login',
    '/register',
    '/forgot-password',
  ],
};
