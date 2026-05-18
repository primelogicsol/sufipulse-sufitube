"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Building2, CheckCircle2, Clock, XCircle, AlertCircle, DollarSign, ArrowRight, History, CreditCard, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type AccountStatus = 'pending_review' | 'verified' | 'rejected' | 'revision_requested';

interface PayoutAccount {
  id: string;
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

const STATUS_CONFIG: Record<AccountStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  pending_review: { label: 'Pending Review', icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
  verified: { label: 'Verified', icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  revision_requested: { label: 'Revision Required', icon: RefreshCw, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
};

export default function RoyaltiesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    account_holder_name: '',
    bank_name: '',
    account_type: 'checking' as 'checking' | 'savings',
    account_number: '',
    routing_number: '',
    notes: '',
  });

  const CONTRIBUTOR_ROLE_SET = new Set(['writer', 'vocalist', 'producer', 'studio', 'literary', 'admin', 'super_admin', 'governance_admin']);

  useEffect(() => {
    if (user === null) { router.push('/login'); return; }
    if (user) {
      const roles: string[] = Array.isArray((user as any).assigned_roles)
        ? (user as any).assigned_roles
        : user.role ? [user.role] : [];
      if (!roles.some(r => CONTRIBUTOR_ROLE_SET.has(r))) {
        router.push('/user/profile');
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/payout-account', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.account) {
          setAccount(data.account);
          setForm(prev => ({
            ...prev,
            account_holder_name: data.account.account_holder_name,
            bank_name: data.account.bank_name,
            account_type: data.account.account_type,
            routing_number: data.account.routing_number,
            notes: data.account.notes || '',
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.account_holder_name.trim()) { setError('Account holder name is required.'); return; }
    if (!form.bank_name.trim()) { setError('Bank name is required.'); return; }
    if (!form.account_number || form.account_number.length < 4) { setError('Enter a valid account number (at least 4 digits).'); return; }
    if (!form.routing_number.trim()) { setError('Routing number is required.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/user/payout-account', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      setAccount(data.account);
      setSuccess(true);
      setForm(prev => ({ ...prev, account_number: '' }));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const StatusIcon = account ? STATUS_CONFIG[account.status].icon : null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Royalties & Payouts</h1>
          <p className="text-sm text-neutral-400">Manage your financial details and track institutional disbursements.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content: Stats & Banking */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Earned</span>
                </div>
                <p className="text-2xl font-bold text-white">$0.00</p>
                <p className="text-[10px] text-neutral-600 mt-1 uppercase">Life-to-date</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Pending</span>
                </div>
                <p className="text-2xl font-bold text-white">$0.00</p>
                <p className="text-[10px] text-neutral-600 mt-1 uppercase">Next Cycle</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
                    <History className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Last Payout</span>
                </div>
                <p className="text-2xl font-bold text-white">—</p>
                <p className="text-[10px] text-neutral-600 mt-1 uppercase">N/A</p>
              </div>
            </div>

            {/* Banking Form */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-neutral-800 bg-neutral-950/30">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  Payout Configuration
                </h2>
              </div>

              <div className="p-8">
                {/* Processor notice */}
                <div className="flex items-start gap-4 p-5 rounded-xl border border-blue-500/10 bg-blue-500/5 mb-8">
                  <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-100">Processed by Prime Logic Solutions LLC</p>
                    <p className="text-xs text-blue-200/60 mt-1 leading-relaxed">
                      All royalty disbursements are handled by Prime Logic Solutions LLC (USA), SufiPulse's authorized institutional payment partner.
                    </p>
                  </div>
                </div>

                {/* Current account status */}
                {account && (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Institutional Linked Account</span>
                      {StatusIcon && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_CONFIG[account.status].bgColor} ${STATUS_CONFIG[account.status].color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_CONFIG[account.status].label}
                        </span>
                      )}
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-6">
                      {account.status === 'revision_requested' && account.admin_notes && (
                        <div className="col-span-2 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-2">
                          <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                            <AlertCircle size={12} />
                            Governance Revision Note
                          </p>
                          <p className="text-sm text-neutral-200 italic leading-relaxed">
                            &ldquo;{account.admin_notes}&rdquo;
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-neutral-600 uppercase font-bold mb-1">Account Holder</p>
                        <p className="text-sm text-neutral-200">{account.account_holder_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-600 uppercase font-bold mb-1">Financial Institution</p>
                        <p className="text-sm text-neutral-200">{account.bank_name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-600 uppercase font-bold mb-1">Account Mask</p>
                        <p className="text-sm text-neutral-200 font-mono">
                          {account.account_type.toUpperCase()} ••••{account.account_last4}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-600 uppercase font-bold mb-1">Routing Number</p>
                        <p className="text-sm text-neutral-200 font-mono">{account.routing_number}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Account Holder Name</label>
                      <input
                        required
                        type="text"
                        value={form.account_holder_name}
                        onChange={e => setForm(p => ({ ...p, account_holder_name: e.target.value }))}
                        placeholder="Full legal name"
                        className="dashboard-input w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Bank Name</label>
                      <input
                        required
                        type="text"
                        value={form.bank_name}
                        onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))}
                        placeholder="e.g. Chase, Bank of America"
                        className="dashboard-input w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Account Type</label>
                    <div className="flex gap-4">
                      {(['checking', 'savings'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, account_type: type }))}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                            form.account_type === type
                              ? 'border-amber-400 bg-amber-400/10 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                              : 'border-neutral-800 bg-neutral-950 text-neutral-500 hover:border-neutral-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
                        Account Number
                      </label>
                      <input
                        required={!account}
                        type="password"
                        inputMode="numeric"
                        value={form.account_number}
                        onChange={e => setForm(p => ({ ...p, account_number: e.target.value.replace(/\D/g, '') }))}
                        placeholder={account ? '••••••••' : 'Enter account number'}
                        className="dashboard-input w-full font-mono"
                      />
                      <p className="text-[10px] text-neutral-600 mt-1 italic ml-1">Only the last 4 digits are stored in the registry.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Routing Number (9 digits)</label>
                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        value={form.routing_number}
                        onChange={e => setForm(p => ({ ...p, routing_number: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                        placeholder="123456789"
                        maxLength={9}
                        className="dashboard-input w-full font-mono"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Bank account submitted for institutional verification.
                    </div>
                  )}

                  <div className="pt-4 border-t border-neutral-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 text-neutral-950 text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : account ? 'Update Registry' : 'Link Payout Account'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar: Notices */}
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Governance Notice</h3>
              <div className="space-y-4">
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Royalty calculations are performed quarterly. Payouts are issued to the linked bank account following institutional audit of streaming and licensing revenue.
                </p>
                <div className="p-4 bg-amber-400/5 border border-amber-400/10 rounded-xl">
                  <p className="text-[10px] text-amber-200/60 font-medium italic">
                    "Institutional transparency ensures every sacred work receives its formal and spiritual due."
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Payout Schedule</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 uppercase font-bold">Q1 Cycle</span>
                  <span className="text-neutral-300">April 15</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 uppercase font-bold">Q2 Cycle</span>
                  <span className="text-neutral-300">July 15</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 uppercase font-bold">Q3 Cycle</span>
                  <span className="text-neutral-300">October 15</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 uppercase font-bold">Q4 Cycle</span>
                  <span className="text-neutral-300">January 15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
