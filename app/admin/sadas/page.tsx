"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { storage } from '@/app/lib/storage';
import { notifyStatusChange, lookupUserFromStorage, mapContentStatusToEvent } from '@/app/lib/notifications';
import { Mic, RefreshCw } from 'lucide-react';

type SadaItem = {
  id: string;
  title?: string;
  vocalist_name?: string;
  author_name?: string;
  user_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  lyrics?: string;
  audio_url?: string;
};

const STATUSES = ['pending', 'under_review', 'revision_requested', 'approved', 'published', 'rejected'] as const;

export default function SadasPage() {
  const [items, setItems] = useState<SadaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('pending');

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await storage.getAll('sada');
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = String(item.status || 'pending').toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery =
        !query ||
        `${item.title || ''} ${item.vocalist_name || ''} ${item.author_name || ''} ${item.user_id || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const updateStatus = async (id: string, status: string) => {
    await storage.update('sada', id, {
      status,
      reviewed_at: new Date().toISOString(),
    });

    // Notify the vocalist
    const sada = items.find(i => i.id === id);
    if (sada?.user_id) {
      const storedUser = lookupUserFromStorage(sada.user_id);
      if (storedUser) {
        notifyStatusChange({
          user_id: sada.user_id,
          email: storedUser.email,
          name: sada.vocalist_name || sada.author_name || storedUser.name,
          role: 'vocalist',
          status: mapContentStatusToEvent(status),
          reference: sada.title,
        }).catch(console.error);
      }
    }

    await loadItems();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Sada Moderation — Ahl-e-Sada</h1>
            <p className="text-sm text-[var(--dash-text-secondary)]">
              Stage 2 — review vocal performances submitted by approved vocalists.
            </p>
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title or vocalist"
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
            <div className="dashboard-loading"><p>Loading sadas...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">No sada submissions found</div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Sada</th>
                    <th>Vocalist</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Mic className="w-4 h-4 text-[var(--dash-accent)]" />
                          <span className="font-medium text-[var(--dash-text-primary)]">{item.title || 'Untitled'}</span>
                        </div>
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">
                        {item.vocalist_name || item.author_name || item.user_id || 'Unknown'}
                      </td>
                      <td className="text-[var(--dash-text-secondary)] capitalize">
                        {String(item.status || 'pending').replace('_', ' ')}
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateStatus(item.id, 'under_review')}
                            className="dashboard-btn-secondary text-xs"
                          >
                            Under Review
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, 'approved')}
                            className="dashboard-btn-primary text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, 'revision_requested')}
                            className="dashboard-btn-secondary text-xs"
                          >
                            Revision
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, 'rejected')}
                            className="dashboard-btn-secondary text-xs"
                          >
                            Reject
                          </button>
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
