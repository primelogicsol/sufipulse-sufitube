export type AppRole = 'admin' | 'writer' | 'vocalist' | 'producer' | 'literary' | 'studio';

export const CONTRIBUTOR_ROLES: AppRole[] = ['writer', 'vocalist', 'producer', 'literary', 'studio'];

export const ALL_ROLES: AppRole[] = ['admin', ...CONTRIBUTOR_ROLES];

type UserLike = {
  role?: string;
  assigned_roles?: string[];
} | null | undefined;

export function getAssignedRoles(user: UserLike): AppRole[] {
  if (!user) return [];

  const mapped = Array.isArray(user.assigned_roles)
    ? user.assigned_roles.filter((role): role is AppRole => ALL_ROLES.includes(role as AppRole))
    : [];

  if (mapped.length > 0) return mapped;

  if (String(user.role || '').toLowerCase() === 'admin') {
    return ['admin', ...CONTRIBUTOR_ROLES];
  }

  return [...CONTRIBUTOR_ROLES];
}

export function hasRoleAccess(user: UserLike, role: AppRole): boolean {
  const roles = getAssignedRoles(user);
  return roles.includes('admin') || roles.includes(role);
}

export function canAccessAdmin(user: UserLike): boolean {
  return hasRoleAccess(user, 'admin');
}
