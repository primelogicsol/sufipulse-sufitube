"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Mic, RefreshCw, PlusCircle, X } from 'lucide-react';
import { notifyStatusChange, lookupProfileByName, lookupUserFromStorage } from '@/app/lib/notifications';
import { getAllReleases } from '@/lib/cms-api';

type PerformanceAssignment = {
  id: string;
  release_id?: string;
  release_title?: string;
  vocalist?: string;
  writer?: string;
  producer?: string;
  status?: string;
  due_date?: string;
  created_at?: string;
};

const STORAGE_KEY = 'sufipulse_performance_assignments';
const STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'blocked'] as const;

export default function PerformanceAssignmentsPage() {
  const [items, setItems] = useState<PerformanceAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [showCreate, setShowCreate] = useState(false);
  const [cmsReleases, setCmsReleases] = useState<{ id: string; title: string }[]>([]);
  const [approvedVocalists, setApprovedVocalists] = useState<string[]>([]);
  const [approvedWriters, setApprovedWriters] = useState<string[]>([]);
  const [approvedProducers, setApprovedProducers] = useState<string[]>([]);
  const [newAssignment, setNewAssignment] = useState({ release_id: '', release_title: '', vocalist: '', writer: '', producer: '', due_date: '' });
  const [createLoading, setCreateLoading] = useState(false);

  const loadItems = () => {
    setLoading(true);
    try {
      if (typeof window === 'undefined') {
        setItems([]);
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } finally {
      setLoading(false);
    }
  };

  const persistItems = (next: PerformanceAssignment[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setItems(next);
  };

  useEffect(() => {
    loadItems();
    // Load approved contributors for dropdowns
    if (typeof window !== 'undefined') {
      const vocalists: any[] = JSON.parse(localStorage.getItem('sufipulse_vocalist_profiles') || '[]');
      const writers: any[]   = JSON.parse(localStorage.getItem('sufipulse_writer_profiles') || '[]');
      const producers: any[] = JSON.parse(localStorage.getItem('sufipulse_producer_profiles') || '[]');
      const approved = (p: any) => p.status === 'approved' || p.profile_status === 'approved';
      setApprovedVocalists(vocalists.filter(approved).map(p => p.performance_name || p.full_name).filter(Boolean));
      setApprovedWriters(writers.filter(approved).map(p => p.pen_name || p.full_name).filter(Boolean));
      setApprovedProducers(producers.filter(approved).map(p => p.professional_name || p.full_name).filter(Boolean));
    }
    getAllReleases({ status: 'published' }).then(r => setCmsReleases(r.map(x => ({ id: x.id, title: x.title })))).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = String(item.status || 'pending').toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery =
        !query ||
        `${item.release_title || ''} ${item.vocalist || ''} ${item.writer || ''} ${item.producer || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const updateStatus = (id: string, status: string) => {
    const item = items.find(i => i.id === id);
    const next = items.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            updated_at: new Date().toISOString(),
          }
        : item
    );
    persistItems(next);

    // Notify each assigned stakeholder
    if (item) {
      const roles: Array<{ key: 'vocalist' | 'writer' | 'producer'; role: 'vocalist' | 'writer' | 'producer' }> = [
        { key: 'vocalist', role: 'vocalist' },
        { key: 'writer',   role: 'writer' },
        { key: 'producer', role: 'producer' },
      ];
      roles.forEach(({ key, role }) => {
        const name = item[key];
        if (!name) return;
        const profile = lookupProfileByName(role, name);
        const storedUser = profile?.user_id ? lookupUserFromStorage(profile.user_id) : null;
        const email = storedUser?.email || profile?.email;
        if (!email) return;
        notifyStatusChange({
          user_id: profile?.user_id,
          email,
          name: profile?.name || name,
          role,
          status: 'assignment_received',
          reference: item.release_title,
        }).catch(console.error);
      });
    }
  };

  const createAssignment = () => {
    if (!newAssignment.release_title && !newAssignment.release_id) return;
    setCreateLoading(true);
    try {
      const releaseTitle = newAssignment.release_title ||
        cmsReleases.find(r => r.id === newAssignment.release_id)?.title || '';
      const entry: PerformanceAssignment = {
        id: `PA-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        release_id: newAssignment.release_id || undefined,
        release_title: releaseTitle,
        vocalist: newAssignment.vocalist || undefined,
        writer:   newAssignment.writer   || undefined,
        producer: newAssignment.producer || undefined,
        due_date: newAssignment.due_date || undefined,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const all: PerformanceAssignment[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, entry]));

      // Notify each assigned stakeholder
      (['vocalist', 'writer', 'producer'] as const).forEach((role) => {
        const name = entry[role];
        if (!name) return;
        const profile = lookupProfileByName(role, name);
        const storedUser = profile?.user_id ? lookupUserFromStorage(profile.user_id) : null;
        const email = storedUser?.email || profile?.email;
        if (!email) return;
        notifyStatusChange({
          user_id: profile?.user_id,
          email,
          name: profile?.name || name,
          role,
          status: 'assignment_received',
          reference: releaseTitle,
        }).catch(console.error);
      });

      setNewAssignment({ release_id: '', release_title: '', vocalist: '', writer: '', producer: '', due_date: '' });
      setShowCreate(false);
      loadItems();
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Performance Assignments</h1>
              <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
                Stage 2 — assign Ahl-e-Qalam / Ahl-e-Sada / Ahl-e-Naghma teams to approved releases and track execution.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(v => !v)}
              className="dashboard-btn-primary inline-flex items-center gap-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              New Assignment
            </button>
          </div>
        </div>

        {/* ── Create Assignment Form ── */}
        {showCreate && (
          <div className="dashboard-card border-[var(--dash-accent)]/30">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[var(--dash-text-primary)]">Create Performance Assignment</h2>
              <button onClick={() => setShowCreate(false)} className="text-[var(--dash-text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Release */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--dash-text-secondary)] mb-1">Release</label>
                {cmsReleases.length > 0 ? (
                  <select
                    value={newAssignment.release_id}
                    onChange={(e) => {
                      const r = cmsReleases.find(r => r.id === e.target.value);
                      setNewAssignment(a => ({ ...a, release_id: e.target.value, release_title: r?.title || '' }));
                    }}
                    className="dashboard-input"
                  >
                    <option value="">— Select a published release —</option>
                    {cmsReleases.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Release title (no published releases found)"
                    value={newAssignment.release_title}
                    onChange={(e) => setNewAssignment(a => ({ ...a, release_title: e.target.value }))}
                    className="dashboard-input"
                  />
                )}
              </div>

              {/* Vocalist */}
              <div>
                <label className="block text-xs font-medium text-[var(--dash-text-secondary)] mb-1">Vocalist — Ahl-e-Sada</label>
                {approvedVocalists.length > 0 ? (
                  <select
                    value={newAssignment.vocalist}
                    onChange={(e) => setNewAssignment(a => ({ ...a, vocalist: e.target.value }))}
                    className="dashboard-input"
                  >
                    <option value="">— Select vocalist —</option>
                    {approvedVocalists.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="No approved vocalists yet"
                    value={newAssignment.vocalist}
                    onChange={(e) => setNewAssignment(a => ({ ...a, vocalist: e.target.value }))}
                    className="dashboard-input"
                  />
                )}
              </div>

              {/* Writer */}
              <div>
                <label className="block text-xs font-medium text-[var(--dash-text-secondary)] mb-1">Writer — Ahl-e-Qalam</label>
                {approvedWriters.length > 0 ? (
                  <select
                    value={newAssignment.writer}
                    onChange={(e) => setNewAssignment(a => ({ ...a, writer: e.target.value }))}
                    className="dashboard-input"
                  >
                    <option value="">— Select writer —</option>
                    {approvedWriters.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="No approved writers yet"
                    value={newAssignment.writer}
                    onChange={(e) => setNewAssignment(a => ({ ...a, writer: e.target.value }))}
                    className="dashboard-input"
                  />
                )}
              </div>

              {/* Producer */}
              <div>
                <label className="block text-xs font-medium text-[var(--dash-text-secondary)] mb-1">Producer — Ahl-e-Naghma</label>
                {approvedProducers.length > 0 ? (
                  <select
                    value={newAssignment.producer}
                    onChange={(e) => setNewAssignment(a => ({ ...a, producer: e.target.value }))}
                    className="dashboard-input"
                  >
                    <option value="">— Select producer —</option>
                    {approvedProducers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="No approved producers yet"
                    value={newAssignment.producer}
                    onChange={(e) => setNewAssignment(a => ({ ...a, producer: e.target.value }))}
                    className="dashboard-input"
                  />
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-[var(--dash-text-secondary)] mb-1">Due Date</label>
                <input
                  type="date"
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment(a => ({ ...a, due_date: e.target.value }))}
                  className="dashboard-input"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={createAssignment}
                disabled={createLoading || (!newAssignment.release_title && !newAssignment.release_id)}
                className="dashboard-btn-primary disabled:opacity-50"
              >
                {createLoading ? 'Creating…' : 'Create & Notify Team'}
              </button>
              <button onClick={() => setShowCreate(false)} className="dashboard-btn-secondary">Cancel</button>
            </div>
            <p className="text-xs text-[var(--dash-text-muted)] mt-3">
              Assigned contributors will receive an in-app notification immediately.
            </p>
          </div>
        )}

        <div className="dashboard-card">
          <div className="flex gap-3 mb-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search release or stakeholder"
              className="dashboard-input"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-52">
              <option value="all">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
            <button onClick={loadItems} className="dashboard-btn-secondary inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Release</th>
                  <th>Writer</th>
                  <th>Vocalist</th>
                  <th>Producer</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[var(--dash-text-muted)]">
                      No assignments found. Use &quot;New Assignment&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Mic className="w-4 h-4 text-[var(--dash-accent)]" />
                          <span className="font-medium text-[var(--dash-text-primary)]">{item.release_title || 'Untitled'}</span>
                        </div>
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">{item.writer || '—'}</td>
                      <td className="text-[var(--dash-text-secondary)]">{item.vocalist || '—'}</td>
                      <td className="text-[var(--dash-text-secondary)]">{item.producer || '—'}</td>
                      <td className="text-[var(--dash-text-secondary)]">
                        {item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-[var(--dash-text-secondary)] capitalize">{String(item.status || 'pending').replace('_', ' ')}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(item.id, 'assigned')}     className="dashboard-btn-secondary text-xs">Assign</button>
                          <button onClick={() => updateStatus(item.id, 'in_progress')}  className="dashboard-btn-secondary text-xs">Start</button>
                          <button onClick={() => updateStatus(item.id, 'completed')}    className="dashboard-btn-primary text-xs">Complete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
