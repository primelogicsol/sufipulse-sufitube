// app/admin/cms/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAllReleases, deleteRelease, setReleaseState } from '@/lib/cms-api';
import type { Release } from '@/lib/cms-types';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  FileUp,
  Image,
  Users,
  BookOpen,
  Globe,
  Save,
  RotateCcw,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';

type ReleaseStatus = Release['status'];

interface StatusTransitionRecord {
  releaseId: string;
  releaseTitle: string;
  previousStatus: ReleaseStatus;
  previousVisibility: 'public' | 'private' | 'unlisted';
  nextStatus: ReleaseStatus;
  nextVisibility: 'public' | 'private' | 'unlisted';
  savedAt: string;
}

const STATUS_OPTIONS: Array<{ value: ReleaseStatus; label: string; publicNote: string }> = [
  { value: 'published', label: 'Published', publicNote: 'Live on Public Site' },
  { value: 'unpublished', label: 'Unpublished', publicNote: 'Hidden from Public' },
  { value: 'draft', label: 'Draft', publicNote: 'Hidden from Public' },
  { value: 'queued', label: 'Queued', publicNote: 'Hidden from Public' },
  { value: 'in_review', label: 'Under Review', publicNote: 'Hidden from Public' },
  { value: 'approved', label: 'Approved', publicNote: 'Hidden from Public' },
  { value: 'archived', label: 'Archived', publicNote: 'Hidden from Public' },
];

const STATUS_LABELS: Record<string, string> = {
  published: 'Published',
  unpublished: 'Unpublished',
  draft: 'Draft',
  queued: 'Queued',
  in_review: 'Under Review',
  approved: 'Approved',
  archived: 'Archived',
};

const STATUS_BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  published: { bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.45)', text: '#6ee7b7' },
  unpublished: { bg: 'rgba(249, 115, 22, 0.14)', border: 'rgba(249, 115, 22, 0.45)', text: '#fdba74' },
  draft: { bg: 'rgba(148, 163, 184, 0.14)', border: 'rgba(148, 163, 184, 0.4)', text: '#cbd5e1' },
  queued: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.45)', text: '#d8b4fe' },
  in_review: { bg: 'rgba(59, 130, 246, 0.14)', border: 'rgba(59, 130, 246, 0.45)', text: '#93c5fd' },
  approved: { bg: 'rgba(20, 184, 166, 0.14)', border: 'rgba(20, 184, 166, 0.45)', text: '#5eead4' },
  archived: { bg: 'rgba(100, 116, 139, 0.14)', border: 'rgba(100, 116, 139, 0.4)', text: '#94a3b8' },
};

