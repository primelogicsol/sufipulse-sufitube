import { type NextRequest, NextResponse } from 'next/server';
import { verifyEmail, sendPasswordResetOTP, resetPassword } from '@/server/services/auth';
import { parseBody } from '@/server/middleware/validate';
import { rateLimiters, applyRateLimit } from '@/server/middleware/rate-limit';
import { verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '@/server/validators/auth';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, rateLimiters.strict);
  if (limited) return limited;

  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON' } },
      { status: 400 }
    );
  }

  const { action } = rawBody ?? {};

  try {
    switch (action) {
      case 'verify': {
        const parsed = verifyEmailSchema.safeParse(rawBody);
        if (!parsed.success) {
          return NextResponse.json({ success: false, error: { message: 'Validation failed', details: parsed.error.flatten() } }, { status: 400 });
        }
        const result = await verifyEmail(parsed.data.email, parsed.data.otp);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      case 'forgot': {
        const parsed = forgotPasswordSchema.safeParse(rawBody);
        if (!parsed.success) {
          return NextResponse.json({ success: false, error: { message: 'Invalid email' } }, { status: 400 });
        }
        const result = await sendPasswordResetOTP(parsed.data.email);
        return NextResponse.json(result);
      }

      case 'reset': {
        const parsed = resetPasswordSchema.safeParse(rawBody);
        if (!parsed.success) {
          return NextResponse.json({ success: false, error: { message: 'Validation failed', details: parsed.error.flatten() } }, { status: 400 });
        }
        const result = await resetPassword(parsed.data.email, parsed.data.otp, parsed.data.password);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: 'Invalid action. Use: verify | forgot | reset' } },
          { status: 400 }
        );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Request failed' } },
      { status: 500 }
    );
  }
}
