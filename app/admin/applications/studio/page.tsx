"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { storage } from '@/app/lib/storage';
import { notifyStatusChange, mapContentStatusToEvent } from '@/app/lib/notifications';
import { Building, RefreshCw } from 'lucide-react';

type StudioProfile = {
  id: string;
  studio_name?: string;
  primary_contact_name?: string;
  email?: string;
  country?: string;
  city?: string;
  years_in_operation?: string;
  profile_status?: string;
  created_at?: string;
};

const STATUSES = ['pending', 'under_review', 'revision_requested', 'approved', 'rejected'] as const;

export default function AdminStudioApplications() {
  const [profiles, setProfiles] = useState<StudioProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('pending');

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await storage.getAll('studio');
      setProfiles(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const filtered = useMemo(() => {
    return profiles.filter((profile) => {
      const status = String(profile.profile_status || 'pending').toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery =
        !query ||
        `${profile.studio_name || ''} ${profile.primary_contact_name || ''} ${profile.email || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [profiles, query, filter]);

  const updateStatus = async (id: string, status: string) => {
    await storage.update('studio', id, {
      profile_status: status,
      reviewed_at: new Date().toISOString(),
    });

    // Notify the studio contact
    const profile = profiles.find(p => p.id === id);
    if (profile?.email) {
      notifyStatusChange({
        email: profile.email,
        name: profile.studio_name || profile.primary_contact_name || 'Studio Partner',
        role: 'studio',
        status: mapContentStatusToEvent(status),
      }).catch(console.error);
    }

    await loadProfiles();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Studio Applications</h1>
            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search studio name or email"
                className="dashboard-input"
              />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-56">
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading studio applications...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">No studio applications found</div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Studio</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((profile) => (
                    <tr key={profile.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Building className="w-4 h-4 text-[var(--dash-accent)]" />
                          <div>
                            <div className="font-medium text-[var(--dash-text-primary)]">{profile.studio_name || 'Unknown studio'}</div>
                            <div className="text-xs text-[var(--dash-text-muted)]">{profile.years_in_operation || '-'} years in operation</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">
                        <div>{profile.primary_contact_name || '-'}</div>
                        <div className="text-xs text-[var(--dash-text-muted)]">{profile.email || 'No email'}</div>
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">{[profile.city, profile.country].filter(Boolean).join(', ') || '-'}</td>
                      <td className="text-[var(--dash-text-secondary)] capitalize">{String(profile.profile_status || 'pending').replace('_', ' ')}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(profile.id, 'under_review')} className="dashboard-btn-secondary text-xs">Under Review</button>
                          <button onClick={() => updateStatus(profile.id, 'approved')} className="dashboard-btn-primary text-xs">Approve</button>
                          <button onClick={() => updateStatus(profile.id, 'revision_requested')} className="dashboard-btn-secondary text-xs">Revision</button>
                          <button onClick={() => updateStatus(profile.id, 'rejected')} className="dashboard-btn-secondary text-xs">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={loadProfiles} className="dashboard-btn-secondary text-sm inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
