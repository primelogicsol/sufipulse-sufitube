import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { usersRepository } from '@/server/db/repositories/users';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const users = usersRepository.listAll().map(({ password_hash, ...u }) => u);
  return NextResponse.json({ success: true, data: users });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { email, full_name, role, assigned_roles } = body as Record<string, unknown>;

  if (!email || typeof email !== 'string' || !full_name || typeof full_name !== 'string') {
    return NextResponse.json(
      { success: false, error: { message: 'email and full_name are required' } },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid email address' } },
      { status: 400 }
    );
  }

  const existing = usersRepository.findByEmail(email.trim().toLowerCase());
  if (existing) {
    return NextResponse.json(
      { success: false, error: { message: 'A user with this email already exists' } },
      { status: 409 }
    );
  }

  const resolvedRole = (role === 'admin' ? 'admin' : 'user') as 'admin' | 'user';
  const resolvedAssignedRoles = Array.isArray(assigned_roles)
    ? (assigned_roles as string[])
    : ['writer', 'vocalist', 'producer', 'literary', 'studio'];

  // Generate a secure random temp password — user resets via forgot-password flow
  const tempPassword = `SP_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const password_hash = await bcrypt.hash(tempPassword, 10);

  const created = usersRepository.create({
    email: email.trim().toLowerCase(),
    full_name: full_name.trim(),
    password_hash,
    role: resolvedRole,
    assigned_roles: resolvedAssignedRoles,
    is_verified: true,
    is_blocked: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _ph, ...safeUser } = created;
  return NextResponse.json({ success: true, data: safeUser }, { status: 201 });
}
