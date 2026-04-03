"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { DollarSign, RefreshCw } from 'lucide-react';
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
const STATUSES = ['pending', 'approved', 'paid', 'on_hold'] as const;

export default function RoyaltiesPage() {
  const [records, setRecords] = useState<RoyaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  const loadRecords = () => {
    setLoading(true);
    try {
      if (typeof window === 'undefined') {
        setRecords([]);
        return;
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setRecords(Array.isArray(parsed) ? parsed : []);
    } finally {
      setLoading(false);
    }
  };

  const persistRecords = (next: RoyaltyRecord[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setRecords(next);
  };

  useEffect(() => {
    loadRecords();
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

  const totalDue = filtered.reduce((sum, item) => sum + Number(item.amount_due || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <h1 className="text-xl font-semibold text-[var(--dash-text-primary)]">Royalty Management</h1>
          <p className="text-sm text-[var(--dash-text-secondary)] mt-1">
            Stage 4 workflow: review payout obligations and mark disbursement status.
          </p>
          <p className="text-sm text-[var(--dash-text-secondary)] mt-3">
            Current queue total: ${totalDue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>

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
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-[var(--dash-text-muted)]">No royalty records found</td>
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
      </div>
    </DashboardLayout>
  );
}
