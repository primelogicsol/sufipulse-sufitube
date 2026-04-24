import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, getUserById } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'No refresh token provided' },
        },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid refresh token' },
        },
        { status: 401 }
      );
    }

    const user = getUserById(payload.userId as string);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'User not found' },
        },
        { status: 401 }
      );
    }

    // Generate new access token
    const accessToken = await generateAccessToken(user);

    const response = NextResponse.json({
      success: true,
      user,
    });

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Token refresh failed' },
      },
      { status: 500 }
    );
  }
}
