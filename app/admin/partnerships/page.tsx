"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Handshake, RefreshCw, X, ExternalLink, Search } from 'lucide-react';

type Partnership = {
  id: string;
  organization_name?: string;
  contact_name?: string;
  email?: string;
  role_title?: string;
  organization_type?: string;
  partnership_type?: string;
  proposal_type?: string;
  organization_website?: string;
  proposal_description?: string;
  proposed_timeline?: string;
  resources_offered?: string;
  partnership_goals?: string;
  status?: string;
  created_at?: string;
  reviewed_at?: string;
};

const STATUSES = ['pending', 'under_review', 'approved', 'rejected'] as const;

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  under_review: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  approved: 'bg-green-500/10 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
};

function DetailModal({ item, onClose, onStatusChange }: {
  item: Partnership;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (status: string) => {
    setUpdating(true);
    await onStatusChange(item.id, status);
    setUpdating(false);
    onClose();
  };

  const statusKey = String(item.status || 'pending').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[var(--dash-card-bg,#0f172a)] border border-[var(--dash-border,#1e293b)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--dash-border,#1e293b)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--dash-text-primary)] mb-1">
              {item.organization_name || 'Unknown Organization'}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[statusKey] || STATUS_STYLES.pending}`}>
              {statusKey.replace('_', ' ')}
            </span>
          </div>
          <button onClick={onClose} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)] transition-colors mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Contact info */}
          <div>
            <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-3">Contact Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Name</p>
                <p className="text-sm text-[var(--dash-text-primary)]">{item.contact_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Email</p>
                <a href={`mailto:${item.email}`} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">{item.email || '—'}</a>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Role / Title</p>
                <p className="text-sm text-[var(--dash-text-primary)]">{item.role_title || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Website</p>
                {item.organization_website ? (
                  <a href={item.organization_website} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1">
                    {item.organization_website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : <p className="text-sm text-[var(--dash-text-primary)]">—</p>}
              </div>
            </div>
          </div>

          {/* Org details */}
          <div>
            <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-3">Organization Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Organization Type</p>
                <p className="text-sm text-[var(--dash-text-primary)]">{item.organization_type || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Partnership Type</p>
                <p className="text-sm text-[var(--dash-text-primary)]">{item.partnership_type || item.proposal_type || '—'}</p>
              </div>
            </div>
          </div>

          {/* Proposal */}
          {item.proposal_description && (
            <div>
              <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Collaboration Proposal</p>
              <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-3 border border-[var(--dash-border,#1e293b)]">
                {item.proposal_description}
              </p>
            </div>
          )}

          {/* Timeline */}
          {item.proposed_timeline && (
            <div>
              <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Proposed Timeline</p>
              <p className="text-sm text-[var(--dash-text-secondary)]">{item.proposed_timeline}</p>
            </div>
          )}

          {/* Resources */}
          {item.resources_offered && (
            <div>
              <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Resources Offered</p>
              <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-3 border border-[var(--dash-border,#1e293b)]">
                {item.resources_offered}
              </p>
            </div>
          )}

          {/* Goals */}
          {item.partnership_goals && (
            <div>
              <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Partnership Goals</p>
              <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-3 border border-[var(--dash-border,#1e293b)]">
                {item.partnership_goals}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-2 border-t border-[var(--dash-border,#1e293b)]">
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--dash-text-muted)]">
              <span>Submitted: {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</span>
              {item.reviewed_at && <span>Reviewed: {new Date(item.reviewed_at).toLocaleString()}</span>}
            </div>
          </div>
        </div>

        {/* Actions footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--dash-border,#1e293b)] bg-black/10">
          <button disabled={updating || statusKey === 'under_review'} onClick={() => changeStatus('under_review')}
            className="dashboard-btn-secondary text-xs disabled:opacity-40">Under Review</button>
          <button disabled={updating || statusKey === 'approved'} onClick={() => changeStatus('approved')}
            className="dashboard-btn-primary text-xs disabled:opacity-40">Approve</button>
          <button disabled={updating || statusKey === 'rejected'} onClick={() => changeStatus('rejected')}
            className="dashboard-btn-secondary text-xs disabled:opacity-40">Reject</button>
        </div>
      </div>
    </div>
  );
}

export default function PartnershipsPage() {
  const [items, setItems] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [selected, setSelected] = useState<Partnership | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partnerships');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
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
        `${item.organization_name || ''} ${item.contact_name || ''} ${item.email || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/partnerships/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadItems();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Partnership Proposals</h1>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search organization or contact"
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
            <div className="dashboard-loading"><p>Loading partnership proposals...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">No partnership proposals found</div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const statusKey = String(item.status || 'pending').toLowerCase();
                    return (
                    <tr key={item.id} className="cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelected(item)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Handshake className="w-4 h-4 text-[var(--dash-accent)]" />
                          <span className="font-medium text-[var(--dash-text-primary)]">{item.organization_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="text-[var(--dash-text-secondary)]">{item.contact_name || item.email || 'Unknown'}</td>
                      <td className="text-[var(--dash-text-secondary)]">{item.partnership_type || item.proposal_type || '—'}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[statusKey] || STATUS_STYLES.pending}`}>
                          {statusKey.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-[var(--dash-text-muted)] text-xs">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateStatus(item.id, 'under_review')} className="dashboard-btn-secondary text-xs">Under Review</button>
                          <button onClick={() => updateStatus(item.id, 'approved')} className="dashboard-btn-primary text-xs">Approve</button>
                          <button onClick={() => updateStatus(item.id, 'rejected')} className="dashboard-btn-secondary text-xs">Reject</button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
        />
      )}
    </DashboardLayout>
  );
}
