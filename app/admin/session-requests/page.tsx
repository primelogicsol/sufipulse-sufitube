"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { createNotification } from '@/app/lib/notifications';
import { getAllReleases } from '@/lib/cms-api';
import type { Release } from '@/lib/cms-types';
import { Calendar, RefreshCw } from 'lucide-react';

type SessionRequest = {
  id: string;
  requester_name?: string;
  contact_name?: string;
  email?: string;
  user_id?: string;
  session_type?: string;
  preferred_date?: string;
  preferred_date_start?: string;
  approval_reference_code?: string;
  role_type?: string;
  release_id?: string;
  status?: string;
  created_at?: string;
};

const STORAGE_KEY = 'sufipulse_session_requests';
const STATUSES = ['pending', 'under_review', 'approved', 'scheduled', 'rejected'] as const;

export default function SessionRequestsPage() {
  const [items, setItems] = useState<SessionRequest[]>([]);
  const [cmsReleases, setCmsReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('pending');

  const loadItems = () => {
    setLoading(true);
    try {
      if (typeof window === 'undefined') {
        setItems([]);
        return;
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } finally {
      setLoading(false);
    }
  };

  const persistItems = (next: SessionRequest[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setItems(next);
  };

  useEffect(() => { loadItems(); }, []);
  useEffect(() => { getAllReleases().then(setCmsReleases).catch(() => {}); }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = String(item.status || 'pending').toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery =
        !query ||
        `${item.requester_name || ''} ${item.contact_name || ''} ${item.email || ''}`.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const updateStatus = (id: string, status: string) => {
    const next = items.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            reviewed_at: new Date().toISOString(),
          }
        : item
    );
    persistItems(next);

    // Notify the contributor in-app if user_id is known
    const item = items.find((r) => r.id === id);
    if (item?.user_id) {
      const statusMessages: Record<string, string> = {
        under_review: 'Your studio session request is now under review. We will update you shortly.',
        approved:     'Your studio session request has been approved. The admin team will be in touch to confirm the schedule.',
        scheduled:    'Your studio session has been scheduled. Please check your email for further details from the admin team.',
        rejected:     'Your studio session request was not approved at this time. Contact the admin team for further guidance.',
      };
      const msg = statusMessages[status];
      if (msg) {
        createNotification({
          user_id: item.user_id,
          title: 'Studio Session Request Update',
          message: msg,
          event: 'access_code_issued',
          action_url: '/user/studio/dashboard',
        });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Session Requests</h1>
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search requester or email"
                className="dashboard-input"
              />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-56">
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading session requests...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">No session requests found</div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Contact</th>
                    <th>Session Type</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-[var(--dash-accent)]" />
                          <div>
                            <span className="font-medium text-[var(--dash-text-primary)] block">{item.requester_name || item.contact_name || 'Unknown'}</span>
                            {item.approval_reference_code && (
                              <span className="text-xs font-mono text-[var(--dash-text-muted)]">{item.approval_reference_code}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">{item.email || '-'}</td>
                      <td className="text-[var(--dash-text-secondary)]">
                        <div>{item.session_type === 'in_person' ? 'In-Person' : item.session_type === 'remote' ? 'Remote' : item.session_type || '-'}</div>
                        {item.release_id && (
                          <div className="text-xs text-[var(--dash-text-muted)] mt-0.5">
                            {cmsReleases.find(r => r.id === item.release_id)?.title ?? `Release #${item.release_id}`}
                          </div>
                        )}
                      </td>
                      <td className="text-[var(--dash-text-secondary)] capitalize">{String(item.status || 'pending').replace('_', ' ')}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(item.id, 'under_review')} className="dashboard-btn-secondary text-xs">Under Review</button>
                          <button onClick={() => updateStatus(item.id, 'scheduled')} className="dashboard-btn-primary text-xs">Schedule</button>
                          <button onClick={() => updateStatus(item.id, 'rejected')} className="dashboard-btn-secondary text-xs">Reject</button>
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
