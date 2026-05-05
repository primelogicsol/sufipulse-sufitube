// app/admin/cms/releases/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getAllReleases, publishRelease, unpublishRelease, archiveRelease } from '@/lib/cms-api';
import type { Release } from '@/lib/cms-types';
import { Plus, Edit3, Eye, Trash2, Archive, Check, X } from 'lucide-react';

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadReleases();
  }, [selectedStatus]);

  async function loadReleases() {
    try {
      setLoading(true);
      const filters = selectedStatus !== 'all' ? { status: selectedStatus as any } : undefined;
      const data = await getAllReleases(filters);
      setReleases(data || []);
    } catch (error) {
      console.error('Error loading releases:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      await publishRelease(id);
      loadReleases();
    } catch (error) {
      console.error('Error publishing:', error);
    }
  }

  async function handleUnpublish(id: string) {
    try {
      await unpublishRelease(id);
      loadReleases();
    } catch (error) {
      console.error('Error unpublishing:', error);
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveRelease(id);
      loadReleases();
    } catch (error) {
      console.error('Error archiving:', error);
    }
  }

  const statusColors: Record<string, string> = {
    'draft': 'bg-slate-50 border-slate-200',
    'in_review': 'bg-blue-50 border-blue-200',
    'approved': 'bg-green-50 border-green-200',
    'published': 'bg-emerald-50 border-emerald-200',
    'unpublished': 'bg-orange-50 border-orange-200',
    'archived': 'bg-gray-50 border-gray-200'
  };

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    fetched: number;
    created: number;
    updated: number;
    total: number;
    newestTitle?: string;
    newestPublishedAt?: string;
  } | null>(null);

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
        newestPublishedAt: items[0]?.publishedAt || items[0]?.releaseDate
      });
      
      loadReleases();
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Failed to sync with YouTube');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto" style={{background: 'var(--dash-bg-primary)', color: 'var(--dash-text-primary)', padding: '2rem'}}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{color: 'var(--dash-text-primary)'}}>Release Management</h1>
          <div className="flex gap-4">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
              style={{
                backgroundColor: 'var(--dash-bg-secondary)',
                color: 'var(--dash-text-primary)',
                border: '1px solid var(--dash-border)',
                cursor: syncing ? 'not-allowed' : 'pointer'
              }}
            >
              <Check size={20} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Latest Videos'}
            </button>
            <Link
              href="/admin/cms/releases/new/edit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition"
              style={{
                backgroundColor: 'var(--dash-accent)',
                color: '#000',
                textDecoration: 'none'
              }}
            >
              <Plus size={20} /> New Release
            </Link>
          </div>
        </div>

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
            {syncResult.newestTitle && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--dash-border)' }}>
                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>LATEST SYNCED</p>
                <p className="font-bold">{syncResult.newestTitle}</p>
                <p className="text-xs" style={{ color: 'var(--dash-text-secondary)' }}>{new Date(syncResult.newestPublishedAt!).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{borderBottom: '1px solid var(--dash-border)'}}>
          {['all', 'draft', 'in_review', 'approved', 'published', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className="px-4 py-2 rounded-none font-semibold transition whitespace-nowrap"
              style={{
                backgroundColor: selectedStatus === status ? 'transparent' : 'transparent',
                color: selectedStatus === status ? 'var(--dash-accent)' : 'var(--dash-text-secondary)',
                borderBottom: selectedStatus === status ? '3px solid var(--dash-accent)' : 'none',
                cursor: 'pointer'
              }}
            >
              {status === 'in_review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="rounded-lg overflow-hidden" style={{backgroundColor: 'var(--dash-bg-secondary)', border: '1px solid var(--dash-border)'}}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{borderColor: 'var(--dash-border)', borderTopColor: 'var(--dash-accent)'}}></div>
              <p style={{color: 'var(--dash-text-secondary)'}}>Loading releases...</p>
            </div>
          ) : releases.length === 0 ? (
            <div className="p-12 text-center">
              <p style={{color: 'var(--dash-text-secondary)'}}>No releases found</p>
            </div>
          ) : (
            <div style={{borderTop: '1px solid var(--dash-border)'}}>
              {releases.map((release) => (
                <div
                  key={release.id}
                  className="p-6 border-l-4 transition"
                  style={{
                    borderLeft: '4px solid var(--dash-accent)',
                    borderBottom: '1px solid var(--dash-border)',
                    backgroundColor: 'var(--dash-bg-secondary)',
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold" style={{color: 'var(--dash-text-primary)'}}>{release.title}</h3>
                      <p style={{color: 'var(--dash-text-secondary)', fontSize: '0.875rem'}}>/{release.slug}</p>
                      {release.description && (
                        <p style={{color: 'var(--dash-text-secondary)', marginTop: '0.5rem'}} className="line-clamp-2">{release.description}</p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{backgroundColor: 'var(--dash-accent-muted)', color: 'var(--dash-accent)'}}>
                      {release.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p style={{color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600'}}>DURATION</p>
                      <p style={{color: 'var(--dash-text-primary)'}}>{release.duration_formatted || '—'}</p>
                    </div>
                    <div>
                      <p style={{color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600'}}>VIEWS</p>
                      <p style={{color: 'var(--dash-text-primary)'}}>{release.view_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600'}}>CATEGORY</p>
                      <p style={{color: 'var(--dash-text-primary)'}}>{release.category || '—'}</p>
                    </div>
                    <div>
                      <p style={{color: 'var(--dash-text-muted)', fontSize: '0.75rem', fontWeight: '600'}}>RELEASED</p>
                      <p style={{color: 'var(--dash-text-primary)'}}>
                        {release.release_date ? new Date(release.release_date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <Link
                      href={`/admin/cms/releases/${release.id}/edit`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition"
                      style={{
                        backgroundColor: 'var(--dash-bg-hover)',
                        color: 'var(--dash-text-secondary)',
                        textDecoration: 'none'
                      }}
                    >
                      <Edit3 size={16} /> Edit
                    </Link>

                    {release.status !== 'published' && (
                      <button
                        onClick={() => handlePublish(release.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition"
                        style={{
                          backgroundColor: 'var(--dash-status-approved-bg)',
                          color: 'var(--dash-status-approved)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Check size={16} /> Publish
                      </button>
                    )}

                    {release.status === 'published' && (
                      <button
                        onClick={() => handleUnpublish(release.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition"
                        style={{
                          backgroundColor: 'var(--dash-status-pending-bg)',
                          color: 'var(--dash-status-pending)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} /> Unpublish
                      </button>
                    )}

                    {release.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(release.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition"
                        style={{
                          backgroundColor: 'var(--dash-status-draft-bg)',
                          color: 'var(--dash-status-draft)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Archive size={16} /> Archive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
