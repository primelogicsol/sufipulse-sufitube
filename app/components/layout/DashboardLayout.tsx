"use client";

import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Mic,
  Music,
  BookOpen,
  Handshake,
  Calendar,
  LogOut,
  Shield,
  Activity,
  Building2,
  Globe,
  DollarSign,
  Bell,
  X,
  KeyRound,
  Mail,
  Server,
  BarChart2,
  Youtube,
  ShieldCheck,
  Settings,
  User as UserIcon,
  History,
  PenTool,
  MessageSquare,
  Music2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  AdminNotification,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '../../lib/notifications';
import { CONTRIBUTOR_ROLES } from '@/app/lib/role-access';


interface DashboardLayoutProps {
  children: React.ReactNode;
}

const ADMIN_ROLES = ['admin', 'super_admin', 'governance_admin'];

// ─── Navigation Definitions ───────────────────────────────────────────────────

const adminNavigation = [
  {
    title: 'Core',
    links: [
      { path: '/admin', label: 'Overview', icon: LayoutDashboard },
      { path: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    title: 'Stage 1 — Onboarding',
    links: [
      { path: '/admin/applications/writers',   label: 'Writers (Ahl-e-Qalam)',      icon: FileText },
      { path: '/admin/applications/vocalists', label: 'Vocalists (Ahl-e-Sada)',     icon: Mic },
      { path: '/admin/applications/producers', label: 'Producers (Ahl-e-Naghma)',   icon: Music },
      { path: '/admin/applications/literary',  label: 'Literary (Ahl-e-Tahreer)',  icon: BookOpen },
      { path: '/admin/applications/studio',    label: 'Studios (Karkhana-e-Sada)', icon: Building2 },
      { path: '/admin/studio-access-codes',    label: 'Studio Access Codes',        icon: KeyRound },
    ],
  },
  {
    title: 'Stage 2 — Content',
    links: [
      { path: '/admin/kalams',                  label: 'Kalam Editorial Queue',       icon: BookOpen },
      { path: '/admin/sadas',                   label: 'Sadas (Ahl-e-Sada)',         icon: Mic },
      { path: '/admin/articles',                label: 'Articles (Ahl-e-Tahreer)',   icon: BookOpen },
      { path: '/admin/lyrics-requests',         label: 'Lyrics Requests',            icon: Mail },
      { path: '/admin/performance-assignments', label: 'Performance Assignments',    icon: Mic },
    ],
  },
  {
    title: 'Stage 3 — Production & Studio',
    links: [
      { path: '/admin/editorial/production-consideration', label: 'Production Consideration', icon: Activity },
      { path: '/admin/production-workflow', label: 'Production Workflow',     icon: Settings },
      { path: '/admin/session-requests',    label: 'Session Requests (Queue)',icon: Calendar },
      { path: '/admin/studio-sessions',     label: 'Studio Sessions (Active)',icon: Building2 },
      { path: '/admin/release-workflow',    label: 'Release Workflow',        icon: Globe },
      { path: '/admin/cms',                 label: 'CMS Dashboard',           icon: Globe },
      { path: '/admin/cms-releases',        label: 'CMS Releases',            icon: FileText },
    ],
  },
  {
    title: 'Stage 4 — Outreach & Finance',
    links: [
      { path: '/admin/song-adoptions',        label: 'Song Adoptions',         icon: Handshake },
      { path: '/admin/youtube-analytics',    label: 'YouTube Impressions',    icon: Youtube },
      { path: '/admin/google-ads',           label: 'Google Ads Campaigns',   icon: BarChart2 },
      { path: '/admin/partnerships',       label: 'Partnerships',            icon: Handshake },
      { path: '/admin/infrastructure',     label: 'Infrastructure Proposals', icon: Server },
      { path: '/admin/contact-messages',   label: 'Contact Messages',         icon: Mail },
      { path: '/admin/royalties',          label: 'Royalty Management',       icon: DollarSign },
    ],
  },
];

const writerNavigation = [
  {
    title: 'Ahl-e-Qalam',
    links: [
      { path: '/user/writer/dashboard', label: 'Writer Dashboard', icon: LayoutDashboard },
      { path: '/user/writer/dashboard?tab=submit', label: 'Submit New Kalam', icon: PenTool },
      { path: '/user/writer/dashboard?tab=history', label: 'My Submissions', icon: History },
    ],
  },
  {
    title: 'Account',
    links: [
      { path: '/user/profile', label: 'My Profile', icon: UserIcon },
      { path: '/user/royalties', label: 'Royalties & Stats', icon: DollarSign },
    ],
  },
];

const vocalistNavigation = [
  {
    title: 'Ahl-e-Sada',
    links: [
      { path: '/user/vocalist/dashboard', label: 'Vocalist Dashboard', icon: LayoutDashboard },
      { path: '/user/vocalist/dashboard?tab=assignments', label: 'My Assignments', icon: Music },
      { path: '/user/vocalist/dashboard?tab=performances', label: 'Production History', icon: History },
    ],
  },
  {
    title: 'Account',
    links: [
      { path: '/user/profile', label: 'My Profile', icon: UserIcon },
      { path: '/user/royalties', label: 'Royalties & Stats', icon: DollarSign },
    ],
  },
];

const producerNavigation = [
  {
    title: 'Ahl-e-Naghma',
    links: [
      { path: '/user/producer/dashboard', label: 'Producer Dashboard', icon: LayoutDashboard },
      { path: '/user/producer/dashboard?tab=assignments', label: 'Curated Assignments', icon: Music2 },
      { path: '/user/producer/dashboard?tab=performances', label: 'Production History', icon: History },
    ],
  },
  {
    title: 'Account',
    links: [
      { path: '/user/profile', label: 'My Profile', icon: UserIcon },
      { path: '/user/royalties', label: 'Royalties & Stats', icon: DollarSign },
    ],
  },
];

const literaryNavigation = [
  {
    title: 'Ahl-e-Tahreer',
    links: [
      { path: '/user/literary-contributor/dashboard', label: 'Literary Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Account',
    links: [
      { path: '/user/profile', label: 'My Profile', icon: UserIcon },
      { path: '/user/royalties', label: 'Royalties & Stats', icon: DollarSign },
    ],
  },
];

const studioNavigation = [
  {
    title: 'Karkhana-e-Sada',
    links: [
      { path: '/user/studio/dashboard', label: 'Studio Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Account',
    links: [
      { path: '/user/profile', label: 'My Profile', icon: UserIcon },
      { path: '/user/royalties', label: 'Royalties & Stats', icon: DollarSign },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getNavigationForRole = (role: string) => {
  if (ADMIN_ROLES.includes(role)) return adminNavigation;
  if (role === 'writer') return writerNavigation;
  if (role === 'vocalist') return vocalistNavigation;
  if (role === 'producer') return producerNavigation;
  if (role === 'literary') return literaryNavigation;
  if (role === 'studio') return studioNavigation;
  // Fallback
  return [
    {
      title: 'Account',
      links: [
        { path: '/user/profile', label: 'My Profile', icon: UserIcon },
        { path: '/user/royalties', label: 'Royalties & Stats', icon: DollarSign },
      ],
    },
  ];
};

const getRoleLabel = (role: string) => {
  if (role === 'admin') return 'Administrator';
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'governance_admin') return 'Governance Admin';
  if (role === 'writer') return 'Ahl-e-Qalam (Writer)';
  if (role === 'vocalist') return 'Ahl-e-Sada (Vocalist)';
  if (role === 'producer') return 'Ahl-e-Naghma (Producer)';
  if (role === 'literary') return 'Ahl-e-Tahreer (Literary)';
  if (role === 'studio') return 'Karkhana (Studio)';
  return 'Contributor';
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileApproved, setProfileApproved] = useState<boolean | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const navigationSections = getNavigationForRole(user?.role || '');
  const navigationLinks = navigationSections.flatMap((section) => section.links);

  const loadAdminNotifications = () => {
    if (ADMIN_ROLES.includes(user?.role || '')) {
      setAdminNotifications(getAdminNotifications());
    }
  };

  useEffect(() => {
    if (user && ADMIN_ROLES.includes(user.role)) {
      loadAdminNotifications();
      const interval = setInterval(loadAdminNotifications, 30_000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // General Contributor Approval Check
  useEffect(() => {
    if (!user || ADMIN_ROLES.includes(user.role)) {
      setProfileApproved(true);
      return;
    }

    const checkApproval = async () => {
      try {
        const endpoint = user.role === 'writer' ? '/api/writers' : 
                         user.role === 'vocalist' ? '/api/vocalists' :
                         user.role === 'producer' ? '/api/producers' : null;
        
        if (!endpoint) {
          setProfileApproved(true);
          return;
        }

        const res = await fetch(endpoint);
        const data = await res.json();
        const profile = Array.isArray(data) ? data.find((p: any) => p.user_id === user.id || p.email === user.email) : null;
        
        if (profile) {
          const isApproved = profile.profile_status === 'approved' || 
                            profile.profile_status === 'approved_as_writer' ||
                            profile.profile_status === 'approved_as_vocalist' ||
                            profile.profile_status === 'approved_as_producer';
          setProfileApproved(isApproved);
        } else {
          setProfileApproved(false);
        }
      } catch {
        setProfileApproved(false);
      }
    };

    checkApproval();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = adminNotifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    logout();
    router.push('/');
  };

  // Restricted view for unapproved contributors
  const isContributorRoute = pathname?.startsWith('/user/writer/dashboard') || 
                            pathname?.startsWith('/user/vocalist/dashboard') ||
                            pathname?.startsWith('/user/producer/dashboard');
  
  if (user && (CONTRIBUTOR_ROLES.includes(user.role as any)) && profileApproved === false && isContributorRoute) {
    const roleType = user.role === 'writer' ? 'Ahl-e-Qalam' : 
                     user.role === 'vocalist' ? 'Ahl-e-Sada' : 
                     user.role === 'producer' ? 'Ahl-e-Naghma' :
                     user.role === 'literary' ? 'Ahl-e-Tahreer' :
                     user.role === 'studio' ? 'Karkhana-e-Sada' : 'Contributor';
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111] border border-amber-400/20 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-4">Registry Admission Pending</h2>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Your {roleType} profile is currently under institutional review. 
            Full dashboard access activates automatically upon formal authorization.
          </p>
          <div className="space-y-3">
            <Link href="/" className="block w-full py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
              Return to Website
            </Link>
            <button onClick={handleSignOut} className="block w-full py-3 text-neutral-500 hover:text-white text-sm transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (!pathname) return false;
    // Handle query params in path
    const [purePath] = path.split('?');
    const dashboardPaths = ['/admin', '/user/writer/dashboard', '/user/vocalist/dashboard', '/user/producer/dashboard', '/user/literary-contributor/dashboard', '/user/studio/dashboard'];
    if (dashboardPaths.includes(purePath)) {
      return pathname === purePath;
    }
    return pathname === purePath || pathname.startsWith(`${purePath}/`);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="p-6 border-b border-[var(--dash-border)]">
          <Link href="/" title="Back to SufiPulse website" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
            <Image
              src="/sufipulse-logo-v5.png"
              alt="SufiPulse"
              width={40}
              height={40}
              className="rounded-lg shrink-0"
            />
            <span className="text-sm font-bold text-[var(--dash-text-primary)] leading-tight">SufiPulse</span>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            {ADMIN_ROLES.includes(user?.role || '') ? (
              <Shield className="w-4 h-4 text-[var(--dash-accent)]" />
            ) : (
              <UserIcon className="w-4 h-4 text-[var(--dash-accent)]" />
            )}
            <div>
              <p className="text-xs font-semibold text-[var(--dash-text-primary)]">
                {ADMIN_ROLES.includes(user?.role || '') ? 'Portal Governance' : 'Contributor Hub'}
              </p>
              <p className="text-[10px] text-[var(--dash-text-muted)] uppercase tracking-wider font-bold">
                {ADMIN_ROLES.includes(user?.role || '') ? 'Majlis-e-Intizamiya' : 'Institutional Registry'}
              </p>
            </div>
          </div>
        </div>

        <nav className="dashboard-sidebar-nav py-4">
          {navigationSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="px-6 pb-1 text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)]">
                {section.title}
              </p>
              {section.links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`dashboard-sidebar-link ${isActive(link.path) ? 'active' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Header Bar */}
        <header className="dashboard-header">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-[var(--dash-text-primary)]">
              {navigationLinks.find(link => isActive(link.path))?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Admin Notification Bell */}
            {ADMIN_ROLES.includes(user?.role || '') && (
              <div ref={bellRef} className="relative">
                <button
                  onClick={() => { setBellOpen(prev => !prev); loadAdminNotifications(); }}
                  className="relative p-2 text-[var(--dash-text-secondary)] hover:text-[var(--dash-accent)] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
                      <span className="text-sm font-semibold text-white">Inbox</span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={() => { markAllAdminNotificationsRead(); loadAdminNotifications(); }}
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setBellOpen(false)} className="text-neutral-500 hover:text-neutral-300">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {adminNotifications.length === 0 ? (
                        <p className="text-center text-neutral-500 text-sm py-8">No notifications</p>
                      ) : (
                        adminNotifications.slice(0, 20).map(n => (
                          <div
                            key={n.id}
                            onClick={() => { markAdminNotificationRead(n.id); loadAdminNotifications(); }}
                            className={`px-4 py-3 border-b border-[#1a1a1a] cursor-pointer hover:bg-[#1a1a1a] transition-colors ${
                              !n.read ? 'border-l-2 border-l-amber-400' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium ${n.read ? 'text-neutral-400' : 'text-white'}`}>{n.title}</p>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" />}
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-neutral-600 capitalize">{n.from_role}{n.from_name ? ` · ${n.from_name}` : ''}</span>
                              <span className="text-[10px] text-neutral-600">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--dash-text-primary)]">{user?.email}</p>
              <p className="text-[10px] text-[var(--dash-text-muted)] font-bold uppercase tracking-widest">{getRoleLabel(user?.role || '')}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--dash-text-secondary)] hover:text-[var(--dash-accent)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
