"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { storage } from '@/app/lib/storage';
import { Mail, RefreshCw, X, Reply } from 'lucide-react';

type ContactMessage = {
  id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: string;
  created_at?: string;
  replied_at?: string;
};

const STATUSES = ['unread', 'read', 'replied', 'archived'] as const;

const STATUS_STYLES: Record<string, string> = {
  unread: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  read: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  replied: 'bg-green-500/10 text-green-400 border-green-500/30',
  archived: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
};

function DetailModal({ item, onClose, onStatusChange }: {
  item: ContactMessage;
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

  const statusKey = String(item.status || 'unread').toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--dash-card-bg,#0f172a)] border border-[var(--dash-border,#1e293b)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--dash-border,#1e293b)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--dash-text-primary)] mb-1">
              {item.subject || 'No Subject'}
            </h2>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[statusKey] || STATUS_STYLES.unread}`}
            >
              {statusKey}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text-primary)] transition-colors mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Sender info */}
          <div>
            <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-3">Sender</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Name</p>
                <p className="text-sm text-[var(--dash-text-primary)]">{item.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--dash-text-muted)] mb-0.5">Email</p>
                <a
                  href={`mailto:${item.email}`}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {item.email || '—'}
                </a>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs text-[var(--dash-text-muted)] uppercase tracking-wider mb-2">Message</p>
            <div className="bg-black/20 rounded-lg p-4 border border-[var(--dash-border,#1e293b)]">
              <p className="text-sm text-[var(--dash-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {item.message || '—'}
              </p>
            </div>
          </div>

          {/* Reply shortcut */}
          {item.email && (
            <a
              href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || '')}`}
              className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 hover:text-amber-200 px-4 py-2 text-sm rounded transition-all"
            >
              <Reply className="w-4 h-4" />
              Reply via Email
            </a>
          )}

          {/* Metadata */}
          <div className="pt-2 border-t border-[var(--dash-border,#1e293b)]">
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--dash-text-muted)]">
              <span>Received: {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</span>
              {item.replied_at && (
                <span>Replied: {new Date(item.replied_at).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--dash-border,#1e293b)] bg-black/10">
          <button
            disabled={updating || statusKey === 'read'}
            onClick={() => changeStatus('read')}
            className="dashboard-btn-secondary text-xs disabled:opacity-40"
          >
            Mark as Read
          </button>
          <button
            disabled={updating || statusKey === 'replied'}
            onClick={() => changeStatus('replied')}
            className="dashboard-btn-primary text-xs disabled:opacity-40"
          >
            Mark as Replied
          </button>
          <button
            disabled={updating || statusKey === 'archived'}
            onClick={() => changeStatus('archived')}
            className="dashboard-btn-secondary text-xs disabled:opacity-40"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContactMessagesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('unread');
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await storage.getAll('contact_message');
      // Sort newest first
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setItems(sorted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const status = String(item.status || 'unread').toLowerCase();
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery =
        !query ||
        `${item.name || ''} ${item.email || ''} ${item.subject || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [items, query, filter]);

  const unreadCount = items.filter((i) => String(i.status || 'unread') === 'unread').length;

  const updateStatus = async (id: string, status: string) => {
    await storage.update('contact_message', id, {
      status,
      ...(status === 'replied' ? { replied_at: new Date().toISOString() } : {}),
    });
    await loadItems();
  };

  const openMessage = async (item: ContactMessage) => {
    setSelected(item);
    // Auto-mark unread → read when opened
    if (String(item.status || 'unread') === 'unread') {
      await storage.update('contact_message', item.id, { status: 'read' });
      await loadItems();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="dashboard-card">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-[var(--dash-text-primary)] flex items-center gap-2">
                Contact Messages
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
            </div>

            <div className="flex gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, or subject"
                className="dashboard-input"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="dashboard-input max-w-48"
              >
                <option value="all">All messages</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading"><p>Loading messages...</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--dash-text-muted)]">No messages found</div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>From</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Received</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const statusKey = String(item.status || 'unread').toLowerCase();
                    const isUnread = statusKey === 'unread';
                    return (
                      <tr
                        key={item.id}
                        className="cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => openMessage(item)}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <Mail className={`w-4 h-4 ${isUnread ? 'text-amber-400' : 'text-[var(--dash-text-muted)]'}`} />
                            <span className={`${isUnread ? 'font-semibold text-[var(--dash-text-primary)]' : 'font-medium text-[var(--dash-text-secondary)]'}`}>
                              {item.subject || '(no subject)'}
                            </span>
                          </div>
                        </td>
                        <td className="text-[var(--dash-text-secondary)]">{item.name || '—'}</td>
                        <td className="text-[var(--dash-text-muted)] text-sm">{item.email || '—'}</td>
                        <td>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[statusKey] || STATUS_STYLES.unread}`}
                          >
                            {statusKey}
                          </span>
                        </td>
                        <td className="text-[var(--dash-text-muted)] text-xs">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => updateStatus(item.id, 'read')}
                              className="dashboard-btn-secondary text-xs"
                            >
                              Read
                            </button>
                            <button
                              onClick={() => updateStatus(item.id, 'replied')}
                              className="dashboard-btn-primary text-xs"
                            >
                              Replied
                            </button>
                            <button
                              onClick={() => updateStatus(item.id, 'archived')}
                              className="dashboard-btn-secondary text-xs"
                            >
                              Archive
                            </button>
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
            <button
              onClick={loadItems}
              className="dashboard-btn-secondary text-sm inline-flex items-center gap-2"
            >
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
