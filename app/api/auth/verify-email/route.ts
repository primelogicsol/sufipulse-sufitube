import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail, sendPasswordResetOTP, resetPassword } from '@/lib/auth';
import { z } from 'zod';
import { validateRequestBody } from '@/app/lib/api-middleware';
import { rateLimiters } from '@/app/lib/rate-limiter';

// Verify email schema
const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Reset password schema
const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

export async function POST(req: NextRequest) {
  const response = NextResponse.next();
  const isAllowed = await rateLimiters.strict(req, response);

  if (!isAllowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many attempts. Please try again later.' } },
      { status: 429, headers: Object.fromEntries(response.headers.entries()) }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'verify': {
        const validation = await validateRequestBody(req, verifyEmailSchema);
        if (!(validation as any).success) {
          return NextResponse.json(validation, { status: 400 });
        }

        const result = await verifyEmail((validation as any).data.email, (validation as any).data.otp);
        return NextResponse.json(result, {
          status: result.success ? 200 : 400,
        });
      }

      case 'forgot': {
        const validation = await validateRequestBody(req, forgotPasswordSchema);
        if (!(validation as any).success) {
          return NextResponse.json(validation, { status: 400 });
        }

        const result = await sendPasswordResetOTP((validation as any).data.email);
        return NextResponse.json(result);
      }

      case 'reset': {
        const validation = await validateRequestBody(req, resetPasswordSchema);
        if (!(validation as any).success) {
          return NextResponse.json(validation, { status: 400 });
        }

        const result = await resetPassword(
          (validation as any).data.email,
          (validation as any).data.otp,
          (validation as any).data.password
        );

        return NextResponse.json(result, {
          status: result.success ? 200 : 400,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: 'Invalid action' } },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }
}
