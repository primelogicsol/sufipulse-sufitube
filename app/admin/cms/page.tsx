// app/admin/cms/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAllReleases, deleteRelease } from '@/lib/cms-api';
import type { Release } from '@/lib/cms-types';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Archive,
  FileUp,
  Image,
  Users,
  BookOpen,
  Settings,
  Globe
} from 'lucide-react';

export default function CMSPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadReleases();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchQuery, rowsPerPage]);

  async function loadReleases() {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }
      
      const data = await getAllReleases(filters);
      setReleases(data || []);
    } catch (error) {
      console.error('Error loading releases:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredReleases = releases.filter(r => {
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

  const statuses: Record<string, string> = {
    'draft': 'Draft',
    'in_review': 'Under Review',
    'approved': 'Approved',
    'published': 'Published',
    'unpublished': 'Unpublished',
    'archived': 'Archived'
  };

  const handleDelete = async (release: Release) => {
    if (!confirm(`Delete "${release.title}"? This cannot be undone.`)) return;
    setDeletingId(release.id);
    try {
      await deleteRelease(release.id);
      setReleases(prev => prev.filter(r => r.id !== release.id));
    } catch (err: any) {
      setActionError(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-800',
    'in_review': 'bg-blue-100 text-blue-800',
    'approved': 'bg-green-100 text-green-800',
    'published': 'bg-emerald-100 text-emerald-800',
    'unpublished': 'bg-orange-100 text-orange-800',
    'archived': 'bg-slate-100 text-slate-800'
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {actionError && (
          <div className="mb-4 p-3 rounded-lg text-sm flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/25 text-red-400">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)} className="shrink-0 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{color: 'var(--dash-text-primary)'}}>CMS Dashboard</h1>
            <p className="mt-1" style={{color: 'var(--dash-text-secondary)'}}>Manage releases, media, and content</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/cms-releases/new"
              className="dashboard-btn-primary flex items-center gap-2"
            >
              <Plus size={20} /> New Release
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/cms-releases"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <FileUp className="mb-2" size={24} style={{color: 'var(--dash-accent)'}} />
            <p className="font-semibold" style={{color: 'var(--dash-text-primary)'}}>Releases</p>
            <p className="text-sm" style={{color: 'var(--dash-text-secondary)'}}>Manage all releases</p>
          </Link>

          <Link
            href="/admin/cms/media"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <Image className="mb-2" size={24} style={{color: 'var(--dash-accent)'}} />
            <p className="font-semibold" style={{color: 'var(--dash-text-primary)'}}>Media Library</p>
            <p className="text-sm" style={{color: 'var(--dash-text-secondary)'}}>Upload & organize media</p>
          </Link>

          <Link
            href="/admin/cms/bulk-import"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <BookOpen className="mb-2" size={24} style={{color: 'var(--dash-accent)'}} />
            <p className="font-semibold" style={{color: 'var(--dash-text-primary)'}}>Bulk Import</p>
            <p className="text-sm" style={{color: 'var(--dash-text-secondary)'}}>CSV batch upload</p>
          </Link>

          <Link
            href="/admin/cms/roles"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <Users className="mb-2" size={24} style={{color: 'var(--dash-accent)'}} />
            <p className="font-semibold" style={{color: 'var(--dash-text-primary)'}}>Roles & Permissions</p>
            <p className="text-sm" style={{color: 'var(--dash-text-secondary)'}}>Access control</p>
          </Link>

          <Link
            href="/admin/lyrics-requests"
            className="dashboard-card p-4 cursor-pointer hover:border-[color:var(--dash-accent)] transition"
          >
            <Globe className="mb-2" size={24} style={{color: 'var(--dash-accent)'}} />
            <p className="font-semibold" style={{color: 'var(--dash-text-primary)'}}>Lyrics Requests</p>
            <p className="text-sm" style={{color: 'var(--dash-text-secondary)'}}>On-demand translations</p>
          </Link>
        </div>

        {/* Filters */}
        <div className="dashboard-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="dashboard-input has-icon w-full"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Status</option>
              {Object.entries(statuses).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Releases Table */}
        <div className="dashboard-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{borderColor: 'var(--dash-border)', borderTopColor: 'var(--dash-accent)'}}></div>
              <p style={{color: 'var(--dash-text-secondary)'}}>Loading releases...</p>
            </div>
          ) : releases.length === 0 ? (
            <div className="p-8 text-center">
              <p className="mb-4" style={{color: 'var(--dash-text-secondary)'}}>No releases found</p>
              <Link
                href="/admin/cms-releases/new"
                className="dashboard-btn-primary inline-block"
              >
                Create First Release
              </Link>
            </div>
          ) : (
            <>
            <table className="w-full">
              <thead className="dashboard-table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{color: 'var(--dash-text-primary)'}}>Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{color: 'var(--dash-text-primary)'}}>Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{color: 'var(--dash-text-primary)'}}>Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{color: 'var(--dash-text-primary)'}}>Release Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold" style={{color: 'var(--dash-text-primary)'}}>Views</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold" style={{color: 'var(--dash-text-primary)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReleases.map((release) => (
                  <tr key={release.id} className="dashboard-table-row">
                    <td className="px-6 py-4">
                      <p className="font-semibold" style={{color: 'var(--dash-text-primary)'}}>{release.title}</p>
                      <p className="text-sm" style={{color: 'var(--dash-text-muted)'}}>{release.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="dashboard-badge" style={{backgroundColor: `var(--dash-status-${release.status}-bg)`, color: `var(--dash-status-${release.status}-text)`}}>
                        {statuses[release.status] || release.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{color: 'var(--dash-text-secondary)'}}>{release.category || '—'}</td>
                    <td className="px-6 py-4" style={{color: 'var(--dash-text-secondary)'}}>
                      {release.release_date ? new Date(release.release_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4" style={{color: 'var(--dash-text-secondary)'}}>{release.view_count.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/cms-releases/${release.id}`}
                          className="p-2 rounded-lg transition" 
                          style={{color: 'var(--dash-text-secondary)'}}
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(release)}
                          disabled={deletingId === release.id}
                          className="p-2 rounded-lg transition hover:text-red-400 disabled:opacity-40"
                          style={{color: 'var(--dash-text-secondary)'}}
                          title="Delete release"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
