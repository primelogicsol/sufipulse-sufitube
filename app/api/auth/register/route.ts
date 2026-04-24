import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { registerSchema } from '@/app/lib/validation-schemas';
import { rateLimiters } from '@/app/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const response = NextResponse.next();
  const isAllowed = await rateLimiters.auth(req, response);

  if (!isAllowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many registration attempts. Please try again later.' } },
      { status: 429, headers: Object.fromEntries(response.headers.entries()) }
    );
  }
  try {
    const validation = await validateRequestBody(req, registerSchema);

    if (!(validation as any).success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const { full_name, email, password, role } = (validation as any).data;
    const result = await registerUser({ full_name, email, password, role });

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Registration successful. Please verify your email.',
      // TODO: Remove otpCode in production - send via email instead
      otpCode: process.env.NODE_ENV === 'development' ? result.otpCode : undefined,
    });

    // Set HTTP-only cookies
    response.cookies.set('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    response.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Registration failed' },
      },
      { status: 400 }
    );
  }
}
