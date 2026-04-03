"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Eye, EyeOff, Archive, MoreVertical } from 'lucide-react';
import type { CMSRelease } from '@/lib/cms-storage';

export default function CMSReleasesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [releases, setReleases] = useState<CMSRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.role.includes('admin')) {
      router.push('/admin');
      return;
    }
    loadReleases();
  }, [user, filter]);

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--dash-bg-secondary)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
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
        </div>

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
          <div className="dashboard-card overflow-hidden">
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
                {releases.map((release) => (
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
                    <td className="px-4 py-3">
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
                            style={{ backgroundColor: 'var(--dash-bg-card)', border: '1px solid var(--dash-border)' }}
                          >
                            {release.status !== 'published' && (
                              <button
                                onClick={() => { handlePublish(release); setShowMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--dash-bg-secondary)]"
                                style={{ color: 'var(--dash-status-approved)' }}
                              >
                                <Eye size={14} /> Publish
                              </button>
                            )}
                            {release.status === 'published' && (
                              <button
                                onClick={() => { handleUnpublish(release); setShowMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--dash-bg-secondary)]"
                                style={{ color: 'var(--dash-status-pending)' }}
                              >
                                <EyeOff size={14} /> Unpublish
                              </button>
                            )}
                            {release.status !== 'archived' && (
                              <button
                                onClick={() => { handleArchive(release); setShowMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--dash-bg-secondary)]"
                                style={{ color: 'var(--dash-text-secondary)' }}
                              >
                                <Archive size={14} /> Archive
                              </button>
                            )}
                            <button
                              onClick={() => { handleDelete(release.id); setShowMenu(null); }}
                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--dash-bg-secondary)]"
                              style={{ color: 'var(--dash-status-rejected)' }}
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
          </div>
        )}
      </div>
    </div>
  );
}
