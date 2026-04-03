"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

/**
 * Redirects to /login if the user is not authenticated or not an admin.
 * Use at the top of every admin page component.
 *
 * @example
 * export default function MyAdminPage() {
 *   const { user, loading } = useAdminGuard();
 *   if (loading) return null;
 *   ...
 * }
 */
export function useAdminGuard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (!user.role?.includes('admin')) {
      alert('Only Admin can access this page');
      router.push('/');
    }
  }, [user, router]);

  return { user };
}
