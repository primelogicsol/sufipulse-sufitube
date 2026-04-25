import { type NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/server/services/auth';
import { parseBody, ok, serverError } from '@/server/middleware/validate';
import { rateLimiters, applyRateLimit } from '@/server/middleware/rate-limit';
import { loginSchema } from '@/server/validators/auth';
import { config } from '@/server/config';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, rateLimiters.auth);
  if (limited) return limited;

  const body = await parseBody(req, loginSchema);
  if (body instanceof NextResponse) return body;

  try {
    const result = await loginUser(body.email, body.password);
    const res = ok(result.user);

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
      { success: false, error: { message: err.message || 'Login failed' } },
      { status: 401 }
    );
  }
}
