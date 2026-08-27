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
        setConnected(json.connected);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
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

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 flex flex-col md:flex-row md:items-center gap-4">
          <FileSpreadsheet className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">YouTube Studio Advanced Mode CSV</p>
            <p className="text-blue-300/70 mt-1">
              Import the Content/Video breakdown. It supplies first-party catalog IDs and can supply thumbnail impressions and Impressions CTR that are not available from the channel Analytics API report.
            </p>
            {studioSummary && (
              <p className="text-[11px] text-blue-300/60 mt-2 font-mono">
                Loaded {studioSummary.rowCount} videos · {studioSummary.fileName} · {new Date(studioSummary.importedAt).toLocaleString()}
              </p>
            )}
          </div>
          <label className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-200 text-xs font-semibold cursor-pointer transition-colors">
            {studioImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {studioSummary ? 'Replace CSV Snapshot' : 'Import Studio CSV'}
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
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-neutral-400 font-medium">Metric provenance:</span>
            <SourceBadge source="youtube_analytics_api" />
            <SourceBadge source="studio_csv" />
            <SourceBadge source="unavailable" />
          </div>
          <p className="text-[11px] text-neutral-600 mt-2">
            Each value below carries its own source. Missing metrics remain unavailable; imported Studio values never masquerade as live API telemetry.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p>{error}</p>
              {reconnectRequired && (
                <p className="text-red-300/70 mt-1">Reconnect once to grant the current read-only scopes required by Google. The latest Studio CSV remains usable while OAuth is unavailable.</p>
              )}
            </div>
          </div>
        )}

        {warning && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {warning}
          </div>
        )}

        {data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Eye className="w-4 h-4" />, label: 'Total Views', value: fmt(totalViews) },
              { icon: <Clock className="w-4 h-4" />, label: 'Watch Time', value: totalWatchMinutes > 0 ? `${fmt(totalWatchMinutes / 60)} hr` : '—' },
              { icon: <Database className="w-4 h-4" />, label: 'Weighted Avg Duration', value: fmtDuration(weightedAvgDuration) },
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

        {loading && data.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-neutral-900/40 rounded-xl animate-pulse border border-neutral-800" />
            ))}
          </div>
        )}

        {(connected === true || studioSummary) && !loading && !error && data.length === 0 && (
          <div className="border border-neutral-800 rounded-xl p-8 text-center text-neutral-500">
            No per-video rows were returned from the available verified sources.
          </div>
        )}

        {data.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search videos..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/60">
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">Video</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">Views</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">Avg Duration</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">Watch Min</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">Impressions</th>
                    <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-neutral-500 font-medium">CTR</th>
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
                      <td className="px-4 py-3 text-right font-bold text-amber-400 tabular-nums align-top">
                        <div>{fmt(v.views)}</div>
                        <SourceBadge source={v.metricSources.views} />
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-400 tabular-nums align-top">
                        <div>{fmtDuration(v.avgViewDurationSecs)}</div>
                        <SourceBadge source={v.metricSources.averageViewDuration} />
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-400 tabular-nums align-top">
                        <div>{fmt(v.watchTimeMinutes)}</div>
                        <SourceBadge source={v.metricSources.watchTime} />
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-400 tabular-nums align-top">
                        <div>{fmt(v.impressions)}</div>
                        <SourceBadge source={v.metricSources.impressions} />
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-400 tabular-nums align-top">
                        <div>{v.ctr === null ? '—' : `${v.ctr.toFixed(2)}%`}</div>
                        <SourceBadge source={v.metricSources.ctr} />
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://www.youtube.com/watch?v=${v.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-600 hover:text-amber-400 transition-colors"
                          aria-label={`Open ${v.title} on YouTube`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-700 text-right">
              {filtered.length} of {data.length} videos · aggregate source: {dataSource || 'verified YouTube source'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
