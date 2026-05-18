// app/admin/cms/roles/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Shield, User, Check, Minus, Users, ExternalLink } from 'lucide-react';
import { ALL_ROLES, type AppRole, ADMIN_ROLES } from '@/app/lib/role-access';

/* ─── Role metadata ─── */
type RoleMeta = {
  label: string;
  bgVar: string;
  fgVar: string;
  description: string;
  workflowSummary: string;
};

const ROLE_META: Record<AppRole, RoleMeta> = {
  admin: {
    label: 'Primary Administrator',
    bgVar: 'var(--dash-accent-muted)',
    fgVar: 'var(--dash-accent)',
    description: 'Full platform governance — all workflow stages, CMS, users, royalties, finance.',
    workflowSummary: 'All Stages',
  },
  administrator: {
    label: 'Institutional Administrator',
    bgVar: 'var(--dash-accent-muted)',
    fgVar: 'var(--dash-accent)',
    description: 'Canonical administrative role for institutional oversight and management.',
    workflowSummary: 'All Stages',
  },
  super_admin: {
    label: 'Super Administrator',
    bgVar: 'var(--dash-accent-muted)',
    fgVar: 'var(--dash-accent)',
    description: 'Elevated administrative access for system configuration and root governance.',
    workflowSummary: 'All Stages (Elevated)',
  },
  governance_admin: {
    label: 'Governance Admin',
    bgVar: 'var(--dash-accent-muted)',
    fgVar: 'var(--dash-accent)',
    description: 'Specialized administrative role focused on charter compliance and operational ethics.',
    workflowSummary: 'Governance & Mithaq',
  },
  writer: {
    label: 'Writer (Ahl-e-Qalam)',
    bgVar: 'rgba(59,130,246,0.12)',
    fgVar: '#60A5FA',
    description: 'Submit and manage Kalams in the literary and content pipeline.',
    workflowSummary: 'Stage 2 — Content',
  },
  vocalist: {
    label: 'Vocalist (Ahl-e-Naghma)',
    bgVar: 'rgba(139,92,246,0.12)',
    fgVar: '#A78BFA',
    description: 'View performance assignments and participate in studio sessions.',
    workflowSummary: 'Stage 2–3 — Performance',
  },
  producer: {
    label: 'Producer',
    bgVar: 'rgba(34,197,94,0.12)',
    fgVar: '#4ADE80',
    description: 'Manage production workflow, studio sessions, and release preparation.',
    workflowSummary: 'Stage 3 — Production',
  },
  literary: {
    label: 'Literary (Ahl-e-Tahreer)',
    bgVar: 'rgba(245,158,11,0.12)',
    fgVar: '#FCD34D',
    description: 'Manage articles, translations, and editorial literary content.',
    workflowSummary: 'Stage 2 — Literary',
  },
  studio: {
    label: 'Studio Engineer',
    bgVar: 'rgba(249,115,22,0.12)',
    fgVar: '#FB923C',
    description: 'Studio session management and production-floor operations.',
    workflowSummary: 'Stage 3 — Studio',
  },
  user: {
    label: 'Network Member',
    bgVar: 'rgba(255,255,255,0.05)',
    fgVar: '#ffffff',
    description: 'Standard access for registered network participants and seekers.',
    workflowSummary: 'Public Participation',
  },
};

/* ─── Permission matrix ─── */
type PermRow = {
  stage: string;
  resource: string;
  admin: boolean;
  administrator: boolean;
  super_admin: boolean;
  governance_admin: boolean;
  writer: boolean;
  vocalist: boolean;
  producer: boolean;
  literary: boolean;
  studio: boolean;
  user: boolean;
};

