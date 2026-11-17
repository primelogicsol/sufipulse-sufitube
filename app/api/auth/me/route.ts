import { type NextRequest } from 'next/server';
import { requireAuth } from '@/server/middleware/authenticate';
import { ok } from '@/server/middleware/validate';

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if ('headers' in user && user instanceof Response) {
    // For anonymous visitors, return clean 200 with null user instead of noisy 401
    return ok(null);
  }

  return ok(user);
}
