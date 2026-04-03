"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Globe, RefreshCw } from 'lucide-react';

type ReleaseItem = {
  id: string;
  title: string;
  status: string;
  releaseDate?: string;
  publishedAt?: string;
};

const STATUS_FILTERS = ['all', 'approved', 'published', 'unpublished', 'archived'] as const;

export default function ReleaseWorkflowPage() {
  const [items, setItems] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/releases');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const updateRelease = async (item: ReleaseItem, status: string) => {
    await fetch(`/api/releases/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item,
        status,
        ...(status === 'published' ? { publishedAt: new Date().toISOString() } : {}),
      }),
    });
    await loadItems();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Release Workflow</h1>
          <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
            Governance gate for go-live decisions and archive lifecycle.
          </p>
        </div>

        <div className="dashboard-card">
          <div className="flex gap-3 mb-5">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-56">
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>{status === 'all' ? 'All statuses' : status.replace('_', ' ')}</option>
              ))}
            </select>
            <button onClick={loadItems} className="dashboard-btn-secondary inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading release workflow...</p></div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Release</th>
                    <th>Release Date</th>
                    <th>Published</th>
                    <th>Status</th>
                    <th className="text-right">Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-[var(--dash-text-muted)]">No releases found for this stage</td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-[var(--dash-accent)]" />
                            <span className="font-medium text-[var(--dash-text-primary)]">{item.title}</span>
                          </div>
                        </td>
                        <td className="text-[var(--dash-text-secondary)]">
                          {item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="text-[var(--dash-text-secondary)]">
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="text-[var(--dash-text-secondary)] capitalize">{item.status?.replace('_', ' ')}</td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => updateRelease(item, 'approved')} className="dashboard-btn-secondary text-xs">Approve</button>
                            <button onClick={() => updateRelease(item, 'published')} className="dashboard-btn-primary text-xs">Publish</button>
                            <button onClick={() => updateRelease(item, 'unpublished')} className="dashboard-btn-secondary text-xs">Unpublish</button>
                            <button onClick={() => updateRelease(item, 'archived')} className="dashboard-btn-secondary text-xs">Archive</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
