"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Mic, RefreshCw, Search } from 'lucide-react';

type StudioSession = {
  id: string;
  requester_name?: string;
  requester_email?: string;
  email?: string;
  user_id?: string;
  session_type?: string;
  role_type?: string;
  approval_reference_code?: string;
  release_id?: string;
  release_title?: string;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
  engineer_name?: string;
  scheduled_date?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

const ACTIVE_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

export default function StudioSessionsPage() {
  const [items, setItems] = useState<StudioSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('scheduled');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/session-requests');
      if (!res.ok) throw new Error('Failed to load sessions');
      const data: StudioSession[] = await res.json();
      const active = Array.isArray(data)
        ? data.filter(s => ACTIVE_STATUSES.includes(s.status as typeof ACTIVE_STATUSES[number]))
        : [];
      setItems(active);
    } catch (e: any) {
      setError(e.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/session-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated: StudioSession = await res.json();
      setItems(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    } catch {
      // Keep existing data on failure
    } finally {
      setUpdating(null);
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
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
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
                            {(item.requester_email || item.email) && (
                              <div className="text-xs text-[var(--dash-text-muted)]">{item.requester_email || item.email}</div>
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
                          <button
                            onClick={() => updateStatus(item.id, 'in_progress')}
                            disabled={updating === item.id}
                            className="dashboard-btn-secondary text-xs"
                          >Start</button>
                          <button
                            onClick={() => updateStatus(item.id, 'completed')}
                            disabled={updating === item.id}
                            className="dashboard-btn-primary text-xs"
                          >Complete</button>
                          <button
                            onClick={() => updateStatus(item.id, 'cancelled')}
                            disabled={updating === item.id}
                            className="dashboard-btn-secondary text-xs"
                          >Cancel</button>
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
