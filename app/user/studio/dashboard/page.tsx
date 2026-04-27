"use client";
import { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserDashboard from '@/app/components/dashboard/UserDashboard';
import { hasRoleAccess } from '@/app/lib/role-access';

export default function StudioDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!hasRoleAccess(user as any, 'studio')) {
      alert('You do not have studio role access.');
      router.push('/');
    }
  }, [user]);

  return <UserDashboard role="studio" />;
}
