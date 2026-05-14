"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { 
  Globe, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronRight,
  Loader2,
  Mail,
  User,
  ExternalLink,
  MessageSquare,
  Languages,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  History,
  Trash2,
  X,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { type LyricsRequest } from '@/lib/cms-storage';

// Status color mapping
const STATUS_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  pending:        { bg: 'bg-amber-500/10',    text: 'text-amber-500',    border: 'border-amber-500/20' },
  in_review:      { bg: 'bg-blue-500/10',     text: 'text-blue-500',     border: 'border-blue-500/20' },
  assigned:       { bg: 'bg-indigo-500/10',   text: 'text-indigo-500',   border: 'border-indigo-500/20' },
  in_translation: { bg: 'bg-purple-500/10',   text: 'text-purple-500',   border: 'border-purple-500/20' },
  completed:      { bg: 'bg-emerald-500/10',  text: 'text-emerald-500',  border: 'border-emerald-500/20' },
  sent_to_user:   { bg: 'bg-cyan-500/10',     text: 'text-cyan-500',     border: 'border-cyan-500/20' },
  published:      { bg: 'bg-green-500/10',    text: 'text-green-500',    border: 'border-green-500/20' },
  rejected:       { bg: 'bg-red-500/10',      text: 'text-red-500',      border: 'border-red-500/20' },
  closed:         { bg: 'bg-neutral-500/10',  text: 'text-neutral-500',  border: 'border-neutral-500/20' },
};

const PRIORITY_COLORS: Record<string, string> = {
  normal: 'text-neutral-400',
  high:   'text-orange-400',
  urgent: 'text-red-500 font-bold',
};

