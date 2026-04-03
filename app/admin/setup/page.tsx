"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Shield, Database, Rocket } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { seedCMSWithTestData } from '@/lib/seed-cms-data';

type SetupStatus = 'idle' | 'success' | 'error';

const STORAGE_KEYS = {
  USERS: 'sufipulse_users',
} as const;

const DEFAULT_ADMIN = {
  email: 'admin@sufipulse.local',
  full_name: 'Admin User',
};

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SetupStatus>('idle');
  const [message, setMessage] = useState('');
  const [releaseCount, setReleaseCount] = useState(0);

  const normalizeEmail = (email: string) => email.trim().toLowerCase();

  const createAdminCredentials = () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const normalizedEmail = normalizeEmail(DEFAULT_ADMIN.email);
    const adminExists = users.some((u: any) => normalizeEmail(String(u?.email || '')) === normalizedEmail);

    if (!adminExists) {
      users.push({
        id: `admin-${Date.now()}`,
        email: normalizedEmail,
        full_name: DEFAULT_ADMIN.full_name,
        role: 'admin',
        is_verified: true,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    return { created: !adminExists };
  };

  const seedCmsData = () => {
    const releases = seedCMSWithTestData();
    return { count: releases.length };
  };

  const setupAdmin = async () => {
    setLoading(true);
    setStatus('idle');

    try {
      const result = createAdminCredentials();

      setStatus('success');
      setMessage(
        result.created
          ? 'Admin credentials created successfully.'
          : 'Admin credentials already existed and are ready to use.'
      );
    } catch (error: any) {
      setStatus('error');
      setMessage(`Failed to create admin credentials: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setupTestData = async () => {
    setLoading(true);
    setStatus('idle');

    try {
      const result = seedCmsData();
      setReleaseCount(result.count);
      setStatus('success');
      setMessage(`${result.count} test releases created successfully. CMS is ready.`);
    } catch (error: any) {
      setStatus('error');
      setMessage(`Failed to seed test releases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const setupBoth = async () => {
    setLoading(true);
    setStatus('idle');

    try {
      const adminResult = createAdminCredentials();
      const releaseResult = seedCmsData();
      setReleaseCount(releaseResult.count);

      const adminMessage = adminResult.created ? 'Admin created' : 'Admin already existed';
      setStatus('success');
      setMessage(`${adminMessage}. Seeded ${releaseResult.count} CMS releases.`);
    } catch (error: any) {
      setStatus('error');
      setMessage(`Setup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <h1 className="text-2xl font-bold text-[var(--dash-text-primary)] mb-2">SufiPulse CMS Setup</h1>
          <p className="text-[var(--dash-text-secondary)]">Create admin credentials and seed release data for standalone mode.</p>
        </div>

        {status !== 'idle' && (
          <div
            className={`dashboard-card border ${
              status === 'success'
                ? 'border-[var(--dash-status-approved)] bg-[var(--dash-status-approved-bg)]'
                : 'border-[var(--dash-status-rejected)] bg-[var(--dash-status-rejected-bg)]'
            }`}
          >
            <div className="flex items-start gap-3">
              {status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-[var(--dash-status-approved)] mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[var(--dash-status-rejected)] mt-0.5" />
              )}
              <div>
                <p className="font-medium text-[var(--dash-text-primary)]">{message}</p>
                {status === 'success' && (
                  <p className="text-sm text-[var(--dash-text-secondary)] mt-2">
                    Login: admin@sufipulse.local. Password: any value in standalone mode.
                    {releaseCount > 0 ? ` Seeded releases: ${releaseCount}.` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-[var(--dash-accent)]" />
              <h2 className="text-lg font-semibold text-[var(--dash-text-primary)]">Admin Credentials</h2>
            </div>
            <p className="text-[var(--dash-text-secondary)] mb-4">
              Ensures admin account exists for CMS access.
            </p>
            <div className="bg-[var(--dash-bg-hover)] border border-[var(--dash-border)] rounded-lg p-3 mb-4 text-sm text-[var(--dash-text-secondary)]">
              Email: admin@sufipulse.local
              <br />
              Role: admin
            </div>
            <button
              onClick={setupAdmin}
              disabled={loading}
              className="dashboard-btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Create Admin Account'}
            </button>
          </div>

          <div className="dashboard-card">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-[var(--dash-accent)]" />
              <h2 className="text-lg font-semibold text-[var(--dash-text-primary)]">Sample CMS Releases</h2>
            </div>
            <p className="text-[var(--dash-text-secondary)] mb-4">
              Seeds CMS with curated test releases for immediate testing.
            </p>
            <button
              onClick={setupTestData}
              disabled={loading}
              className="dashboard-btn-secondary w-full disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Seed Test Releases'}
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center gap-3 mb-3">
            <Rocket className="w-5 h-5 text-[var(--dash-accent)]" />
            <h2 className="text-lg font-semibold text-[var(--dash-text-primary)]">One-Click Setup</h2>
          </div>
          <p className="text-[var(--dash-text-secondary)] mb-4">
            Runs both setup steps with one action and returns a reliable result.
          </p>
          <button
            onClick={setupBoth}
            disabled={loading}
            className="dashboard-btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Setup Everything'}
          </button>
        </div>

        <div className="dashboard-card">
          <h3 className="text-base font-semibold text-[var(--dash-text-primary)] mb-3">Next Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-[var(--dash-text-secondary)] text-sm">
            <li>Run one of the setup actions above.</li>
            <li>Open <Link href="/login" className="text-[var(--dash-accent)] hover:underline">/login</Link>.</li>
            <li>Sign in with admin@sufipulse.local.</li>
            <li>Go to <Link href="/admin/cms-releases" className="text-[var(--dash-accent)] hover:underline">/admin/cms-releases</Link>.</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}
