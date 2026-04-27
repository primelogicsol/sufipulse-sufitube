import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const user = usersRepository.findById(id);
  if (!user) return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 });

  const { password_hash, ...safeUser } = user;
  return NextResponse.json({ success: true, data: safeUser });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const user = usersRepository.findById(id);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'User not found' } },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { role, assigned_roles, is_verified, is_blocked } = body as Record<string, unknown>;

  let current = user;

  if (role !== undefined || assigned_roles !== undefined) {
    const nextRole = (role ?? current.role) as 'admin' | 'writer' | 'vocalist' | 'producer' | 'literary' | 'studio' | 'user';
    const nextAssigned = Array.isArray(assigned_roles) ? (assigned_roles as string[]) : (current.assigned_roles ?? []);
    current = usersRepository.setRoles(id, nextRole, nextAssigned) ?? current;
  }

  if (is_blocked !== undefined && typeof is_blocked === 'boolean') {
    current = usersRepository.setBlocked(id, is_blocked) ?? current;
  }

  if (is_verified !== undefined && typeof is_verified === 'boolean') {
    current = usersRepository.update(id, { is_verified }) ?? current;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safeUser } = current;
  return NextResponse.json({ success: true, data: safeUser });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  if (id === auth.id) {
    return NextResponse.json(
      { success: false, error: { message: 'Cannot delete your own account' } },
      { status: 400 }
    );
  }

  const user = usersRepository.findById(id);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'User not found' } },
      { status: 404 }
    );
  }

  usersRepository.delete(id);
  return NextResponse.json({ success: true });
}
