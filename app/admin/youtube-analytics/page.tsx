'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Youtube, Link2, Unlink, RefreshCw, Loader2, AlertCircle,
  Eye, TrendingUp, Clock, MousePointerClick, ExternalLink, Search,
} from 'lucide-react';
import type { VideoImpression } from '@/app/api/admin/youtube-analytics/impressions/route';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function YouTubeAnalyticsPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [data, setData] = useState<VideoImpression[]>([]);
  const [loading, setLoading] = useState(false);
  const [asOf, setAsOf] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const checkStatus = useCallback(async () => {
    const res = await fetch('/api/admin/youtube-analytics/status');
    if (res.ok) {
      const json = await res.json();
      setConnected(json.connected);
    }
  }, []);

  const loadImpressions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/youtube-analytics/impressions');
      if (!res.ok) {
        const j = await res.json();
        if (j.error === 'not_connected') { setConnected(false); return; }
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      setData(j.data ?? []);
      setAsOf(j.asOf ?? '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // read yt_auth param from URL
    const p = new URLSearchParams(window.location.search);
    if (p.get('yt_auth') === 'success') {
      setConnected(true);
      window.history.replaceState({}, '', '/admin/youtube-analytics');
    } else if (p.get('yt_auth') === 'denied') {
      setError('Authorization was denied.');
      window.history.replaceState({}, '', '/admin/youtube-analytics');
    } else if (p.get('yt_auth') === 'error') {
      setError(`OAuth error: ${p.get('reason') ?? 'unknown'}`);
      window.history.replaceState({}, '', '/admin/youtube-analytics');
    }
  }, [checkStatus]);

  useEffect(() => {
    if (connected === true) loadImpressions();
  }, [connected, loadImpressions]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/admin/youtube-analytics/connect', { method: 'POST' });
      const j = await res.json();
      if (j.authUrl) window.location.href = j.authUrl;
      else setError(j.error || 'Failed to start auth');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const filtered = data.filter(v =>
    !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.videoId.includes(search)
  );

  const totalImpressions = data.reduce((s, v) => s + v.impressions, 0);
  const totalViews = data.reduce((s, v) => s + v.views, 0);
  const avgCtr = data.length
    ? Math.round(data.reduce((s, v) => s + v.ctr, 0) / data.length * 10) / 10
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif font-light text-neutral-100 flex items-center gap-3">
              <Youtube className="w-7 h-7 text-red-500" />
              YouTube Impressions
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Per-song impressions, CTR, and watch time from YouTube Analytics
              {asOf && <span className="ml-2 text-neutral-600">· as of {asOf}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            {connected === true && (
              <button
                onClick={loadImpressions}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            )}
            {connected === false && (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Connect YouTube Analytics
              </button>
            )}
            {connected === true && (
              <span className="flex items-center gap-1.5 px-3 py-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Connected
              </span>
            )}
          </div>
        </div>

        {/* OAuth note */}
        {connected === false && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300 space-y-1">
            <p className="font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              One-time setup required
            </p>
            <p className="text-amber-400/70">
              Add <code className="bg-neutral-900 px-1 rounded text-xs">
                {typeof window !== 'undefined' ? window.location.origin : 'https://sufipulse.com'}
                /api/admin/youtube-analytics/callback
              </code> as an authorized redirect URI in your Google Cloud Console OAuth 2.0 client, then click Connect.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Summary cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <Eye className="w-4 h-4" />, label: 'Total Impressions', value: fmt(totalImpressions) },
              { icon: <TrendingUp className="w-4 h-4" />, label: 'Total Views', value: fmt(totalViews) },
              { icon: <MousePointerClick className="w-4 h-4" />, label: 'Avg CTR', value: `${avgCtr}%` },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-xs uppercase tracking-wide mb-2">
                  <span className="text-amber-400/70">{icon}</span>
                  {label}
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && data.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-neutral-900/40 rounded-xl animate-pulse border border-neutral-800" />
            ))}
          </div>
        )}

        {/* Table */}
        {data.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search songs..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/60">
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">Song</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                      <span className="flex items-center justify-end gap-1"><Eye className="w-3 h-3" />Impressions</span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">Views</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">CTR</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                      <span className="flex items-center justify-end gap-1"><Clock className="w-3 h-3" />Avg Duration</span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">Watch Min</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {filtered.map((v, i) => (
                    <tr key={v.videoId} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="px-4 py-3 text-neutral-600 tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-neutral-200 truncate" title={v.title}>{v.title}</p>
                        <p className="text-xs text-neutral-600 font-mono mt-0.5">{v.videoId}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-400 tabular-nums">
                        {fmt(v.impressions)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-300 tabular-nums">
                        {fmt(v.views)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={`${v.ctr >= 5 ? 'text-green-400' : v.ctr >= 2 ? 'text-amber-400' : 'text-neutral-500'}`}>
                          {v.ctr}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-400 tabular-nums">
                        {fmtDuration(v.avgViewDurationSecs)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-400 tabular-nums">
                        {fmt(v.watchTimeMinutes)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://www.youtube.com/watch?v=${v.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-600 hover:text-amber-400 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-700 text-right">{filtered.length} of {data.length} songs</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
