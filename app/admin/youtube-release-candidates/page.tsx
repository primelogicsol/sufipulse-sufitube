"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, RefreshCw, Search, Youtube } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';

type Candidate = {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  publishedDate?: string;
  durationFormatted?: string;
  views?: number;
  detectedAt: string;
  lastSeenAt: string;
};

export default function YouTubeReleaseCandidatesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/releases/youtube-candidates', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load candidates');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const scanNow = async () => {
    try {
      setScanning(true);
      setMessage('');
      const res = await fetch('/api/releases/youtube-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'YouTube scan failed');
      setItems(Array.isArray(data.items) ? data.items : []);
      setMessage(`YouTube scan complete: ${data.scanned || 0} videos checked, ${data.pending || 0} awaiting approval.`);
    } catch (error: any) {
      setMessage(error?.message || 'YouTube scan failed');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (!user?.role?.includes('admin')) return;
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  const approve = async (youtubeId: string) => {
    try {
      setApproving(youtubeId);
      setMessage('');
      const res = await fetch('/api/releases/youtube-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Approval failed');
      setMessage('Approved as a SufiPulse release. You can now polish the release in CMS or inline on the public release page.');
      await load();
    } catch (error: any) {
      setMessage(error?.message || 'Approval failed');
    } finally {
      setApproving(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2"><Youtube className="w-4 h-4" /> YouTube Release Detection</div>
            <h1 className="text-2xl font-bold text-white">Pending Release Approvals</h1>
            <p className="text-neutral-400 mt-2 max-w-3xl">New YouTube uploads are detected automatically. Nothing becomes a canonical SufiPulse release until you approve it here. Approval imports the current YouTube title, description, thumbnail and available video metadata. Everything else can be polished afterward in CMS Releases or inline on the public release page.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={scanNow} disabled={scanning || loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-50">
              <Search className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} /> {scanning ? 'Scanning YouTube…' : 'Scan YouTube Now'}
            </button>
            <button onClick={load} disabled={loading || scanning} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {message && <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">{message}</div>}

        {loading && items.length === 0 ? (
          <div className="text-neutral-400 py-12">Checking detected uploads…</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-white font-semibold">No uploads are waiting for approval</h2>
            <p className="text-neutral-500 text-sm mt-2">Use Scan YouTube Now for an immediate full-channel comparison, or wait for the automatic six-hour scan.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div key={item.youtubeId} className="rounded-xl border border-white/10 bg-[#111] p-4 flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-56 aspect-video rounded-lg overflow-hidden bg-black flex-none">{item.thumbnailUrl ? <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" unoptimized /> : null}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-white font-semibold text-lg">{item.title}</h2>
                  <div className="text-xs text-neutral-500 mt-1">YouTube ID: {item.youtubeId}{item.publishedDate ? ` · Published ${new Date(item.publishedDate).toLocaleString()}` : ''}{item.durationFormatted ? ` · ${item.durationFormatted}` : ''}</div>
                  <p className="text-neutral-400 text-sm mt-3 line-clamp-4 whitespace-pre-line">{item.description || 'No YouTube description.'}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button onClick={() => approve(item.youtubeId)} disabled={approving === item.youtubeId} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50">{approving === item.youtubeId ? 'Approving…' : 'Approve as Release'}</button>
                    <a href={`https://www.youtube.com/watch?v=${item.youtubeId}`} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 text-sm">View on YouTube</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 text-sm text-neutral-500">After approval: <Link href="/admin/cms-releases" className="text-neutral-300 hover:text-white underline">open CMS Releases</Link> to refine credits, lyrics, commentary, translations, taxonomy and other governed fields.</div>
      </div>
    </DashboardLayout>
  );
}
