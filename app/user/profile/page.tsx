"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { User, Mail, Shield, LogOut, Banknote, Languages } from 'lucide-react';
import Link from 'next/link';

const ROLE_PORTAL_MAP: Record<string, { label: string; href: string }> = {
  writer: { label: 'Ahl-e-Qalam Portal', href: '/user/writer/dashboard' },
  vocalist: { label: 'Ahl-e-Sada Portal', href: '/user/vocalist/dashboard' },
  producer: { label: 'Ahl-e-Naghma Portal', href: '/user/producer/dashboard' },
  studio: { label: 'Karkhana-e-Sada Portal', href: '/user/studio/dashboard' },
  literary: { label: 'Ahl-e-Tahreer Portal', href: '/user/literary-contributor/dashboard' },
};

export default function MyAccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.push('/login');
  }, [user, router]);

  if (!user) {
    return (
      <Layout>
        <PageContainer>
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        </PageContainer>
      </Layout>
    );
  }

  const initials = (() => {
    const parts = (user.full_name || '').split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return 'SP';
  })();

  const assignedRoles: string[] = Array.isArray(user.assigned_roles)
    ? user.assigned_roles
    : user.role ? [user.role] : [];

  const CONTRIBUTOR_ROLE_SET = new Set(['writer', 'vocalist', 'producer', 'studio', 'literary']);
  const isContributor = assignedRoles.some(r => CONTRIBUTOR_ROLE_SET.has(r));

  const portalLinks = assignedRoles
    .filter(r => r !== 'admin' && ROLE_PORTAL_MAP[r])
    .map(r => ROLE_PORTAL_MAP[r]);

  const isAdmin = assignedRoles.includes('admin') || user.role === 'admin';

  return (
    <Layout>
      <PageContainer>
        <div className="min-h-[70vh] py-16 max-w-xl mx-auto">

          {/* Avatar + name */}
          <div className="flex items-center gap-5 mb-10">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--color-gold)] bg-[var(--color-gold)]/10 flex items-center justify-center text-[var(--color-gold)] font-semibold text-xl select-none">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {user.full_name || 'Account'}
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
            </div>
          </div>

          {/* Details card */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/5 mb-6">
            <div className="flex items-center gap-3 px-5 py-4">
              <Mail className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
              <span className="text-sm text-[var(--color-text-secondary)]">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <Shield className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
              <span className="text-sm text-[var(--color-text-secondary)] capitalize">
                {isAdmin ? 'Administrator' : 'Member'}
              </span>
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <User className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {user.is_verified ? 'Verified account' : 'Account pending verification'}
              </span>
            </div>
          </div>

          {/* Royalty Payouts — contributors only */}
          {isContributor && (
            <Link
              href="/user/royalties"
              className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/5 transition-colors mb-3"
            >
              <div className="flex items-center gap-3">
                <Banknote className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Royalty Payouts</span>
              </div>
              <span className="text-[var(--color-gold)] text-xs">→</span>
            </Link>
          )}

          {/* Admin link */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/5 transition-colors mb-3"
            >
              <span className="text-sm font-medium text-[var(--color-text-primary)]">Admin Dashboard</span>
              <span className="text-[var(--color-gold)] text-xs">→</span>
            </Link>
          )}

          {/* My Lyrics Requests — all logged-in users */}
          <Link
            href="/user/lyrics-requests"
            className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/5 transition-colors mb-6"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <span className="text-sm font-medium text-[var(--color-text-primary)]">My Lyrics Requests</span>
            </div>
            <span className="text-[var(--color-gold)] text-xs">→</span>
          </Link>

          {/* Role portals */}
          {portalLinks.length > 0 && (
            <div className="space-y-3 mb-6">
              {portalLinks.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/5 transition-colors"
                >
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
                  <span className="text-[var(--color-gold)] text-xs">→</span>
                </Link>
              ))}
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-red-400 transition-colors mt-8"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </PageContainer>
    </Layout>
  );
}
