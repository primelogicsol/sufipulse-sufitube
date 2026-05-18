"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Mail, RefreshCw, X, Reply, Search, Filter, Shield, Tag, User, MessageSquare, Clock, ArrowRight, CheckCircle, AlertCircle, Archive, Trash2, Edit3 } from 'lucide-react';

type InstitutionalInquiry = {
  id: string;
  inquiryId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  assignedTo?: string;
  priority: string;
  admin_notes?: string;
  submittedAt: string;
  updated_at?: string;
};

const STATUSES = ['submitted', 'under_review', 'assigned', 'awaiting_response', 'resolved', 'archived'] as const;

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  under_review: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  assigned: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  awaiting_response: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  archived: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-neutral-500',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400 font-bold',
};

const CATEGORY_LABELS: Record<string, string> = {
  general_inquiry: 'General Inquiry',
  contributor_inquiry: 'Contributor Inquiry',
  studio_coordination: 'Studio Coordination',
  partnership: 'Partnership',
  technical_support: 'Technical Support',
  governance: 'Governance',
  media_press: 'Media / Press',
  institutional_collaboration: 'Institutional Collaboration',
  other: 'Other'
};

function InquiryModal({ item, onClose, onUpdate }: {
  item: InstitutionalInquiry;
  onClose: () => void;
  onUpdate: (id: string, patch: any) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState(item.admin_notes || '');
  const [status, setStatus] = useState(item.status);
  const [priority, setPriority] = useState(item.priority);
  const [assignedTo, setAssignedTo] = useState(item.assignedTo || '');

  const handleSave = async () => {
    setUpdating(true);
    await onUpdate(item.id, { 
      status, 
      priority, 
      assignedTo: assignedTo || null,
      admin_notes: notes 
    });
    setUpdating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-amber-400 bg-amber-400/5 border border-amber-400/10 px-3 py-1 rounded-full uppercase tracking-widest">{item.inquiryId}</span>
               <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${STATUS_STYLES[status]}`}>{status.replace('_', ' ')}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight pt-2">
              {item.subject}
            </h2>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{CATEGORY_LABELS[item.category] || item.category}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3">Sender Identity</p>
                <div className="elite-card p-5 bg-white/[0.02] border-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-neutral-500" />
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-neutral-500" />
                    <a href={`mailto:${item.email}`} className="text-amber-400 hover:underline">{item.email}</a>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3">Workflow Lifecycle</p>
                <div className="elite-card p-5 bg-white/[0.02] border-white/5 space-y-4 text-xs">
                   <div className="flex justify-between border-b border-white/5 pb-2">
                     <span className="text-neutral-500 uppercase tracking-widest">Submitted</span>
                     <span className="text-neutral-300">{new Date(item.submittedAt).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-neutral-500 uppercase tracking-widest">Last Updated</span>
                     <span className="text-neutral-300">{item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3">Inquiry Message</p>
              <div className="elite-card p-6 bg-black/40 border-white/5 min-h-[160px]">
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Institutional Actions</p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 outline-none"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Priority</label>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Assign To</label>
                <input 
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Admin Name/ID"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Operational Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Internal coordination notes, response history..."
                className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-amber-400 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {item.email && (
               <a 
                 href={`mailto:${item.email}?subject=Re: ${item.subject} [${item.inquiryId}]`}
                 className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-xs font-bold uppercase tracking-widest"
               >
                 <Reply size={16} /> Compose Reply
               </a>
             )}
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 rounded-xl border border-white/10 text-neutral-400 text-xs font-black uppercase tracking-widest hover:text-white transition-all">
              Cancel
            </button>
            <button 
              disabled={updating}
              onClick={handleSave}
              className="px-8 py-3 rounded-xl bg-amber-400 text-black text-xs font-black uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-2 shadow-lg"
            >
              {updating ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
              Save Institutional Record
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .elite-card {
            background: rgba(18, 18, 18, 0.4);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 20px;
        }
      `}</style>
    </div>
  );
}

export default function InstitutionalInquiriesPage() {
  const [items, setItems] = useState<InstitutionalInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selected, setSelected] = useState<InstitutionalInquiry | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const updateInquiry = async (id: string, patch: any) => {
    await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    await loadItems();
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesQuery = !query || 
        `${item.name} ${item.email} ${item.subject} ${item.inquiryId}`.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [items, query, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'submitted' || i.status === 'under_review').length,
      urgent: items.filter(i => i.priority === 'urgent' && i.status !== 'resolved').length
    };
  }, [items]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Institutional Inquiry Management
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-neutral-500 text-sm mt-1 uppercase tracking-[0.1em]">Operational Oversight & Lifecycle Tracking</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-8">
               <div className="text-center">
                 <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-1">Total</p>
                 <p className="text-white font-bold">{stats.total}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-1 text-amber-500/60">Pending</p>
                 <p className="text-white font-bold">{stats.pending}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-1 text-red-500/60">Urgent</p>
                 <p className="text-white font-bold">{stats.urgent}</p>
               </div>
            </div>
            <button 
              onClick={loadItems}
              className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin text-amber-400' : 'text-neutral-400'} />
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, subject or Reference ID..."
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-amber-400/50 outline-none transition-all placeholder:text-neutral-700"
            />
          </div>
          
          <div className="md:col-span-3">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-[#0a0a0a] border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-sm text-neutral-300 focus:border-amber-400/50 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none bg-[#0a0a0a] border border-white/10 rounded-2xl pl-10 pr-6 py-4 text-sm text-neutral-300 focus:border-amber-400/50 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => <option key={val} value={val}>{label.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
          {loading && items.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto opacity-20" />
               <p className="text-neutral-600 text-xs font-black uppercase tracking-[0.3em]">Synchronizing Registry...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <MessageSquare className="w-10 h-10 text-neutral-800 mx-auto" />
               <p className="text-neutral-600 text-xs font-black uppercase tracking-[0.3em]">No matching inquiries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Inquiry ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Subject & Category</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Sender</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-center">Priority</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((item) => (
                    <tr 
                      key={item.id} 
                      className="group hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => setSelected(item)}
                    >
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-neutral-400 group-hover:text-amber-400 transition-colors font-mono">{item.inquiryId}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-white font-bold text-sm tracking-tight">{item.subject}</p>
                          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-0.5">
                          <p className="text-neutral-300 font-medium text-sm">{item.name}</p>
                          <p className="text-neutral-500 text-xs">{item.email}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${PRIORITY_STYLES[item.priority] || 'text-neutral-500'}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLES[item.status] || STATUS_STYLES.submitted}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex flex-col items-end gap-1">
                            <span className="text-neutral-400 text-xs">{new Date(item.submittedAt).toLocaleDateString()}</span>
                            <div className="p-1 bg-white/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                               <ArrowRight size={12} className="text-amber-400" />
                            </div>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <InquiryModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateInquiry}
        />
      )}
    </DashboardLayout>
  );
}
