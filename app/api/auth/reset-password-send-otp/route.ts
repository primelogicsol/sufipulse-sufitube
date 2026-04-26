import { type NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetOTP } from '@/server/services/auth';
import { parseBody } from '@/server/middleware/validate';
import { rateLimiters, applyRateLimit } from '@/server/middleware/rate-limit';
import { forgotPasswordSchema } from '@/server/validators/auth';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, rateLimiters.strict);
  if (limited) return limited;

  const body = await parseBody(req, forgotPasswordSchema);
  if (body instanceof NextResponse) return body;

  try {
    const result = await sendPasswordResetOTP(body.email);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Request failed' } },
      { status: 500 }
    );
  }
}
