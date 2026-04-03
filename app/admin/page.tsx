"use client";
import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
import { Users, FileText, Mic, Music, BookOpen, Handshake, Calendar, Activity, Globe, DollarSign, CircleAlert as AlertCircle, Mail } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
// import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../api/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalUsers: number;
  writerApplications: number;
  vocalistApplications: number;
  producerApplications: number;
  literaryApplications: number;
  studioApplications: number;
  pendingKalams: number;
  pendingSadas: number;
  pendingArticles: number;
  pendingPartnerships: number;
  pendingSessionRequests: number;
  pendingAdoptions: number;
  draftReleases: number;
  pendingAccessCodeRequests: number;
  pendingContactMessages: number;
}

export default function AdminDashboard() {
  //   const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    writerApplications: 0,
    vocalistApplications: 0,
    producerApplications: 0,
    literaryApplications: 0,
    studioApplications: 0,
    pendingKalams: 0,
    pendingSadas: 0,
    pendingArticles: 0,
    pendingPartnerships: 0,
    pendingSessionRequests: 0,
    pendingAdoptions: 0,
    draftReleases: 0,
    pendingAccessCodeRequests: 0,
    pendingContactMessages: 0,
  });
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true);

  const normalizeArrayLike = (value: any): any[] => {
    if (Array.isArray(value)) {
      // Supports tuple-like map storage: [[id, payload], ...]
      if (value.length > 0 && Array.isArray(value[0]) && value[0].length === 2) {
        return value
          .map((entry) => (Array.isArray(entry) ? entry[1] : entry))
          .filter((item) => item && typeof item === 'object');
      }
      return value;
    }

    if (value && typeof value === 'object') {
      return Object.values(value);
    }

    return [];
  };

  const safeReadArray = (key: string): any[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return normalizeArrayLike(parsed);
    } catch {
      return [];
    }
  };

  const pendingCount = (items: any[], field: string = 'status') => {
    const pendingStates = new Set(['pending', 'submitted', 'under_review', 'revision_requested']);
    return items.filter((item) => pendingStates.has(String(item?.[field] || '').toLowerCase())).length;
  };

  const firstArray = (...candidates: any[]): any[] => {
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }
    return [];
  };

  const loadStats = async () => {
    try {
      const [writersResult, vocalistsResult, producersResult, kalamsResult, draftReleasesResult] = await Promise.allSettled([
        api.getAllWriter(),
        api.getAllVocalists(),
        api.getAllProducers(),
        api.getAllKalams(),
        fetch('/api/releases?status=draft'),
      ]);

      const writerPayload = writersResult.status === 'fulfilled' ? await writersResult.value.json() : null;
      const vocalistPayload = vocalistsResult.status === 'fulfilled' ? await vocalistsResult.value.json() : null;
      const producerPayload = producersResult.status === 'fulfilled' ? await producersResult.value.json() : null;
      const kalamPayload = kalamsResult.status === 'fulfilled' ? await kalamsResult.value.json() : null;
      const draftReleasePayload =
        draftReleasesResult.status === 'fulfilled' && draftReleasesResult.value.ok
          ? await draftReleasesResult.value.json()
          : [];

      const writers = firstArray(
        writerPayload?.data?.writers,
        writerPayload?.writers,
        writerPayload?.data,
        safeReadArray('sufipulse_writer_profiles')
      );

      const vocalists = firstArray(
        vocalistPayload?.data?.vocalists,
        vocalistPayload?.vocalists,
        vocalistPayload?.data,
        safeReadArray('sufipulse_vocalist_profiles')
      );

      const kalams = firstArray(
        kalamPayload?.data?.kalams,
        kalamPayload?.kalams,
        kalamPayload?.data,
        safeReadArray('sufipulse_kalams')
      );

      const producers = firstArray(
        producerPayload?.data?.producers,
        producerPayload?.producers,
        producerPayload?.data,
        safeReadArray('sufipulse_producer_profiles')
      );

      const users = safeReadArray('sufipulse_users');
      const articles = safeReadArray('sufipulse_articles');
      const sadas = safeReadArray('sufipulse_sadas');
      const partnerships = safeReadArray('sufipulse_partnerships');
      const sessionRequests = safeReadArray('sufipulse_session_requests');
      const literaryProfiles = safeReadArray('sufipulse_literary_profiles');
      const studioProfiles = safeReadArray('sufipulse_studio_profiles');
      const adoptions = safeReadArray('sufipulse_song_adoptions');
      const accessCodeRequests = safeReadArray('sufipulse_studio_access_requests');
      const contactMessages = safeReadArray('sufipulse_contact_messages');

      const pendingAdoptions = adoptions.filter((adoption) => {
        const status = String(adoption?.adoption_status || '').toLowerCase();
        return status === 'pending_review' || status === 'scheduled' || status === 'live';
      }).length;

      setStats({
        totalUsers: users.length,
        writerApplications: pendingCount(writers, 'profile_status'),
        vocalistApplications: pendingCount(vocalists, 'status'),
        producerApplications: pendingCount(producers, 'profile_status'),
        literaryApplications: pendingCount(literaryProfiles, 'profile_status'),
        studioApplications: pendingCount(studioProfiles, 'profile_status'),
        pendingKalams: pendingCount(kalams, 'status'),
        pendingSadas: pendingCount(sadas, 'status'),
        pendingArticles: pendingCount(articles, 'status'),
        pendingPartnerships: pendingCount(partnerships, 'status'),
        pendingSessionRequests: pendingCount(sessionRequests, 'status'),
        pendingAdoptions,
        draftReleases: Array.isArray(draftReleasePayload) ? draftReleasePayload.length : 0,
        pendingAccessCodeRequests: accessCodeRequests.filter(r => String(r?.status || '').toLowerCase() === 'pending').length,
        pendingContactMessages: contactMessages.filter(m => String(m?.status || 'unread').toLowerCase() === 'unread').length,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!user.role.includes("admin")) {
      alert("Only Admin can access this page")
      router.push("/");
    } else {
      loadStats();
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
      label: 'Producer Applications',
      value: stats.producerApplications,
      meta: 'Pending review',
      icon: Music,
      link: '/admin/applications/producers',
      alert: stats.producerApplications > 0,
    },
    {
      label: 'Literary Profiles',
      value: stats.literaryApplications,
      meta: 'Pending review',
      icon: BookOpen,
      link: '/admin/applications/literary',
      alert: stats.literaryApplications > 0,
    },
    {
      label: 'Studio Profiles',
      value: stats.studioApplications,
      meta: 'Pending review',
      icon: Calendar,
      link: '/admin/applications/studio',
      alert: stats.studioApplications > 0,
    },
    {
      label: 'Access Code Requests',
      value: stats.pendingAccessCodeRequests,
      meta: 'Pending issuance',
      icon: Activity,
      link: '/admin/studio-access-codes',
      alert: stats.pendingAccessCodeRequests > 0,
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
      label: 'Pending Sadas',
      value: stats.pendingSadas,
      meta: 'Awaiting approval',
      icon: Mic,
      link: '/admin/sadas',
      alert: stats.pendingSadas > 0,
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
    {
      label: 'Song Adoptions',
      value: stats.pendingAdoptions,
      meta: 'Need moderation',
      icon: Handshake,
      link: '/admin/song-adoptions',
      alert: stats.pendingAdoptions > 0,
    },
    {
      label: 'Draft Releases',
      value: stats.draftReleases,
      meta: 'CMS pipeline',
      icon: FileText,
      link: '/admin/cms-releases',
      alert: stats.draftReleases > 0,
    },
    {
      label: 'Contact Messages',
      value: stats.pendingContactMessages,
      meta: 'Unread messages',
      icon: Mail,
      link: '/admin/contact-messages',
      alert: stats.pendingContactMessages > 0,
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

  const totalPendingItems = stats.writerApplications +
    stats.vocalistApplications +
    stats.producerApplications +
    stats.literaryApplications +
    stats.studioApplications +
    stats.pendingAccessCodeRequests +
    stats.pendingKalams +
    stats.pendingSadas +
    stats.pendingArticles +
    stats.pendingPartnerships +
    stats.pendingSessionRequests +
    stats.pendingAdoptions +
    stats.draftReleases +
    stats.pendingContactMessages;

  const stageCards = [
    {
      stage: 'Stage 1',
      title: 'Onboarding & Verification',
      description: 'Verify stakeholders before they enter production workflows.',
      pending:
        stats.writerApplications +
        stats.vocalistApplications +
        stats.producerApplications +
        stats.literaryApplications +
        stats.studioApplications +
        stats.pendingAccessCodeRequests,
      icon: Users,
      links: [
        { label: 'Writers', href: '/admin/applications/writers' },
        { label: 'Vocalists', href: '/admin/applications/vocalists' },
        { label: 'Producers', href: '/admin/applications/producers' },
        { label: 'Literary', href: '/admin/applications/literary' },
        { label: 'Studios', href: '/admin/applications/studio' },
        { label: 'Access Codes', href: '/admin/studio-access-codes' },
      ],
    },
    {
      stage: 'Stage 2',
      title: 'Content & Assignment',
      description: 'Review kalams, articles, and allocate contributors to active works.',
      pending: stats.pendingKalams + stats.pendingSadas + stats.pendingArticles,
      icon: Activity,
      links: [
        { label: 'Kalams', href: '/admin/kalams' },
        { label: 'Sadas', href: '/admin/sadas' },
        { label: 'Articles', href: '/admin/articles' },
        { label: 'Assignments', href: '/admin/performance-assignments' },
      ],
    },
    {
      stage: 'Stage 3',
      title: 'Production & Release',
      description: 'Drive release records through CMS workflow to publication.',
      pending: stats.draftReleases + stats.pendingSessionRequests,
      icon: Globe,
      links: [
        { label: 'Production', href: '/admin/production-workflow' },
        { label: 'Session Requests', href: '/admin/session-requests' },
        { label: 'Studio Sessions', href: '/admin/studio-sessions' },
        { label: 'Release Workflow', href: '/admin/release-workflow' },
        { label: 'CMS Releases', href: '/admin/cms-releases' },
      ],
    },
    {
      stage: 'Stage 4',
      title: 'Outreach, Adoption & Finance',
      description: 'Coordinate engagement channels and close financial obligations.',
      pending:
        stats.pendingPartnerships +
        stats.pendingAdoptions,
      icon: DollarSign,
      links: [
        { label: 'Adoptions', href: '/admin/song-adoptions' },
        { label: 'Partnerships', href: '/admin/partnerships' },
        { label: 'Royalties', href: '/admin/royalties' },
      ],
    },
  ];

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
          Engagement Workflow Sequence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stageCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.stage} className="dashboard-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--dash-text-muted)]">{item.stage}</p>
                    <h3 className="font-semibold text-[var(--dash-text-primary)] mt-1">{item.title}</h3>
                  </div>
                  <Icon className="w-5 h-5 text-[var(--dash-accent)]" />
                </div>

                <p className="text-sm text-[var(--dash-text-secondary)] mb-4">{item.description}</p>

                <p className="text-sm mb-4">
                  <span className="font-semibold text-[var(--dash-text-primary)]">Pending:</span>{' '}
                  <span className="text-[var(--dash-status-pending)] font-semibold">{item.pending}</span>
                </p>

                <div className="flex flex-wrap gap-2">
                  {item.links.map((link) => (
                    <Link key={link.href} href={link.href} className="dashboard-btn-secondary text-xs">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
              <Link href="/admin/applications/producers" className="dashboard-btn-secondary text-sm">
                Review Producers
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
              <Link href="/admin/cms-releases" className="dashboard-btn-secondary text-sm">
                Review Releases
              </Link>
            </div>
          </div>

          <div className="dashboard-card">
            <h3 className="font-semibold text-[var(--dash-text-primary)] mb-4">
              User Management
            </h3>
            <p className="text-sm text-[var(--dash-text-secondary)] mb-4">
              Handle admin setup and user access policies in standalone mode
            </p>
            <Link href="/admin/setup" className="dashboard-btn-primary text-sm inline-block">
              Open Admin Setup
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
              <Link href="/admin/song-adoptions" className="dashboard-btn-secondary text-sm">
                Adoptions
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stakeholder Dashboard Access ─────────────────────────────────── */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-[var(--dash-text-primary)] mb-2">
          Stakeholder Dashboards
        </h2>
        <p className="text-sm text-[var(--dash-text-secondary)] mb-6">
          View contributor portals as admin — or use the demo credentials below to log in as each role.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Writer Portal',
              role: 'Ahl-e-Qalam',
              dashboard: '/user/writer/dashboard',
              profile: '/user/writer/profile',
              email: 'writer@sufipulse.local',
              password: 'writer123',
              color: '#f59e0b',
            },
            {
              label: 'Vocalist Portal',
              role: 'Ahl-e-Sada',
              dashboard: '/user/vocalist/dashboard',
              profile: '/user/vocalist/profile',
              email: 'vocalist@sufipulse.local',
              password: 'vocalist123',
              color: '#6366f1',
            },
            {
              label: 'Producer Portal',
              role: 'Ahl-e-Naghma',
              dashboard: '/user/producer/dashboard',
              profile: '/user/producer/profile',
              email: 'producer@sufipulse.local',
              password: 'producer123',
              color: '#10b981',
            },
            {
              label: 'Literary Portal',
              role: 'Ahl-e-Tahreer',
              dashboard: '/user/literary-contributor/dashboard',
              profile: '/user/literary-contributor/profile',
              email: 'literary@sufipulse.local',
              password: 'literary123',
              color: '#8b5cf6',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="dashboard-card flex flex-col gap-4"
              style={{ borderLeft: `3px solid ${item.color}` }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: item.color }}>
                  {item.role}
                </p>
                <h3 className="font-semibold text-[var(--dash-text-primary)]">{item.label}</h3>
              </div>

              <div className="flex gap-2">
                <Link
                  href={item.dashboard}
                  className="flex-1 text-center dashboard-btn-primary text-xs py-1.5"
                >
                  Dashboard
                </Link>
                <Link
                  href={item.profile}
                  className="flex-1 text-center dashboard-btn-secondary text-xs py-1.5"
                >
                  Profile
                </Link>
              </div>

              <div className="bg-[#0d0d0d] rounded p-3 space-y-1 border border-[#1a1a1a]">
                <p className="text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wide">Demo Credentials</p>
                <p className="text-xs font-mono text-[var(--dash-text-secondary)] truncate">{item.email}</p>
                <p className="text-xs font-mono text-[var(--dash-text-muted)]">{item.password}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}