"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { User, Shield, Search, RefreshCw, UserPlus, X, Ban, Trash2, CheckCircle } from 'lucide-react';
import { ALL_ROLES } from '@/app/lib/role-access';

type AdminUser = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  assigned_roles?: string[];
  is_verified?: boolean;
  is_blocked?: boolean;
  created_at?: string;
};

type ConfirmAction = { type: 'block' | 'unblock' | 'delete'; user: AdminUser };

const PROTECTED_EMAILS = ['admin@sufipulse.local'];

const CONTRIBUTOR_ROLES = ['writer', 'vocalist', 'producer', 'literary', 'studio'];

const defaultNewUser = () => ({
  email: '',
  full_name: '',
  role: 'user' as 'user' | 'admin',
  assigned_roles: [...CONTRIBUTOR_ROLES] as string[],
});

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [newUser, setNewUser] = useState(defaultNewUser());
  const [addError, setAddError] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) {
      setPageError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refresh = () => fetchUsers();

  const filtered = useMemo(() => {
    return users.filter((item) => {
      const matchesQuery = !query || `${item.full_name || ''} ${item.email || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'blocked' && item.is_blocked) ||
        (statusFilter === 'active' && !item.is_blocked);
      return matchesQuery && matchesStatus;
    });
  }, [users, query, statusFilter]);

  const updateRole = async (id: string, role: 'admin' | 'user') => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const assigned_roles =
      role === 'admin'
        ? ['admin', ...CONTRIBUTOR_ROLES]
        : user.assigned_roles || [...CONTRIBUTOR_ROLES];
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, assigned_roles }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? data.data : u)));
    } catch (e: any) {
      setPageError(e.message);
    }
  };

  const toggleAssignedRole = async (id: string, role: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    const assigned = new Set(user.assigned_roles || []);
    if (assigned.has(role)) {
      assigned.delete(role);
    } else {
      assigned.add(role);
    }
    if (user.role === 'admin') assigned.add('admin');

    const nextRole = assigned.has('admin') ? 'admin' : 'user';
    const assigned_roles = Array.from(assigned);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole, assigned_roles }),
      });
      if (!res.ok) throw new Error('Failed to update roles');
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? data.data : u)));
    } catch (e: any) {
      setPageError(e.message);
    }
  };

  const adminCount = users.filter((item) => item.role === 'admin').length;
  const blockedCount = users.filter((item) => item.is_blocked).length;

  const blockUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_blocked: true }),
      });
      if (!res.ok) throw new Error('Failed to block user');
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? data.data : u)));
    } catch (e: any) {
      setPageError(e.message);
    }
  };

  const unblockUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_blocked: false }),
      });
      if (!res.ok) throw new Error('Failed to unblock user');
      const data = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? data.data : u)));
    } catch (e: any) {
      setPageError(e.message);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      setPageError(e.message);
    }
  };

  const confirmAndExecute = async () => {
    if (!confirmAction) return;
    const { type, user: target } = confirmAction;
    setConfirmAction(null);
    if (type === 'block') await blockUser(target.id);
    else if (type === 'unblock') await unblockUser(target.id);
    else if (type === 'delete') await deleteUser(target.id);
  };

  const isProtected = (email?: string) =>
    PROTECTED_EMAILS.includes((email || '').toLowerCase());

  const addUser = async () => {
    setAddError('');
    const email = newUser.email.trim().toLowerCase();
    const full_name = newUser.full_name.trim();

    if (!email || !full_name) {
      setAddError('Email and full name are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAddError('Please enter a valid email address.');
      return;
    }

    const assigned_roles =
      newUser.role === 'admin'
        ? ['admin', ...CONTRIBUTOR_ROLES]
        : newUser.assigned_roles.length > 0
        ? newUser.assigned_roles
        : [...CONTRIBUTOR_ROLES];

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name, role: newUser.role, assigned_roles }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error?.message || 'Failed to create user');
        return;
      }
      setUsers((prev) => [...prev, data.data]);
      setShowAddModal(false);
      setNewUser(defaultNewUser());
    } catch (e: any) {
      setAddError(e.message);
    }
  };

  const toggleNewUserRole = (role: string) => {
    setNewUser((prev) => {
      const current = new Set(prev.assigned_roles);
      if (current.has(role)) {
        current.delete(role);
      } else {
        current.add(role);
      }
      const isAdmin = role === 'admin' ? current.has('admin') : prev.role === 'admin';
      return {
        ...prev,
        role: isAdmin ? 'admin' : 'user',
        assigned_roles: Array.from(current),
      };
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">User & Role Management</h1>
              <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
                Manage account access levels for workflow governance.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--dash-text-secondary)]">
                <span>Total users: {users.length}</span>
                <span>Admins: {adminCount}</span>
                <span>Members: {users.length - adminCount}</span>
                {blockedCount > 0 && <span style={{color: 'var(--dash-status-rejected)'}}>Blocked: {blockedCount}</span>}
              </div>
            </div>
            <button
              onClick={() => { setShowAddModal(true); setAddError(''); setNewUser(defaultNewUser()); }}
              className="dashboard-btn-primary inline-flex items-center gap-2 shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                className="dashboard-input has-icon"
              />
            </div>
            <button onClick={refresh} className="dashboard-btn-secondary inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
              className="dashboard-input max-w-36"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {pageError && (
            <p className="text-sm mb-4" style={{color: 'var(--dash-status-rejected)'}}>{pageError}</p>
          )}

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Assigned Access Roles</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[var(--dash-text-muted)]">Loading users…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[var(--dash-text-muted)]">No users found</td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {item.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-[var(--dash-accent)]" />
                          ) : (
                            <User className="w-4 h-4 text-[var(--dash-text-muted)]" />
                          )}
                          <div>
                            <div className="font-medium text-[var(--dash-text-primary)]">{item.full_name || 'Unknown'}</div>
                            <div className="text-xs text-[var(--dash-text-muted)]">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--dash-text-secondary)] capitalize">{item.role || 'user'}</td>
                      <td>
                        <div className="flex flex-wrap gap-2 max-w-[360px]">
                          {ALL_ROLES.map((role) => {
                            const checked = (item.assigned_roles || []).includes(role);
                            const disabled = item.role === 'admin' && role === 'admin';
                            return (
                              <label key={`${item.id}-${role}`} className="inline-flex items-center gap-1 text-xs text-[var(--dash-text-secondary)]">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => toggleAssignedRole(item.id, role)}
                                />
                                <span className="capitalize">{role}</span>
                              </label>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        {item.is_blocked ? (
                          <span className="dashboard-badge dashboard-badge-rejected">Blocked</span>
                        ) : (
                          <span className="dashboard-badge dashboard-badge-approved">Active</span>
                        )}
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <div className="flex justify-end flex-wrap gap-2">
                          <button onClick={() => updateRole(item.id, 'user')} className="dashboard-btn-secondary text-xs">Set User</button>
                          <button onClick={() => updateRole(item.id, 'admin')} className="dashboard-btn-primary text-xs">Set Admin</button>
                          {!isProtected(item.email) && (
                            <>
                              {item.is_blocked ? (
                                <button
                                  onClick={() => setConfirmAction({ type: 'unblock', user: item })}
                                  className="dashboard-btn-secondary text-xs inline-flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Unblock
                                </button>
                              ) : (
                                <button
                                  onClick={() => setConfirmAction({ type: 'block', user: item })}
                                  className="dashboard-btn-secondary text-xs inline-flex items-center gap-1"
                                  style={{color: 'var(--dash-status-pending)'}}
                                >
                                  <Ban className="w-3 h-3" /> Block
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmAction({ type: 'delete', user: item })}
                                className="dashboard-btn-secondary text-xs inline-flex items-center gap-1"
                                style={{color: 'var(--dash-status-rejected)'}}
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="dashboard-card w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--dash-text-primary)]">
                {confirmAction.type === 'delete' ? 'Delete User' : confirmAction.type === 'block' ? 'Block User' : 'Unblock User'}
              </h2>
              <button onClick={() => setConfirmAction(null)} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--dash-text-secondary)]">
              {confirmAction.type === 'delete' && <>Are you sure you want to <span className="font-medium" style={{color: 'var(--dash-status-rejected)'}}>permanently delete</span> <span className="font-medium text-[var(--dash-text-primary)]">{confirmAction.user.full_name || confirmAction.user.email}</span>? This cannot be undone.</>}
              {confirmAction.type === 'block' && <><span className="font-medium text-[var(--dash-text-primary)]">{confirmAction.user.full_name || confirmAction.user.email}</span> will not be able to log in.</>}
              {confirmAction.type === 'unblock' && <><span className="font-medium text-[var(--dash-text-primary)]">{confirmAction.user.full_name || confirmAction.user.email}</span> will regain platform access.</>}
            </p>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setConfirmAction(null)} className="dashboard-btn-secondary">Cancel</button>
              <button
                onClick={confirmAndExecute}
                className={confirmAction.type === 'delete' ? 'dashboard-btn-danger' : 'dashboard-btn-primary'}
              >
                {confirmAction.type === 'delete' ? 'Delete' : confirmAction.type === 'block' ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="dashboard-card w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--dash-text-primary)]">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-[var(--dash-text-secondary)] mb-1">Full Name *</label>
                <input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="e.g. Ahmad Khan"
                  className="dashboard-input"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--dash-text-secondary)] mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="dashboard-input"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--dash-text-secondary)] mb-2">Assign Roles</label>
                <div className="flex flex-wrap gap-3">
                  {ALL_ROLES.map((role) => {
                    const checked = newUser.assigned_roles.includes(role) || (role === 'admin' && newUser.role === 'admin');
                    return (
                      <label key={role} className="inline-flex items-center gap-1.5 text-sm text-[var(--dash-text-secondary)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNewUserRole(role)}
                          className="accent-[var(--dash-accent)]"
                        />
                        <span className="capitalize">{role}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--dash-text-muted)] mt-1">Checking "admin" grants full platform access.</p>
              </div>

              {addError && (
                <p className="text-sm" style={{color: 'var(--dash-status-rejected)'}}>{addError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddModal(false)} className="dashboard-btn-secondary">Cancel</button>
              <button onClick={addUser} className="dashboard-btn-primary inline-flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
