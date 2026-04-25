"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Layout } from '@/app/components/layout/Layout';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { ArrowLeft, Building2, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type AccountStatus = 'pending_review' | 'verified' | 'rejected';

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
  status: AccountStatus;
  submitted_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<AccountStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  pending_review: { label: 'Pending Review', icon: Clock, color: 'text-amber-400' },
  verified: { label: 'Verified', icon: CheckCircle2, color: 'text-emerald-400' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400' },
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

  useEffect(() => {
    if (user === null) { router.push('/login'); return; }
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

  if (!user || loading) {
    return (
      <Layout>
        <PageContainer>
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        </PageContainer>
      </Layout>
    );
  }

  const StatusIcon = account ? STATUS_CONFIG[account.status].icon : null;

  return (
    <Layout>
      <PageContainer>
        <div className="min-h-[70vh] py-16 max-w-xl mx-auto">

          {/* Back */}
          <Link
            href="/user/profile"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Account
          </Link>

          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-1">
            Royalty Payouts
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8">
            Link your bank account to receive royalty payments.
          </p>

          {/* Processor notice */}
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 mb-8">
            <Building2 className="w-5 h-5 text-[var(--color-gold)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Processed by Prime Logic Solutions LLC</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                All royalty disbursements are handled by Prime Logic Solutions LLC (USA), SufiPulse's authorized payment partner.
              </p>
            </div>
          </div>

          {/* Current account status */}
          {account && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/5 mb-8">
              <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Linked Account</span>
                {StatusIcon && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_CONFIG[account.status].color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {STATUS_CONFIG[account.status].label}
                  </span>
                )}
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-sm text-[var(--color-text-secondary)]">{account.account_holder_name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{account.bank_name}</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {account.account_type === 'checking' ? 'Checking' : 'Savings'} ••••{account.account_last4}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)]">Routing: {account.routing_number}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-sm font-medium text-[var(--color-text-primary)]">
              {account ? 'Update Bank Account' : 'Add Bank Account'}
            </h2>

            <div>
              <label className="block text-xs text-[var(--color-text-tertiary)] mb-1.5">Account Holder Name</label>
              <input
                type="text"
                value={form.account_holder_name}
                onChange={e => setForm(p => ({ ...p, account_holder_name: e.target.value }))}
                placeholder="Full legal name"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--color-text-tertiary)] mb-1.5">Bank Name</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))}
                placeholder="e.g. Chase, Bank of America"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--color-text-tertiary)] mb-1.5">Account Type</label>
              <div className="flex gap-3">
                {(['checking', 'savings'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, account_type: type }))}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${
                      form.account_type === type
                        ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]'
                        : 'border-white/10 bg-white/[0.03] text-[var(--color-text-secondary)] hover:border-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--color-text-tertiary)] mb-1.5">
                Account Number
                {account && <span className="ml-2 text-[var(--color-text-tertiary)]">(current: ••••{account.account_last4})</span>}
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={form.account_number}
                onChange={e => setForm(p => ({ ...p, account_number: e.target.value.replace(/\D/g, '') }))}
                placeholder={account ? 'Enter new account number to update' : 'Account number'}
                className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Only the last 4 digits are stored. Your full number is never retained.</p>
            </div>

            <div>
              <label className="block text-xs text-[var(--color-text-tertiary)] mb-1.5">Routing Number (9 digits)</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.routing_number}
                onChange={e => setForm(p => ({ ...p, routing_number: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                placeholder="123456789"
                maxLength={9}
                className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--color-text-tertiary)] mb-1.5">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any additional information for our team"
                rows={2}
                className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Bank account submitted for review. Prime Logic Solutions will verify within 2–3 business days.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-[#0a0e13] text-sm font-semibold hover:bg-[var(--color-gold)]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Submitting…' : account ? 'Update Bank Account' : 'Link Bank Account'}
            </button>
          </form>

        </div>
      </PageContainer>
    </Layout>
  );
}
