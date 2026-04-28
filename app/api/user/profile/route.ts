import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';

export async function PATCH(req: NextRequest) {
  const user = await requireAuth(req);
  if ('headers' in user && user instanceof Response) return user;

  let body: { full_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { full_name } = body;
  if (full_name !== undefined && typeof full_name !== 'string') {
    return NextResponse.json({ error: 'Invalid full_name' }, { status: 400 });
  }

  const updates: Partial<{ full_name: string }> = {};
  if (full_name !== undefined) updates.full_name = full_name.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updated = usersRepository.update(user.id, updates);
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { password_hash: _, ...safe } = updated as any;
  return NextResponse.json({ user: safe });
}
