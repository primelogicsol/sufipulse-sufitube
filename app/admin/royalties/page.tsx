"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { DollarSign, RefreshCw, Plus, X, CreditCard } from 'lucide-react';
import { notifyStatusChange, lookupProfileByName, lookupUserFromStorage } from '@/app/lib/notifications';

type RoyaltyRecord = {
  id: string;
  release_title?: string;
  stakeholder_name?: string;
  stakeholder_type?: string;
  amount_due?: number;
  currency?: string;
  payout_status?: string;
  due_date?: string;
  created_at?: string;
};

const STORAGE_KEY = 'sufipulse_royalty_reports';
const BANK_KEY = 'sufipulse_bank_accounts';
const STATUSES = ['pending', 'approved', 'paid', 'on_hold'] as const;

const BLANK_FORM = {
  release_title: '',
  stakeholder_name: '',
  stakeholder_type: 'writer',
  amount_due: '',
  currency: 'USD',
  due_date: '',
};

export default function RoyaltiesPage() {
  const [records, setRecords] = useState<RoyaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [activeView, setActiveView] = useState<'royalties' | 'bank_accounts'>('royalties');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState(BLANK_FORM);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const loadRecords = () => {
    setLoading(true);
    try {
      if (typeof window === 'undefined') { setRecords([]); return; }
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setRecords(Array.isArray(parsed) ? parsed : []);
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = () => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(BANK_KEY);
      setBankAccounts(raw ? JSON.parse(raw) : []);
    } catch { setBankAccounts([]); }
  };

  const persistRecords = (next: RoyaltyRecord[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setRecords(next);
  };

  useEffect(() => {
    loadRecords();
    loadBankAccounts();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter((item) => String(item.payout_status || 'pending') === filter);
  }, [records, filter]);

  const updateStatus = (id: string, payout_status: string) => {
    const item = records.find(r => r.id === id);
    const next = records.map((item) =>
      item.id === id
        ? {
            ...item,
            payout_status,
            updated_at: new Date().toISOString(),
          }
        : item
    );
    persistRecords(next);

    // Notify stakeholder when payment is approved or paid
    if (item && (payout_status === 'paid' || payout_status === 'approved') && item.stakeholder_name) {
      const roleKey = (item.stakeholder_type as any) || 'writer';
      const profile = lookupProfileByName(roleKey, item.stakeholder_name);
      const storedUser = profile?.user_id ? lookupUserFromStorage(profile.user_id) : null;
      const email = storedUser?.email || profile?.email;
      if (email) {
        notifyStatusChange({
          user_id: profile?.user_id,
          email,
          name: profile?.name || item.stakeholder_name,
          role: roleKey,
          status: 'royalty_paid',
          reference: item.release_title,
        }).catch(console.error);
      }
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: RoyaltyRecord = {
      id: `royalty_${Date.now()}`,
      release_title: newForm.release_title,
      stakeholder_name: newForm.stakeholder_name,
      stakeholder_type: newForm.stakeholder_type,
      amount_due: parseFloat(newForm.amount_due) || 0,
      currency: newForm.currency,
      due_date: newForm.due_date,
      payout_status: 'pending',
      created_at: new Date().toISOString(),
    };
    const next = [...records, entry];
    persistRecords(next);
    setNewForm(BLANK_FORM);
    setShowNewForm(false);
  };

  const totalDue = filtered.reduce((sum, item) => sum + Number(item.amount_due || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Royalty Management</h1>
              <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
                Review payout obligations, manage bank accounts, and record disbursements.
              </p>
            </div>
            <button onClick={() => { setShowNewForm(true); setActiveView('royalties'); }} className="dashboard-btn-primary inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Record
            </button>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-2">
          <button onClick={() => setActiveView('royalties')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'royalties' ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}`}>
            <DollarSign className="w-4 h-4 inline mr-1" /> Royalty Records
          </button>
          <button onClick={() => { setActiveView('bank_accounts'); loadBankAccounts(); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeView === 'bank_accounts' ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}`}>
            <CreditCard className="w-4 h-4 inline mr-1" /> Bank Accounts ({bankAccounts.length})
          </button>
        </div>

        {/* Create New Record Form */}
        {showNewForm && activeView === 'royalties' && (
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--dash-text-primary)]">Create Royalty Record</h2>
              <button onClick={() => { setShowNewForm(false); setNewForm(BLANK_FORM); }} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRecord} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Release Title *</label>
                <input required className="dashboard-input w-full" placeholder="e.g. Ya Dost" value={newForm.release_title} onChange={e => setNewForm(p => ({ ...p, release_title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Stakeholder Name *</label>
                <input required className="dashboard-input w-full" placeholder="Display name used in profile" value={newForm.stakeholder_name} onChange={e => setNewForm(p => ({ ...p, stakeholder_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Stakeholder Type *</label>
                <select required className="dashboard-input w-full" value={newForm.stakeholder_type} onChange={e => setNewForm(p => ({ ...p, stakeholder_type: e.target.value }))}>
                  {['writer', 'vocalist', 'producer', 'literary', 'studio', 'distributor', 'institution'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Amount Due *</label>
                <input required type="number" min="0" step="0.01" className="dashboard-input w-full" placeholder="0.00" value={newForm.amount_due} onChange={e => setNewForm(p => ({ ...p, amount_due: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Currency</label>
                <select className="dashboard-input w-full" value={newForm.currency} onChange={e => setNewForm(p => ({ ...p, currency: e.target.value }))}>
                  {['USD', 'GBP', 'EUR', 'AED', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] mb-1">Due Date</label>
                <input type="date" className="dashboard-input w-full" value={newForm.due_date} onChange={e => setNewForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 md:col-span-3 flex gap-3">
                <button type="submit" className="dashboard-btn-primary px-6">Create Record</button>
                <button type="button" onClick={() => { setShowNewForm(false); setNewForm(BLANK_FORM); }} className="dashboard-btn-secondary px-6">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Royalty Records View */}
        {activeView === 'royalties' && (
          <div className="dashboard-card">
            <div className="flex gap-3 mb-5">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dashboard-input max-w-52">
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
              <button onClick={loadRecords} className="dashboard-btn-secondary inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <span className="ml-auto text-sm text-[var(--dash-text-secondary)] self-center">
                Queue total: <strong className="text-[var(--dash-text-primary)]">${totalDue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </span>
            </div>

            {loading ? (
              <div className="dashboard-loading"><p>Loading royalties...</p></div>
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
                        <td colSpan={6} className="text-center py-10 text-[var(--dash-text-muted)]">No royalty records found. Use &ldquo;New Record&rdquo; to create one.</td>
                      </tr>
                    ) : (
                      filtered.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <DollarSign className="w-4 h-4 text-[var(--dash-accent)]" />
                              <span className="font-medium text-[var(--dash-text-primary)]">{item.release_title || 'Unknown release'}</span>
                            </div>
                          </td>
                          <td className="text-[var(--dash-text-secondary)]">
                            {item.stakeholder_name || '-'}
                            {item.stakeholder_type ? ` (${item.stakeholder_type})` : ''}
                          </td>
                          <td className="text-[var(--dash-text-secondary)]">
                            {(item.currency || 'USD')} {Number(item.amount_due || 0).toLocaleString()}
                          </td>
                          <td className="text-[var(--dash-text-secondary)]">
                            {item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="text-[var(--dash-text-secondary)] capitalize">{String(item.payout_status || 'pending').replace('_', ' ')}</td>
                          <td>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => updateStatus(item.id, 'approved')} className="dashboard-btn-secondary text-xs">Approve</button>
                              <button onClick={() => updateStatus(item.id, 'paid')} className="dashboard-btn-primary text-xs">Mark Paid</button>
                              <button onClick={() => updateStatus(item.id, 'on_hold')} className="dashboard-btn-secondary text-xs">Hold</button>
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

        {/* Bank Accounts View */}
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
                      <th>IBAN / Routing</th>
                      <th>SWIFT / BIC</th>
                      <th>Type</th>
                      <th>Country</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankAccounts.map((b: any) => (
                      <tr key={b.id || b.user_id}>
                        <td className="font-medium text-[var(--dash-text-primary)]">{b.holder_name || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)]">{b.bank_name || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)] font-mono">{b.account_number ? `••••${String(b.account_number).slice(-4)}` : '—'}</td>
                        <td className="text-[var(--dash-text-secondary)] font-mono">{b.iban_routing || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)] font-mono">{b.swift_bic || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)] capitalize">{b.account_type || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)]">{b.country || '—'}</td>
                        <td className="text-[var(--dash-text-secondary)]">{b.updated_at ? new Date(b.updated_at).toLocaleDateString() : '—'}</td>
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
