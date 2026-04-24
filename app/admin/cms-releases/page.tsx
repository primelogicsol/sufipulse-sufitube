"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Eye, EyeOff, Archive, MoreVertical, Download, RefreshCw, CheckSquare, Square } from 'lucide-react';
import type { CMSRelease } from '@/lib/cms-storage';

type YouTubeImportVideo = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedDate?: string;
  durationSeconds?: number;
  durationFormatted?: string;
  views?: number;
  alreadyImported?: boolean;
};

export default function CMSReleasesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [releases, setReleases] = useState<CMSRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [loadingYouTube, setLoadingYouTube] = useState(false);
  const [importingYouTube, setImportingYouTube] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeImportVideo[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [youtubePanelOpen, setYoutubePanelOpen] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [directUrl, setDirectUrl] = useState('');

  useEffect(() => {
    if (!user?.role.includes('admin')) {
      router.push('/admin');
      return;
    }
    loadReleases();
  }, [user, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, rowsPerPage]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(releases.length / rowsPerPage));
    if (currentPage > nextTotalPages) {
      setCurrentPage(nextTotalPages);
    }
  }, [releases.length, rowsPerPage, currentPage]);

  const loadReleases = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/releases' : `/api/releases?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setReleases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (release: CMSRelease) => {
    try {
      const res = await fetch(`/api/releases/${release.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...release, status: 'published', publishedAt: new Date().toISOString() })
      });
      if (res.ok) {
        loadReleases();
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  const handleUnpublish = async (release: CMSRelease) => {
    try {
      const res = await fetch(`/api/releases/${release.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...release, status: 'unpublished' })
      });
      if (res.ok) {
        loadReleases();
      }
    } catch (error) {
      console.error('Failed to unpublish:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this release?')) return;
    try {
      const res = await fetch(`/api/releases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadReleases();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleArchive = async (release: CMSRelease) => {
    try {
      const res = await fetch(`/api/releases/${release.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...release, status: 'archived' })
      });
      if (res.ok) {
        loadReleases();
      }
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

  const fetchYouTubeVideos = async () => {
    try {
      setLoadingYouTube(true);
      setYoutubeMessage(null);
      const res = await fetch('/api/releases/import-youtube?fetchAll=1');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch YouTube videos');
      }
      setYoutubeVideos(Array.isArray(data.items) ? data.items : []);
      setYoutubePanelOpen(true);
      setSelectedVideoIds(new Set());
      setYoutubeMessage(`Fetched ${data.count || 0} videos from YouTube (large channel scan).`);
    } catch (error: any) {
      setYoutubeMessage(`Fetch failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoadingYouTube(false);
    }
  };

  const toggleVideoSelection = (id: string) => {
    setSelectedVideoIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const importSelectedFromYouTube = async () => {
    try {
      setImportingYouTube(true);
      setYoutubeMessage(null);
      const ids = Array.from(selectedVideoIds);
      if (!ids.length) {
        setYoutubeMessage('Select at least one YouTube video to import.');
        return;
      }

      const res = await fetch('/api/releases/import-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Import failed');
      }

      setYoutubeMessage(`Imported ${data.importedCount || 0} video(s) into CMS releases.`);
      await loadReleases();
      await fetchYouTubeVideos();
    } catch (error: any) {
      setYoutubeMessage(`Import failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setImportingYouTube(false);
    }
  };

  const importDirectUrl = async () => {
    let id = directUrl.trim();
    if (!id) {
        setYoutubeMessage('Please enter a valid YouTube URL or ID.');
        return;
    }
    
    // Extract ID if URL is pasted
    const match = id.match(/(?:v=|youtu\.be\/|\/embed\/)([0-9A-Za-z_-]{11})/);
    if (match) id = match[1];

    try {
      setImportingYouTube(true);
      setYoutubeMessage(null);
      const res = await fetch('/api/releases/import-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: [id] }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Import failed');
      }

      setYoutubeMessage(`Successfully imported unlisted/private Video ID: ${id}`);
      setDirectUrl('');
      await loadReleases();
    } catch (error: any) {
      setYoutubeMessage(`Direct import failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setImportingYouTube(false);
    }
  };

  const selectAllFetchedVideos = () => {
    setSelectedVideoIds(new Set(youtubeVideos.map((video) => video.id)));
  };

  const clearSelectedVideos = () => {
    setSelectedVideoIds(new Set());
  };

  if (!user?.role.includes('admin')) {
    return <div className="p-8 text-center">Unauthorized</div>;
  }

  const statusColor: Record<string, string> = {
    published: 'var(--dash-status-approved)',
    draft: 'var(--dash-status-pending)',
    archived: 'var(--dash-text-muted)',
    unpublished: 'var(--dash-status-rejected)',
    in_review: 'var(--dash-status-pending)',
    approved: 'var(--dash-status-approved)',
  };

  const totalReleases = releases.length;
  const totalPages = Math.max(1, Math.ceil(totalReleases / rowsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * rowsPerPage;
  const pageEndIndex = Math.min(pageStartIndex + rowsPerPage, totalReleases);
  const paginatedReleases = releases.slice(pageStartIndex, pageEndIndex);

  const visiblePageCount = 5;
  const pageWindowStart = Math.max(1, Math.min(activePage - 2, totalPages - visiblePageCount + 1));
  const visiblePages = Array.from(
    { length: Math.min(visiblePageCount, totalPages) },
    (_, index) => pageWindowStart + index
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--dash-bg-secondary)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Data Store Notice */}
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-950/40 border border-blue-800/50 text-blue-300 text-sm">
          <span className="mt-0.5 flex-shrink-0">ℹ️</span>
          <span>
            Releases managed here are stored server-side (filesystem) and appear on the{' '}
            <strong>/release-detail/[slug]</strong> public pages. They are separate from the
            localStorage CMS Dashboard (<a href="/admin/cms" className="underline hover:text-blue-200">/admin/cms</a>).
          </span>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--dash-text-primary)' }}>
              CMS Releases
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
              Manage YouTube releases, lyrics, subtitles, and credits.
            </p>
          </div>
          <Link href="/admin/cms-releases/new">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg dashboard-btn-primary font-medium text-sm">
              <Plus size={16} /> New Release
            </button>
          </Link>
          <button
            onClick={fetchYouTubeVideos}
            disabled={loadingYouTube}
            className="flex items-center gap-2 px-4 py-2 rounded-lg dashboard-btn-secondary font-medium text-sm disabled:opacity-60"
          >
            <Download size={16} /> {loadingYouTube ? 'Fetching...' : 'Fetch from YouTube'}
          </button>
        </div>

        {youtubePanelOpen && (
          <div className="mb-6 dashboard-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--dash-text-primary)' }}>YouTube Video Picker</h2>
                <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                  Select real YouTube videos and import them as editable CMS releases.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFetchedVideos}
                  className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2"
                >
                  <CheckSquare size={14} /> Select All
                </button>
                <button
                  type="button"
                  onClick={clearSelectedVideos}
                  className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2"
                >
                  <Square size={14} /> Clear
                </button>
                <button
                  type="button"
                  onClick={fetchYouTubeVideos}
                  disabled={loadingYouTube}
                  className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <button
                  type="button"
                  onClick={importSelectedFromYouTube}
                  disabled={importingYouTube || selectedVideoIds.size === 0}
                  className="dashboard-btn-primary px-3 py-1.5 text-sm inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <Download size={14} /> {importingYouTube ? 'Importing...' : `Import Selected (${selectedVideoIds.size})`}
                </button>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                <input 
                    type="text" 
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    placeholder="Quick Import Unlisted Video (Paste YouTube URL or ID...)"
                    className="flex-1 bg-[#1a1d24] border border-neutral-700 rounded px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                />
                <button
                    onClick={importDirectUrl}
                    disabled={importingYouTube || !directUrl.trim()}
                    className="dashboard-btn-primary px-4 py-1.5 text-sm whitespace-nowrap disabled:opacity-60"
                >
                    {importingYouTube ? 'Importing...' : 'Fetch Directly'}
                </button>
            </div>

            {youtubeMessage && (
              <p className="text-sm mb-3" style={{ color: 'var(--dash-text-secondary)' }}>{youtubeMessage}</p>
            )}

            {youtubeVideos.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>No videos fetched yet.</p>
            ) : (
              <div className="max-h-80 overflow-auto border rounded-lg" style={{ borderColor: 'var(--dash-border)' }}>
                {youtubeVideos.map((video) => (
                  <label
                    key={video.id}
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    style={{ borderBottom: '1px solid var(--dash-border)' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVideoIds.has(video.id)}
                      onChange={() => toggleVideoSelection(video.id)}
                      style={{ marginTop: 6, accentColor: 'var(--dash-accent)' }}
                    />
                    <img
                      src={video.thumbnailUrl || ''}
                      alt={video.title}
                      style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--dash-border)' }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium" style={{ color: 'var(--dash-text-primary)' }}>{video.title}</p>
                      <p className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                        ID: {video.id} | {video.durationFormatted || '0:00'} | {video.views?.toLocaleString?.() || 0} views
                      </p>
                      {video.alreadyImported && (
                        <p className="text-xs mt-1" style={{ color: 'var(--dash-status-approved)' }}>
                          Already in CMS (import will update metadata only)
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'published', 'draft', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                filter === f ? 'dashboard-btn-primary border-transparent' : 'dashboard-btn-secondary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center" style={{ color: 'var(--dash-text-muted)' }}>Loading...</div>
        ) : releases.length === 0 ? (
          <div className="p-12 text-center dashboard-card">
            <p style={{ color: 'var(--dash-text-muted)' }}>No releases found. Create one with &ldquo;New Release&rdquo;.</p>
          </div>
        ) : (
          <div className="dashboard-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--dash-border)' }}>
                  {['Title', 'Status', 'Release Date', 'Views', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--dash-text-secondary)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedReleases.map((release) => (
                  <tr
                    key={release.id}
                    style={{ borderBottom: '1px solid var(--dash-border)' }}
                    className="hover:bg-[var(--dash-bg-hover,rgba(0,0,0,.03))] transition"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/cms-releases/${release.id}`}>
                        <span className="font-medium hover:underline" style={{ color: 'var(--dash-text-primary)' }}>
                          {release.title}
                        </span>
                      </Link>
                      {release.vocalist?.name && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
                          {release.vocalist.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                        style={{
                          color: statusColor[release.status] || 'var(--dash-text-muted)',
                          backgroundColor: 'var(--dash-bg-secondary)',
                          border: `1px solid ${statusColor[release.status] || 'var(--dash-border)'}`,
                        }}
                      >
                        {release.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>
                      {release.releaseDate || '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>
                      {release.viewCount?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-3 overflow-visible">
                      <div className="flex items-center gap-2 relative">
                        <Link href={`/admin/cms-releases/${release.id}`}>
                          <button className="p-1.5 rounded transition dashboard-btn-secondary" title="Edit">
                            <Edit2 size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => setShowMenu(showMenu === release.id ? null : release.id)}
                          className="p-1.5 rounded transition dashboard-btn-secondary"
                          title="More actions"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {showMenu === release.id && (
                          <div
                            className="absolute right-0 top-8 z-20 rounded-lg shadow-lg py-1 min-w-[160px]"
                            style={{
                              backgroundColor: 'var(--dash-bg-card, #1f2d4d)',
                              border: '1px solid var(--dash-border, #2f3e5f)',
                              boxShadow: '0 10px 24px rgba(0, 0, 0, 0.35)',
                            }}
                          >
                            {release.status !== 'published' && (
                              <button
                                onClick={() => { handlePublish(release); setShowMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition"
                                style={{
                                  backgroundColor: 'var(--dash-bg-card, #1f2d4d)',
                                  color: 'var(--dash-status-approved)'
                                }}
                                onMouseEnter={(event) => {
                                  event.currentTarget.style.backgroundColor = 'var(--dash-bg-secondary, #182540)';
                                }}
                                onMouseLeave={(event) => {
                                  event.currentTarget.style.backgroundColor = 'var(--dash-bg-card, #1f2d4d)';
                                }}
                              >
                                <Eye size={14} /> Publish
                              </button>
                            )}
                            {release.status === 'published' && (
                              <button
                                onClick={() => { handleUnpublish(release); setShowMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition"
                                style={{
                                  backgroundColor: 'var(--dash-bg-card, #1f2d4d)',
                                  color: 'var(--dash-status-pending)'
                                }}
                                onMouseEnter={(event) => {
                                  event.currentTarget.style.backgroundColor = 'var(--dash-bg-secondary, #182540)';
                                }}
                                onMouseLeave={(event) => {
                                  event.currentTarget.style.backgroundColor = 'var(--dash-bg-card, #1f2d4d)';
                                }}
                              >
                                <EyeOff size={14} /> Unpublish
                              </button>
                            )}
                            {release.status !== 'archived' && (
                              <button
                                onClick={() => { handleArchive(release); setShowMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition"
                                style={{
                                  backgroundColor: 'var(--dash-bg-card, #1f2d4d)',
                                  color: 'var(--dash-text-secondary)'
                                }}
                                onMouseEnter={(event) => {
                                  event.currentTarget.style.backgroundColor = 'var(--dash-bg-secondary, #182540)';
                                }}
                                onMouseLeave={(event) => {
                                  event.currentTarget.style.backgroundColor = 'var(--dash-bg-card, #1f2d4d)';
                                }}
                              >
                                <Archive size={14} /> Archive
                              </button>
                            )}
                            <button
                              onClick={() => { handleDelete(release.id); setShowMenu(null); }}
                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition"
                              style={{
                                backgroundColor: 'var(--dash-bg-card, #1f2d4d)',
                                color: 'var(--dash-status-rejected)'
                              }}
                              onMouseEnter={(event) => {
                                event.currentTarget.style.backgroundColor = 'var(--dash-bg-secondary, #182540)';
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.backgroundColor = 'var(--dash-bg-card, #1f2d4d)';
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              style={{ borderTop: '1px solid var(--dash-border)' }}
            >
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dash-text-secondary)' }}>
                <span>Rows per page</span>
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  className="px-2 py-1 rounded dashboard-btn-secondary"
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>
                  {totalReleases === 0 ? '0' : pageStartIndex + 1}-{pageEndIndex} of {totalReleases}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                  disabled={activePage <= 1}
                  className="dashboard-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded text-sm ${activePage === page ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                  disabled={activePage >= totalPages}
                  className="dashboard-btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
