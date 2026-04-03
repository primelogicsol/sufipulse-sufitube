"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserNotifications, markNotificationRead } from '@/app/lib/notifications';
import { hasRoleAccess } from '@/app/lib/role-access';
import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarClock,
  Bell,
  Settings,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  LogOut,
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:      { label: 'Pending',       color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  under_review: { label: 'Under Review',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  approved:     { label: 'Approved',      color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  scheduled:    { label: 'Scheduled',     color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  rejected:     { label: 'Rejected',      color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  application_received: { label: 'Received', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  approved_for_review:  { label: 'In Review', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
};

type Tab = 'overview' | 'sessions' | 'notifications';

export default function StudioDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sessionRequests, setSessionRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!hasRoleAccess(user, 'studio')) { router.push('/'); return; }

    const raw = typeof window !== 'undefined'
      ? localStorage.getItem('sufipulse_session_requests')
      : null;
    setSessionRequests(raw ? JSON.parse(raw) : []);

    if (user.id) {
      setNotifications(getUserNotifications(user.id));
    }

    setLoading(false);
  }, [user, router]);

  if (loading || !user) return null;

  const unread = notifications.filter(n => !n.read).length;
  const approved = sessionRequests.filter(r => r.status === 'approved' || r.status === 'scheduled').length;

  const tabClass = (t: Tab) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === t
        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
    }`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800/60 bg-neutral-900/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Karkhana-e-Sada</h1>
            <p className="text-xs text-neutral-400">Studio Partner Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveTab('notifications'); }}
              className="relative p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <button
              onClick={() => logout?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Nav tabs */}
        <nav className="flex items-center gap-2 mb-8 flex-wrap">
          <button className={tabClass('overview')} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={15} /> Overview
          </button>
          <button className={tabClass('sessions')} onClick={() => setActiveTab('sessions')}>
            <CalendarClock size={15} /> Session Requests
            {sessionRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-px text-[11px] bg-neutral-800 border border-neutral-700 rounded-full text-neutral-300">
                {sessionRequests.length}
              </span>
            )}
          </button>
          <button className={tabClass('notifications')} onClick={() => setActiveTab('notifications')}>
            <Bell size={15} /> Notifications
            {unread > 0 && (
              <span className="ml-1 px-1.5 py-px text-[11px] bg-amber-400 text-black rounded-full font-semibold">
                {unread}
              </span>
            )}
          </button>
          <Link
            href="/user/studio/profile"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-md transition-colors"
          >
            <Settings size={15} /> Profile Settings
          </Link>
        </nav>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-lg p-5">
                <p className="text-xs text-neutral-400 mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-white">{sessionRequests.length}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-lg p-5">
                <p className="text-xs text-neutral-400 mb-1">Approved / Scheduled</p>
                <p className="text-2xl font-bold text-green-400">{approved}</p>
              </div>
              <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-lg p-5">
                <p className="text-xs text-neutral-400 mb-1">Unread Notifications</p>
                <p className="text-2xl font-bold text-amber-400">{unread}</p>
              </div>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Recent Session Requests</h2>
              {sessionRequests.length === 0 ? (
                <p className="text-sm text-neutral-400">No session requests submitted yet.</p>
              ) : (
                <ul className="space-y-3">
                  {sessionRequests.slice(-5).reverse().map((req) => (
                    <li key={req.id} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-neutral-300 truncate">
                        {req.session_type || 'Session'} — {req.approval_reference_code || req.id}
                      </span>
                      <span className={`shrink-0 px-2 py-0.5 rounded border text-xs font-medium ${STATUS_LABELS[req.status]?.color ?? 'text-neutral-400'}`}>
                        {STATUS_LABELS[req.status]?.label ?? req.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {sessionRequests.length > 0 && (
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="mt-4 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View all requests →
                </button>
              )}
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-lg p-6">
              <h2 className="text-sm font-semibold text-white mb-3">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/studio-sessions"
                  className="px-4 py-2 text-sm bg-amber-400 text-neutral-950 font-medium rounded-md hover:bg-amber-500 transition-colors"
                >
                  Request a Session
                </Link>
                <Link
                  href="/user/studio/profile"
                  className="px-4 py-2 text-sm border border-neutral-700 text-neutral-300 rounded-md hover:text-white hover:border-neutral-500 transition-colors"
                >
                  Edit Studio Profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── SESSION REQUESTS ── */}
        {activeTab === 'sessions' && (
          <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-lg p-6">
            <h2 className="text-base font-semibold text-white mb-5">Session Requests</h2>
            {sessionRequests.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <CalendarClock size={32} className="mx-auto text-neutral-600" />
                <p className="text-sm text-neutral-400">No session requests found.</p>
                <Link
                  href="/studio-sessions"
                  className="inline-block mt-2 px-5 py-2 text-sm bg-amber-400 text-neutral-950 font-medium rounded-md hover:bg-amber-500 transition-colors"
                >
                  Submit a Request
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-800/60">
                {[...sessionRequests].reverse().map((req) => (
                  <li key={req.id} className="py-4 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {req.session_type || 'Session Request'}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Ref: {req.approval_reference_code || '—'}
                          {req.role_type ? ` · ${req.role_type}` : ''}
                          {req.preferred_date_start ? ` · ${req.preferred_date_start}` : ''}
                        </p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded border text-xs font-medium ${STATUS_LABELS[req.status]?.color ?? 'text-neutral-400'}`}>
                        {STATUS_LABELS[req.status]?.label ?? req.status}
                      </span>
                    </div>
                    {req.additional_notes && (
                      <p className="text-xs text-neutral-500 italic">{req.additional_notes}</p>
                    )}
                    <p className="text-[11px] text-neutral-600">
                      Submitted {req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Notifications</h2>
              {unread > 0 && (
                <span className="text-xs text-amber-400">{unread} unread</span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Bell size={32} className="mx-auto text-neutral-600" />
                <p className="text-sm text-neutral-400">No notifications yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-800/60">
                {[...notifications].reverse().map((n) => (
                  <li
                    key={n.id}
                    className={`py-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-neutral-800/20 rounded px-2 ${
                      n.read ? 'opacity-60' : ''
                    }`}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setNotifications(getUserNotifications(user.id!));
                    }}
                  >
                    <span className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${n.read ? 'bg-neutral-600' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-neutral-600 mt-1">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