const WORKFLOW_PERMISSIONS: PermRow[] = [
  { stage: 'Stage 1 — Onboarding',  resource: 'Applications Review',    admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: false, literary: false, studio: false, user: false },
  { stage: 'Stage 1 — Onboarding',  resource: 'User Management',         admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: false, literary: false, studio: false, user: false },
  { stage: 'Stage 2 — Content',     resource: 'Kalams',                  admin: true, administrator: true, super_admin: true, governance_admin: true, writer: true,  vocalist: false, producer: false, literary: true,  studio: false, user: false },
  { stage: 'Stage 2 — Content',     resource: 'Articles',                admin: true, administrator: true, super_admin: true, governance_admin: true, writer: true,  vocalist: false, producer: false, literary: true,  studio: false, user: false },
  { stage: 'Stage 2 — Content',     resource: 'Performance Assignments', admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: true,  producer: true,  literary: false, studio: false, user: false },
  { stage: 'Stage 3 — Production',  resource: 'Production Workflow',     admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: true,  literary: false, studio: true,  user: false },
  { stage: 'Stage 3 — Production',  resource: 'Studio Sessions',         admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: true,  producer: true,  literary: false, studio: true,  user: false },
  { stage: 'Stage 3 — Production',  resource: 'Release Workflow',        admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: false, literary: false, studio: false, user: false },
  { stage: 'Stage 3 — Production',  resource: 'CMS Releases',            admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: false, literary: false, studio: false, user: false },
  { stage: 'Stage 4 — Outreach',    resource: 'Song Adoptions',          admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: false, literary: false, studio: false, user: false },
  { stage: 'Stage 4 — Outreach',    resource: 'Partnerships',            admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: false, literary: false, studio: false, user: false },
  { stage: 'Stage 4 — Outreach',    resource: 'Session Requests',        admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: false, literary: false, studio: false, user: false },
  { stage: 'Stage 4 — Finance',     resource: 'Royalty Management',      admin: true, administrator: true, super_admin: true, governance_admin: true, writer: false, vocalist: false, producer: false, literary: false, studio: false, user: false },
];

const USERS_KEY = 'sufipulse_users';

type StoredUser = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  assigned_roles?: string[];
  is_blocked?: boolean;
};

function loadUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');
  const [users] = useState<StoredUser[]>(loadUsers);

  const roleDef = ROLE_META[selectedRole];
  const usersWithRole = users.filter((u) =>
    (u.assigned_roles || []).includes(selectedRole) ||
    (u.role === selectedRole)
  );

  const stages = Array.from(new Set(WORKFLOW_PERMISSIONS.map((p) => p.stage)));

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Page header */}
        <div className="dashboard-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                Roles &amp; Permissions
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--dash-text-secondary)' }}>
                View what each role can access in the SufiPulse workflow. To assign or revoke roles, go to{' '}
                <Link href="/admin/users" className="underline" style={{ color: 'var(--dash-accent)' }}>
                  User Management
                </Link>.
              </p>
            </div>
            <Link
              href="/admin/users"
              className="dashboard-btn-primary inline-flex items-center gap-2 shrink-0"
            >
              <Users className="w-4 h-4" /> Manage Users <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Roles list panel ── */}
          <div className="lg:col-span-1 space-y-2">
            {ALL_ROLES.map((role) => {
              const meta = ROLE_META[role];
              const count = users.filter(
                (u) =>
                  (u.assigned_roles || []).includes(role) ||
                  (u.role === role)
              ).length;
              const active = role === selectedRole;
              const isAdminRole = ADMIN_ROLES.includes(role);

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className="w-full text-left rounded-lg px-4 py-3 transition"
                  style={{
                    border: `1px solid ${active ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                    borderLeft: `4px solid ${active ? 'var(--dash-accent)' : 'transparent'}`,
                    backgroundColor: active ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isAdminRole
                        ? <Shield className="w-4 h-4 shrink-0" style={{ color: meta.fgVar }} />
                        : <User className="w-4 h-4 shrink-0" style={{ color: meta.fgVar }} />}
                      <span className="text-sm font-medium" style={{ color: active ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)' }}>
                        {meta.label}
                      </span>
                    </div>
                    {count > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: meta.bgVar, color: meta.fgVar }}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 pl-6" style={{ color: 'var(--dash-text-muted)' }}>
                    {meta.workflowSummary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ── Detail panel ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Role summary card */}
            <div className="dashboard-card">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: roleDef.bgVar }}
                >
                  {ADMIN_ROLES.includes(selectedRole)
                    ? <Shield className="w-5 h-5" style={{ color: roleDef.fgVar }} />
                    : <User className="w-5 h-5" style={{ color: roleDef.fgVar }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--dash-text-primary)' }}>
                      {roleDef.label}
                    </h2>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: roleDef.bgVar, color: roleDef.fgVar }}
                    >
                      {roleDef.workflowSummary}
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--dash-text-secondary)' }}>
                    {roleDef.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold" style={{ color: 'var(--dash-accent)' }}>
                    {usersWithRole.length}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>assigned users</p>
                </div>
              </div>

              {/* Users with this role */}
              {usersWithRole.length > 0 ? (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--dash-divider)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--dash-text-muted)' }}>
                    Users with this role
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {usersWithRole.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                        style={{
                          border: '1px solid var(--dash-border)',
                          backgroundColor: 'var(--dash-bg-primary)',
                          color: u.is_blocked ? 'var(--dash-text-muted)' : 'var(--dash-text-secondary)',
                        }}
                      >
                        <User className="w-3 h-3 shrink-0" />
                        <span>{u.full_name || u.email}</span>
                        {u.is_blocked && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)' }}
                          >
                            Blocked
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-1 text-xs mt-3"
                    style={{ color: 'var(--dash-accent)' }}
                  >
                    Manage assignments <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-sm mt-4 pt-4" style={{ color: 'var(--dash-text-muted)', borderTop: '1px solid var(--dash-divider)' }}>
                  No users currently assigned this role.{' '}
                  <Link href="/admin/users" style={{ color: 'var(--dash-accent)' }} className="underline">
                    Assign from User Management.
                  </Link>
                </p>
              )}
            </div>

            {/* Permission matrix */}
            <div className="dashboard-card">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'var(--dash-text-muted)' }}
              >
                Workflow Access Matrix
              </h3>

              {stages.map((stage) => {
                const rows = WORKFLOW_PERMISSIONS.filter((p) => p.stage === stage);
                return (
                  <div key={stage} className="mb-6 last:mb-0">
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2 pb-1"
                      style={{ color: 'var(--dash-text-muted)', borderBottom: '1px solid var(--dash-divider)' }}
                    >
                      {stage}
                    </p>
                    <div className="space-y-1.5">
                      {rows.map((row) => {
                        const granted = row[selectedRole as keyof PermRow] as boolean;
                        return (
                          <div
                            key={row.resource}
                            className="flex items-center gap-3 px-3 py-2 rounded"
                            style={{
                              backgroundColor: granted ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                              border: `1px solid ${granted ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                              opacity: granted ? 1 : 0.5,
                            }}
                          >
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: granted ? 'var(--dash-accent-muted)' : 'transparent',
                                border: `1px solid ${granted ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                              }}
                            >
                              {granted
                                ? <Check className="w-3 h-3" style={{ color: 'var(--dash-accent)' }} />
                                : <Minus className="w-3 h-3" style={{ color: 'var(--dash-text-muted)' }} />}
                            </div>
                            <span
                              className="text-sm"
                              style={{ color: granted ? 'var(--dash-text-primary)' : 'var(--dash-text-muted)' }}
                            >
                              {row.resource}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hierarchy note */}
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: 'var(--dash-accent-muted)',
                border: '1px solid var(--dash-accent)',
                color: 'var(--dash-text-secondary)',
              }}
            >
              <p className="font-semibold mb-1" style={{ color: 'var(--dash-accent)' }}>
                Role Hierarchy Note
              </p>
              <p>
                All contributor roles require admin approval via the application workflow before activation.{' '}
                <strong style={{ color: 'var(--dash-text-primary)' }}>Admins always have full access</strong>{' '}
                regardless of other assigned roles. Assign roles under{' '}
                <Link href="/admin/users" style={{ color: 'var(--dash-accent)' }} className="underline">
                  User Management
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
