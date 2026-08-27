'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Youtube, Link2, RefreshCw, Loader2, AlertCircle,
  Eye, Clock, ExternalLink, Search, Database, FileSpreadsheet, Upload,
} from 'lucide-react';
import type { VideoImpression } from '@/app/api/admin/youtube-analytics/impressions/route';

function fmt(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function fmtDuration(secs: number | null): string {
  if (secs === null || !Number.isFinite(secs)) return '—';
  const safe = Math.max(0, Math.round(secs));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

type MetricSource = 'youtube_analytics_api' | 'studio_csv' | 'unavailable';

function sourceLabel(source: MetricSource): string {
  if (source === 'youtube_analytics_api') return 'LIVE API';
  if (source === 'studio_csv') return 'STUDIO CSV';
  return 'UNAVAILABLE';
}

function sourceClass(source: MetricSource): string {
  if (source === 'youtube_analytics_api') return 'bg-green-500/10 border-green-500/20 text-green-300';
  if (source === 'studio_csv') return 'bg-sky-500/10 border-sky-500/20 text-sky-300';
  return 'bg-neutral-800 border-neutral-700 text-neutral-500';
}

function SourceBadge({ source }: { source: MetricSource }) {
  return (
    <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded border text-[8px] font-bold tracking-wider ${sourceClass(source)}`}>
      {sourceLabel(source)}
    </span>
  );
}

export default function YouTubeAnalyticsPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [data, setData] = useState<VideoImpression[]>([]);
  const [loading, setLoading] = useState(false);
  const [asOf, setAsOf] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [search, setSearch] = useState('');
  const [reconnectRequired, setReconnectRequired] = useState(false);
  const [dataSource, setDataSource] = useState('');
  const [studioImporting, setStudioImporting] = useState(false);
  const [studioSummary, setStudioSummary] = useState<{ rowCount: number; importedAt: string; fileName: string } | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/youtube-analytics/status', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setConnected(Boolean(json.connected));
        setReconnectRequired(Boolean(json.reconnectRequired));
      } else {
        setConnected(false);
        setReconnectRequired(false);
      }
    } catch {
      setConnected(false);
      setReconnectRequired(false);
    }
  }, []);

  const loadStudioStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/youtube-analytics/studio-import', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.imported && json.snapshot) {
        setStudioSummary({
          rowCount: json.snapshot.rowCount,
          importedAt: json.snapshot.importedAt,
          fileName: json.snapshot.fileName,
        });
      }
    } catch {
      // Studio import is an optional first-party fallback; live Analytics can continue independently.
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    setWarning('');
    setReconnectRequired(false);

    try {
      const res = await fetch('/api/admin/youtube-analytics/impressions', { cache: 'no-store' });
      const j = await res.json();

      if (!res.ok) {
        if (j.error === 'not_connected') {
          setConnected(false);
          return;
        }
        if (j.reconnectRequired) setReconnectRequired(true);
        throw new Error(j.message || j.error || `HTTP ${res.status}`);
      }

      setData(j.data ?? []);
      setAsOf(j.asOf ?? '');
      setDataSource(j.source ?? '');
      if (j.reconnectRequired) setReconnectRequired(true);
      if (Array.isArray(j.warnings) && j.warnings.length > 0) {
        setWarning(j.warnings.join(' '));
      }
    } catch (error: unknown) {
      setError(errorMessage(error, 'Failed to load YouTube Analytics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    loadStudioStatus();

    const p = new URLSearchParams(window.location.search);
    if (p.get('yt_auth') === 'success') {
      setConnected(true);
      setReconnectRequired(false);
      window.history.replaceState({}, '', '/admin/youtube-analytics');
    } else if (p.get('yt_auth') === 'denied') {
      setError('Authorization was denied.');
      window.history.replaceState({}, '', '/admin/youtube-analytics');
    } else if (p.get('yt_auth') === 'error') {
      setError(`OAuth error: ${p.get('reason') ?? 'unknown'}`);
      window.history.replaceState({}, '', '/admin/youtube-analytics');
    }
  }, [checkStatus, loadStudioStatus]);

  useEffect(() => {
    if (connected === true || studioSummary) loadAnalytics();
  }, [connected, studioSummary, loadAnalytics]);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/youtube-analytics/connect', { method: 'POST' });
      const j = await res.json();
      if (j.authUrl) window.location.href = j.authUrl;
      else setError(j.error || 'Failed to start authorization.');
    } catch (error: unknown) {
      setError(errorMessage(error, 'Failed to start authorization.'));
    } finally {
      setConnecting(false);
    }
  };

  const handleStudioImport = async (file: File) => {
    setStudioImporting(true);
    setError('');
    setWarning('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/youtube-analytics/studio-import', {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Studio CSV import failed.');
      setStudioSummary({ rowCount: json.rowCount, importedAt: json.importedAt, fileName: json.fileName });
      setWarning(`YouTube Studio snapshot imported: ${json.rowCount} unique video rows. Studio-only metrics now use this verified first-party source.`);
      await loadAnalytics();
    } catch (error: unknown) {
      setError(errorMessage(error, 'Studio CSV import failed.'));
    } finally {
      setStudioImporting(false);
    }
  };

  const filtered = data.filter(v =>
    !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.videoId.includes(search)
  );

  const totalViews = data.reduce((sum, row) => sum + (row.views ?? 0), 0);
  const totalWatchMinutes = data.reduce((sum, row) => sum + (row.watchTimeMinutes ?? 0), 0);
  const weightedRows = data.filter(row => row.views !== null && row.avgViewDurationSecs !== null);
  const weightedViews = weightedRows.reduce((sum, row) => sum + (row.views ?? 0), 0);
  const weightedAvgDuration = weightedViews > 0
    ? Math.round(weightedRows.reduce((sum, row) => sum + ((row.avgViewDurationSecs ?? 0) * (row.views ?? 0)), 0) / weightedViews)
    : null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-light text-neutral-100 flex items-center gap-3">
              <Youtube className="w-7 h-7 text-red-500" />
              YouTube Analytics
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Verified per-video performance from YouTube Analytics and imported YouTube Studio snapshots
              {asOf && <span className="ml-2 text-neutral-600">· through {asOf}</span>}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(connected === true || studioSummary) && (
              <button
                onClick={loadAnalytics}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            )}

            {(connected === false || reconnectRequired) && (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {reconnectRequired ? 'Reconnect YouTube' : 'Connect YouTube Analytics'}
              </button>
            )}

            {connected === true && !reconnectRequired && (
              <span className="flex items-center gap-1.5 px-3 py-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Read-only OAuth
              </span>
            )}
          </div>
        </div>

        {connected === false && !studioSummary && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300 space-y-1">
            <p className="font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Connect OAuth or import a first-party Studio snapshot
            </p>
            <p className="text-amber-400/70">
              OAuth provides live read-only YouTube Analytics. A Studio Advanced Mode CSV can operate as the verified fallback without sharing passwords, passkeys, recovery codes, or 2FA codes.
            </p>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-neutral-200">
            <Database className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium">Metric provenance</span>
          </div>
          <p className="text-xs text-neutral-500">
            Every displayed field is labeled by source. YouTube Analytics API provides live views/watch time/average view duration. Thumbnail impressions and Impressions CTR are populated only from a verified Studio Advanced Mode CSV; they are never estimated.
          </p>
          <div className="flex flex-wrap gap-2">
            <SourceBadge source="youtube_analytics_api" />
            <SourceBadge source="studio_csv" />
            <SourceBadge source="unavailable" />
          </div>
        </div>

        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sky-200">
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-sm font-medium">YouTube Studio Advanced Mode CSV</span>
          </div>
          <p className="text-xs text-sky-300/60">
            Import a first-party Studio export to supply impressions/CTR and preserve a quota-independent catalog snapshot. CSV data is stored persistently and remains explicitly labeled STUDIO CSV.
          </p>
          <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${studioImporting ? 'opacity-50 pointer-events-none' : 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20 text-sky-200'}`}>
            {studioImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {studioImporting ? 'Importing…' : studioSummary ? 'Replace Studio CSV' : 'Import Studio CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={studioImporting}
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) void handleStudioImport(file);
                event.currentTarget.value = '';
              }}
            />
          </label>
          {studioSummary && (
            <p className="text-[11px] text-sky-300/70">
              Latest snapshot: {studioSummary.fileName} · {studioSummary.rowCount} unique videos · imported {new Date(studioSummary.importedAt).toLocaleString()}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {warning && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200">
            {warning}
          </div>
        )}

        {(connected === true || studioSummary) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <Eye className="w-5 h-5 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-neutral-100 tabular-nums">{fmt(totalViews)}</div>
                <div className="text-xs text-neutral-500 mt-1">Total views in selected API window</div>
                <SourceBadge source={dataSource === 'studio_csv' ? 'studio_csv' : data.length > 0 ? 'youtube_analytics_api' : 'unavailable'} />
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <Clock className="w-5 h-5 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-neutral-100 tabular-nums">{totalWatchMinutes > 0 ? `${(totalWatchMinutes / 60).toFixed(1)}h` : '—'}</div>
                <div className="text-xs text-neutral-500 mt-1">Watch time</div>
                <SourceBadge source={dataSource === 'studio_csv' ? 'studio_csv' : data.some(row => row.watchTimeMinutes !== null) ? 'youtube_analytics_api' : 'unavailable'} />
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <Clock className="w-5 h-5 text-amber-400 mb-2" />
                <div className="text-2xl font-bold text-neutral-100 tabular-nums">{fmtDuration(weightedAvgDuration)}</div>
                <div className="text-xs text-neutral-500 mt-1">Weighted average view duration</div>
                <SourceBadge source={dataSource === 'studio_csv' ? 'studio_csv' : weightedAvgDuration !== null ? 'youtube_analytics_api' : 'unavailable'} />
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <h2 className="text-sm font-medium text-neutral-200">Per-video performance</h2>
                  <p className="text-[11px] text-neutral-600 mt-0.5">Impressions and CTR remain unavailable unless supplied by Studio CSV.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search title or video ID"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-neutral-700"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-neutral-950/70 text-neutral-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Video</th>
                      <th className="text-right px-3 py-3 font-medium">Views</th>
                      <th className="text-right px-3 py-3 font-medium">Watch time</th>
                      <th className="text-right px-3 py-3 font-medium">Avg duration</th>
                      <th className="text-right px-3 py-3 font-medium">Impressions</th>
                      <th className="text-right px-3 py-3 font-medium">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filtered.map(row => (
                      <tr key={row.videoId} className="hover:bg-neutral-800/30">
                        <td className="px-4 py-3 max-w-md">
                          <div className="flex items-start gap-2">
                            <a
                              href={`https://www.youtube.com/watch?v=${row.videoId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-neutral-200 hover:text-white line-clamp-2"
                            >
                              {row.title}
                            </a>
                            <ExternalLink className="w-3 h-3 text-neutral-700 shrink-0 mt-1" />
                          </div>
                          <span className="text-[10px] text-neutral-700 font-mono">{row.videoId}</span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-neutral-300">
                          {fmt(row.views)}<br/><SourceBadge source={row.metricSources.views} />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-neutral-300">
                          {row.watchTimeMinutes === null ? '—' : `${(row.watchTimeMinutes / 60).toFixed(1)}h`}<br/><SourceBadge source={row.metricSources.watchTimeMinutes} />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-neutral-300">
                          {fmtDuration(row.avgViewDurationSecs)}<br/><SourceBadge source={row.metricSources.avgViewDurationSecs} />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-neutral-300">
                          {fmt(row.impressions)}<br/><SourceBadge source={row.metricSources.impressions} />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-neutral-300">
                          {row.ctr === null ? '—' : `${row.ctr.toFixed(2)}%`}<br/><SourceBadge source={row.metricSources.ctr} />
                        </td>
                      </tr>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-neutral-600">No verified analytics rows are available for this view.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
