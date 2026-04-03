// app/admin/auto-setup/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUFI_PULSE_TEST_RELEASES, seedCMSWithTestData } from '@/lib/seed-cms-data';

export default function AutoSetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const setup = async () => {
      try {
        setStatus('Creating admin credentials...');
        
        // Create admin user
        const STORAGE_KEYS = {
          USERS: 'sufipulse_users',
          CURRENT_USER: 'sufipulse_current_user',
        };

        const adminUser = {
          id: 'admin-1',
          email: 'admin@sufipulse.local',
          full_name: 'Admin User',
          role: 'admin',
          is_verified: true,
          created_at: new Date().toISOString(),
        };

        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const adminExists = users.some((u: any) => u.email === adminUser.email);

        if (!adminExists) {
          users.push(adminUser);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }

        setStatus('Seeding CMS with test releases...');
        seedCMSWithTestData();

        setStatus('✅ Setup complete! Redirecting to CMS dashboard...');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/admin/cms-releases');
        }, 2000);
      } catch (error: any) {
        setStatus(`❌ Error: ${error.message}`);
      }
    };

    setup();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-4">SufiPulse Setup</h1>
        <p className="text-center text-neutral-600">{status}</p>
        
        {status.includes('✅') && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-semibold">Admin credentials created:</p>
            <p className="text-green-600 text-sm mt-1">Email: admin@sufipulse.local</p>
            <p className="text-green-600 text-sm">Password: any password</p>
            <p className="text-green-600 text-sm mt-2">{SUFI_PULSE_TEST_RELEASES.length} test releases loaded</p>
          </div>
        )}

        {status.includes('❌') && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