export default function AdminLyricsRequestsPage() {
  const [requests, setRequests] = useState<LyricsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Detail/Edit State
  const [editForm, setEditForm] = useState<Partial<LyricsRequest>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/lyrics-requests');
      if (!response.ok) throw new Error('Failed to load requests');
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const selectedRequest = useMemo(() => 
    requests.find(r => r.id === selectedRequestId), 
    [requests, selectedRequestId]
  );

  useEffect(() => {
    if (selectedRequest) {
      setEditForm(selectedRequest);
      setSuccessMessage(null);
    }
  }, [selectedRequest]);

  const handleOpenRequest = (id: string) => {
    setSelectedRequestId(id);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (hasChanges && !confirm('Discard unsaved changes?')) return;
    setIsDrawerOpen(false);
    setSelectedRequestId(null);
  };

  const hasChanges = useMemo(() => {
    if (!selectedRequest) return false;
    return JSON.stringify(editForm) !== JSON.stringify(selectedRequest);
  }, [editForm, selectedRequest]);

  const handleSave = async (autoStatus?: LyricsRequest['status']) => {
    if (!selectedRequestId) return;
    setIsSaving(true);
    setSuccessMessage(null);
    
    const payload = { ...editForm };
    if (autoStatus) payload.status = autoStatus;

    try {
      const response = await fetch(`/api/admin/lyrics-requests/${selectedRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to save request');
      
      const updated = await response.json();
      setRequests(prev => prev.map(r => r.id === selectedRequestId ? updated : r));
      setEditForm(updated);
      setSuccessMessage('Changes saved successfully.');
      
      if (autoStatus === 'completed') {
         // Keep drawer open but show success
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToUser = async () => {
    if (!selectedRequestId || !editForm.requesterEmail) return;
    if (!editForm.translatedLyrics) {
      alert('Please add translated lyrics before sending.');
      return;
    }

    setIsSending(true);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/admin/lyrics-requests/${selectedRequestId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editForm.requesterEmail,
          translatedLyrics: editForm.translatedLyrics
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      const { request: updated } = data;
      setRequests(prev => prev.map(r => r.id === selectedRequestId ? updated : r));
      setEditForm(updated);
      setSuccessMessage('Lyrics sent to user successfully.');
    } catch (err: any) {
      alert(`Send Error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedRequestId || !editForm.translatedLyrics) return;
    
    if (!confirm('This will add these lyrics to the release and mark them as published. Continue?')) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/lyrics-requests/${selectedRequestId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translatedLyrics: editForm.translatedLyrics,
          languageCode: editForm.languageCode
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to publish');
      }

      const { request: updated } = await response.json();
      setRequests(prev => prev.map(r => r.id === selectedRequestId ? updated : r));
      setEditForm(updated);
      setSuccessMessage('Lyrics published to release successfully.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        req.releaseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.requesterEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.languageName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_translation' || r.status === 'in_review').length,
    fulfilled: requests.filter(r => r.status === 'completed' || r.status === 'sent_to_user' || r.status === 'published').length,
  }), [requests]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Languages className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-[var(--dash-text-primary)]">Lyrics Requests</h1>
            </div>
            <p className="text-[var(--dash-text-secondary)]">Manage, translate, and fulfill lyrics requests from your community.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-xl divide-x divide-[var(--dash-border)] overflow-hidden shadow-sm">
               <div className="px-5 py-3 text-center">
                 <p className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold mb-1">Pending</p>
                 <p className="text-lg font-bold text-amber-500 leading-none">{stats.pending}</p>
               </div>
               <div className="px-5 py-3 text-center">
                 <p className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold mb-1">Active</p>
                 <p className="text-lg font-bold text-blue-500 leading-none">{stats.inProgress}</p>
               </div>
               <div className="px-5 py-3 text-center">
                 <p className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold mb-1">Fulfilled</p>
                 <p className="text-lg font-bold text-emerald-500 leading-none">{stats.fulfilled}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-muted)]" />
            <input
              type="text"
              placeholder="Search by title, email, or language..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dashboard-input w-full pl-10"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-[var(--dash-bg-secondary)] border border-[var(--dash-border)] rounded-lg px-3 py-1.5 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-[var(--dash-text-muted)]" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-[var(--dash-text-primary)] focus:ring-0 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="in_translation">In Translation</option>
                <option value="completed">Completed</option>
                <option value="sent_to_user">Sent to User</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <button 
              onClick={fetchRequests}
              className="dashboard-btn-secondary p-2 shadow-sm"
              title="Refresh List"
            >
              <History className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Table */}
        <div className="dashboard-card overflow-hidden shadow-xl border-[var(--dash-border)]">
          {loading && requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--dash-text-muted)] bg-[var(--dash-bg-secondary)]/30">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-500/50" />
              <p className="font-medium">Loading translation requests...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400 bg-[var(--dash-bg-secondary)]/30">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold mb-2">Sync Error</p>
              <p className="text-sm mb-6">{error}</p>
              <button onClick={fetchRequests} className="dashboard-btn-primary px-6 py-2">Try Again</button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-24 text-center bg-[var(--dash-bg-secondary)]/30">
              <Globe className="w-16 h-16 text-neutral-800 mx-auto mb-4" strokeWidth={1} />
              <h3 className="text-xl font-bold text-[var(--dash-text-primary)] mb-2">No Requests Found</h3>
              <p className="text-[var(--dash-text-muted)] max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' 
                  ? "Adjust your filters or search terms to find what you're looking for." 
                  : "New lyrics requests from users will appear here automatically."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--dash-bg-secondary)] border-b border-[var(--dash-border)]">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold">Release Title</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold text-center">Language</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold">Requester</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold">Status</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold text-center">Fulfillment</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--dash-border)]">
                  {filteredRequests.map(req => {
                    const status = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                    return (
                      <tr 
                        key={req.id} 
                        className={`hover:bg-[var(--dash-bg-secondary)]/50 transition-colors cursor-pointer group ${selectedRequestId === req.id ? 'bg-amber-500/5' : ''}`}
                        onClick={() => handleOpenRequest(req.id)}
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--dash-text-primary)] line-clamp-1">{req.releaseTitle}</span>
                            <span className="text-[10px] text-[var(--dash-text-muted)] flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/5 border border-amber-500/10 text-amber-500 text-xs font-semibold">
                            <Globe className="w-3 h-3" />
                            {req.languageName}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm text-[var(--dash-text-primary)] font-medium truncate max-w-[180px]">{req.requesterEmail || 'Anonymous'}</span>
                            <span className="text-[10px] text-[var(--dash-text-muted)] truncate max-w-[180px]">{req.requesterName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.bg} ${status.text} ${status.border}`}>
                            {req.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                             <div className={`p-1 rounded ${req.sentToUser ? 'text-emerald-500 bg-emerald-500/10' : 'text-neutral-700 bg-neutral-800'}`} title={req.sentToUser ? 'Sent to user' : 'Not sent'}>
                               <Mail className="w-3.5 h-3.5" />
                             </div>
                             <div className={`p-1 rounded ${req.publishedToRelease ? 'text-emerald-500 bg-emerald-500/10' : 'text-neutral-700 bg-neutral-800'}`} title={req.publishedToRelease ? 'Published' : 'Not published'}>
                               <Globe className="w-3.5 h-3.5" />
                             </div>
                             <div className={`p-1 rounded ${req.translatedLyrics ? 'text-blue-400 bg-blue-400/10' : 'text-neutral-700 bg-neutral-800'}`} title={req.translatedLyrics ? 'Draft exists' : 'Empty'}>
                               <FileText className="w-3.5 h-3.5" />
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-neutral-800 rounded-lg text-amber-500 transition-colors">
                              <ArrowRight className="w-4 h-4" />
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
        </div>
      </div>

      {/* Detail Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" onClick={handleCloseDrawer} />
          
          <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-[#0a0a0a] border-l border-[var(--dash-border)] shadow-2xl pointer-events-auto transform transition-transform duration-300 ease-out overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md px-8 py-6 border-b border-[var(--dash-border)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_COLORS[editForm.status || 'pending'].bg} ${STATUS_COLORS[editForm.status || 'pending'].text} ${STATUS_COLORS[editForm.status || 'pending'].border}`}>
                    {editForm.status?.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${PRIORITY_COLORS[editForm.priority || 'normal']}`}>
                    {editForm.priority} Priority
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white leading-tight">{editForm.releaseTitle}</h2>
              </div>
              <button 
                onClick={handleCloseDrawer}
                className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Success/Error Feedback */}
              {successMessage && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-200">{successMessage}</p>
                </div>
              )}

              {/* Request Metadata */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold">Target Language</p>
                  <p className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {editForm.languageName}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold">Requested On</p>
                  <p className="text-sm text-white">{editForm.createdAt ? new Date(editForm.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold">Requester Email</p>
                  <p className="text-sm text-[var(--dash-text-primary)] flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[var(--dash-text-muted)]" />
                    {editForm.requesterEmail || 'No email provided'}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                   <p className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold">User Link</p>
                   {editForm.sourceUrl ? (
                     <a href={editForm.sourceUrl} target="_blank" className="text-xs text-amber-400 hover:underline flex items-center justify-end gap-1">
                       View Release <ExternalLink className="w-3 h-3" />
                     </a>
                   ) : <span className="text-xs text-neutral-600">None</span>}
                </div>
              </div>

              {editForm.requestedMessage && (
                <div className="p-4 bg-neutral-900 border border-[var(--dash-border)] rounded-xl">
                   <p className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold mb-2">Requester Message</p>
                   <p className="text-sm text-[var(--dash-text-secondary)] italic leading-relaxed">"{editForm.requestedMessage}"</p>
                </div>
              )}

              {/* Administrative Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="dashboard-input w-full text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_translation">In Translation</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold mb-2">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value as any })}
                    className="dashboard-input w-full text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Translated Lyrics Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold">Translated Lyrics</label>
                  <div className="flex gap-2">
                     {editForm.sentToUser && <span className="text-[10px] text-cyan-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Sent to User</span>}
                     {editForm.publishedToRelease && <span className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Published</span>}
                  </div>
                </div>
                <textarea
                  value={editForm.translatedLyrics || ''}
                  onChange={e => setEditForm({ ...editForm, translatedLyrics: e.target.value })}
                  placeholder="Paste or type the completed lyrics here..."
                  className="dashboard-input w-full min-h-[300px] font-serif text-base leading-relaxed p-6"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[var(--dash-text-muted)] font-bold mb-2">Internal Translation Notes</label>
                <textarea
                  value={editForm.translationNotes || ''}
                  onChange={e => setEditForm({ ...editForm, translationNotes: e.target.value })}
                  rows={3}
                  className="dashboard-input w-full text-sm"
                  placeholder="Add notes about source, difficulty, or corrections..."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[var(--dash-border)] flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave()}
                    disabled={isSaving || !hasChanges}
                    className="flex-1 dashboard-btn-secondary py-3 flex items-center justify-center gap-2 shadow-sm disabled:opacity-30"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => handleSave('completed')}
                    disabled={isSaving || editForm.status === 'completed' || !editForm.translatedLyrics}
                    className="flex-1 dashboard-btn-secondary py-3 flex items-center justify-center gap-2 shadow-sm disabled:opacity-30"
                  >
                    Mark as Completed
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSendToUser}
                    disabled={isSending || !editForm.requesterEmail || !editForm.translatedLyrics}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-black py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-30"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send to User
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing || !editForm.translatedLyrics || editForm.publishedToRelease}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-black py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-30"
                  >
                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Publish to Release
                  </button>
                </div>

                {!editForm.requesterEmail && (
                  <p className="text-[10px] text-red-500/80 text-center font-bold uppercase tracking-widest">
                    No requester email available G manual outreach required
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
