import { type NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/server/services/auth';
import { sendVerificationEmail } from '@/server/services/email';
import { parseBody, ok, serverError } from '@/server/middleware/validate';
import { rateLimiters, applyRateLimit } from '@/server/middleware/rate-limit';
import { registerSchema } from '@/server/validators/auth';
import { config } from '@/server/config';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, rateLimiters.auth);
  if (limited) return limited;

  const body = await parseBody(req, registerSchema);
  if (body instanceof NextResponse) return body;

  try {
    const result = await registerUser({
      full_name: body.full_name,
      email: body.email,
      password: body.password,
      role: body.role,
    });

    // Send OTP email (fire-and-forget — don't block registration)
    sendVerificationEmail(result.user.email, result.user.full_name, result.otpCode).catch(
      err => console.error('[register] Email send failed:', err)
    );

    const res = NextResponse.json(
      {
        success: true,
        data: result.user,
        message: 'Registration successful. Please verify your email.',
      },
      { status: 201 }
    );

    const cookieOpts = {
      httpOnly: true,
      secure: config.app.isProduction,
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookies.set('access_token', result.accessToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 });
    res.cookies.set('refresh_token', result.refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Registration failed' } },
      { status: 400 }
    );
  }
}
