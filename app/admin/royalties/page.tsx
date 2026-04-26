"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { CreditCard, DollarSign, Loader2, Plus, RefreshCw, X } from 'lucide-react';
import { notifyStatusChange } from '@/app/lib/notifications';

type RoyaltyRecord = {
  id: string;
  release_id?: string;
  release_title?: string;
  stakeholder_id?: string;
  stakeholder_name?: string;
  stakeholder_email?: string;
  stakeholder_type?: string;
  amount_due?: number;
  currency?: string;
  payout_status?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
};

const STATUSES = ['pending', 'approved', 'paid', 'on_hold'] as const;
const CURRENCIES = ['USD', 'GBP', 'EUR', 'AED', 'CAD'] as const;

// Types that have admin API endpoints for contributor lookup
const TYPE_API: Record<string, string> = {
  writer: '/api/writers',
  vocalist: '/api/vocalists',
  producer: '/api/producers',
  literary: '/api/literary',
  studio: '/api/studio',
};

const ALL_TYPES = ['writer', 'vocalist', 'producer', 'literary', 'studio', 'distributor', 'institution'];

function getDisplayName(type: string, item: any): string {
  switch (type) {
    case 'writer':   return item.pen_name || item.full_name || item.email;
    case 'vocalist': return item.performance_name || item.full_name || item.email;
    case 'producer': return item.professional_name || item.full_name || item.email;
    case 'literary': return item.professional_name || item.full_name || item.email;
    case 'studio':   return item.studio_name || item.primary_contact_name || item.email;
    default:         return item.full_name || item.name || item.email || item.id;
  }
}

const BLANK_FORM = {
  release_id: '',
  release_title: '',
  stakeholder_id: '',
  stakeholder_name: '',
  stakeholder_email: '',
  stakeholder_type: 'writer',
  amount_due: '',
  currency: 'USD',
  due_date: '',
};