export default function CMSPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Staged status selections before clicking Save: { [releaseId]: nextStatus }
  const [pendingStatusById, setPendingStatusById] = useState<Record<string, ReleaseStatus>>({});

  // Multi-step undo stacks: global stack + per-release stack so any song can undo back through prior states
  const [undoStack, setUndoStack] = useState<StatusTransitionRecord[]>([]);
  const [rowUndoHistory, setRowUndoHistory] = useState<Record<string, StatusTransitionRecord[]>>({});

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    canUndoLast?: boolean;
  } | null>(null);

  useEffect(() => {
    void loadReleases();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchQuery, rowsPerPage]);

  async function loadReleases() {
    try {
      setLoading(true);
      const filters: { status?: string; category?: string } = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }
      const data = await getAllReleases(filters);
      setReleases(data || []);
    } catch (error) {
      console.error('Error loading releases:', error);
      setFeedback({ type: 'error', message: 'Failed to load releases from server.' });
    } finally {
      setLoading(false);
    }
  }

  const handleStageStatus = (release: Release, nextStatus: ReleaseStatus) => {
    setPendingStatusById((prev) => {
      const next = { ...prev };
      if (nextStatus === release.status) {
        delete next[release.id];
      } else {
        next[release.id] = nextStatus;
      }
      return next;
    });
  };

  const handleDiscardRowStage = (releaseId: string) => {
    setPendingStatusById((prev) => {
      const next = { ...prev };
      delete next[releaseId];
      return next;
    });
  };

  const handleDiscardAllStaged = () => {
    setPendingStatusById({});
  };

  const applyAndPersistState = async (
    release: Release,
    targetStatus: ReleaseStatus,
    options?: { isUndo?: boolean; explicitVisibility?: 'public' | 'private' | 'unlisted' }
  ) => {
    const previousStatus = release.status;
    const previousVisibility = release.visibility || (release.status === 'published' ? 'public' : 'private');
    const targetVisibility = options?.explicitVisibility ?? (targetStatus === 'published' ? 'public' : 'private');

    setSavingIds((prev) => new Set(prev).add(release.id));
    setFeedback(null);

    try {
      const updated = await setReleaseState(release.id, targetStatus, targetVisibility);
      const persistedStatus = updated.status;
      const persistedVisibility = updated.visibility || (persistedStatus === 'published' ? 'public' : 'private');

      // Clear staged selection for this row
      setPendingStatusById((prev) => {
        const next = { ...prev };
        delete next[release.id];
        return next;
      });

      // Update local table state cleanly
      setReleases((prev) => {
        if (statusFilter !== 'all' && persistedStatus !== statusFilter) {
          return prev.filter((r) => r.id !== release.id);
        }
        return prev.map((r) =>
          r.id === release.id
            ? { ...r, ...updated, status: persistedStatus, visibility: persistedVisibility }
            : r
        );
      });

      if (!options?.isUndo && (previousStatus !== persistedStatus || previousVisibility !== persistedVisibility)) {
        const record: StatusTransitionRecord = {
          releaseId: release.id,
          releaseTitle: release.title,
          previousStatus,
          previousVisibility,
          nextStatus: persistedStatus,
          nextVisibility: persistedVisibility,
          savedAt: new Date().toISOString(),
        };
        setUndoStack((prev) => [record, ...prev].slice(0, 50));
        setRowUndoHistory((prev) => ({
          ...prev,
          [release.id]: [record, ...(prev[release.id] || [])].slice(0, 20),
        }));
      }

      const publicBehavior =
        persistedStatus === 'published' && persistedVisibility === 'public'
          ? 'Now LIVE on public frontend pages (/, /releases, /release-detail).'
          : 'Now HIDDEN from all public frontend pages (/, /releases, /release-detail return 404).';

      setFeedback({
        type: 'success',
        message: `${options?.isUndo ? 'Undone' : 'Saved'}: "${release.title}" → ${STATUS_LABELS[persistedStatus] || persistedStatus} (${persistedVisibility}). ${publicBehavior}`,
        canUndoLast: !options?.isUndo,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Failed to save "${release.title}": ${err?.message || 'Server error'}`,
      });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(release.id);
        return next;
      });
    }
  };

  const handleSaveRow = async (release: Release) => {
    const nextStatus = pendingStatusById[release.id];
    if (!nextStatus) return;
    await applyAndPersistState(release, nextStatus);
  };

  const handleSaveAllStaged = async () => {
    const entries = Object.entries(pendingStatusById);
    if (entries.length === 0) return;

    const releaseMap = new Map(releases.map((r) => [r.id, r]));
    let savedCount = 0;
    let errorCount = 0;
    const batchRecords: StatusTransitionRecord[] = [];

    for (const [releaseId, nextStatus] of entries) {
      const release = releaseMap.get(releaseId);
      if (!release) continue;

      const previousStatus = release.status;
      const previousVisibility = release.visibility || (release.status === 'published' ? 'public' : 'private');
      const targetVisibility = nextStatus === 'published' ? 'public' : 'private';

      setSavingIds((prev) => new Set(prev).add(releaseId));
      try {
        const updated = await setReleaseState(releaseId, nextStatus, targetVisibility);
        const persistedStatus = updated.status;
        const persistedVisibility = updated.visibility || (persistedStatus === 'published' ? 'public' : 'private');

        savedCount += 1;
        const record: StatusTransitionRecord = {
          releaseId,
          releaseTitle: release.title,
          previousStatus,
          previousVisibility,
          nextStatus: persistedStatus,
          nextVisibility: persistedVisibility,
          savedAt: new Date().toISOString(),
        };
        batchRecords.push(record);
        setRowUndoHistory((prev) => ({
          ...prev,
          [releaseId]: [record, ...(prev[releaseId] || [])].slice(0, 20),
        }));

        setReleases((prev) => {
          if (statusFilter !== 'all' && persistedStatus !== statusFilter) {
            return prev.filter((r) => r.id !== releaseId);
          }
          return prev.map((r) =>
            r.id === releaseId
              ? { ...r, ...updated, status: persistedStatus, visibility: persistedVisibility }
              : r
          );
        });
        setPendingStatusById((prev) => {
          const next = { ...prev };
          delete next[releaseId];
          return next;
        });
      } catch {
        errorCount += 1;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(releaseId);
          return next;
        });
      }
    }

    if (batchRecords.length > 0) {
      setUndoStack((prev) => [...batchRecords, ...prev].slice(0, 50));
    }

    if (errorCount > 0) {
      setFeedback({
        type: 'error',
        message: `Saved ${savedCount} release(s), ${errorCount} failed. Check any remaining staged rows.`,
      });
    } else {
      setFeedback({
        type: 'success',
        message: `Saved ${savedCount} status change${savedCount === 1 ? '' : 's'} and synced public frontend visibility immediately.`,
        canUndoLast: batchRecords.length > 0,
      });
    }
  };

  const handleUndoRow = async (release: Release) => {
    const history = rowUndoHistory[release.id] || [];
    if (history.length === 0) return;
    const [latest, ...rest] = history;
    setRowUndoHistory((prev) => ({ ...prev, [release.id]: rest }));
    setUndoStack((prev) => prev.filter((item) => item !== latest));
    await applyAndPersistState(release, latest.previousStatus, {
      isUndo: true,
      explicitVisibility: latest.previousVisibility,
    });
  };

  const handleUndoLastGlobal = async () => {
    if (undoStack.length === 0) return;
    const [latest, ...rest] = undoStack;
    setUndoStack(rest);
    setRowUndoHistory((prev) => ({
      ...prev,
      [latest.releaseId]: (prev[latest.releaseId] || []).filter((item) => item !== latest),
    }));

    const existingInView = releases.find((r) => r.id === latest.releaseId) || ({
      id: latest.releaseId,
      title: latest.releaseTitle,
      slug: latest.releaseId,
      status: latest.nextStatus,
      visibility: latest.nextVisibility,
      view_count: 0,
      like_count: 0,
      show_views: true,
      show_likes: true,
      enable_lyrics: true,
      enable_commentary: true,
      enable_sponsors: false,
      enable_adoption: true,
      enable_credits: true,
    } as Release);

    await applyAndPersistState(existingInView, latest.previousStatus, {
      isUndo: true,
      explicitVisibility: latest.previousVisibility,
    });
    await loadReleases();
  };

  const handleDelete = async (release: Release) => {
    if (!confirm(`Permanently delete "${release.title}"? Tip: Choose Unpublished, Draft, Queued, or Archived instead if you want to keep lyrics and metadata.`)) return;
    setDeletingId(release.id);
    try {
      await deleteRelease(release.id);
      setReleases((prev) => prev.filter((r) => r.id !== release.id));
      setFeedback({ type: 'success', message: `Deleted "${release.title}".` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Delete failed: ${err.message}` });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReleases = releases.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.title.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q);
  });

  const totalReleases = filteredReleases.length;
  const totalPages = Math.max(1, Math.ceil(totalReleases / rowsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const pageStart = (activePage - 1) * rowsPerPage;
  const pageEnd = Math.min(pageStart + rowsPerPage, totalReleases);
  const paginatedReleases = filteredReleases.slice(pageStart, pageEnd);

  const pageWindowStart = Math.max(1, Math.min(activePage - 2, totalPages - 4));
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => pageWindowStart + i);

  const stagedCount = Object.keys(pendingStatusById).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Feedback & Undo Banner */}
        {feedback && (
          <div
            role="alert"
            className={`mb-4 p-3.5 rounded-lg text-sm flex flex-wrap items-center justify-between gap-3 border ${
              feedback.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <div className="flex items-center gap-2">
              {feedback.canUndoLast && undoStack.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleUndoLastGlobal()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30 transition"
                >
                  <RotateCcw size={13} />
                  Undo ({STATUS_LABELS[undoStack[0].previousStatus] || undoStack[0].previousStatus})
                </button>
              )}
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="p-1 opacity-70 hover:opacity-100"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--dash-text-primary)' }}>CMS Dashboard</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
              Set any song to Published, Unpublished, Draft, Queued, Review, Approved, or Archived — click Save to apply immediately across all public pages, or Undo at any time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={() => void handleUndoLastGlobal()}
                className="dashboard-btn-secondary flex items-center gap-2 text-sm"
                title={`Undo last saved change (${undoStack[0].releaseTitle} -> ${STATUS_LABELS[undoStack[0].previousStatus]})`}
              >
                <RotateCcw size={16} />
                Undo Last ({STATUS_LABELS[undoStack[0].previousStatus]})
              </button>
            )}
            <Link
              href="/admin/cms-releases/new"
              className="dashboard-btn-primary flex items-center gap-2"
            >
              <Plus size={20} /> New Release
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Link
            href="/admin/cms-releases"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <FileUp className="mb-2" size={24} style={{ color: 'var(--dash-accent)' }} />
            <p className="font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Releases</p>
            <p className="text-sm" style={{ color: 'var(--dash-text-secondary)' }}>Studio &amp; YouTube tools</p>
          </Link>

          <Link
            href="/admin/cms/media"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <Image className="mb-2" size={24} style={{ color: 'var(--dash-accent)' }} />
            <p className="font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Media Library</p>
            <p className="text-sm" style={{ color: 'var(--dash-text-secondary)' }}>Upload &amp; organize media</p>
          </Link>

          <Link
            href="/admin/cms/bulk-import"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <BookOpen className="mb-2" size={24} style={{ color: 'var(--dash-accent)' }} />
            <p className="font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Bulk Import</p>
            <p className="text-sm" style={{ color: 'var(--dash-text-secondary)' }}>CSV batch upload</p>
          </Link>

          <Link
            href="/admin/cms/roles"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <Users className="mb-2" size={24} style={{ color: 'var(--dash-accent)' }} />
            <p className="font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Roles &amp; Permissions</p>
            <p className="text-sm" style={{ color: 'var(--dash-text-secondary)' }}>Access control</p>
          </Link>

          <Link
            href="/admin/lyrics-requests"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <Globe className="mb-2" size={24} style={{ color: 'var(--dash-accent)' }} />
            <p className="font-semibold" style={{ color: 'var(--dash-text-primary)' }}>Lyrics Requests</p>
            <p className="text-sm" style={{ color: 'var(--dash-text-secondary)' }}>On-demand translations</p>
          </Link>
        </div>

        {/* Unsaved Batch Bar */}
        {stagedCount > 0 && (
          <div className="mb-4 p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-amber-200">
              {stagedCount} unsaved status change{stagedCount === 1 ? '' : 's'} staged. Click <strong>Save</strong> on a row or <strong>Save All Changes</strong> to apply to public frontend pages.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleSaveAllStaged()}
                disabled={savingIds.size > 0}
                className="dashboard-btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save size={14} />
                {savingIds.size > 0 ? 'Saving...' : `Save All Changes (${stagedCount})`}
              </button>
              <button
                type="button"
                onClick={handleDiscardAllStaged}
                disabled={savingIds.size > 0}
                className="dashboard-btn-secondary px-3 py-1.5 text-xs"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="dashboard-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search releases by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dashboard-input has-icon w-full"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'published', 'unpublished', 'draft', 'queued', 'in_review', 'approved', 'archived'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    statusFilter === key ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'
                  }`}
                >
                  {key === 'all' ? 'All' : STATUS_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Releases Table */}
        <div className="dashboard-card overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div
                className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: 'var(--dash-border)', borderTopColor: 'var(--dash-accent)' }}
              />
              <p style={{ color: 'var(--dash-text-secondary)' }}>Loading releases...</p>
            </div>
          ) : filteredReleases.length === 0 ? (
            <div className="p-8 text-center">
              <p className="mb-4" style={{ color: 'var(--dash-text-secondary)' }}>No releases found for this filter.</p>
              {statusFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="dashboard-btn-secondary px-4 py-2 text-sm"
                >
                  Show All Releases
                </button>
              ) : (
                <Link href="/admin/cms-releases/new" className="dashboard-btn-primary inline-block">
                  Create First Release
                </Link>
              )}
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="dashboard-table-header">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>Current State &amp; Public Visibility</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>Release Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>Views</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-primary)' }}>Actions (Set State · Save · Undo)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReleases.map((release) => {
                    const effectiveVisibility = release.visibility || (release.status === 'published' ? 'public' : 'private');
                    const isPublicLive = release.status === 'published' && effectiveVisibility === 'public';
                    const stagedStatus = pendingStatusById[release.id];
                    const selectedStatus = stagedStatus ?? release.status;
                    const hasStagedChange = stagedStatus !== undefined && stagedStatus !== release.status;
                    const isSaving = savingIds.has(release.id);
                    const badgeStyle = STATUS_BADGE_STYLES[release.status] || STATUS_BADGE_STYLES.draft;
                    const rowHistory = rowUndoHistory[release.id] || [];

                    return (
                      <tr
                        key={release.id}
                        className="dashboard-table-row"
                        style={hasStagedChange ? { backgroundColor: 'rgba(245, 158, 11, 0.06)' } : undefined}
                      >
                        <td className="px-5 py-4">
                          <Link href={`/admin/cms-releases/${release.id}`} className="hover:underline">
                            <p className="font-semibold" style={{ color: 'var(--dash-text-primary)' }}>{release.title}</p>
                          </Link>
                          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>/{release.slug}</p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: badgeStyle.bg,
                                border: `1px solid ${badgeStyle.border}`,
                                color: badgeStyle.text,
                              }}
                            >
                              {STATUS_LABELS[release.status] || release.status}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                isPublicLive
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                  : 'border-neutral-600/50 bg-neutral-800/60 text-neutral-400'
                              }`}
                            >
                              {isPublicLive ? 'Live on Public Site' : 'Hidden from Public'}
                            </span>
                          </div>
                          {hasStagedChange && (
                            <p className="text-[11px] text-amber-300 mt-1 font-medium">
                              Unsaved: {STATUS_LABELS[release.status]} &rarr; {STATUS_LABELS[stagedStatus]} (click Save)
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap" style={{ color: 'var(--dash-text-secondary)' }}>
                          {release.release_date ? new Date(release.release_date).toLocaleDateString() : '—'}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap" style={{ color: 'var(--dash-text-secondary)' }}>
                          {release.view_count.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {/* State Selector */}
                            <select
                              aria-label={`Set status for ${release.title}`}
                              value={selectedStatus}
                              disabled={isSaving}
                              onChange={(e) => handleStageStatus(release, e.target.value as ReleaseStatus)}
                              className="form-input py-1.5 px-2.5 text-xs rounded-lg min-w-[145px]"
                              style={
                                hasStagedChange
                                  ? { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' }
                                  : undefined
                              }
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label} ({opt.value === 'published' ? 'Public' : 'Private'})
                                </option>
                              ))}
                            </select>

                            {/* Save & Cancel buttons when staged */}
                            {hasStagedChange && (
                              <>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => void handleSaveRow(release)}
                                  className="dashboard-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                                  title="Save status and update public frontend visibility"
                                >
                                  <Save size={13} />
                                  {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleDiscardRowStage(release.id)}
                                  className="dashboard-btn-secondary px-2 py-1.5 rounded-lg text-xs"
                                  title="Discard unsaved selection"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {/* Per-row Undo button when this song has prior saved transitions */}
                            {!hasStagedChange && rowHistory.length > 0 && (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void handleUndoRow(release)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-200 hover:bg-amber-500/25 transition disabled:opacity-50"
                                title={`Undo back to ${STATUS_LABELS[rowHistory[0].previousStatus] || rowHistory[0].previousStatus}`}
                              >
                                <RotateCcw size={13} />
                                Undo ({STATUS_LABELS[rowHistory[0].previousStatus] || rowHistory[0].previousStatus})
                              </button>
                            )}

                            {/* View Live Public Page (active when published & public) */}
                            {isPublicLive ? (
                              <a
                                href={`/release-detail/${release.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg transition hover:text-emerald-400"
                                style={{ color: 'var(--dash-text-secondary)' }}
                                title="Open live public page"
                              >
                                <ExternalLink size={16} />
                              </a>
                            ) : (
                              <span
                                className="p-2 rounded-lg opacity-30 cursor-not-allowed"
                                style={{ color: 'var(--dash-text-muted)' }}
                                title="Hidden on public website"
                              >
                                <Eye size={16} />
                              </span>
                            )}

                            {/* Full Editor */}
                            <Link
                              href={`/admin/cms-releases/${release.id}`}
                              className="p-2 rounded-lg transition hover:text-amber-400"
                              style={{ color: 'var(--dash-text-secondary)' }}
                              title="Edit release metadata, lyrics & subtitles"
                            >
                              <Edit3 size={16} />
                            </Link>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => void handleDelete(release)}
                              disabled={deletingId === release.id || isSaving}
                              className="p-2 rounded-lg transition hover:text-red-400 disabled:opacity-40"
                              style={{ color: 'var(--dash-text-secondary)' }}
                              title="Permanently delete release"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalReleases > rowsPerPage && (
                <div
                  className="px-6 py-3 flex flex-wrap items-center justify-between gap-3"
                  style={{ borderTop: '1px solid var(--dash-border)' }}
                >
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
                    <span>Rows per page</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      className="px-2 py-1 rounded dashboard-btn-secondary"
                    >
                      {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span>{totalReleases === 0 ? '0' : pageStart + 1}–{pageEnd} of {totalReleases}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={activePage <= 1}
                      className="dashboard-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {visiblePages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded text-sm ${activePage === page ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={activePage >= totalPages}
                      className="dashboard-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
