"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Server, RefreshCw, X, ExternalLink, Search } from 'lucide-react';

type InfraProposal = {
  id: string;
  contact_name?: string;
  email?: string;
  organization_name?: string;
  role_title?: string;
  proposal_type?: string;
  website?: string;
  technical_description?: string;
  integration_scope?: string;
  compliance_notes?: string;
  timeline?: string;
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
  item: InfraProposal;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const statusKey = String(item.status || 'pending').toLowerCase();

  const changeStatus = async (status: string) => {
    setUpdating(true);
    await onStatusChange(item.id, status);
    setUpdating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[var(--dash-card-bg,#0f172a)] border border-[var(--dash-border,#1e293b)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-3">Contact</p>
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
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Role</p>
                <p className="text-sm text-[var(--dash-text-primary)]">{item.role_title || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Website</p>
                {item.website ? (
                  <a href={item.website} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-amber-400 hover:text-amber-300 inline-flex items-center gap-1">
                    {item.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : <p className="text-sm text-[var(--dash-text-primary)]">—</p>}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">Proposal Type</p>
            <p className="text-sm text-[var(--dash-text-primary)]">{item.proposal_type || '—'}</p>
          </div>

          {item.technical_description && (
            <div>
              <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Technical Description</p>
              <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-3 border border-[var(--dash-border,#1e293b)]">
                {item.technical_description}
              </p>
            </div>
          )}

          {item.integration_scope && (
            <div>
              <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Integration Scope</p>
              <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed whitespace-pre-wrap bg-black/20 rounded-lg p-3 border border-[var(--dash-border,#1e293b)]">
                {item.integration_scope}
              </p>
            </div>
          )}

          {item.compliance_notes && (
            <div>
              <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Compliance Notes</p>
              <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {item.compliance_notes}
              </p>
            </div>
          )}

          {item.timeline && (
            <div>
              <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-1">Proposed Timeline</p>
              <p className="text-sm text-[var(--dash-text-secondary)]">{item.timeline}</p>
            </div>
          )}

          <div className="pt-2 border-t border-[var(--dash-border,#1e293b)]">
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--dash-text-muted)]">
              <span>Submitted: {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</span>
              {item.reviewed_at && <span>Reviewed: {new Date(item.reviewed_at).toLocaleString()}</span>}
            </div>
          </div>
        </div>

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

export default function InfrastructurePage() {
  const [items, setItems] = useState<InfraProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [selected, setSelected] = useState<InfraProposal | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/infrastructure');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = String(item.status || 'pending').toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery =
        !query ||
        `${item.organization_name || ''} ${item.contact_name || ''} ${item.email || ''} ${item.proposal_type || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/infrastructure/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadItems();
  };

  const pendingCount = items.filter((i) => String(i.status || 'pending') === 'pending').length;

  return (
    <DashboardLayout>
      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
        />
      )}
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-[var(--dash-text-primary)] flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-400" />
                Infrastructure Proposals
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {pendingCount} pending
                  </span>
                )}
              </h1>
              <button onClick={loadItems} className="dashboard-btn-secondary flex items-center gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search organization, contact, or type"
                  className="dashboard-input has-icon w-full"
                />
              </div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-56">
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading infrastructure proposals...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">No infrastructure proposals found</div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Contact</th>
                    <th>Proposal Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const statusKey = String(item.status || 'pending').toLowerCase();
                    return (
                      <tr key={item.id}>
                        <td className="font-medium text-[var(--dash-text-primary)]">
                          {item.organization_name || '—'}
                        </td>
                        <td>
                          <div className="text-sm">{item.contact_name || '—'}</div>
                          <div className="text-xs text-[var(--dash-text-muted)]">{item.email || ''}</div>
                        </td>
                        <td className="text-sm text-[var(--dash-text-secondary)]">{item.proposal_type || '—'}</td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[statusKey] || STATUS_STYLES.pending}`}>
                            {statusKey.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-xs text-[var(--dash-text-muted)]">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => setSelected(item)}
                            className="dashboard-btn-secondary text-xs"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
