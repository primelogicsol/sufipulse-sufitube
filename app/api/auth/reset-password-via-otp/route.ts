import { type NextRequest, NextResponse } from 'next/server';
import { resetPasswordViaTempToken } from '@/server/services/auth';
import { parseBody } from '@/server/middleware/validate';
import { rateLimiters, applyRateLimit } from '@/server/middleware/rate-limit';
import { resetViaTokenSchema } from '@/server/validators/auth';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, rateLimiters.strict);
  if (limited) return limited;

  const body = await parseBody(req, resetViaTokenSchema);
  if (body instanceof NextResponse) return body;

  try {
    const result = await resetPasswordViaTempToken(body.email, body.tempToken, body.password);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Request failed' } },
      { status: 500 }
    );
  }
}
