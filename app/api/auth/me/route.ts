import { type NextRequest } from 'next/server';
import { requireAuth } from '@/server/middleware/authenticate';
import { ok } from '@/server/middleware/validate';

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if ('headers' in user && user instanceof Response) return user; // 401

  return ok(user);
}
