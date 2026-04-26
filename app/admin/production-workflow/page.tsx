"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Activity, RefreshCw } from 'lucide-react';

type ReleaseItem = {
  id: string;
  title: string;
  status: string;
  releaseDate?: string;
  updatedAt?: string;
};

const PRODUCTION_STATUSES = ['draft', 'in_review', 'approved', 'published', 'archived'] as const;

export default function ProductionWorkflowPage() {
  const [items, setItems] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/releases?status=all');
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

  const moveToStatus = async (item: ReleaseItem, status: string) => {
    await fetch(`/api/releases/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, status }),
    });
    await loadItems();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Production Workflow</h1>
          <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
            Stage 3 workflow: move releases through draft, review, approval, and publish gates.
          </p>
        </div>

        <div className="dashboard-card">
          <div className="flex gap-3 mb-5">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-52">
              <option value="all">All statuses</option>
              {PRODUCTION_STATUSES.map((status) => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
            <button onClick={loadItems} className="dashboard-btn-secondary inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading workflow items...</p></div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Release</th>
                    <th>Release Date</th>
                    <th>Status</th>
                    <th className="text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-[var(--dash-text-muted)]">No releases in this workflow stage</td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Activity className="w-4 h-4 text-[var(--dash-accent)]" />
                            <span className="font-medium text-[var(--dash-text-primary)]">{item.title}</span>
                          </div>
                        </td>
                        <td className="text-[var(--dash-text-secondary)]">
                          {item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="text-[var(--dash-text-secondary)] capitalize">{item.status?.replace('_', ' ')}</td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => moveToStatus(item, 'in_review')} className="dashboard-btn-secondary text-xs">To Review</button>
                            <button onClick={() => moveToStatus(item, 'approved')} className="dashboard-btn-secondary text-xs">Approve</button>
                            <button onClick={() => moveToStatus(item, 'published')} className="dashboard-btn-primary text-xs">Publish</button>
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
