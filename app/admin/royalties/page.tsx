"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  CreditCard, 
  DollarSign, 
  Loader2, 
  Plus, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Building2, 
  ShieldCheck, 
  Search,
  ChevronRight,
  Info
} from 'lucide-react';
import { notifyStatusChange } from '../../lib/notifications';
import { useAuth } from '../../contexts/AuthContext';

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

type AccountStatus = 'pending_review' | 'verified' | 'rejected' | 'revision_requested';

interface PayoutAccount {
  id: string;
  user_id: string;
  email: string;
  account_holder_name: string;
  bank_name: string;
  account_type: 'checking' | 'savings';
  account_last4: string;
  routing_number: string;
  currency: string;
  country: string;
  notes?: string;
  admin_notes?: string;
  status: AccountStatus;
  submitted_at: string;
  updated_at: string;
}

const STATUSES = ['pending', 'approved', 'paid', 'on_hold'] as const;
const CURRENCIES = ['USD', 'GBP', 'EUR', 'AED', 'CAD'] as const;

const STATUS_CONFIG: Record<AccountStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  pending_review: { label: 'Pending Review', icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  verified: { label: 'Verified', icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  revision_requested: { label: 'Revision Required', icon: RefreshCw, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
};

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
  const { user } = useAuth();
  const [records, setRecords] = useState<RoyaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [activeView, setActiveView] = useState<'royalties' | 'bank_accounts'>('royalties');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState(BLANK_FORM);
  const [bankAccounts, setBankAccounts] = useState<PayoutAccount[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [formError, setFormError] = useState('');

  // Verification Queue States
  const [selectedAccount, setSelectedKalam] = useState<PayoutAccount | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');

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
          all.filter(item => item.profile_status === 'approved' || item.status === 'approved' || item.profile_status === 'approved_as_writer')
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

  const handleUpdateAccountStatus = async (id: string, status: AccountStatus) => {
    try {
      setProcessingAction(true);
      const res = await fetch(`/api/royalties/payout-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNote }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSelectedKalam(null);
      setAdminNote('');
      await loadBankAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingAction(false);
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

  const filteredAccounts = bankAccounts.filter(acc => {
    const query = accountSearch.toLowerCase();
    return (
      acc.account_holder_name?.toLowerCase().includes(query) ||
      acc.bank_name?.toLowerCase().includes(query) ||
      acc.email?.toLowerCase().includes(query)
    );
  });

  const hasApiBackedContributors = (type: string) => type in TYPE_API;

  function StatusBadge({ status }: { status: AccountStatus }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_review;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.bgColor} ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Financial Governance</h1>
            <p className="text-sm text-neutral-400">Manage institutional royalty obligations and contributor payout registry.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-lg max-w-md">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-[10px] leading-tight text-amber-200/80">
              Institutional transparency ensures every sacred work receives its formal and spiritual due. 
              Manual verification is required for all payout rails.
            </p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => setActiveView('royalties')}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeView === 'royalties' ? 'text-amber-400' : 'text-neutral-500 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={14} />
              Royalty Records
            </div>
            {activeView === 'royalties' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
          </button>
          <button
            onClick={() => { setActiveView('bank_accounts'); loadBankAccounts(); }}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors relative ${activeView === 'bank_accounts' ? 'text-amber-400' : 'text-neutral-500 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <Building2 size={14} />
              Payout Verification Queue
              {bankAccounts.filter(a => a.status === 'pending_review').length > 0 && (
                <span className="w-4 h-4 bg-amber-400 text-black text-[9px] rounded-full flex items-center justify-center">
                  {bankAccounts.filter(a => a.status === 'pending_review').length}
                </span>
              )}
            </div>
            {activeView === 'bank_accounts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />}
          </button>
        </div>

        {/* Create New Record Form */}
        {showNewForm && activeView === 'royalties' && (
          <div className="dashboard-card border-amber-400/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Create Institutional Royalty Obligation
              </h2>
              <button onClick={closeForm} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

                {/* Release — populated from real CMS releases */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Release Reference *</label>
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
                    <option value="">Select institutional release…</option>
                    {releases.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>

                {/* Stakeholder Type */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Stakeholder Role *</label>
                  <select
                    required
                    className="dashboard-input w-full"
                    value={newForm.stakeholder_type}
                    onChange={e => setNewForm(prev => ({
                      ...prev,
                      stakeholder_type: e.target.value,
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

                {/* Stakeholder */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Approved Contributor *</label>
                  {hasApiBackedContributors(newForm.stakeholder_type) ? (
                    loadingContributors ? (
                      <div className="dashboard-input w-full flex items-center gap-2 text-neutral-500 italic">
                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching registry…
                      </div>
                    ) : contributors.length === 0 ? (
                      <div className="dashboard-input w-full text-neutral-600 italic">
                        No approved contributors found
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
                        <option value="">Select from registry…</option>
                        {contributors.map((c: any) => (
                          <option key={c.id} value={c.id}>{getDisplayName(newForm.stakeholder_type, c)}</option>
                        ))}
                      </select>
                    )
                  ) : (
                    <input
                      required
                      className="dashboard-input w-full"
                      placeholder="Entity Name"
                      value={newForm.stakeholder_name}
                      onChange={e => setNewForm(prev => ({ ...prev, stakeholder_name: e.target.value }))}
                    />
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Amount Due *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className="dashboard-input w-full pl-10"
                      placeholder="0.00"
                      value={newForm.amount_due}
                      onChange={e => setNewForm(prev => ({ ...prev, amount_due: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Currency</label>
                  <select
                    className="dashboard-input w-full"
                    value={newForm.currency}
                    onChange={e => setNewForm(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Disbursement Target Date</label>
                  <input
                    type="date"
                    className="dashboard-input w-full"
                    value={newForm.due_date}
                    onChange={e => setNewForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              {formError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button type="submit" className="dashboard-btn-primary px-10 py-3 bg-linear-to-r from-amber-400 to-amber-500 text-black font-black uppercase text-xs tracking-widest">Formalize Record</button>
                <button type="button" onClick={closeForm} className="dashboard-btn-secondary px-10 py-3 text-neutral-500 uppercase text-xs font-bold tracking-widest">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Royalty Records View */}
        {activeView === 'royalties' && (
          <div className="dashboard-card">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="dashboard-input max-w-xs"
              >
                <option value="all">All Disbursement Statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
              
              <div className="flex gap-2 sm:ml-auto">
                <button onClick={loadRecords} className="dashboard-btn-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <button
                  onClick={() => { setShowNewForm(true); setFormError(''); }}
                  className="dashboard-btn-primary px-6 py-2 bg-amber-400 text-black text-xs font-black uppercase tracking-widest flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" /> New Obligation
                </button>
              </div>
            </div>

            <div className="bg-neutral-950/30 border border-neutral-800 rounded-xl p-4 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <Info size={14} className="text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Queue Aggregate</span>
              </div>
              <p className="text-xl font-mono text-white">
                <span className="text-amber-400">$</span>{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
                <p className="text-neutral-500 text-sm italic">Loading institutional ledger…</p>
              </div>
            ) : (
              <div className="dashboard-table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Release Reference</th>
                      <th>Institutional Stakeholder</th>
                      <th>Amount Due</th>
                      <th>Target Date</th>
                      <th>Status</th>
                      <th className="text-right">Governance Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-neutral-600 italic">
                          No royalty obligations found in this cycle.
                        </td>
                      </tr>
                    ) : (
                      filtered.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center border border-neutral-800">
                                <DollarSign className="w-4 h-4 text-amber-400" />
                              </div>
                              <span className="font-bold text-white text-sm">
                                {item.release_title || 'Unknown Release'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-neutral-200">{item.stakeholder_name || '—'}</span>
                              <span className="text-[9px] text-neutral-500 uppercase tracking-widest">{item.stakeholder_type}</span>
                            </div>
                          </td>
                          <td className="font-mono text-sm text-neutral-300">
                            <span className="text-neutral-600 mr-1">{item.currency || 'USD'}</span>
                            {Number(item.amount_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="text-xs text-neutral-500">
                            {item.due_date ? new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediate'}
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border ${
                              item.payout_status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                              item.payout_status === 'approved' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                              item.payout_status === 'on_hold' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                              'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>
                              {String(item.payout_status || 'pending').replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-end gap-2">
                              {savingId === item.id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                              ) : (
                                <>
                                  <button onClick={() => updateStatus(item.id, 'approved')} title="Approve for Disbursement" className="p-2 hover:bg-white/5 rounded text-blue-400 transition-colors"><ShieldCheck size={16} /></button>
                                  <button onClick={() => updateStatus(item.id, 'paid')} title="Mark as Disbursed" className="p-2 hover:bg-white/5 rounded text-emerald-400 transition-colors"><CheckCircle2 size={16} /></button>
                                  <button onClick={() => updateStatus(item.id, 'on_hold')} title="Institutional Hold" className="p-2 hover:bg-white/5 rounded text-red-400 transition-colors"><AlertCircle size={16} /></button>
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

        {/* Payout Verification Queue View */}
        {activeView === 'bank_accounts' && (
          <div className="dashboard-card">
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input 
                  type="text" 
                  placeholder="Search contributors or banks..."
                  value={accountSearch}
                  onChange={e => setAccountSearch(e.target.value)}
                  className="dashboard-input w-full pl-10"
                />
              </div>
              <button onClick={loadBankAccounts} className="dashboard-btn-secondary px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 sm:ml-auto">
                <RefreshCw className="w-3.5 h-3.5" /> Sync Registry
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="py-20 text-center bg-neutral-950/20 border border-dashed border-neutral-800 rounded-2xl">
                <Building2 className="w-12 h-12 text-neutral-800 mx-auto mb-4 opacity-30" />
                <p className="text-neutral-600 text-sm font-medium">No payout accounts awaiting verification.</p>
              </div>
            ) : (
              <div className="dashboard-table-container">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Account Holder</th>
                      <th>Financial Institution</th>
                      <th>Identity Hash</th>
                      <th>Currency</th>
                      <th>Compliance Status</th>
                      <th>Submitted</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id || acc.user_id}>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">{acc.account_holder_name || '—'}</span>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{acc.email}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Building2 size={12} className="text-neutral-500" />
                            <span className="text-xs text-neutral-300">{acc.bank_name || '—'}</span>
                          </div>
                        </td>
                        <td className="text-xs font-mono text-neutral-500">
                          {acc.account_last4 ? `••••${acc.account_last4}` : '—'}
                          {acc.routing_number && <span className="block text-[10px] opacity-50">{acc.routing_number}</span>}
                        </td>
                        <td className="text-xs text-neutral-400 font-bold">{acc.currency || 'USD'}</td>
                        <td>
                          <StatusBadge status={acc.status} />
                        </td>
                        <td className="text-[10px] text-neutral-500 uppercase font-bold">
                          {acc.submitted_at ? new Date(acc.submitted_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="text-right">
                          <button 
                            onClick={() => {
                              setSelectedKalam(acc);
                              setAdminNote(acc.admin_notes || '');
                            }}
                            className="dashboard-btn-secondary py-1 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 ml-auto"
                          >
                            <Search size={12} />
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Verification Detail Modal */}
        {selectedAccount && (
          <div className="dashboard-modal-overlay" onClick={() => !processingAction && setSelectedKalam(null)}>
            <div className="dashboard-modal max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="dashboard-modal-header border-b border-neutral-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20">
                    <CreditCard className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-0">Disbursement Rail Verification</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">{selectedAccount.email}</p>
                      <StatusBadge status={selectedAccount.status} />
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedKalam(null)} className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="dashboard-modal-body space-y-8 p-8">
                {/* Security Warning */}
                <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 flex items-start gap-4">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed text-blue-200/60 uppercase font-bold tracking-widest">
                    Verification confirms registry alignment. Actual fund transfer requires connection to the authorized payment processor. Cross-reference account holder name with institutional KYC records.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] text-neutral-600 uppercase font-bold tracking-widest mb-2">Legal Account Holder</label>
                    <p className="text-base font-bold text-white">{selectedAccount.account_holder_name}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 uppercase font-bold tracking-widest mb-2">Financial Institution</label>
                    <p className="text-base font-bold text-white">{selectedAccount.bank_name}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 uppercase font-bold tracking-widest mb-2">Account Type</label>
                    <p className="text-sm text-neutral-300 capitalize">{selectedAccount.account_type}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-600 uppercase font-bold tracking-widest mb-2">Institutional Currency</label>
                    <p className="text-sm text-amber-400 font-bold">{selectedAccount.currency}</p>
                  </div>
                </div>

                <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-800/50">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Routing Number (ACH/IBAN)</span>
                    <span className="text-sm font-mono text-white tracking-widest">{selectedAccount.routing_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Account Identification Mask</span>
                    <span className="text-sm font-mono text-white tracking-widest">••••{selectedAccount.account_last4}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <label className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-2">Governance Evaluation / Revision Notes</label>
                  <textarea 
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter reason for rejection or specific revision requirements..."
                    className="dashboard-textarea h-24 text-sm"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-neutral-800 flex flex-wrap gap-3 bg-neutral-900/40">
                <button 
                  onClick={() => handleUpdateAccountStatus(selectedAccount.user_id, 'verified')}
                  disabled={processingAction}
                  className="flex-1 min-w-[140px] px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                >
                  {processingAction ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Verification'}
                </button>
                <button 
                  onClick={() => handleUpdateAccountStatus(selectedAccount.user_id, 'revision_requested')}
                  disabled={processingAction || !adminNote}
                  className="flex-1 min-w-[140px] px-6 py-3.5 border border-orange-500/30 text-orange-400 hover:bg-orange-500/5 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all disabled:opacity-30"
                >
                  Request Revision
                </button>
                <button 
                  onClick={() => handleUpdateAccountStatus(selectedAccount.user_id, 'rejected')}
                  disabled={processingAction}
                  className="px-6 py-3.5 border border-red-500/30 text-red-500 hover:bg-red-500/5 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                >
                  Reject Rail
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
