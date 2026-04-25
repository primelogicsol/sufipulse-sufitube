"use client";

import { useAuth } from '@/app/contexts/AuthContext';
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
} from '@/app/lib/notifications';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationSections = [
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
      { path: '/admin/kalams',                  label: 'Kalams (Ahl-e-Qalam)',       icon: Music },
      { path: '/admin/sadas',                   label: 'Sadas (Ahl-e-Sada)',         icon: Mic },
      { path: '/admin/articles',                label: 'Articles (Ahl-e-Tahreer)',   icon: BookOpen },
      { path: '/admin/performance-assignments', label: 'Performance Assignments',    icon: Mic },
    ],
  },
  {
    title: 'Stage 3 — Production & Studio',
    links: [
      { path: '/admin/production-workflow', label: 'Production Workflow',     icon: Activity },
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
      { path: '/admin/song-adoptions',     label: 'Song Adoptions',         icon: Handshake },
      { path: '/admin/partnerships',       label: 'Partnerships',            icon: Handshake },
      { path: '/admin/infrastructure',     label: 'Infrastructure Proposals', icon: Server },
      { path: '/admin/contact-messages',   label: 'Contact Messages',         icon: Mail },
      { path: '/admin/royalties',          label: 'Royalty Management',       icon: DollarSign },
    ],
  },
];

const navigationLinks = navigationSections.flatMap((section) => section.links);

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const loadAdminNotifications = () => {
    setAdminNotifications(getAdminNotifications());
  };

  useEffect(() => {
    loadAdminNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadAdminNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

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

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname === path || pathname.startsWith(`${path}/`);
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
            <Shield className="w-4 h-4 text-[var(--dash-accent)]" />
            <div>
              <p className="text-xs font-semibold text-[var(--dash-text-primary)]">Admin Portal</p>
              <p className="text-[10px] text-[var(--dash-text-muted)]">Governance Control</p>
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
              {navigationLinks.find(link => isActive(link.path))?.label || 'Admin Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Admin Notification Bell */}
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
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--dash-text-primary)]">{user?.email}</p>
              <p className="text-xs text-[var(--dash-text-muted)]">Administrator</p>
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

export { DashboardLayout };
