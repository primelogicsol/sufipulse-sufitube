// app/admin/cms/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAllReleases } from '@/lib/cms-api';
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
  Settings
} from 'lucide-react';

export default function CMSPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadReleases();
  }, [statusFilter, categoryFilter]);

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

  const statuses: Record<string, string> = {
    'draft': 'Draft',
    'in_review': 'Under Review',
    'approved': 'Approved',
    'published': 'Published',
    'unpublished': 'Unpublished',
    'archived': 'Archived'
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
        </div>

        {/* Filters */}
        <div className="dashboard-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3" size={20} style={{color: 'var(--dash-text-muted)'}} />
                <input
                  type="text"
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="form-input w-full pl-10"
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
                {releases.map((release) => (
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
                          className="p-2 rounded-lg transition"
                          style={{color: 'var(--dash-text-secondary)'}}
                          title="More options"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
