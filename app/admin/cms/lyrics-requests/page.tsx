"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
  Globe, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Mail,
  User,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface LyricsRequest {
  id: string;
  releaseId: string;
  releaseSlug: string;
  releaseTitle: string;
  languageCode: string;
  languageName: string;
  requesterName?: string;
  requesterEmail: string;
  note?: string;
  notifyWhenPublished: boolean;
  status: 'pending' | 'reviewed' | 'fulfilled' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export default function AdminLyricsRequests() {
  const [requests, setRequests] = useState<LyricsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/lyrics-requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/admin/lyrics-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      const updated = await response.json();
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    try {
      const response = await fetch(`/api/admin/lyrics-requests/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete request');
      
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.releaseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.languageName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesLanguage = languageFilter === 'all' || req.languageCode === languageFilter;
    
    return matchesSearch && matchesStatus && matchesLanguage;
  });

  const languages = Array.from(new Set(requests.map(r => JSON.stringify({ code: r.languageCode, name: r.languageName }))))
    .map(s => JSON.parse(s))
    .sort((a, b) => a.name.localeCompare(b.name));

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
    total: requests.length
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Lyrics Translation Requests</h1>
            <p className="text-neutral-400">Manage on-demand translation requests from your audience.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 flex items-center gap-6">
              <div className="text-center">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">Pending</p>
                <p className="text-xl font-bold text-amber-500">{stats.pending}</p>
              </div>
              <div className="w-px h-8 bg-neutral-800"></div>
              <div className="text-center">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">Fulfilled</p>
                <p className="text-xl font-bold text-emerald-500">{stats.fulfilled}</p>
              </div>
              <div className="w-px h-8 bg-neutral-800"></div>
              <div className="text-center">
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">Total</p>
                <p className="text-xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by title, email, or language..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={languageFilter}
              onChange={e => setLanguageFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading requests...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">
              {error}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-20 text-center">
              <Globe className="w-16 h-16 text-neutral-800 mx-auto mb-4" strokeWidth={1} />
              <h3 className="text-lg font-bold text-white mb-1">No requests found</h3>
              <p className="text-neutral-500 text-sm">When users request lyrics, they will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {filteredRequests.map(req => (
                <div key={req.id} className="p-6 hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          req.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          req.status === 'reviewed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                          'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}>
                          {req.status}
                        </span>
                        <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white truncate mb-1">
                        {req.releaseTitle}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-amber-400 font-medium">
                          <Globe className="w-4 h-4" />
                          {req.languageName}
                        </div>
                        
                        <div className="flex items-center gap-2 text-neutral-300">
                          <Mail className="w-4 h-4 text-neutral-500" />
                          {req.requesterEmail}
                          {req.notifyWhenPublished && (
                            <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-700">Notify</span>
                          )}
                        </div>

                        {req.requesterName && (
                          <div className="flex items-center gap-2 text-neutral-300">
                            <User className="w-4 h-4 text-neutral-500" />
                            {req.requesterName}
                          </div>
                        )}
                      </div>

                      {req.note && (
                        <div className="mt-4 p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-start gap-3">
                          <MessageSquare className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-neutral-400 italic">"{req.note}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <select
                          value={req.status}
                          onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                          disabled={updatingId === req.id}
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="fulfilled">Fulfilled</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        
                        <Link 
                          href={`/admin/cms/releases/${req.releaseId}/edit`}
                          className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-amber-400 transition-colors"
                          title="Go to Release"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete Request"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
