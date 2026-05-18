export type AppRole = 'admin' | 'administrator' | 'super_admin' | 'governance_admin' | 'writer' | 'vocalist' | 'producer' | 'literary' | 'studio' | 'user';

export const ADMIN_ROLES: AppRole[] = ['admin', 'administrator', 'super_admin', 'governance_admin'];
export const CONTRIBUTOR_ROLES: AppRole[] = ['writer', 'vocalist', 'producer', 'literary', 'studio'];

export const ALL_ROLES: AppRole[] = [...ADMIN_ROLES, ...CONTRIBUTOR_ROLES, 'user'];

type UserLike = {
  role?: string;
  assigned_roles?: string[];
} | null | undefined;

export function getAssignedRoles(user: UserLike): AppRole[] {
  if (!user) return [];

  const mapped = Array.isArray(user.assigned_roles)
    ? user.assigned_roles.filter((role): role is AppRole => ALL_ROLES.includes(role as AppRole))
    : [];

  // If they have any admin roles in assigned_roles, they are an admin
  if (mapped.some(r => ADMIN_ROLES.includes(r))) {
    return mapped;
  }

  // Check primary role
  const primaryRole = String(user.role || '').toLowerCase() as AppRole;
  if (ADMIN_ROLES.includes(primaryRole)) {
    return [primaryRole, ...CONTRIBUTOR_ROLES];
  }

  if (CONTRIBUTOR_ROLES.includes(primaryRole)) {
    return mapped.length > 0 ? mapped : [primaryRole];
  }

  return mapped;
}

export function hasRoleAccess(user: UserLike, role: AppRole): boolean {
  const roles = getAssignedRoles(user);
  const isAdmin = roles.some(r => ADMIN_ROLES.includes(r));
  return isAdmin || roles.includes(role);
}

export function canAccessAdmin(user: UserLike): boolean {
  if (!user) return false;
  const roles = getAssignedRoles(user);
  const primaryRole = String(user.role || '').toLowerCase() as AppRole;
  
  return ADMIN_ROLES.includes(primaryRole) || roles.some(r => ADMIN_ROLES.includes(r));
}
