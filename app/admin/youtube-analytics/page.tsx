'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Youtube, Link2, RefreshCw, Loader2, AlertCircle,
  Eye, Clock, ExternalLink, Search, Database, FileSpreadsheet, Upload,
  Layers, Target, Users, Timer, Activity, TrendingUp, Globe, Video,
  ArrowRight, Sparkles,
} from 'lucide-react';
import type {
  VideoImpression,
  ChannelAnalyticsSummary,
  TrafficSourceMetric,
  GeographyMetric,
  MetricSource,
} from '@/app/api/admin/youtube-analytics/impressions/route';
import type { YouTubeStudioLifetimeFunnel } from '@/lib/youtube-studio-import';

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function fmtFull(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return n.toLocaleString();
}

function fmtDuration(secs: number | null | undefined): string {
  if (secs === null || secs === undefined || !Number.isFinite(secs)) return '—';
  const safe = Math.max(0, Math.round(secs));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function sourceLabel(source: MetricSource | 'studio_lifetime' | undefined): string {
  if (source === 'youtube_analytics_api' || source === 'youtube_data_api') return 'LIVE API';
  if (source === 'studio_csv') return 'STUDIO CSV';
  if (source === 'studio_lifetime') return 'STUDIO LIFETIME';
  return 'UNAVAILABLE';
}

function sourceClass(source: MetricSource | 'studio_lifetime' | undefined): string {
  if (source === 'youtube_analytics_api' || source === 'youtube_data_api') {
    return 'bg-green-500/10 border-green-500/20 text-green-300';
  }
  if (source === 'studio_csv') return 'bg-sky-500/10 border-sky-500/20 text-sky-300';
  if (source === 'studio_lifetime') return 'bg-purple-500/10 border-purple-500/20 text-purple-300';
  return 'bg-neutral-800 border-neutral-700 text-neutral-500';
}

function SourceBadge({ source }: { source: MetricSource | 'studio_lifetime' | undefined }) {
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
  const [summary, setSummary] = useState<ChannelAnalyticsSummary | null>(null);
  const [lifetimeFunnel, setLifetimeFunnel] = useState<YouTubeStudioLifetimeFunnel | null>(null);
  const [trafficSources, setTrafficSources] = useState<TrafficSourceMetric[]>([]);
  const [geographies, setGeographies] = useState<GeographyMetric[]>([]);
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
      setSummary(j.summary ?? null);
      setLifetimeFunnel(j.lifetimeFunnel ?? null);
      setTrafficSources(j.trafficSources ?? []);
      setGeographies(j.geographies ?? []);
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

  // Local calculation fallbacks if summary not provided directly
  const totalViews = summary?.views ?? data.reduce((sum, row) => sum + (row.views ?? 0), 0);
  const totalWatchHours = summary?.watchTimeHours ?? (
    data.some(r => r.watchTimeMinutes !== null)
      ? Number((data.reduce((sum, row) => sum + (row.watchTimeMinutes ?? 0), 0) / 60).toFixed(1))
      : null
  );

  const weightedRows = data.filter(row => row.views !== null && row.avgViewDurationSecs !== null);
  const weightedViews = weightedRows.reduce((sum, row) => sum + (row.views ?? 0), 0);
  const weightedAvgDuration = summary?.averageViewDurationSeconds ?? (
    weightedViews > 0
      ? Math.round(weightedRows.reduce((sum, row) => sum + ((row.avgViewDurationSecs ?? 0) * (row.views ?? 0)), 0) / weightedViews)
      : null
  );

  const totalVideosDisplay = summary?.totalVideos ?? (data.length > 0 ? data.length : (studioSummary?.rowCount ?? null));

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
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
            {/* ── ROW 1: 4 Primary KPI Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Total Views */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <SourceBadge source={summary?.metricSources?.views ?? (dataSource === 'studio_csv' ? 'studio_csv' : data.length > 0 ? 'youtube_analytics_api' : 'unavailable')} />
                  </div>
                  <div className="text-2xl font-bold text-neutral-100 tabular-nums">{fmt(totalViews)}</div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">Total views in selected API window</div>
              </div>

              {/* 2. Total Impressions (Studio CSV & Lifetime) */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Layers className="w-5 h-5 text-sky-400" />
                    <SourceBadge source={summary?.metricSources?.impressions ?? (summary?.impressions ? 'studio_csv' : 'unavailable')} />
                  </div>
                  <div className="text-2xl font-bold text-neutral-100 tabular-nums">{fmt(summary?.impressions)}</div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">Thumbnail impressions in selected API window</div>
              </div>

              {/* 3. Average CTR */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <SourceBadge source={summary?.metricSources?.impressionsCtr ?? (summary?.impressionsCtr !== null ? 'studio_csv' : 'unavailable')} />
                  </div>
                  <div className="text-2xl font-bold text-neutral-100 tabular-nums">
                    {summary?.impressionsCtr !== null && summary?.impressionsCtr !== undefined ? `${summary.impressionsCtr.toFixed(2)}%` : '—'}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">Impression click-through rate</div>
              </div>

              {/* 4. Total Subscribers */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <SourceBadge source={summary?.metricSources?.subscribers ?? (summary?.subscribers !== null ? 'youtube_data_api' : 'unavailable')} />
                  </div>
                  <div className="text-2xl font-bold text-neutral-100 tabular-nums">{fmt(summary?.subscribers)}</div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">Current channel subscribers</div>
              </div>
            </div>

            {/* ── ROW 2: 4 Primary KPI Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 5. Watch Time */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <SourceBadge source={summary?.metricSources?.watchTimeHours ?? (dataSource === 'studio_csv' ? 'studio_csv' : totalWatchHours !== null ? 'youtube_analytics_api' : 'unavailable')} />
                  </div>
                  <div className="text-2xl font-bold text-neutral-100 tabular-nums">
                    {totalWatchHours !== null ? `${fmt(totalWatchHours)}h` : '—'}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">Watch time</div>
              </div>

              {/* 6. Average View Duration */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Timer className="w-5 h-5 text-amber-400" />
                    <SourceBadge source={summary?.metricSources?.averageViewDurationSeconds ?? (dataSource === 'studio_csv' ? 'studio_csv' : weightedAvgDuration !== null ? 'youtube_analytics_api' : 'unavailable')} />
                  </div>
                  <div className="text-2xl font-bold text-neutral-100 tabular-nums">{fmtDuration(weightedAvgDuration)}</div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">Weighted average view duration</div>
              </div>

              {/* 7. Average Retention */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-5 h-5 text-teal-400" />
                    <SourceBadge source={summary?.metricSources?.averageViewPercentage ?? (summary?.averageViewPercentage !== null ? 'youtube_analytics_api' : 'unavailable')} />
                  </div>
                  <div className="text-2xl font-bold text-neutral-100 tabular-nums">
                    {summary?.averageViewPercentage !== null && summary?.averageViewPercentage !== undefined
                      ? `${summary.averageViewPercentage.toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">Average percentage viewed</div>
              </div>

              {/* 8. Total Videos */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Video className="w-5 h-5 text-rose-400" />
                    <SourceBadge source={summary?.metricSources?.totalVideos ?? (totalVideosDisplay !== null ? (dataSource === 'studio_csv' ? 'studio_csv' : 'youtube_data_api') : 'unavailable')} />
                  </div>
                  <div className="text-2xl font-bold text-neutral-100 tabular-nums">{fmt(totalVideosDisplay)}</div>
                </div>
                <div className="text-xs text-neutral-500 mt-2">Total channel videos</div>
              </div>
            </div>

            {/* ── YOUTUBE STUDIO LIFETIME IMPRESSIONS & WATCH TIME FUNNEL ────────── */}
            {lifetimeFunnel && (
              <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-purple-950/30 border border-purple-500/20 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h2 className="text-sm font-semibold tracking-wide uppercase text-neutral-200">
                      Lifetime Impressions & How They Led to Watch Time
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500">{lifetimeFunnel.period}</span>
                    <SourceBadge source="studio_lifetime" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                  {/* Step 1: Impressions */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5 space-y-1">
                    <div className="text-[11px] font-medium text-neutral-400">Thumbnail impressions</div>
                    <div className="text-xl font-bold text-purple-300 tabular-nums">{fmt(lifetimeFunnel.impressions)}</div>
                    <div className="text-[10px] text-purple-400/80">{lifetimeFunnel.recommendationPercentage}% from recommendations</div>
                  </div>

                  {/* Step 2: CTR */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5 space-y-1">
                    <div className="text-[11px] font-medium text-neutral-400">Click-through rate</div>
                    <div className="text-xl font-bold text-emerald-300 tabular-nums">{lifetimeFunnel.ctr}%</div>
                    <div className="text-[10px] text-neutral-500">Thumbnail conversion</div>
                  </div>

                  {/* Step 3: Views from impressions */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5 space-y-1">
                    <div className="text-[11px] font-medium text-neutral-400">Engaged views</div>
                    <div className="text-xl font-bold text-blue-300 tabular-nums">{fmt(lifetimeFunnel.engagedViews)}</div>
                    <div className="text-[10px] text-neutral-500">From impressions</div>
                  </div>

                  {/* Step 4: Average Duration */}
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5 space-y-1">
                    <div className="text-[11px] font-medium text-neutral-400">Avg view duration</div>
                    <div className="text-xl font-bold text-amber-300 tabular-nums">{lifetimeFunnel.avgViewDurationFormatted}</div>
                    <div className="text-[10px] text-neutral-500">Per view retention</div>
                  </div>

                  {/* Step 5: Watch time */}
                  <div className="col-span-2 md:col-span-1 bg-neutral-950/60 border border-neutral-800 rounded-lg p-3.5 space-y-1">
                    <div className="text-[11px] font-medium text-neutral-400">Watch time</div>
                    <div className="text-xl font-bold text-teal-300 tabular-nums">{fmt(lifetimeFunnel.watchTimeHours)}h</div>
                    <div className="text-[10px] text-teal-400/80">From impressions</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ROW 3: Top Traffic Sources & Top Geographies ──────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Traffic Sources (7 cols on desktop ~58%) */}
              <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-200">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-medium tracking-wide uppercase text-neutral-300">Top Traffic Sources</h2>
                  </div>
                  <SourceBadge source={trafficSources.length > 0 ? 'youtube_analytics_api' : 'unavailable'} />
                </div>

                {trafficSources.length > 0 ? (
                  <div className="space-y-3">
                    {trafficSources.map(ts => (
                      <div key={ts.sourceRaw} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-neutral-600 font-mono font-bold text-[10px]">{ts.rank}</span>
                            <span className="font-medium text-neutral-200">{ts.source}</span>
                          </div>
                          <div className="flex items-center gap-4 tabular-nums">
                            <span className="text-neutral-400">{fmtFull(ts.views)} views</span>
                            <span className="text-neutral-500 font-mono text-[11px] w-12 text-right">{ts.viewShare}%</span>
                            <span className="text-neutral-400 font-medium w-16 text-right">{fmt(ts.watchTimeHours)}h</span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400/50 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(2, ts.viewShare))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-600">
                    Traffic source breakdown is available with an active YouTube Analytics connection.
                  </div>
                )}
              </div>

              {/* Top Geographies (5 cols on desktop ~42%) */}
              <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-200">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <h2 className="text-sm font-medium tracking-wide uppercase text-neutral-300">Top Geographies</h2>
                  </div>
                  <SourceBadge source={geographies.length > 0 ? 'youtube_analytics_api' : 'unavailable'} />
                </div>

                {geographies.length > 0 ? (
                  <div className="space-y-3">
                    {geographies.map(geo => (
                      <div key={geo.countryCode} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-neutral-600 font-mono font-bold text-[10px]">{geo.rank}</span>
                            <span className="font-medium text-neutral-200 truncate max-w-[120px] sm:max-w-[160px]">{geo.countryName}</span>
                          </div>
                          <div className="flex items-center gap-3 tabular-nums text-right">
                            <span className="text-neutral-400">{fmt(geo.views)}</span>
                            <span className="text-neutral-500 font-mono text-[11px] w-10">{geo.viewShare}%</span>
                            <span className="text-neutral-400 w-12">{fmt(geo.watchTimeHours)}h</span>
                            <span className="text-neutral-500 font-mono text-[11px] w-10">{fmtDuration(geo.averageViewDurationSeconds)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-sky-400/50 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(2, geo.viewShare))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-600">
                    Geographic distribution is available with an active YouTube Analytics connection.
                  </div>
                )}
              </div>
            </div>

            {/* ── Metric Provenance & Legend ─────────────────────────────────── */}
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
                <SourceBadge source="studio_lifetime" />
                <SourceBadge source="unavailable" />
              </div>
            </div>

            {/* ── Studio Advanced Mode CSV Card ──────────────────────────────── */}
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

            {/* ── Per-Video Performance Table ────────────────────────────────── */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-neutral-200">Per-video performance</h2>
                    {totalVideosDisplay !== null && (
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-400 rounded">
                        {totalVideosDisplay} videos
                      </span>
                    )}
                  </div>
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
                          {row.watchTimeMinutes === null ? '—' : `${(row.watchTimeMinutes / 60).toFixed(1)}h`}<br/><SourceBadge source={row.metricSources.watchTime} />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-neutral-300">
                          {fmtDuration(row.avgViewDurationSecs)}<br/><SourceBadge source={row.metricSources.averageViewDuration} />
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