"use client";
import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
import { Users, FileText, Mic, Music, BookOpen, Handshake, Calendar, CircleAlert as AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
// import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalUsers: number;
  writerApplications: number;
  vocalistApplications: number;
  pendingKalams: number;
  pendingArticles: number;
  pendingPartnerships: number;
  pendingSessionRequests: number;
}

export default function AdminDashboard() {
  //   const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    writerApplications: 0,
    vocalistApplications: 0,
    pendingKalams: 0,
    pendingArticles: 0,
    pendingPartnerships: 0,
    pendingSessionRequests: 0,
  });
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!user.role.includes("admin")) {
      alert("Only Admin can access this page")
      router.push("/");
    }
  }, [user]);

  //   useEffect(() => {
  //     if (!authLoading) {
  //       loadStats();
  //     }
  //   }, [authLoading]);

  //   const loadStats = async () => {
  //     try {
  //       const [
  //         usersResult,
  //         writerAppsResult,
  //         vocalistAppsResult,
  //         kalamsResult,
  //         articlesResult,
  //         partnershipsResult,
  //         sessionRequestsResult,
  //       ] = await Promise.all([
  //         supabase.from('users').select('id', { count: 'exact', head: true }),
  //         supabase.from('writer_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  //         supabase.from('vocalist_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  //         supabase.from('kalams').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
  //         supabase.from('literary_articles').select('id', { count: 'exact', head: true }).eq('publication_status', 'submitted'),
  //         supabase.from('institutional_partnership_proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  //         supabase.from('session_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  //       ]);

  //       setStats({
  //         totalUsers: usersResult.count || 0,
  //         writerApplications: writerAppsResult.count || 0,
  //         vocalistApplications: vocalistAppsResult.count || 0,
  //         pendingKalams: kalamsResult.count || 0,
  //         pendingArticles: articlesResult.count || 0,
  //         pendingPartnerships: partnershipsResult.count || 0,
  //         pendingSessionRequests: sessionRequestsResult.count || 0,
  //       });
  //     } catch (error) {
  //       console.error('Error loading stats:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      meta: 'Active accounts',
      icon: Users,
      link: '/admin/users',
      color: 'var(--dash-accent)',
    },
    {
      label: 'Writer Applications',
      value: stats.writerApplications,
      meta: 'Pending review',
      icon: FileText,
      link: '/admin/applications/writers',
      alert: stats.writerApplications > 0,
    },
    {
      label: 'Vocalist Applications',
      value: stats.vocalistApplications,
      meta: 'Pending review',
      icon: Mic,
      link: '/admin/applications/vocalists',
      alert: stats.vocalistApplications > 0,
    },
    {
      label: 'Pending Kalams',
      value: stats.pendingKalams,
      meta: 'Awaiting approval',
      icon: Music,
      link: '/admin/kalams',
      alert: stats.pendingKalams > 0,
    },
    {
      label: 'Pending Articles',
      value: stats.pendingArticles,
      meta: 'Awaiting publication',
      icon: BookOpen,
      link: '/admin/articles',
      alert: stats.pendingArticles > 0,
    },
    {
      label: 'Partnership Proposals',
      value: stats.pendingPartnerships,
      meta: 'Under review',
      icon: Handshake,
      link: '/admin/partnerships',
      alert: stats.pendingPartnerships > 0,
    },
    {
      label: 'Session Requests',
      value: stats.pendingSessionRequests,
      meta: 'Pending approval',
      icon: Calendar,
      link: '/admin/session-requests',
      alert: stats.pendingSessionRequests > 0,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-loading">
          <p>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalPendingItems = stats.writerApplications + stats.vocalistApplications +
    stats.pendingKalams + stats.pendingArticles +
    stats.pendingPartnerships + stats.pendingSessionRequests;

  return (
    <DashboardLayout>
      {totalPendingItems > 0 && (
        <div className="mb-6 p-4 bg-[var(--dash-status-pending-bg)] border border-[var(--dash-status-pending)] rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--dash-status-pending)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--dash-text-primary)]">
                {totalPendingItems} item{totalPendingItems !== 1 ? 's' : ''} require attention
              </p>
              <p className="text-xs text-[var(--dash-text-secondary)]">
                Review pending applications and submissions
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)] mb-2">
          Governance Overview
        </h1>
        <p className="text-[var(--dash-text-secondary)]">
          Operational control center for institutional management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.link}
              className="dashboard-stat hover:border-[var(--dash-accent)] transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <p className="dashboard-stat-label">{stat.label}</p>
                {stat.alert && (
                  <AlertCircle className="w-4 h-4 text-[var(--dash-status-pending)]" />
                )}
              </div>

              <div className="flex items-center gap-4">
                <Icon className="w-10 h-10 text-[var(--dash-text-muted)] group-hover:text-[var(--dash-accent)] transition-colors" />
                <div className="flex-1">
                  <p className="dashboard-stat-value">{stat.value}</p>
                  <p className="dashboard-stat-meta">{stat.meta}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-bold text-[var(--dash-text-primary)] mb-6">
          Administrative Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="dashboard-card">
            <h3 className="font-semibold text-[var(--dash-text-primary)] mb-4">
              Application Review
            </h3>
            <p className="text-sm text-[var(--dash-text-secondary)] mb-4">
              Process pending contributor applications and verify credentials
            </p>
            <div className="flex gap-3">
              <Link href="/admin/applications/writers" className="dashboard-btn-secondary text-sm">
                Review Writers
              </Link>
              <Link href="/admin/applications/vocalists" className="dashboard-btn-secondary text-sm">
                Review Vocalists
              </Link>
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="font-semibold text-[var(--dash-text-primary)] mb-4">
              Content Moderation
            </h3>
            <p className="text-sm text-[var(--dash-text-secondary)] mb-4">
              Review and approve submitted content for publication
            </p>
            <div className="flex gap-3">
              <Link href="/admin/kalams" className="dashboard-btn-secondary text-sm">
                Review Kalams
              </Link>
              <Link href="/admin/articles" className="dashboard-btn-secondary text-sm">
                Review Articles
              </Link>
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="font-semibold text-[var(--dash-text-primary)] mb-4">
              User Management
            </h3>
            <p className="text-sm text-[var(--dash-text-secondary)] mb-4">
              Manage user accounts and access permissions
            </p>
            <Link href="/admin/users" className="dashboard-btn-primary text-sm inline-block">
              Manage Users
            </Link>
          </div>

          <div className="dashboard-card">
            <h3 className="font-semibold text-[var(--dash-text-primary)] mb-4">
              Institutional Relations
            </h3>
            <p className="text-sm text-[var(--dash-text-secondary)] mb-4">
              Review partnership proposals and coordinate sessions
            </p>
            <div className="flex gap-3">
              <Link href="/admin/partnerships" className="dashboard-btn-secondary text-sm">
                Partnerships
              </Link>
              <Link href="/admin/session-requests" className="dashboard-btn-secondary text-sm">
                Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}