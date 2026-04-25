/**
 * server/db/repositories/users.ts
 *
 * All database operations for the `users` table.
 * Services import from here — never access `db.table('users')` directly.
 */

import { db, generateId } from '@/lib/database';
import type { User } from '@/server/types';

const table = () => db.table<User>('users');

export const usersRepository = {
  // ─── Reads ──────────────────────────────────────────────────────────────────

  findById(id: string): User | null {
    return table().findById(id);
  },

  findByEmail(email: string): User | null {
    return table().findOne({ email });
  },

  findByGoogleId(googleId: string): User | null {
    return table().findOne({ google_id: googleId } as Partial<User>);
  },

  listAll(): User[] {
    return table().getAll();
  },

  listByRole(role: User['role']): User[] {
    return table().find({ role });
  },

  count(): number {
    return table().count();
  },

  // ─── Writes ─────────────────────────────────────────────────────────────────

  create(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const now = new Date().toISOString();
    return table().insert({
      ...data,
      id: generateId(),
      created_at: now,
      updated_at: now,
    });
  },

  update(id: string, data: Partial<Omit<User, 'id' | 'created_at'>>): User | null {
    return table().update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    });
  },

  delete(id: string): boolean {
    return table().delete(id);
  },

  // ─── Domain helpers ─────────────────────────────────────────────────────────

  setVerified(id: string): User | null {
    return table().update(id, {
      is_verified: true,
      otp_code: undefined,
      otp_expires_at: undefined,
      updated_at: new Date().toISOString(),
    });
  },

  setOtp(id: string, otp: string, expiresAt: string): User | null {
    return table().update(id, {
      otp_code: otp,
      otp_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });
  },

  setBlocked(id: string, blocked: boolean): User | null {
    return table().update(id, {
      is_blocked: blocked,
      updated_at: new Date().toISOString(),
    });
  },

  setPasswordHash(id: string, hash: string): User | null {
    return table().update(id, {
      password_hash: hash,
      otp_code: undefined,
      otp_expires_at: undefined,
      is_verified: true,
      updated_at: new Date().toISOString(),
    });
  },

  setRoles(id: string, role: User['role'], assignedRoles: string[]): User | null {
    return table().update(id, {
      role,
      assigned_roles: assignedRoles,
      updated_at: new Date().toISOString(),
    });
  },
};
