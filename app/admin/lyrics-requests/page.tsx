"use client";

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Mail, RefreshCw, X, Reply, Search, Filter, Shield, Tag, User, MessageSquare, Clock, ArrowRight, CheckCircle, AlertCircle, Archive, Trash2, Edit3, Globe, ExternalLink, Send, Languages, FileText } from 'lucide-react';
import Link from 'next/link';

type LyricsRequest = {
  id: string;
  releaseId: string;
  releaseSlug: string;
  releaseTitle: string;
  languageCode: string;
  languageName: string;
  requestType: string;
  requesterName?: string;
  requesterEmail?: string;
  status: string;
  priority: string;
  requestedMessage?: string;
  adminNotes?: string;
  translatedLyrics?: string;
  translationNotes?: string;
  notifyWhenPublished: boolean;
  notificationSentAt?: string;
  publishedToRelease: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = ['submitted', 'under_review', 'approved', 'in_translation', 'published', 'rejected', 'archived'] as const;

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  under_review: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  approved: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  in_translation: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
  archived: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
};

function RequestModal({ item, onClose, onUpdate }: {
  item: LyricsRequest;
  onClose: () => void;
  onUpdate: (id: string, patch: any) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState(item.adminNotes || '');
  const [status, setStatus] = useState(item.status);
  const [priority, setPriority] = useState(item.priority);
  const [translatedLyrics, setTranslatedLyrics] = useState(item.translatedLyrics || '');
  const [translationNotes, setTranslationNotes] = useState(item.translationNotes || '');

  const handleSave = async (customStatus?: string) => {
    setUpdating(true);
    await onUpdate(item.id, { 
      status: customStatus || status, 
      priority, 
      adminNotes: notes,
      translatedLyrics,
      translationNotes
    });
    setUpdating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-amber-400 bg-amber-400/5 border border-amber-400/10 px-3 py-1 rounded-full uppercase tracking-widest">Reference: {item.id.slice(-8).toUpperCase()}</span>
               <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${STATUS_STYLES[status]}`}>{status.replace('_', ' ')}</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight pt-2">
              {item.languageName} Translation Workflow
            </h2>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{item.releaseTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Requester & Context */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3">Requester Identity</p>
                <div className="elite-card p-5 bg-white/[0.02] border-white/5 space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-neutral-500" />
                    <span className="text-white font-medium">{item.requesterName || 'Anonymous Seeker'}</span>
                  </div>
                  {item.requesterEmail && (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-neutral-500" />
                      <a href={`mailto:${item.requesterEmail}`} className="text-amber-400 hover:underline text-xs">{item.requesterEmail}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} className={item.notifyWhenPublished ? "text-emerald-500" : "text-neutral-700"} />
                    <span className="text-[10px] text-neutral-400">{item.notifyWhenPublished ? 'Notify on publication' : 'No notification'}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3">Release Context</p>
                <div className="elite-card p-5 bg-black/40 border-white/5 space-y-4">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-amber-400/5 rounded-xl border border-amber-400/10">
                       <Globe className="w-5 h-5 text-amber-400" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-white font-bold text-xs truncate">{item.releaseTitle}</p>
                       <Link href={`/release-detail/${item.releaseSlug}`} target="_blank" className="text-[9px] text-amber-400 hover:underline uppercase tracking-widest flex items-center gap-1 mt-1">
                          Preview <ExternalLink size={8} />
                       </Link>
                     </div>
                   </div>
                   {item.requestedMessage && (
                     <div className="pt-4 border-t border-white/5">
                        <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.3em] mb-2">Requester Note</p>
                        <p className="text-neutral-400 text-[11px] leading-relaxed italic">"{item.requestedMessage}"</p>
                     </div>
                   )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3">Workflow Lifecycle</p>
                <div className="elite-card p-5 bg-white/[0.02] border-white/5 space-y-4 text-[10px]">
                   <div className="flex justify-between border-b border-white/5 pb-2">
                     <span className="text-neutral-500 uppercase tracking-widest">Submitted</span>
                     <span className="text-neutral-300">{new Date(item.createdAt).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-neutral-500 uppercase tracking-widest">Last Updated</span>
                     <span className="text-neutral-300">{new Date(item.updatedAt).toLocaleString()}</span>
                   </div>
                   {item.notificationSentAt && (
                     <div className="flex justify-between text-emerald-500 pt-2 border-t border-emerald-500/10">
                       <span className="uppercase tracking-widest font-bold">Published Notification Sent</span>
                       <span>{new Date(item.notificationSentAt).toLocaleDateString()}</span>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Right Column: Fulfillment */}
            <div className="lg:col-span-2 space-y-8">
               <div>
                  <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <Languages size={14} className="text-amber-400" />
                    Translation Fulfillment
                  </p>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Translated Lyrics ({item.languageName})</label>
                      <textarea 
                        value={translatedLyrics}
                        onChange={(e) => setTranslatedLyrics(e.target.value)}
                        rows={10}
                        placeholder="Paste the translated lyrics here..."
                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-base text-white focus:border-amber-400 outline-none resize-none font-arabic leading-loose"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Translation & Proofreading Notes</label>
                      <input 
                        type="text"
                        value={translationNotes}
                        onChange={(e) => setTranslationNotes(e.target.value)}
                        placeholder="Translator name, dialect variations, etc."
                        className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>
               </div>

               <div>
                <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Institutional Actions</p>
                
                <div className="grid md:grid-cols-2 gap-8 mt-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Process Status</label>
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 outline-none cursor-pointer"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Priority</label>
                    <select 
                      value={priority} 
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-400 outline-none cursor-pointer"
                    >
                      <option value="normal">NORMAL</option>
                      <option value="high">HIGH</option>
                      <option value="urgent">URGENT</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Internal Coordination Notes</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Admin-only notes for tracking progress..."
                      className="w-full bg-black border border-white/10 rounded-xl px-6 py-4 text-xs text-white focus:border-amber-400 outline-none resize-none"
                    />
                  </div>
                </div>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {item.requesterEmail && (
               <a 
                 href={`mailto:${item.requesterEmail}?subject=Re: Lyrics Translation Request - ${item.releaseTitle}`}
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
            
            {status !== 'published' && (
               <button 
                disabled={updating || !translatedLyrics}
                onClick={() => handleSave('published')}
                className="px-8 py-3 rounded-xl bg-emerald-500 text-black text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg disabled:opacity-30"
              >
                <CheckCircle size={14} /> Mark Published & Notify
              </button>
            )}

            <button 
              disabled={updating}
              onClick={() => handleSave()}
              className="px-8 py-3 rounded-xl bg-amber-400 text-black text-xs font-black uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-2 shadow-lg"
            >
              {updating ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
              Save Record
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

export default function LyricsRequestsPage() {
  const [items, setItems] = useState<LyricsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<LyricsRequest | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lyrics-requests');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const updateRequest = async (id: string, patch: any) => {
    await fetch(`/api/lyrics-requests`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    await loadItems();
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesQuery = !query || 
        `${item.requesterName} ${item.requesterEmail} ${item.releaseTitle} ${item.languageName}`.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'submitted' || i.status === 'under_review' || i.status === 'in_translation').length,
      published: items.filter(i => i.status === 'published').length
    };
  }, [items]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Lyrics Request Management
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </h1>
            <p className="text-neutral-500 text-sm mt-1 uppercase tracking-[0.1em]">Editorial Pipeline Oversight</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-8">
               <div className="text-center">
                 <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-1">Total</p>
                 <p className="text-white font-bold">{stats.total}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-1 text-amber-500/60">Active</p>
                 <p className="text-white font-bold">{stats.pending}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-1 text-emerald-500/60">Published</p>
                 <p className="text-white font-bold">{stats.published}</p>
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
          <div className="md:col-span-8 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, release title or language..."
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-amber-400/50 outline-none transition-all placeholder:text-neutral-700"
            />
          </div>
          
          <div className="md:col-span-4">
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
               <Globe className="w-10 h-10 text-neutral-800 mx-auto" />
               <p className="text-neutral-600 text-xs font-black uppercase tracking-[0.3em]">No matching requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Target</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Release Context</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Requester</th>
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
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                             <Globe size={14} />
                           </div>
                           <span className="text-white font-bold text-sm tracking-tight">{item.languageName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-neutral-300 font-medium text-sm tracking-tight">{item.releaseTitle}</p>
                          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-2">
                            Ref: {item.id.slice(-8).toUpperCase()}
                            {item.translatedLyrics && (
                              <span title="Draft lyrics attached">
                                <FileText size={10} className="text-blue-400" />
                              </span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-0.5">
                          <p className="text-neutral-300 font-medium text-sm">{item.requesterName || 'Anonymous'}</p>
                          <p className="text-neutral-500 text-xs">{item.requesterEmail || '—'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLES[item.status] || STATUS_STYLES.submitted}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex flex-col items-end gap-1">
                            <span className="text-neutral-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2">
                               {item.notifyWhenPublished && (
                                 <span title="Notify on publish">
                                   <Send size={10} className="text-emerald-500" />
                                 </span>
                               )}
                               <ArrowRight size={12} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
        <RequestModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateRequest}
        />
      )}
    </DashboardLayout>
  );
}
