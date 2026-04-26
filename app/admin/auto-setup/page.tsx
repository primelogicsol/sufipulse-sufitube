// app/admin/auto-setup/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

export default function AutoSetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runSetup = async () => {
    setRunning(true);
    try {
      setStatus('Creating localStorage admin entry...');

      const USERS_KEY = 'sufipulse_users';
      const adminUser = {
        id: 'admin-1',
        email: 'admin@sufipulse.local',
        full_name: 'Admin User',
        role: 'admin',
        is_verified: true,
        created_at: new Date().toISOString(),
      };

      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      if (!users.some((u: any) => u.email === adminUser.email)) {
        users.push(adminUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      setStatus('✅ Done. Redirecting to CMS...');
      setTimeout(() => router.push('/admin/cms-releases'), 1500);
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-8 max-w-md w-full space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-amber-400 w-6 h-6 shrink-0" />
          <h1 className="text-xl font-bold text-neutral-100">Dev-Only Setup Tool</h1>
        </div>

        <p className="text-neutral-400 text-sm leading-relaxed">
          This tool writes a local-only admin entry to browser localStorage.
          It does <strong className="text-neutral-200">not</strong> affect the real server user store.
          Use it only for local browser testing — not on the production VPS.
        </p>

        {!status && (
          <button
            onClick={runSetup}
            disabled={running}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Run Local Setup
          </button>
        )}

        {status && (
          <div className={`p-4 rounded-lg border text-sm font-medium ${
            status.startsWith('✅')
              ? 'bg-green-950 border-green-700 text-green-300'
              : status.startsWith('❌')
              ? 'bg-red-950 border-red-700 text-red-300'
              : 'bg-neutral-800 border-neutral-700 text-neutral-300'
          }`}>
            {status}
          </div>
        )}

        <button
          onClick={() => router.push('/admin')}
          className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-sm rounded-lg transition-colors"
        >
          Back to Admin
        </button>
      </div>
    </div>
  );
}
