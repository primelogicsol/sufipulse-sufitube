// app/admin/cms/releases/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getAllReleases, setReleaseState } from '@/lib/cms-api';
import type { Release } from '@/lib/cms-types';
import { Plus, Edit3, Check, Save, RotateCcw, ExternalLink } from 'lucide-react';

type ReleaseStatus = Release['status'];

const STATUS_OPTIONS: Array<{ value: ReleaseStatus; label: string }> = [
  { value: 'published', label: 'Published (Public)' },
  { value: 'unpublished', label: 'Unpublished (Private)' },
  { value: 'draft', label: 'Draft (Private)' },
  { value: 'queued', label: 'Queued (Private)' },
  { value: 'in_review', label: 'In Review (Private)' },
  { value: 'approved', label: 'Approved (Private)' },
  { value: 'archived', label: 'Archived (Private)' },
];

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [pendingStatusById, setPendingStatusById] = useState<Record<string, ReleaseStatus>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [rowUndo, setRowUndo] = useState<Record<string, Array<{ status: ReleaseStatus; visibility: 'public' | 'private' | 'unlisted' }>>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    fetched: number;
    created: number;
    updated: number;
    total: number;
    newestTitle?: string;
    newestPublishedAt?: string;
  } | null>(null);

  useEffect(() => {
    void loadReleases();
  }, [selectedStatus]);

  async function loadReleases() {
    try {
      setLoading(true);
      const filters = selectedStatus !== 'all' ? { status: selectedStatus } : undefined;
      const data = await getAllReleases(filters);
      setReleases(data || []);
    } catch (error) {
      console.error('Error loading releases:', error);
      setFeedback({ type: 'error', message: 'Failed to load releases.' });
    } finally {
      setLoading(false);
    }
  }

  async function persistStatus(release: Release, nextStatus: ReleaseStatus, isUndo = false, explicitVis?: 'public' | 'private' | 'unlisted') {
    const prevStatus = release.status;
    const prevVis = release.visibility || (release.status === 'published' ? 'public' : 'private');
    const targetVis = explicitVis ?? (nextStatus === 'published' ? 'public' : 'private');

    setSavingIds((prev) => new Set(prev).add(release.id));
    setFeedback(null);
    try {
      const updated = await setReleaseState(release.id, nextStatus, targetVis);
      setPendingStatusById((prev) => {
        const next = { ...prev };
        delete next[release.id];
        return next;
      });
      if (!isUndo && prevStatus !== updated.status) {
        setRowUndo((prev) => ({
          ...prev,
          [release.id]: [{ status: prevStatus, visibility: prevVis }, ...(prev[release.id] || [])].slice(0, 15),
        }));
      }
      setReleases((prev) => {
        if (selectedStatus !== 'all' && updated.status !== selectedStatus) {
          return prev.filter((r) => r.id !== release.id);
        }
        return prev.map((r) => (r.id === release.id ? { ...r, ...updated } : r));
      });
      setFeedback({
        type: 'success',
        message: `${isUndo ? 'Undone' : 'Saved'}: "${release.title}" → ${updated.status.toUpperCase()} (${updated.visibility || targetVis}).`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Failed to update "${release.title}": ${err?.message || 'Error'}` });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(release.id);
        return next;
      });
    }
  }

  async function handleUndoRow(release: Release) {
    const stack = rowUndo[release.id] || [];
    if (!stack.length) return;
    const [prev, ...rest] = stack;
    setRowUndo((curr) => ({ ...curr, [release.id]: rest }));
    await persistStatus(release, prev.status, true, prev.visibility);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/releases/import-youtube', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      const data = await res.json();

      const items = data.items || [];
      const updated = items.filter((r: any) => r.updatedAt !== r.createdAt).length;
      const created = items.length - updated;

      setSyncResult({
        fetched: data.importedCount || items.length,
        created,
        updated,
        total: items.length,
        newestTitle: items[0]?.title,
        newestPublishedAt: items[0]?.publishedAt || items[0]?.releaseDate,
      });

      void loadReleases();
    } catch (error) {
      console.error('Error syncing:', error);
      setFeedback({ type: 'error', message: 'Failed to sync with YouTube.' });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto" style={{ background: 'var(--dash-bg-primary)', color: 'var(--dash-text-primary)', padding: '2rem' }}>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--dash-text-primary)' }}>Release Management</h1>
          <div className="flex gap-4">
            <button
              onClick={() => void handleSync()}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
              style={{
                backgroundColor: 'var(--dash-bg-secondary)',
                color: 'var(--dash-text-primary)',
                border: '1px solid var(--dash-border)',
                cursor: syncing ? 'not-allowed' : 'pointer',
              }}
            >
              <Check size={20} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Latest Videos'}
            </button>
            <Link
              href="/admin/cms-releases/new"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition"
              style={{ backgroundColor: 'var(--dash-accent)', color: '#000', textDecoration: 'none' }}
            >
              <Plus size={20} /> New Release
            </Link>
          </div>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`mb-6 p-3.5 rounded-lg text-sm border ${
              feedback.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {syncResult && (
          <div className="mb-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--dash-bg-secondary)', borderColor: 'var(--dash-accent-muted)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--dash-accent)' }}>Sync Complete</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>FETCHED</p>
                <p className="text-xl font-bold">{syncResult.fetched}</p>
              </div>
              <div>
                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>CREATED</p>
                <p className="text-xl font-bold" style={{ color: 'var(--dash-status-approved)' }}>{syncResult.created}</p>
              </div>
              <div>
                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>UPDATED</p>
                <p className="text-xl font-bold" style={{ color: 'var(--dash-accent)' }}>{syncResult.updated}</p>
              </div>
              <div>
                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>TOTAL STORED</p>
                <p className="text-xl font-bold">{syncResult.total}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ borderBottom: '1px solid var(--dash-border)' }}>
          {['all', 'published', 'unpublished', 'draft', 'queued', 'in_review', 'approved', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className="px-4 py-2 rounded-none font-semibold transition whitespace-nowrap"
              style={{
                backgroundColor: 'transparent',
                color: selectedStatus === status ? 'var(--dash-accent)' : 'var(--dash-text-secondary)',
                borderBottom: selectedStatus === status ? '3px solid var(--dash-accent)' : 'none',
                cursor: 'pointer',
              }}
            >
              {status === 'in_review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--dash-bg-secondary)', border: '1px solid var(--dash-border)' }}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--dash-border)', borderTopColor: 'var(--dash-accent)' }} />
              <p style={{ color: 'var(--dash-text-secondary)' }}>Loading releases...</p>
            </div>
          ) : releases.length === 0 ? (
            <div className="p-12 text-center">
              <p style={{ color: 'var(--dash-text-secondary)' }}>No releases found</p>
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--dash-border)' }}>
              {releases.map((release) => {
                const staged = pendingStatusById[release.id];
                const currentSelection = staged ?? release.status;
                const hasStaged = staged !== undefined && staged !== release.status;
                const isSaving = savingIds.has(release.id);
                const isLive = release.status === 'published' && (release.visibility || 'public') === 'public';
                const undoItems = rowUndo[release.id] || [];

                return (
                  <div
                    key={release.id}
                    className="p-6 border-l-4 transition"
                    style={{
                      borderLeft: '4px solid var(--dash-accent)',
                      borderBottom: '1px solid var(--dash-border)',
                      backgroundColor: 'var(--dash-bg-secondary)',
                    }}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold" style={{ color: 'var(--dash-text-primary)' }}>{release.title}</h3>
                        <p style={{ color: 'var(--dash-text-secondary)', fontSize: '0.875rem' }}>/{release.slug}</p>
                        {release.description && (
                          <p style={{ color: 'var(--dash-text-secondary)', marginTop: '0.5rem' }} className="line-clamp-2">{release.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--dash-accent-muted)', color: 'var(--dash-accent)' }}>
                          {release.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2.5 py-1 rounded text-xs font-semibold ${isLive ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                          {isLive ? 'Live on Public Site' : 'Hidden from Public'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center justify-end pt-2 border-t border-white/5">
                      <select
                        value={currentSelection}
                        disabled={isSaving}
                        onChange={(e) => {
                          const next = e.target.value as ReleaseStatus;
                          setPendingStatusById((prev) => {
                            const copy = { ...prev };
                            if (next === release.status) delete copy[release.id];
                            else copy[release.id] = next;
                            return copy;
                          });
                        }}
                        className="form-input py-1.5 px-3 text-xs rounded-lg"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>

                      {hasStaged && (
                        <>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => void persistStatus(release, staged)}
                            className="dashboard-btn-primary px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setPendingStatusById((prev) => { const c = { ...prev }; delete c[release.id]; return c; })}
                            className="dashboard-btn-secondary px-3 py-2 rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {!hasStaged && undoItems.length > 0 && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void handleUndoRow(release)}
                          className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-200 hover:bg-amber-500/25"
                        >
                          <RotateCcw size={14} /> Undo ({undoItems[0].status})
                        </button>
                      )}

                      {isLive && (
                        <a
                          href={`/release-detail/${release.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold dashboard-btn-secondary"
                        >
                          <ExternalLink size={14} /> View Live
                        </a>
                      )}

                      <Link
                        href={`/admin/cms-releases/${release.id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold dashboard-btn-secondary"
                      >
                        <Edit3 size={14} /> Full Editor
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
