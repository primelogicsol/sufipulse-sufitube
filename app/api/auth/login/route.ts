import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { loginSchema } from '@/app/lib/validation-schemas';
import { rateLimiters, getRateLimitKey } from '@/app/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const response = NextResponse.next();
  const isAllowed = await rateLimiters.auth(req, response);

  if (!isAllowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many login attempts. Please try again later.' } },
      { status: 429, headers: Object.fromEntries(response.headers.entries()) }
    );
  }

  try {
    const validation = await validateRequestBody(req, loginSchema);

    if (!(validation as any).success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const { email, password } = (validation as any).data;
    const result = await loginUser(email, password);

    const loginResponse = NextResponse.json({
      success: true,
      user: result.user,
    }, { headers: Object.fromEntries(response.headers.entries()) });

    // Set HTTP-only cookies
    loginResponse.cookies.set('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    loginResponse.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return loginResponse;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Login failed' },
      },
      { status: 401, headers: Object.fromEntries(response.headers.entries()) }
    );
  }
}
