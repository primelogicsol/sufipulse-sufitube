import { type NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken, getUserById } from '@/server/services/auth';
import { ok } from '@/server/middleware/validate';
import { config } from '@/server/config';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, error: { message: 'No refresh token provided' } },
      { status: 401 }
    );
  }

  const payload = await verifyRefreshToken(refreshToken);

  if (!payload?.userId) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid or expired refresh token' } },
      { status: 401 }
    );
  }

  const user = getUserById(payload.userId as string);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'User not found' } },
      { status: 401 }
    );
  }

  const [accessToken, newRefreshToken] = await Promise.all([
    generateAccessToken(user as any),
    generateRefreshToken(user.id),
  ]);

  const res = ok(user);

  res.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: config.app.isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  res.cookies.set('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: config.app.isProduction,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return res;
}
