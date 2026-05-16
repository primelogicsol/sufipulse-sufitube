"use client";

import React, { useState, useEffect } from 'react';
import { Layout } from '@/app/components/layout/Layout';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Languages, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  Loader2, 
  ExternalLink,
  MessageSquare,
  FileText,
  AlertCircle,
  Inbox,
  Globe
} from 'lucide-react';
import Link from 'next/link';

interface UserLyricsRequest {
  id: string;
  releaseTitle: string;
  languageName: string;
  status: string;
  translatedLyrics?: string;
  sourceUrl?: string;
  createdAt: string;
}

export default function MyLyricsRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<UserLyricsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === null) router.push('/login');
  }, [user, router]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/lyrics-requests');
      if (!response.ok) throw new Error('Failed to load your requests');
      const data = await response.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyRequests();
  }, [user]);

  if (!user) return null;

  return (
    <Layout>
      <PageContainer>
        <div className="min-h-[70vh] py-16 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Languages className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">My Lyrics Requests</h1>
                <p className="text-neutral-400 text-sm">Track your translation requests and view fulfilled lyrics.</p>
              </div>
            </div>
            <Link href="/user/profile" className="text-xs text-amber-400 hover:underline">Back to Profile</Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 bg-white/[0.02] border border-white/5 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-amber-500/40" />
              <p>Loading your requests...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-500/5 border border-red-500/10 rounded-2xl">
               <AlertCircle className="w-10 h-10 text-red-500/40 mx-auto mb-3" />
               <p className="text-red-400 font-medium mb-4">{error}</p>
               <button onClick={fetchMyRequests} className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors">Retry</button>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-20 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
              <Inbox className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Requests Found</h3>
              <p className="text-neutral-500 text-sm max-w-xs mx-auto mb-6">You haven't requested any lyrics translations yet. Missing lyrics? Request them from any song page!</p>
              <Link href="/releases" className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors">Browse Releases</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="group bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.04] rounded-2xl overflow-hidden transition-all">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                             req.status === 'published' || req.status === 'sent_to_user' || req.status === 'completed' 
                               ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                               : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                           }`}>
                             {req.status.replace(/_/g, ' ')}
                           </span>
                           <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                             <Clock className="w-3 h-3" />
                             {new Date(req.createdAt).toLocaleDateString()}
                           </span>
                        </div>
                        <h3 className="text-lg font-bold text-white truncate mb-1">{req.releaseTitle}</h3>
                        <p className="text-amber-400/80 text-sm font-medium flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          {req.languageName} Translation
                        </p>
                      </div>
                      
                      {req.sourceUrl && (
                        <a href={req.sourceUrl} target="_blank" className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors" title="View Release">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {req.translatedLyrics ? (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="p-5 bg-black/40 border border-emerald-500/20 rounded-xl relative">
                           <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-black uppercase rounded shadow-lg">Ready</div>
                           <h4 className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-3 flex items-center gap-2">
                             <FileText className="w-3 h-3" /> Fulfilling your request
                           </h4>
                           <p className="text-sm font-serif leading-relaxed text-neutral-200 whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar italic pr-2">
                             {req.translatedLyrics}
                           </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-3 p-4 bg-neutral-900/50 rounded-xl border border-white/5">
                        <MessageSquare className="w-4 h-4 text-neutral-600" />
                        <p className="text-xs text-neutral-500">Our team is working on your translation. We'll notify you when it's ready.</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </Layout>
  );
}
