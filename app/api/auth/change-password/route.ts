import { type NextRequest, NextResponse } from 'next/server';
import { changePassword } from '@/server/services/auth';
import { requireAuth } from '@/server/middleware/authenticate';
import { parseBody } from '@/server/middleware/validate';
import { changePasswordSchema } from '@/server/validators/auth';

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if ('headers' in user && user instanceof Response) return user;

  const body = await parseBody(req, changePasswordSchema);
  if (body instanceof NextResponse) return body;

  const result = await changePassword(user.id, body.oldPassword, body.newPassword);
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json({ message: result.message });
}
