"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Mic, RefreshCw, Search } from 'lucide-react';
import { notifyStatusChange, lookupProfileByName, lookupUserFromStorage, mapContentStatusToEvent } from '@/app/lib/notifications';

// Active (scheduled / in-progress / completed) session requests from the session queue
type StudioSession = {
  id: string;
  // Submitted by contributor
  requester_name?: string;
  requester_email?: string;
  user_id?: string;
  // Session detail
  session_type?: string;
  role_type?: string;
  approval_reference_code?: string;
  release_id?: string;
  release_title?: string;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  // Studio engineering assignment (set by admin)
  engineer_name?: string;
  scheduled_date?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

// Reads from the same store as session-requests — filters to non-pending statuses
const STORAGE_KEY = 'sufipulse_session_requests';
const ACTIVE_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

export default function StudioSessionsPage() {
  const [items, setItems] = useState<StudioSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('scheduled');

  const loadItems = () => {
    setLoading(true);
    try {
      if (typeof window === 'undefined') {
        setItems([]);
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: StudioSession[] = raw ? JSON.parse(raw) : [];
      // This page shows only "active" sessions (already past the pending-queue stage)
      const active = Array.isArray(parsed)
        ? parsed.filter(s => ACTIVE_STATUSES.includes(s.status as typeof ACTIVE_STATUSES[number]))
        : [];
      setItems(active);
    } finally {
      setLoading(false);
    }
  };

  const persistAll = (next: StudioSession[]) => {
    if (typeof window === 'undefined') return;
    // Merge back into the full store (don't lose pending items)
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: StudioSession[] = raw ? JSON.parse(raw) : [];
    const merged = all.map(item => {
      const updated = next.find(n => n.id === item.id);
      return updated ?? item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setItems(next);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = String(item.status || '').toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery =
        !query ||
        `${item.requester_name || ''} ${item.release_title || ''} ${item.session_type || ''} ${item.engineer_name || ''}`.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const updateStatus = (id: string, status: string) => {
    const item = items.find(i => i.id === id);
    const next = items.map(s =>
      s.id === id ? { ...s, status, updated_at: new Date().toISOString() } : s
    );
    persistAll(next);

    // Notify the requester on significant transitions
    if (item) {
      const notifyStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      if (notifyStatuses.includes(status)) {
        // Try by user_id first, fall back to name lookup
        const storedUser = item.user_id ? lookupUserFromStorage(item.user_id) : null;
        const email = storedUser?.email || item.requester_email;
        if (email) {
          const role = (item.role_type || 'studio') as 'studio' | 'vocalist' | 'writer' | 'producer' | 'literary';
          notifyStatusChange({
            user_id: item.user_id,
            email,
            name: item.requester_name || storedUser?.name || 'Contributor',
            role,
            status: mapContentStatusToEvent(status),
            reference: item.release_title || item.session_type || 'Session',
          }).catch(console.error);
        }

        // Also notify assigned engineer if present
        if (item.engineer_name) {
          const engProfile = lookupProfileByName('studio', item.engineer_name);
          const engUser = engProfile?.user_id ? lookupUserFromStorage(engProfile.user_id) : null;
          const engEmail = engUser?.email || engProfile?.email;
          if (engEmail) {
            notifyStatusChange({
              user_id: engProfile?.user_id,
              email: engEmail,
              name: engProfile?.name || item.engineer_name,
              role: 'studio',
              status: mapContentStatusToEvent(status),
              reference: item.release_title || item.session_type || 'Session',
            }).catch(console.error);
          }
        }
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Studio Sessions — Active</h1>
              <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
                Stage 3 — manage sessions that have moved past the request queue (scheduled, in-progress, completed).
                Pending requests are handled in <strong>Session Requests</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search requester, release or engineer"
                  className="dashboard-input has-icon w-full"
                />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-56">
                <option value="all">All active statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading active sessions...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">
              No active sessions found. Approve requests in <strong>Session Requests</strong> to schedule them here.
            </div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Release / Session</th>
                    <th>Type</th>
                    <th>Engineer</th>
                    <th>Preferred Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Mic className="w-4 h-4 text-[var(--dash-accent)]" />
                          <div>
                            <div className="font-medium text-[var(--dash-text-primary)]">
                              {item.requester_name || 'Unknown'}
                            </div>
                            {item.requester_email && (
                              <div className="text-xs text-[var(--dash-text-muted)]">{item.requester_email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">
                        {item.release_title || '—'}
                        {item.approval_reference_code && (
                          <div className="text-xs text-[var(--dash-text-muted)]">
                            Ref: {item.approval_reference_code}
                          </div>
                        )}
                      </td>
                      <td className="text-[var(--dash-text-secondary)] capitalize">
                        {item.session_type || '—'}
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">
                        {item.engineer_name || '—'}
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">
                        {item.preferred_date ? new Date(item.preferred_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-[var(--dash-text-secondary)] capitalize">
                        {String(item.status || '').replace('_', ' ')}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(item.id, 'in_progress')} className="dashboard-btn-secondary text-xs">Start</button>
                          <button onClick={() => updateStatus(item.id, 'completed')} className="dashboard-btn-primary text-xs">Complete</button>
                          <button onClick={() => updateStatus(item.id, 'cancelled')} className="dashboard-btn-secondary text-xs">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={loadItems} className="dashboard-btn-secondary text-sm inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
