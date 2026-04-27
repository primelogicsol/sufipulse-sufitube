import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';
import { auditLog } from '@/app/lib/audit-log';

export const dynamic = 'force-dynamic';

type UserRole = 'writer' | 'vocalist' | 'producer' | 'literary' | 'studio' | 'user';
const VALID_ROLES: UserRole[] = ['writer', 'vocalist', 'producer', 'literary', 'studio', 'user'];

// DELETE /api/admin/users/[id]/role
// Body: { role: 'writer' | 'vocalist' | ... }
// Removes a specific role from assigned_roles. If no roles remain, reverts primary role to 'user'.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const user = usersRepository.findById(id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let body: { role?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const roleToRemove = body.role as UserRole;
  if (!roleToRemove || !VALID_ROLES.includes(roleToRemove)) {
    return NextResponse.json({ error: 'Valid role required' }, { status: 400 });
  }

  const existing = user.assigned_roles ?? [];
  const nextAssigned = existing.filter(r => r !== roleToRemove);
  const nextPrimary: UserRole = nextAssigned.length > 0 ? (nextAssigned[0] as UserRole) : 'user';

  const updated = usersRepository.setRoles(id, nextPrimary, nextAssigned);

  auditLog({
    userId: auth.id,
    userEmail: auth.email,
    action: 'role_revoked',
    resourceType: 'user',
    resourceId: id,
    details: { revokedRole: roleToRemove, remainingRoles: nextAssigned, newPrimaryRole: nextPrimary },
  });

  const { password_hash, ...safe } = updated!;
  return NextResponse.json({ success: true, data: safe });
}
