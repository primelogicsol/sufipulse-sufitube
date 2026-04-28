"use client";
import { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import UserDashboard from '@/app/components/dashboard/UserDashboard';
import { hasRoleAccess } from '@/app/lib/role-access';

export interface KalamUnderDraft {
  title: string;
  language: string;
  writing_style: string;
  content: string;
}

export interface Kalam {
  title: string;
  user_id: string;
  id: string;
  writer_id: string;
  email?: string;
  status: string;
  language: string;
  writing_style: string;
  content: string;
  revision_notes?: string;
  created_at?: any;
  updated_at?: any;
}

export interface Sada {
  title: string;
  user_id: string;
  id: string;
  vocalist_id: string;
  status: string;
  language: string;
  singing_style: string;
  link: string;
  revision_notes?: string;
  created_at?: any;
  updated_at?: any;
}

export default function UserDashboardWriter() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!hasRoleAccess(user as any, 'writer')) {
      router.push('/');
    }
  }, [user]);

  return <UserDashboard role='writer' />;
}
