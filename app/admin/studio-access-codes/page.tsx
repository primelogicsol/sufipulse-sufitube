"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { KeyRound, RefreshCw, Copy, Check, Plus, X, Search } from 'lucide-react';

type AccessCodeRequest = {
  id: string;
  name: string;
  email: string;
  role: 'writer' | 'vocalist' | 'producer';
  profile_reference: string;
  reason: string;
  status: 'pending' | 'issued' | 'rejected';
  issued_code: string | null;
  created_at: string;
  issued_at: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  writer:   'Writer — Ahl-e-Qalam',
  vocalist: 'Vocalist — Ahl-e-Sada',
  producer: 'Producer — Ahl-e-Naghma',
};

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-400/10 text-amber-400 border-amber-400/30',
  issued:   'bg-green-400/10 text-green-400 border-green-400/30',
  rejected: 'bg-red-400/10 text-red-400 border-red-400/30',
};

function generateCode(role: string): string {
  const prefix = role === 'writer' ? 'WRT' : role === 'vocalist' ? 'VOC' : 'PRD';
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `REF-${prefix}-${year}-${rand}`;
}

export default function AdminStudioAccessCodes() {
  const [requests, setRequests] = useState<AccessCodeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('pending');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate panel state
  const [showGenerate, setShowGenerate] = useState(false);
  const [genName, setGenName] = useState('');
  const [genEmail, setGenEmail] = useState('');
  const [genRole, setGenRole] = useState<'writer' | 'vocalist' | 'producer'>('vocalist');
  const [genNote, setGenNote] = useState('');
  const [genPreview, setGenPreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/studio-access-codes');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Regenerate preview code whenever role changes in the panel
  useEffect(() => {
    if (showGenerate) setGenPreview(generateCode(genRole));
  }, [genRole, showGenerate]);

  const openGenerate = () => {
    setGenName('');
    setGenEmail('');
    setGenRole('vocalist');
    setGenNote('');
    setGenError('');
    setGenPreview(generateCode('vocalist'));
    setShowGenerate(true);
  };

  const rerollCode = () => setGenPreview(generateCode(genRole));

  const createCode = async () => {
    if (!genName.trim()) { setGenError('Name is required.'); return; }
    if (!genEmail.trim()) { setGenError('Email is required.'); return; }
    setGenError('');
    setGenerating(true);
    try {
      const res = await fetch('/api/studio-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: genName.trim(),
          email: genEmail.trim(),
          role: genRole,
          reason: genNote.trim() || 'Manually issued by admin.',
          profile_reference: '',
          status: 'issued',
          issued_code: genPreview,
          issued_at: new Date().toISOString(),
          _admin_created: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to create code.');
      setShowGenerate(false);
      load();
    } catch (e: any) {
      setGenError(e.message || 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  };

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchesFilter = filter === 'all' || r.status === filter;
      const matchesQuery =
        !query ||
        `${r.name} ${r.email} ${r.role} ${r.id}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [requests, query, filter]);

  const issueCode = async (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (!request) return;
    const code = generateCode(request.role);
    await fetch(`/api/studio-access-codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'issued', issued_code: code, issued_at: new Date().toISOString() }),
    });
    load();
  };

  const rejectRequest = async (id: string) => {
    await fetch(`/api/studio-access-codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    load();
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Generate New Code Panel ── */}
        {showGenerate ? (
          <div className="dashboard-card border-[var(--dash-accent)]/30">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[var(--dash-accent)]" />
                <h2 className="text-sm font-semibold text-[var(--dash-text-primary)]">Generate New Access Code</h2>
              </div>
              <button onClick={() => setShowGenerate(false)} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Code preview */}
            <div className="flex items-center gap-3 bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-lg px-4 py-3 mb-5">
              <span className="text-xs text-[var(--dash-text-muted)]">Code:</span>
              <span className="font-mono text-lg font-bold text-[var(--dash-accent)] tracking-widest flex-1">{genPreview}</span>
              <button
                onClick={rerollCode}
                className="dashboard-btn-secondary text-xs inline-flex items-center gap-1"
                title="Generate a different code"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reroll
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-[var(--dash-text-muted)] mb-1.5 uppercase tracking-wide">Contributor Name *</label>
                <input
                  value={genName}
                  onChange={(e) => setGenName(e.target.value)}
                  placeholder="Full name"
                  className="dashboard-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--dash-text-muted)] mb-1.5 uppercase tracking-wide">Email *</label>
                <input
                  type="email"
                  value={genEmail}
                  onChange={(e) => setGenEmail(e.target.value)}
                  placeholder="contributor@email.com"
                  className="dashboard-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--dash-text-muted)] mb-1.5 uppercase tracking-wide">Role</label>
                <select
                  value={genRole}
                  onChange={(e) => setGenRole(e.target.value as typeof genRole)}
                  className="dashboard-input w-full"
                >
                  <option value="vocalist">Vocalist — Ahl-e-Sada</option>
                  <option value="writer">Writer — Ahl-e-Qalam</option>
                  <option value="producer">Producer — Ahl-e-Naghma</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--dash-text-muted)] mb-1.5 uppercase tracking-wide">Internal Note (optional)</label>
                <input
                  value={genNote}
                  onChange={(e) => setGenNote(e.target.value)}
                  placeholder="Reason for issuing"
                  className="dashboard-input w-full"
                />
              </div>
            </div>

            {genError && (
              <p className="text-sm text-red-400 mb-3">{genError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={createCode}
                disabled={generating}
                className="dashboard-btn-primary text-sm disabled:opacity-50"
              >
                {generating ? 'Saving…' : 'Issue Code'}
              </button>
              <button onClick={() => setShowGenerate(false)} className="dashboard-btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={openGenerate}
              className="dashboard-btn-primary text-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Generate New Code
            </button>
          </div>
        )}

        {/* ── Requests List ── */}
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-[var(--dash-accent)]" />
              <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">
                Studio Access Code Requests
              </h1>
            </div>
            <p className="text-sm text-[var(--dash-text-muted)] -mt-2">
              Review contributor requests for session reference codes. Issuing a code enables the contributor to submit a Session Coordination Request.
            </p>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email or request ID"
                  className="dashboard-input has-icon w-full"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="dashboard-input max-w-48"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="issued">Issued</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading requests…</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">
              No access code requests found
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((req) => (
                <div
                  key={req.id}
                  className="border border-[var(--dash-border)] rounded-lg p-5 bg-[var(--dash-surface-secondary)] space-y-4"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[var(--dash-text-primary)]">{req.name}</span>
                        <span className="text-xs text-[var(--dash-text-muted)] font-mono">{req.id}</span>
                        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${STATUS_COLORS[req.status] ?? ''}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--dash-text-secondary)] mt-1">
                        {req.email} · {ROLE_LABELS[req.role] ?? req.role}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--dash-text-muted)]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Profile reference */}
                  {req.profile_reference && (
                    <div className="text-sm">
                      <span className="text-[var(--dash-text-muted)]">Profile reference: </span>
                      <span className="font-mono text-[var(--dash-accent)]">{req.profile_reference}</span>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="text-sm text-[var(--dash-text-secondary)] bg-[var(--dash-surface)] rounded p-3 border border-[var(--dash-border)]">
                    {req.reason}
                  </div>

                  {/* Issued code display */}
                  {req.status === 'issued' && req.issued_code && (
                    <div className="flex items-center gap-3 bg-green-400/5 border border-green-400/20 rounded-lg px-4 py-3">
                      <span className="text-xs text-[var(--dash-text-muted)]">Issued code:</span>
                      <span className="font-mono text-green-400 font-semibold tracking-wider">{req.issued_code}</span>
                      <button
                        onClick={() => copyCode(req.issued_code!, req.id)}
                        className="ml-auto flex items-center gap-1 text-xs text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)] transition-colors"
                      >
                        {copiedId === req.id
                          ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied</>
                          : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                      </button>
                      {req.issued_at && (
                        <span className="text-xs text-[var(--dash-text-muted)]">
                          · Issued {new Date(req.issued_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => issueCode(req.id)}
                        className="dashboard-btn-primary text-sm"
                      >
                        Generate &amp; Issue Code
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id)}
                        className="dashboard-btn-secondary text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={load}
              className="dashboard-btn-secondary text-sm inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
