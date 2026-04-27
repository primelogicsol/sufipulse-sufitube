"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BookOpen, RefreshCw, Search } from 'lucide-react';

type ArticleItem = {
  id: string;
  title?: string;
  author_name?: string;
  email?: string;
  user_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  revision_log?: Array<{ note: string; requestedAt: string; requestedBy: string }>;
};

const STATUSES = ['pending', 'under_review', 'revision_requested', 'approved', 'published', 'rejected'] as const;

function ArticlesPageInner() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>(searchParams?.get('status') || 'pending');
  const [revisionTarget, setRevisionTarget] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/articles');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
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
        `${item.title || ''} ${item.author_name || ''} ${item.user_id || ''}`.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const updateStatus = async (id: string, status: string, admin_note?: string) => {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(admin_note ? { admin_note } : {}) }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update status');
    }
    await loadItems();
  };

  const submitRevision = async () => {
    if (!revisionTarget || !revisionNote.trim()) return;
    await updateStatus(revisionTarget, 'revision_requested', revisionNote.trim());
    setRevisionTarget(null);
    setRevisionNote('');
  };

  return (
    <DashboardLayout>
      {revisionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-[var(--dash-text-primary)] mb-3">Request Revision</h3>
            <p className="text-xs text-[var(--dash-text-muted)] mb-3">Describe what needs to be changed. This message will be emailed to the contributor.</p>
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="e.g. Please expand the introduction and correct the transliteration in verse 2..."
              className="dashboard-input w-full h-28 resize-none mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRevisionTarget(null); setRevisionNote(''); }} className="dashboard-btn-secondary text-sm px-4">Cancel</button>
              <button onClick={submitRevision} disabled={!revisionNote.trim()} className="dashboard-btn-primary text-sm px-4 disabled:opacity-50">Send Revision Request</button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Article Moderation</h1>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title or author"
                  className="dashboard-input has-icon w-full"
                />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-56">
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading articles...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">No article submissions found</div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Author</th>
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
                          <BookOpen className="w-4 h-4 text-[var(--dash-accent)]" />
                          <span className="font-medium text-[var(--dash-text-primary)]">{item.title || 'Untitled'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-[var(--dash-text-secondary)]">{item.author_name || item.user_id || 'Unknown'}</div>
                        {item.email && <div className="text-xs text-[var(--dash-text-muted)]">{item.email}</div>}
                      </td>
                      <td>
                        <span className="text-[var(--dash-text-secondary)] capitalize">{String(item.status || 'pending').replace('_', ' ')}</span>
                        {(item.revision_log?.length ?? 0) > 0 && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[var(--dash-status-pending)]/20 text-[var(--dash-status-pending)]">{item.revision_log!.length}×</span>
                        )}
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(item.id, 'under_review')} className="dashboard-btn-secondary text-xs">Under Review</button>
                          <button onClick={() => updateStatus(item.id, 'published')} className="dashboard-btn-primary text-xs">Publish</button>
                          <button onClick={() => { setRevisionTarget(item.id); setRevisionNote(''); }} className="dashboard-btn-secondary text-xs">Revision</button>
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

export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesPageInner />
    </Suspense>
  );
}
