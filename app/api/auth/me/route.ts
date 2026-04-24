import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, getUserById } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Not authenticated' },
        },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid or expired token' },
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

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Authentication check failed' },
      },
      { status: 500 }
    );
  }
}