export default function RoyaltiesPage() {
  const [records, setRecords] = useState<RoyaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [activeView, setActiveView] = useState<'royalties' | 'bank_accounts'>('royalties');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState(BLANK_FORM);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [formError, setFormError] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/royalties');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBankAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/royalties/payout-accounts');
      const data = await res.json();
      setBankAccounts(Array.isArray(data) ? data : []);
    } catch {
      setBankAccounts([]);
    }
  }, []);

  const loadReleases = useCallback(async () => {
    try {
      const res = await fetch('/api/releases?status=all');
      const data = await res.json();
      setReleases(Array.isArray(data) ? data : []);
    } catch {
      setReleases([]);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    loadBankAccounts();
    loadReleases();
  }, [loadRecords, loadBankAccounts, loadReleases]);

  // Load approved contributors when the form is open and the stakeholder type changes
  useEffect(() => {
    if (!showNewForm) return;
    const type = newForm.stakeholder_type;
    if (!(type in TYPE_API)) {
      setContributors([]);
      return;
    }
    setLoadingContributors(true);
    setContributors([]);
    fetch(TYPE_API[type])
      .then(r => r.json())
      .then((data: any[]) => {
        const all = Array.isArray(data) ? data : [];
        // Only show formally approved contributors — they are the only eligible royalty recipients
        setContributors(
          all.filter(item => item.profile_status === 'approved' || item.status === 'approved')
        );
      })
      .catch(() => setContributors([]))
      .finally(() => setLoadingContributors(false));
  }, [newForm.stakeholder_type, showNewForm]);

  const updateStatus = async (id: string, payout_status: string) => {
    setSavingId(id);
    try {
      await fetch(`/api/royalties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_status }),
      });
      // Notify stakeholder using email stored at record creation time
      const item = records.find(r => r.id === id);
      if (item?.stakeholder_email && (payout_status === 'paid' || payout_status === 'approved')) {
        notifyStatusChange({
          user_id: item.stakeholder_id || '',
          email: item.stakeholder_email,
          name: item.stakeholder_name || '',
          role: item.stakeholder_type as any,
          status: 'royalty_paid',
          reference: item.release_title,
        }).catch(console.error);
      }
      await loadRecords();
    } catch {
      // Reload will reflect server state
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/royalties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          release_id: newForm.release_id,
          release_title: newForm.release_title,
          stakeholder_id: newForm.stakeholder_id || undefined,
          stakeholder_name: newForm.stakeholder_name,
          stakeholder_email: newForm.stakeholder_email || undefined,
          stakeholder_type: newForm.stakeholder_type,
          amount_due: parseFloat(newForm.amount_due) || 0,
          currency: newForm.currency,
          due_date: newForm.due_date || undefined,
          payout_status: 'pending',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || 'Failed to create record.');
        return;
      }
      setNewForm(BLANK_FORM);
      setContributors([]);
      setShowNewForm(false);
      await loadRecords();
    } catch {
      setFormError('Network error. Please try again.');
    }
  };

  const closeForm = () => {
    setShowNewForm(false);
    setNewForm(BLANK_FORM);
    setContributors([]);
    setFormError('');
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter(item => (item.payout_status || 'pending') === filter);
  }, [records, filter]);

  const totalDue = filtered.reduce((sum, item) => sum + Number(item.amount_due || 0), 0);

  const hasApiBackedContributors = (type: string) => type in TYPE_API;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Royalty Management</h1>
              <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
                Review payout obligations, manage bank accounts, and record disbursements.
              </p>
            </div>
            <button
              onClick={() => { setShowNewForm(true); setActiveView('royalties'); setFormError(''); }}
              className="dashboard-btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> New Record
            </button>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('royalties')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'royalties' ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}`}
          >
            <DollarSign className="w-4 h-4 inline mr-1" /> Royalty Records
          </button>
          <button
            onClick={() => { setActiveView('bank_accounts'); loadBankAccounts(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'bank_accounts' ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}`}
          >
            <CreditCard className="w-4 h-4 inline mr-1" /> Bank Accounts ({bankAccounts.length})
          </button>
        </div>

        {/* Create New Record Form */}
        {showNewForm && activeView === 'royalties' && (
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--dash-text-primary)]">Create Royalty Record</h2>
              <button onClick={closeForm} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

              {/* Release — populated from real CMS releases */}
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Release *</label>
                <select
                  required
                  className="dashboard-input w-full"
                  value={newForm.release_id}
                  onChange={e => {
                    const rel = releases.find((r: any) => r.id === e.target.value);
                    setNewForm(prev => ({
                      ...prev,
                      release_id: e.target.value,
                      release_title: rel?.title || '',
                    }));
                  }}
                >
                  <option value="">Select release…</option>
                  {releases.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              {/* Stakeholder Type */}
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Stakeholder Type *</label>
                <select
                  required
                  className="dashboard-input w-full"
                  value={newForm.stakeholder_type}
                  onChange={e => setNewForm(prev => ({
                    ...prev,
                    stakeholder_type: e.target.value,
                    // Reset stakeholder selection when type changes
                    stakeholder_id: '',
                    stakeholder_name: '',
                    stakeholder_email: '',
                  }))}
                >
                  {ALL_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Stakeholder — dropdown of approved contributors, or text for non-API types */}
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Stakeholder *</label>
                {hasApiBackedContributors(newForm.stakeholder_type) ? (
                  loadingContributors ? (
                    <div className="dashboard-input w-full flex items-center gap-2 text-[var(--dash-text-muted)] text-sm">
                      <Loader2 className="w-3 h-3 animate-spin" /> Loading approved contributors…
                    </div>
                  ) : contributors.length === 0 ? (
                    <div className="dashboard-input w-full text-[var(--dash-text-muted)] text-sm">
                      No approved {newForm.stakeholder_type}s found
                    </div>
                  ) : (
                    <select
                      required
                      className="dashboard-input w-full"
                      value={newForm.stakeholder_id}
                      onChange={e => {
                        const c = contributors.find((c: any) => c.id === e.target.value);
                        setNewForm(prev => ({
                          ...prev,
                          stakeholder_id: e.target.value,
                          stakeholder_name: c ? getDisplayName(prev.stakeholder_type, c) : '',
                          stakeholder_email: c?.email || '',
                        }));
                      }}
                    >
                      <option value="">Select {newForm.stakeholder_type}…</option>
                      {contributors.map((c: any) => (
                        <option key={c.id} value={c.id}>{getDisplayName(newForm.stakeholder_type, c)}</option>
                      ))}
                    </select>
                  )
                ) : (
                  // Distributor / institution — no contributor API, accept free text
                  <input
                    required
                    className="dashboard-input w-full"
                    placeholder="Name"
                    value={newForm.stakeholder_name}
                    onChange={e => setNewForm(prev => ({ ...prev, stakeholder_name: e.target.value }))}
                  />
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Amount Due *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="dashboard-input w-full"
                  placeholder="0.00"
                  value={newForm.amount_due}
                  onChange={e => setNewForm(prev => ({ ...prev, amount_due: e.target.value }))}
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Currency</label>
                <select
                  className="dashboard-input w-full"
                  value={newForm.currency}
                  onChange={e => setNewForm(prev => ({ ...prev, currency: e.target.value }))}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Due Date</label>
                <input
                  type="date"
                  className="dashboard-input w-full"
                  value={newForm.due_date}
                  onChange={e => setNewForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>

              {formError && (
                <div className="sm:col-span-2 md:col-span-3 text-sm text-red-400">{formError}</div>
              )}

              <div className="sm:col-span-2 md:col-span-3 flex gap-3">
                <button type="submit" className="dashboard-btn-primary px-6">Create Record</button>
                <button type="button" onClick={closeForm} className="dashboard-btn-secondary px-6">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Royalty Records View */}
        {activeView === 'royalties' && (
          <div className="dashboard-card">
            <div className="flex gap-3 mb-5">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="dashboard-input max-w-52"
              >
                <option value="all">All statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <button onClick={loadRecords} className="dashboard-btn-secondary inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <span className="ml-auto text-sm text-[var(--dash-text-secondary)] self-center">
                Queue total: <strong className="text-[var(--dash-text-primary)]">
                  ${totalDue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </strong>
              </span>
            </div>

            {loading ? (
              <div className="dashboard-loading"><p>Loading royalties…</p></div>
            ) : (
              <div className="dashboard-table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Release</th>
                      <th>Stakeholder</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-[var(--dash-text-muted)]">
                          No royalty records found. Use &ldquo;New Record&rdquo; to create one.
                        </td>
                      </tr>
                    ) : (
                      filtered.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <DollarSign className="w-4 h-4 text-[var(--dash-accent)]" />
                              <span className="font-medium text-[var(--dash-text-primary)]">
                                {item.release_title || 'Unknown release'}
                              </span>
                            </div>
                          </td>
                          <td className="text-[var(--dash-text-secondary)]">
                            {item.stakeholder_name || '—'}
                            {item.stakeholder_type ? ` (${item.stakeholder_type})` : ''}
                          </td>
                          <td className="text-[var(--dash-text-secondary)]">
                            {item.currency || 'USD'} {Number(item.amount_due || 0).toLocaleString()}
                          </td>
                          <td className="text-[var(--dash-text-secondary)]">
                            {item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="text-[var(--dash-text-secondary)] capitalize">
                            {String(item.payout_status || 'pending').replace('_', ' ')}
                          </td>
                          <td>
                            <div className="flex justify-end gap-2">
                              {savingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[var(--dash-text-muted)]" />
                              ) : (
                                <>
                                  <button onClick={() => updateStatus(item.id, 'approved')} className="dashboard-btn-secondary text-xs">Approve</button>
                                  <button onClick={() => updateStatus(item.id, 'paid')} className="dashboard-btn-primary text-xs">Mark Paid</button>
                                  <button onClick={() => updateStatus(item.id, 'on_hold')} className="dashboard-btn-secondary text-xs">Hold</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bank Accounts View — reads from .data/payout-accounts.json via API */}
        {activeView === 'bank_accounts' && (
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[var(--dash-text-primary)]">Submitted Bank Accounts</h2>
              <button onClick={loadBankAccounts} className="dashboard-btn-secondary inline-flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            {bankAccounts.length === 0 ? (
              <p className="text-center py-10 text-[var(--dash-text-muted)]">No bank accounts submitted yet.</p>
            ) : (
              <div className="dashboard-table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Holder Name</th>
                      <th>Bank</th>
                      <th>Account No.</th>
                      <th>Routing</th>
                      <th>Type</th>
                      <th>Currency</th>
                      <th>Country</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts.map((b: any) => (
                      <tr key={b.id || b.user_id}>
                        <td className="font-medium text-[var(--dash-text-primary)]">{b.account_holder_name || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)]">{b.bank_name || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)] font-mono">
                          {b.account_last4 ? `••••${b.account_last4}` : '—'}
                        </td>
                        <td className="text-[var(--dash-text-secondary)] font-mono">{b.routing_number || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)] capitalize">{b.account_type || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)]">{b.currency || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)]">{b.country || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)] capitalize">
                          {b.status ? b.status.replace('_', ' ') : '—'}
                        </td>
                        <td className="text-[var(--dash-text-secondary)]">
                          {b.submitted_at ? new Date(b.submitted_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
