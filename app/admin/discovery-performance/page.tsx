"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FileSearch,
  Globe,
  Layers,
  Network,
  PlayCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Youtube,
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useAuth } from '@/app/contexts/AuthContext';

type ModuleFilter =
  | 'all'
  | '01_overview'
  | '02_google'
  | '03_bing'
  | '04_youtube'
  | '05_keywords'
  | '06_geography'
  | '07_releases'
  | '08_indexing'
  | '09_ai_search'
  | '10_graph'
  | '11_funnel'
  | '12_optimization'
  | '13_health';

const MODULE_NAV: Array<{ id: ModuleFilter; num: string; label: string }> = [
  { id: 'all', num: 'ALL', label: 'All 13 Modules' },
  { id: '01_overview', num: '01', label: 'Executive Overview' },
  { id: '02_google', num: '02', label: 'Google Search' },
  { id: '03_bing', num: '03', label: 'Bing & IndexNow' },
  { id: '04_youtube', num: '04', label: 'YouTube Search' },
  { id: '05_keywords', num: '05', label: 'Keyword Demand (4-Script)' },
  { id: '06_geography', num: '06', label: 'Global Geography' },
  { id: '07_releases', num: '07', label: 'Release SEO' },
  { id: '08_indexing', num: '08', label: 'Indexing & Crawl' },
  { id: '09_ai_search', num: '09', label: 'AI Search Discovery' },
  { id: '10_graph', num: '10', label: 'Discovery Graph' },
  { id: '11_funnel', num: '11', label: 'Web → YouTube Funnel' },
  { id: '12_optimization', num: '12', label: 'Optimization Loop' },
  { id: '13_health', num: '13', label: 'Integration Health' },
];

function fmtSecs(secs?: number | null): string {
  if (secs === null || secs === undefined || !Number.isFinite(secs)) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ProvenanceTag({
  source,
  period,
  syncAt,
  tone = 'emerald',
}: {
  source: string;
  period?: string | null;
  syncAt?: string | null;
  tone?: 'emerald' | 'teal' | 'blue' | 'amber' | 'neutral';
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
    teal: 'bg-teal-500/10 border-teal-500/25 text-teal-300',
    blue: 'bg-blue-500/10 border-blue-500/25 text-blue-300',
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    neutral: 'bg-neutral-800 border-neutral-700 text-neutral-400',
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
      <span className={`px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${colors[tone]}`}>
        {source}
      </span>
      {period && <span className="text-neutral-500 font-mono">{period}</span>}
      {syncAt && (
        <span className="text-neutral-500 font-mono">
          Sync: {new Date(syncAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

function ProportionalBar({
  rank,
  label,
  sublabel,
  value,
  maxValue,
  formattedValue,
  highlightTop = true,
}: {
  rank?: number;
  label: string;
  sublabel?: string;
  value: number;
  maxValue: number;
  formattedValue: string;
  highlightTop?: boolean;
}) {
  const pct = maxValue > 0 ? Math.max(2, Math.min(100, (value / maxValue) * 100)) : 0;
  const isLeader = highlightTop && rank === 1;
  return (
    <div className="space-y-1.5" title={`${label}: ${formattedValue}`}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {rank !== undefined && (
            <span
              className={`font-mono font-bold text-[11px] w-6 shrink-0 ${
                isLeader ? 'text-amber-400' : 'text-neutral-500'
              }`}
            >
              #{rank}
            </span>
          )}
          <span className="font-semibold text-neutral-200 truncate">{label}</span>
          {sublabel && <span className="text-[10px] text-neutral-500 truncate">{sublabel}</span>}
        </div>
        <span className="font-mono text-xs font-bold text-neutral-300 shrink-0">{formattedValue}</span>
      </div>
      <div className="h-2.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isLeader
              ? 'bg-gradient-to-r from-amber-500 to-amber-300'
              : 'bg-gradient-to-r from-teal-600 to-emerald-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function OrganicSearchDiscoveryCommandCenter() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.role && user.role.includes('admin'));

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const [activeModule, setActiveModule] = useState<ModuleFilter>('all');
  const [ytWindow, setYtWindow] = useState<'28d' | 'lifetime'>('28d');
  const [geoTab, setGeoTab] = useState<'views' | 'watchHours' | 'avgDuration'>('views');
  const [releaseQuery, setReleaseQuery] = useState('');
  const [releaseFilter, setReleaseFilter] = useState<'all' | 'needs_graph' | 'needs_scripts' | 'source_recovery' | 'staged_drafts' | 'low_ctr'>('all');
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);

  // Manual AI citation observation form
  const [citationEngine, setCitationEngine] = useState<'ChatGPT' | 'Gemini' | 'Claude' | 'Perplexity'>('Perplexity');
  const [citationQuery, setCitationQuery] = useState('');
  const [savingCitation, setSavingCitation] = useState(false);

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, router]);

  const loadDashboard = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/discovery-performance${force ? '?refresh=1' : ''}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Organic Search Discovery Engine.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadDashboard(false);
    }
  }, [isAdmin, loadDashboard]);

  const runLiveDiagnostics = async () => {
    setRefreshing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/discovery-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      setFeedback({
        ok: Boolean(json.youtubeConnected),
        message: `Live diagnostics complete — YouTube API: ${json.youtubeConnected ? 'CONNECTED' : 'ERROR'} · GSC: ${json.gscState} · Bing: ${json.bingState} · IndexNow Key: ${json.indexNowVerified ? 'VERIFIED' : 'PENDING HOST DEPLOY'}`,
      });
      await loadDashboard(true);
    } catch (err: any) {
      setFeedback({ ok: false, message: err?.message || 'Diagnostics request failed.' });
      setRefreshing(false);
    }
  };

  const handleOptimizationDecision = async (
    proposalId: string,
    decision: 'approve_and_implement' | 'dismiss' | 'reopen'
  ) => {
    setBusyProposalId(proposalId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/discovery-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, decision }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ ok: false, message: json.error || 'Optimization action failed.' });
      } else {
        setFeedback({ ok: true, message: json.message || 'Optimization updated.' });
        await loadDashboard(false);
      }
    } catch (err: any) {
      setFeedback({ ok: false, message: err?.message || 'Network error.' });
    } finally {
      setBusyProposalId(null);
    }
  };

  const handleLogManualCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citationQuery.trim()) return;
    setSavingCitation(true);
    try {
      const res = await fetch('/api/admin/discovery-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_manual_citation',
          engine: citationEngine,
          citationCount: 1,
          sampleQuery: citationQuery.trim(),
          citationConfidence: 100,
          trend: 'stable',
        }),
      });
      if (res.ok) {
        setCitationQuery('');
        setFeedback({ ok: true, message: `Logged verified manual ${citationEngine} citation check.` });
        await loadDashboard(false);
      }
    } finally {
      setSavingCitation(false);
    }
  };

  const filteredReleases = useMemo(() => {
    const list: any[] = data?.releaseSeoAudits || [];
    return list.filter((r) => {
      if (releaseQuery.trim()) {
        const q = releaseQuery.toLowerCase();
        const hit =
          r.canonicalTitle.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          (r.youtubeId || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (releaseFilter === 'needs_graph') return r.graphLinksCount < 3;
      if (releaseFilter === 'needs_scripts') return !r.checks.hasFourScriptLyrics;
      if (releaseFilter === 'source_recovery') return Boolean(r.sourceRecoveryRequired);
      if (releaseFilter === 'staged_drafts') return Number(r.scriptCoverage?.draftPreparedCount || 0) > 0;
      if (releaseFilter === 'low_ctr') return r.metrics.studioCtr !== null && r.metrics.studioCtr < 5.0;
      return true;
    });
  }, [data, releaseQuery, releaseFilter]);

  const showSection = (id: ModuleFilter) => activeModule === 'all' || activeModule === id;

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm text-neutral-300 font-semibold">
            Synchronizing Verified Search, YouTube, Geography, Sitemap & Discovery Graph Intelligence...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const yt = data?.youtube;
  const gsc = data?.googleSearchConsole;
  const bing = data?.bingSearch;
  const demand = data?.searchDemand;
  const idxCrawl = data?.indexingAndCrawl;
  const aiSearch = data?.aiSearchDiscovery;
  const graph = data?.discoveryGraph;
  const funnel = data?.conversionFunnel;
  const loop = data?.optimizationLoop;
  const integrations: any[] = data?.integrations || [];

  const activeTrafficRows: any[] =
    ytWindow === '28d' ? yt?.recent28d?.trafficSources || [] : yt?.lifetime?.trafficSources || [];
  const maxTrafficViews = Math.max(1, ...activeTrafficRows.map((r) => r.views || 0));

  const activeGeoRows: any[] =
    geoTab === 'views'
      ? yt?.geography?.topByViews || []
      : geoTab === 'watchHours'
        ? yt?.geography?.topByWatchHours || []
        : yt?.geography?.topByAvgDuration || [];
  const maxGeoVal = Math.max(
    1,
    ...activeGeoRows.map((r) =>
      geoTab === 'views'
        ? r.views
        : geoTab === 'watchHours'
          ? r.watchTimeHours
          : r.avgViewDurationSeconds
    )
  );

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 overflow-x-hidden min-w-0">
        {/* COMMAND HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
              <Compass className="w-4 h-4" /> SufiPulse USA · Global Organic Search Discovery Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Organic Search, Multilingual Demand & Conversion Intelligence
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-3xl">
              Unified measurement across YouTube Search, Google Search Console, Bing & IndexNow, 4-script Sufi kalam demand, 52 listener geographies, and full-song conversions toward 1,000,000 organic listeners.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-xl text-xs font-bold text-neutral-200 flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Live Data
            </button>
            <button
              type="button"
              onClick={runLiveDiagnostics}
              disabled={refreshing}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-black flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify All Integrations
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {feedback && (
          <div
            className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
              feedback.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-neutral-400 hover:text-white text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STICKY 13-MODULE NAVIGATION */}
        <div className="w-full max-w-full bg-neutral-950/90 backdrop-blur border border-white/10 rounded-2xl p-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {MODULE_NAV.map((m) => {
              const active = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveModule(m.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-amber-500 text-neutral-950'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${active ? 'text-neutral-900' : 'text-amber-400/80'}`}>
                    {m.num}
                  </span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            01. EXECUTIVE ORGANIC DISCOVERY OVERVIEW
           ═══════════════════════════════════════════════════════════════════════ */}
        {showSection('01_overview') && (
          <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Module 01 · Executive Organic Discovery Overview
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Verified Cross-Platform Reach & Search Discovery Baseline
                </h2>
              </div>
              <ProvenanceTag
                source="YouTube API v2/v3 + Studio CSV + First-Party Telemetry"
                syncAt={data?.generatedAt}
                tone="emerald"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Lifetime Channel Views
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  {yt?.lifetime?.views !== null && yt?.lifetime?.views !== undefined
                    ? yt.lifetime.views.toLocaleString()
                    : 'UNAVAILABLE'}
                </div>
                <div className="text-xs text-neutral-400">
                  {yt?.lifetime?.watchHours?.toLocaleString() ?? '—'} watch hrs · AVD{' '}
                  {fmtSecs(yt?.lifetime?.avgViewDurationSeconds)}
                </div>
                <ProvenanceTag source="YT Analytics API v2" period="Lifetime" syncAt={yt?.fetchedAt} tone="emerald" />
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  YouTube Search Views (28d)
                </div>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {yt?.recent28d?.ytSearchViews !== null && yt?.recent28d?.ytSearchViews !== undefined
                    ? yt.recent28d.ytSearchViews.toLocaleString()
                    : 'UNAVAILABLE'}
                </div>
                <div className="text-xs text-neutral-400">
                  {yt?.recent28d?.ytSearchSharePercent ?? 0}% of {yt?.recent28d?.totalViews ?? 0} 28d views (Lifetime:{' '}
                  {yt?.lifetime?.ytSearchViews?.toLocaleString() ?? '—'} · {yt?.lifetime?.ytSearchSharePercent ?? 0}%)
                </div>
                <ProvenanceTag
                  source="YT Analytics API v2"
                  period={
                    yt?.recent28d?.startDate ? `${yt.recent28d.startDate}..${yt.recent28d.endDate}` : '28d'
                  }
                  tone="emerald"
                />
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Subscribers & Full Songs
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {yt?.channelIdentity?.subscribers?.toLocaleString() ?? 'UNAVAILABLE'}
                </div>
                <div className="text-xs text-neutral-400">
                  {yt?.channelIdentity?.totalVideos ?? '—'} YT videos · {graph?.totalPublishedSongs ?? 0} public canonical songs
                </div>
                <ProvenanceTag source="YT Data API v3 + CMS" syncAt={yt?.fetchedAt} tone="emerald" />
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Thumbnail Impressions & CTR
                </div>
                <div className="text-3xl font-black text-teal-300 font-mono">
                  {yt?.lifetime?.studioImpressions
                    ? yt.lifetime.studioImpressions.toLocaleString()
                    : 'UNAVAILABLE'}
                </div>
                <div className="text-xs text-neutral-400">
                  Verified CTR: <strong>{yt?.lifetime?.studioCtr ?? '—'}%</strong> ·{' '}
                  {yt?.geography?.territoriesMeasurable ?? 0} measurable countries
                </div>
                <ProvenanceTag
                  source="Studio CSV Snapshot"
                  period={yt?.lifetime?.studioPeriod}
                  tone="teal"
                />
              </div>
            </div>

            {/* Progress bar toward 1M genuine listeners */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-white/10 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-neutral-200 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" /> Long-Horizon Organic Growth Objective: 1,000,000 Verified Views
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {yt?.lifetime?.views
                    ? `${((yt.lifetime.views / 1_000_000) * 100).toFixed(2)}% (${yt.lifetime.views.toLocaleString()} / 1,000,000)`
                    : 'UNAVAILABLE'}
                </span>
              </div>
              <div className="h-3 bg-neutral-950 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(1, ((yt?.lifetime?.views || 0) / 1_000_000) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            02. GOOGLE SEARCH PERFORMANCE & 03. BING SEARCH PERFORMANCE
           ═══════════════════════════════════════════════════════════════════════ */}
        {(showSection('02_google') || showSection('03_bing')) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {showSection('02_google') && (
              <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                      Module 02 · Google Search Performance
                    </span>
                    <h2 className="text-lg font-black text-white mt-0.5">
                      Google Search Console & Googlebot Activity
                    </h2>
                  </div>
                  <ProvenanceTag
                    source={`GSC API: ${gsc?.status?.state || 'NOT_CONFIGURED'}`}
                    syncAt={gsc?.status?.lastCheckedAt}
                    tone={gsc?.status?.state === 'CONNECTED' ? 'emerald' : 'neutral'}
                  />
                </div>

                {gsc?.report?.status === 'CONNECTED' && gsc?.report?.totals ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="text-[10px] text-neutral-400 uppercase">Clicks (28d)</div>
                        <div className="text-xl font-black text-white font-mono">{gsc.report.totals.clicks}</div>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="text-[10px] text-neutral-400 uppercase">Impressions</div>
                        <div className="text-xl font-black text-white font-mono">
                          {gsc.report.totals.impressions.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="text-[10px] text-neutral-400 uppercase">CTR</div>
                        <div className="text-xl font-black text-emerald-400 font-mono">{gsc.report.totals.ctr}%</div>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="text-[10px] text-neutral-400 uppercase">Non-Branded</div>
                        <div className="text-xl font-black text-amber-400 font-mono">
                          {gsc.report.totals.nonBrandedClicks}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {gsc.report.topQueries.slice(0, 6).map((q: any, idx: number) => (
                        <ProportionalBar
                          key={q.query}
                          rank={idx + 1}
                          label={q.query}
                          sublabel={q.intentType === 'non_branded' ? 'Non-Branded' : 'Branded'}
                          value={q.impressions}
                          maxValue={gsc.report.topQueries[0]?.impressions || 1}
                          formattedValue={`${q.clicks} clicks · ${q.impressions} imp`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Google Search Console API is {gsc?.status?.state || 'NOT_CONFIGURED'} — Showing Zero Synthetic Data
                    </div>
                    <p className="text-neutral-400 leading-relaxed">
                      Official Search Analytics, Sitemaps, and URL Inspection clients are implemented in{' '}
                      <code className="text-neutral-200">lib/google-search-console.ts</code>. Configure property credentials to populate live query impressions, CTR, and average position:
                    </p>
                    <ul className="space-y-1 text-neutral-300 list-disc pl-5">
                      {(gsc?.status?.setupInstructions || []).map((step: string) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                  <div className="p-3 bg-neutral-900/70 rounded-xl border border-white/5">
                    <div className="text-neutral-400 text-[10px] uppercase font-bold">Verified Googlebot Hits</div>
                    <div className="text-lg font-black text-white font-mono mt-1">
                      {gsc?.googlebotCrawls?.pagesCrawled ?? 0}
                    </div>
                    <div className="text-[10px] text-neutral-500">First-Party Server Crawler Log</div>
                  </div>
                  <div className="p-3 bg-neutral-900/70 rounded-xl border border-white/5">
                    <div className="text-neutral-400 text-[10px] uppercase font-bold">Google Search Entrances</div>
                    <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                      {gsc?.googleOrganicReferrals ?? 0}
                    </div>
                    <div className="text-[10px] text-neutral-500">First-Party Referrer Telemetry</div>
                  </div>
                </div>
              </section>
            )}

            {showSection('03_bing') && (
              <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                      Module 03 · Bing Search & IndexNow Performance
                    </span>
                    <h2 className="text-lg font-black text-white mt-0.5">
                      Bing Webmaster Tools & IndexNow Protocol
                    </h2>
                  </div>
                  <ProvenanceTag
                    source={`Bing API: ${bing?.report?.status || 'NOT_CONFIGURED'}`}
                    syncAt={bing?.report?.fetchedAt}
                    tone={bing?.report?.status === 'CONNECTED' ? 'emerald' : 'neutral'}
                  />
                </div>

                {bing?.report?.status === 'CONNECTED' && bing?.report?.totals ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="text-[10px] text-neutral-400 uppercase">Clicks</div>
                        <div className="text-xl font-black text-white font-mono">{bing.report.totals.clicks}</div>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="text-[10px] text-neutral-400 uppercase">Impressions</div>
                        <div className="text-xl font-black text-white font-mono">
                          {bing.report.totals.impressions.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <div className="text-[10px] text-neutral-400 uppercase">Indexed Pages</div>
                        <div className="text-xl font-black text-teal-300 font-mono">
                          {bing.report.totals.inIndex ?? '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Bing Webmaster API is NOT CONFIGURED — Ready for BING_WEBMASTER_API_KEY
                    </div>
                    <ul className="space-y-1 text-neutral-300 list-disc pl-5">
                      {(bing?.report?.setupInstructions || []).map((step: string) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">IndexNow Verification Key File</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bing?.indexNow?.verified
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {bing?.indexNow?.verified ? 'LIVE HTTP 200' : 'LOCAL READY · PENDING DEPLOY'}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-neutral-400 break-all">
                    {bing?.indexNow?.keyLocation}
                  </div>
                  <p className="text-[11px] text-neutral-400">{bing?.indexNow?.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 bg-neutral-900/70 rounded-xl border border-white/5">
                    <div className="text-neutral-400 text-[10px] uppercase font-bold">Verified Bingbot Hits</div>
                    <div className="text-lg font-black text-white font-mono mt-1">
                      {bing?.bingbotCrawls?.pagesCrawled ?? 0}
                    </div>
                    <div className="text-[10px] text-neutral-500">First-Party Server Crawler Log</div>
                  </div>
                  <div className="p-3 bg-neutral-900/70 rounded-xl border border-white/5">
                    <div className="text-neutral-400 text-[10px] uppercase font-bold">Bing Search Entrances</div>
                    <div className="text-lg font-black text-teal-300 font-mono mt-1">
                      {bing?.bingOrganicReferrals ?? 0}
                    </div>
                    <div className="text-[10px] text-neutral-500">First-Party Referrer Telemetry</div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            04. YOUTUBE SEARCH PERFORMANCE
           ═══════════════════════════════════════════════════════════════════════ */}
        {showSection('04_youtube') && (
          <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Module 04 · YouTube Search & Traffic Discovery
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Traffic Source Distribution, Search Terms & Video-Level Search Winners
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setYtWindow('28d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    ytWindow === '28d' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400'
                  }`}
                >
                  Latest 28 Days ({yt?.recent28d?.totalViews ?? 0} views)
                </button>
                <button
                  type="button"
                  onClick={() => setYtWindow('lifetime')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    ytWindow === 'lifetime' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400'
                  }`}
                >
                  Lifetime ({yt?.lifetime?.views?.toLocaleString() ?? 0} views)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Proportional Traffic Sources Chart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    {ytWindow === '28d'
                      ? `Traffic Sources (${yt?.recent28d?.startDate || ''} to ${yt?.recent28d?.endDate || ''})`
                      : 'Lifetime Traffic Sources'}
                  </h3>
                  <ProvenanceTag source="YT Analytics API v2" tone="emerald" />
                </div>
                <div className="space-y-3">
                  {activeTrafficRows.slice(0, 8).map((row: any, i: number) => (
                    <ProportionalBar
                      key={row.sourceRaw}
                      rank={i + 1}
                      label={row.label}
                      sublabel={`${row.sharePercent}%`}
                      value={row.views}
                      maxValue={maxTrafficViews}
                      formattedValue={`${row.views.toLocaleString()} views · ${row.watchHours}h`}
                    />
                  ))}
                </div>
              </div>

              {/* Search Term Intent Diagnostics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-amber-400" />
                    Actual YouTube Search Queries (insightTrafficSourceDetail)
                  </h3>
                  <ProvenanceTag source="YT_SEARCH Filter" tone="emerald" />
                </div>

                <div className="p-4 bg-neutral-900/80 border border-white/10 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-neutral-300">
                    Latest 28-Day Observed Search Queries
                  </div>
                  {(yt?.recent28d?.searchTerms || []).length === 0 ? (
                    <p className="text-xs text-neutral-500">No search term rows returned by YouTube API for this 28d window.</p>
                  ) : (
                    <div className="space-y-2">
                      {(yt?.recent28d?.searchTerms || []).slice(0, 6).map((t: any, idx: number) => (
                        <div
                          key={`${t.term}-${idx}`}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-950 border border-white/5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                                t.category === 'non_branded_sufi'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : t.category === 'branded_sufipulse'
                                    ? 'bg-amber-500/15 text-amber-300'
                                    : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {t.category === 'non_branded_sufi'
                                ? 'Non-Branded Sufi'
                                : t.category === 'branded_sufipulse'
                                  ? 'Branded'
                                  : 'Legacy/Noise'}
                            </span>
                            <span className="font-medium text-neutral-200 truncate">{t.term}</span>
                          </div>
                          <span className="font-mono text-neutral-300 shrink-0">{t.views} views</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-3 text-[11px] text-neutral-400 leading-relaxed">
                    <strong>Forensic Insight:</strong> In the latest 28 days, non-branded Sufi queries (
                    <em>khwaja mere khwaja</em>, <em>bulla ki jaana main kaun</em>, <em>meri zaat zarra-e-benishan</em>)
                    are emerging, while historical lifetime top search queries include{' '}
                    <strong>{(yt?.lifetimeSearchTerms?.offTopicLegacyViews || 0).toLocaleString()}</strong> legacy
                    off-topic serial views vs{' '}
                    <strong>{(yt?.lifetimeSearchTerms?.brandedViews || 0).toLocaleString()}</strong> branded{' '}
                    <code>sufipulse-usa</code> views. Strengthening Sufi/Kashmir/Urdu metadata across all 97 songs re-anchors channel search authority.
                  </div>
                </div>
              </div>
            </div>

            {/* Top Videos by YouTube Search Views */}
            {(yt?.topSearchVideos || []).length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  Top SufiPulse Full-Length Videos Discovered via YouTube Search (Lifetime YT_SEARCH)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(yt?.topSearchVideos || []).slice(0, 8).map((v: any, idx: number) => (
                    <ProportionalBar
                      key={v.youtubeId}
                      rank={idx + 1}
                      label={v.canonicalTitle}
                      sublabel={v.studioCtr !== null ? `Studio CTR ${v.studioCtr}%` : undefined}
                      value={v.searchViews}
                      maxValue={yt.topSearchVideos[0]?.searchViews || 1}
                      formattedValue={`${v.searchViews.toLocaleString()} search views`}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            05. KEYWORD OPPORTUNITIES (4-SCRIPT MULTILINGUAL DEMAND ENGINE)
           ═══════════════════════════════════════════════════════════════════════ */}
        {showSection('05_keywords') && (
          <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Module 05 · Multilingual Search Demand & Existing-Song Mapping
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  11 Sufi, Kashmiri & Urdu Kalam Demand Clusters Across 4 Scripts
                </h2>
              </div>
              <ProvenanceTag
                source="Corpus + Graph + Live YT_SEARCH (Zero Invented Search Volumes)"
                syncAt={demand?.generatedAt}
                tone="blue"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(demand?.clusters || []).map((cluster: any) => {
                const matchedCount = cluster.existingCatalogCoverage.matchedReleasesCount;
                const fourScriptCount = cluster.existingCatalogCoverage.fourScriptReadyCount;
                const scriptPct = matchedCount > 0 ? Math.round((fourScriptCount / matchedCount) * 100) : 0;

                return (
                  <div
                    key={cluster.clusterId}
                    className="p-5 rounded-xl bg-neutral-900/60 border border-white/10 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            {cluster.domain}
                          </span>
                          <h3 className="text-base font-bold text-white">{cluster.title}</h3>
                        </div>
                        <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                          {matchedCount} Existing Songs
                        </span>
                      </div>

                      <p className="text-xs text-neutral-400 leading-relaxed">{cluster.intentSummary}</p>

                      {/* 4-script query pills */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-neutral-950 border border-white/5">
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">English</span>
                          <span className="text-neutral-200">{cluster.multilingualQueries.english[0]}</span>
                        </div>
                        <div className="p-2 rounded bg-neutral-950 border border-white/5">
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">Roman Urdu</span>
                          <span className="text-neutral-200">{cluster.multilingualQueries.romanUrdu[0]}</span>
                        </div>
                        <div className="p-2 rounded bg-neutral-950 border border-white/5" dir="rtl">
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block" dir="ltr">
                            Urdu Nastaliq (اردو)
                          </span>
                          <span className="text-amber-200 font-serif">{cluster.multilingualQueries.urduNastaliq[0]}</span>
                        </div>
                        <div className="p-2 rounded bg-neutral-950 border border-white/5">
                          <span className="text-[9px] uppercase font-bold text-neutral-500 block">
                            Devanagari (देवनागरी)
                          </span>
                          <span className="text-teal-200">{cluster.multilingualQueries.devanagari[0]}</span>
                        </div>
                      </div>

                      {/* 4-Script Readiness Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-neutral-400">
                          <span>4-Script Lyric Readiness ({fourScriptCount}/{matchedCount} songs)</span>
                          <span className="font-mono font-bold text-neutral-300">{scriptPct}%</span>
                        </div>
                        <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scriptPct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 space-y-2">
                      {cluster.matchedReleases?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {cluster.matchedReleases.slice(0, 3).map((rel: any) => (
                            <Link
                              key={rel.id}
                              href={`/admin/cms-releases/${rel.id}`}
                              className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] text-emerald-300 font-medium truncate max-w-[200px]"
                            >
                              {rel.canonicalTitle}
                            </Link>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-amber-200/90 leading-snug">
                        <strong>Action:</strong> {cluster.recommendedAction}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            06. GLOBAL GEOGRAPHIC DISCOVERY
           ═══════════════════════════════════════════════════════════════════════ */}
        {showSection('06_geography') && (
          <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Module 06 · Global Geographic Discovery ({yt?.geography?.territoriesMeasurable ?? 0} Measurable Territories)
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Top 10 Countries by Views, Watch Hours & Contemplative Retention
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'views', label: 'Most Views' },
                  { key: 'avgDuration', label: 'Longest Avg Viewing (≥100 views)' },
                  { key: 'watchHours', label: 'Most Watch Hours' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setGeoTab(t.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      geoTab === t.key ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <ProvenanceTag
                source={yt?.geography?.source || 'Studio Geography CSV'}
                period={yt?.geography?.period}
                tone="teal"
              />
            </div>

            <div className="space-y-3">
              {activeGeoRows.map((row: any, idx: number) => {
                const rawVal =
                  geoTab === 'views'
                    ? row.views
                    : geoTab === 'watchHours'
                      ? row.watchTimeHours
                      : row.avgViewDurationSeconds;
                const formatted =
                  geoTab === 'views'
                    ? `${row.views.toLocaleString()} views`
                    : geoTab === 'watchHours'
                      ? `${row.watchTimeHours.toLocaleString()} hrs`
                      : fmtSecs(row.avgViewDurationSeconds);
                return (
                  <ProportionalBar
                    key={row.countryCode}
                    rank={idx + 1}
                    label={row.countryName}
                    sublabel={row.countryCode}
                    value={rawVal}
                    maxValue={maxGeoVal}
                    formattedValue={formatted}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            07. RELEASE-LEVEL SEO PERFORMANCE
           ═══════════════════════════════════════════════════════════════════════ */}
        {showSection('07_releases') && (
          <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Module 07 · Release-Level SEO & Multilingual Readiness
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Full-Length Song Search Readiness ({filteredReleases.length} of {(data?.releaseSeoAudits || []).length} Public Songs)
                </h2>
              </div>
              <ProvenanceTag source="CMS + Studio CSV + First-Party Telemetry" tone="emerald" />
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={releaseQuery}
                  onChange={(e) => setReleaseQuery(e.target.value)}
                  placeholder="Filter full-length songs by canonical title, slug, or YouTube ID..."
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Songs' },
                  { id: 'source_recovery', label: `Source Recovery (${demand?.summary?.songsRequiringSourceRecovery ?? 0})` },
                  { id: 'staged_drafts', label: `Staged Drafts (${demand?.summary?.songsWithStagedDraftScripts ?? 0})` },
                  { id: 'needs_scripts', label: 'Missing 4-Script Lyrics' },
                  { id: 'needs_graph', label: '<3 Graph Links' },
                  { id: 'low_ctr', label: 'Studio CTR < 5%' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setReleaseFilter(f.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold ${
                      releaseFilter === f.id
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredReleases.slice(0, 30).map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 hover:border-white/15 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/cms-releases/${item.id}`}
                        className="text-sm font-bold text-white hover:text-amber-400 truncate"
                      >
                        {item.canonicalTitle}
                      </Link>
                      <a
                        href={`/release-detail/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-neutral-500 hover:text-emerald-400 flex items-center gap-1"
                      >
                        /release-detail/{item.slug} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* 4-script & graph badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {[
                        { ok: item.scriptCoverage.english, label: 'EN' },
                        { ok: item.scriptCoverage.romanUrdu, label: 'ROM-UR' },
                        { ok: item.scriptCoverage.urduNastaliq, label: 'اردو' },
                        { ok: item.scriptCoverage.devanagari, label: 'देव' },
                      ].map((s) => (
                        <span
                          key={s.label}
                          className={`px-1.5 py-0.5 rounded font-bold border ${
                            s.ok
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                          }`}
                        >
                          {s.label}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 font-mono">
                        Graph: {item.graphLinksCount} links
                      </span>
                      {item.sourceRecoveryRequired && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                          Source Recovery Required
                        </span>
                      )}
                      {Number(item.scriptCoverage?.draftPreparedCount || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold">
                          {item.scriptCoverage.draftPreparedCount} Staged Draft(s) · Approval Gate
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-400 font-mono">
                        {item.indexingState}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 shrink-0 text-xs">
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-500 uppercase">YT Views</div>
                      <div className="font-mono font-bold text-white">
                        {item.metrics.youtubeViews.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-500 uppercase">Studio CTR</div>
                      <div className="font-mono font-bold text-teal-300">
                        {item.metrics.studioCtr !== null ? `${item.metrics.studioCtr}%` : '—'}
                      </div>
                    </div>
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-neutral-400">SEO Score</span>
                        <span className="font-mono font-bold text-amber-300">{item.readinessScore}%</span>
                      </div>
                      <div className="h-2 bg-neutral-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                          style={{ width: `${item.readinessScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            08. INDEXING & CRAWL DIAGNOSTICS & 09. AI SEARCH DISCOVERY
           ═══════════════════════════════════════════════════════════════════════ */}
        {(showSection('08_indexing') || showSection('09_ai_search')) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {showSection('08_indexing') && (
              <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                      Module 08 · Indexing & Crawl Diagnostics
                    </span>
                    <h2 className="text-lg font-black text-white mt-0.5">
                      Canonical Sitemap ({idxCrawl?.sitemapBreakdown?.totalUrls ?? 0} URLs) & Bot Logs
                    </h2>
                  </div>
                  <ProvenanceTag source="Live Sitemap + First-Party Logs" tone="blue" />
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Canonical Full-Song Pages (/release-detail/*)', count: idxCrawl?.sitemapBreakdown?.releaseUrls || 0 },
                    { label: 'Taxonomy Nodes (/concepts, /themes, /moods, /regions)', count: idxCrawl?.sitemapBreakdown?.taxonomyUrls || 0 },
                    { label: 'Knowledge Registry Entities (/knowledge/*/*)', count: idxCrawl?.sitemapBreakdown?.knowledgeUrls || 0 },
                    { label: 'Static Authority & Governance Pages', count: idxCrawl?.sitemapBreakdown?.staticAuthorityUrls || 0 },
                    { label: 'Atlas Discovery Entities (/discovery/*/*)', count: idxCrawl?.sitemapBreakdown?.discoveryEntityUrls || 0 },
                    { label: 'Literary Journal Essays (/literary-journal/*)', count: idxCrawl?.sitemapBreakdown?.articleUrls || 0 },
                  ].map((item, idx) => (
                    <ProportionalBar
                      key={item.label}
                      rank={idx + 1}
                      label={item.label}
                      value={item.count}
                      maxValue={idxCrawl?.sitemapBreakdown?.releaseUrls || 100}
                      formattedValue={`${item.count} URLs`}
                    />
                  ))}
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-xs font-bold text-neutral-300">
                    Verified Search & Social Crawler Log ({(idxCrawl?.crawlers || []).length} Active Bots)
                  </div>
                  {(idxCrawl?.crawlers || []).length === 0 ? (
                    <p className="text-xs text-neutral-500">
                      Historical synthetic June 2026 crawler rows have been purged. Real bot hits on public pages are logged automatically via middleware.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {(idxCrawl?.crawlers || []).map((c: any) => (
                        <div
                          key={c.crawler}
                          className="p-2 rounded bg-neutral-900 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-white">{c.crawler}</span>
                          <span className="font-mono text-neutral-400">
                            {c.pagesCrawled} hits · Last: {new Date(c.lastSeen).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {showSection('09_ai_search') && (
              <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                      Module 09 · AI Search Discovery
                    </span>
                    <h2 className="text-lg font-black text-white mt-0.5">
                      AI Crawlers, AI Referrers & Manual Citation Checks
                    </h2>
                  </div>
                  <ProvenanceTag source="3-Lane Strict Separation" tone="blue" />
                </div>

                {/* Lane A & B */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-white/10 space-y-2">
                    <div className="font-bold text-blue-300 flex items-center gap-1.5">
                      <Bot className="w-4 h-4" /> Lane A · Verified AI Crawlers
                    </div>
                    {(aiSearch?.verifiedAiCrawlers || []).length === 0 ? (
                      <p className="text-[11px] text-neutral-400">
                        0 verified AI bot hits recorded since synthetic seed purge (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot allowed in /robots.txt).
                      </p>
                    ) : (
                      (aiSearch?.verifiedAiCrawlers || []).map((bot: any) => (
                        <div key={bot.crawler} className="flex justify-between font-mono text-[11px]">
                          <span className="text-white">{bot.crawler}</span>
                          <span className="text-emerald-400">{bot.pagesCrawled} hits</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-white/10 space-y-2">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Lane B · AI Referrer Entrances
                    </div>
                    <div className="space-y-1">
                      {(aiSearch?.firstPartyAiReferrers || []).map((r: any) => (
                        <div key={r.engine} className="flex justify-between text-[11px]">
                          <span className="text-neutral-300">{r.engine}</span>
                          <span className="font-mono font-bold text-white">{r.entrances}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lane C: Manual Citation Observations */}
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">
                      Lane C · Manual AI Citation Observations (Non-Automated)
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                      MANUAL OBSERVATION
                    </span>
                  </div>

                  {(aiSearch?.manualCitations || []).length === 0 ? (
                    <p className="text-[11px] text-neutral-400">
                      Unverified synthetic citation numbers (412 / 384 / 198 / 520) have been removed. Log real timestamped manual prompt checks below:
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {(aiSearch?.manualCitations || []).map((c: any) => (
                        <div
                          key={c.engine}
                          className="p-2 rounded bg-neutral-950 border border-white/5 text-[11px] flex items-center justify-between gap-2"
                        >
                          <span className="font-bold text-white">{c.engine}</span>
                          <span className="text-neutral-400 truncate flex-1">{c.sampleQuery}</span>
                          <span className="font-mono text-neutral-500 shrink-0">
                            {new Date(c.lastCitedDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleLogManualCitation} className="flex flex-col sm:flex-row gap-2 pt-1">
                    <select
                      value={citationEngine}
                      onChange={(e) => setCitationEngine(e.target.value as any)}
                      className="bg-neutral-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Perplexity">Perplexity</option>
                      <option value="ChatGPT">ChatGPT</option>
                      <option value="Gemini">Gemini</option>
                      <option value="Claude">Claude</option>
                    </select>
                    <input
                      type="text"
                      value={citationQuery}
                      onChange={(e) => setCitationQuery(e.target.value)}
                      placeholder="Verified prompt where SufiPulse.com was cited..."
                      className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="submit"
                      disabled={savingCitation}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg shrink-0"
                    >
                      Log Check
                    </button>
                  </form>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            10. DISCOVERY GRAPH INTELLIGENCE & 11. WEBSITE-TO-YOUTUBE FUNNEL
           ═══════════════════════════════════════════════════════════════════════ */}
        {(showSection('10_graph') || showSection('11_funnel')) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {showSection('10_graph') && (
              <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                      Module 10 · Discovery Graph Intelligence
                    </span>
                    <h2 className="text-lg font-black text-white mt-0.5">
                      Connected Songs ({graph?.connectedSongsCount ?? 0}/{graph?.totalPublishedSongs ?? 0}) & Taxonomy Density
                    </h2>
                  </div>
                  <Link
                    href="/admin/discovery-graph"
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Graph Editor <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                    <div className="text-[10px] text-neutral-400 uppercase">Connected Songs</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      {graph?.connectedSongsCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                    <div className="text-[10px] text-neutral-400 uppercase">Orphan Songs</div>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {graph?.orphanSongsCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                    <div className="text-[10px] text-neutral-400 uppercase">Verified Joins</div>
                    <div className="text-2xl font-black text-white font-mono">{graph?.totalJoins ?? 0}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(graph?.buckets || []).map((b: any, idx: number) => (
                    <ProportionalBar
                      key={b.key}
                      rank={idx + 1}
                      label={b.label}
                      sublabel={`${b.nodesCount} active nodes`}
                      value={Math.max(1, b.edgesCount)}
                      maxValue={Math.max(10, ...(graph?.buckets || []).map((x: any) => x.edgesCount || 0))}
                      formattedValue={`${b.edgesCount} edges`}
                    />
                  ))}
                </div>
              </section>
            )}

            {showSection('11_funnel') && (
              <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                      Module 11 · Website-to-YouTube Conversion Funnel
                    </span>
                    <h2 className="text-lg font-black text-white mt-0.5">
                      First-Party Attribution: SufiPulse.com → YouTube Listener
                    </h2>
                  </div>
                  <ProvenanceTag source="First-Party Runtime Telemetry" tone="blue" />
                </div>

                <div className="space-y-3">
                  {(funnel?.stages || []).map((stage: any, idx: number) => {
                    const maxStage = Math.max(
                      1,
                      ...((funnel?.stages || []).map((s: any) => s.count || 0))
                    );
                    return (
                      <ProportionalBar
                        key={stage.id}
                        rank={idx + 1}
                        label={stage.label}
                        value={stage.count}
                        maxValue={maxStage}
                        formattedValue={`${stage.count.toLocaleString()} events`}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] text-neutral-400 uppercase">Returning Entrances</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      {funnel?.returningListeners?.returningEntrances ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] text-neutral-400 uppercase">Embedded Plays</div>
                    <div className="text-lg font-black text-amber-300 font-mono">
                      {funnel?.returningListeners?.embeddedVideoPlays ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] text-neutral-400 uppercase">Multi-Touch Sessions</div>
                    <div className="text-lg font-black text-white font-mono">
                      {funnel?.returningListeners?.multiTouchSessions ?? 0}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/70 border border-white/5 text-[11px] text-neutral-400 leading-relaxed">
                  <strong className="text-neutral-200">Attribution Integrity:</strong> Stages above measure direct first-party interactions on{' '}
                  <code className="text-neutral-300">sufipulse.com</code> (including embedded YouTube IFrame API playback). Completed YouTube views ({funnel?.youtubePlatformMetrics?.ytSearchViews28d ?? '—'} 28d YT Search views), watch time ({funnel?.youtubePlatformMetrics?.lifetimeWatchHours?.toLocaleString() ?? '—'} hrs), and net subscribers ({funnel?.youtubePlatformMetrics?.subscribers?.toLocaleString() ?? '—'}) are measured separately via YouTube APIs and never conflated with outbound clicks.
                </div>

                {(funnel?.topConvertingReleases || []).length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <div className="text-xs font-bold text-neutral-300">
                      Measured Song Page Views & Outbound Clicks (Real Runtime Only)
                    </div>
                    <div className="space-y-1.5">
                      {(funnel?.topConvertingReleases || []).slice(0, 5).map((r: any) => (
                        <div
                          key={r.id}
                          className="p-2 rounded bg-neutral-900 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <span className="text-neutral-200 font-medium truncate">{r.canonicalTitle}</span>
                          <span className="font-mono text-neutral-400 shrink-0">
                            {r.metrics.websitePageViews} views · {r.metrics.websiteVideoClicks} YT clicks
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            12. AUTOMATED OPTIMIZATION ACTIONS (HUMAN-APPROVED LOOP)
           ═══════════════════════════════════════════════════════════════════════ */}
        {showSection('12_optimization') && (
          <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Module 12 · Organic Growth Optimization Loop
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Observe → Diagnose → Recommend → Human Approve → Implement → Measure
                </h2>
              </div>
              <ProvenanceTag source="Human-Governed Execution Ledger" tone="amber" />
            </div>

            <div className="space-y-4">
              {(loop?.proposals || []).map((p: any) => {
                const isMeasuring = p.stage === 'measuring' || p.stage === 'approved_implemented';
                const isDismissed = p.stage === 'dismissed';

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-xl border space-y-3 ${
                      isMeasuring
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : isDismissed
                          ? 'bg-neutral-900/30 border-white/5 opacity-60'
                          : 'bg-neutral-900/70 border-white/10'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            p.priority === 'critical'
                              ? 'bg-red-500/20 text-red-300'
                              : p.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {p.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono uppercase text-neutral-300">
                          Stage: {p.stage}
                        </span>
                        <h3 className="text-sm md:text-base font-bold text-white">{p.title}</h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.stage === 'recommended' && (
                          <>
                            <button
                              type="button"
                              disabled={busyProposalId === p.id}
                              onClick={() => handleOptimizationDecision(p.id, 'approve_and_implement')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
                            >
                              {busyProposalId === p.id
                                ? 'Applying...'
                                : p.automatedExecutionSupported
                                  ? 'Approve & Apply Now'
                                  : 'Approve & Lock Baseline'}
                            </button>
                            <button
                              type="button"
                              disabled={busyProposalId === p.id}
                              onClick={() => handleOptimizationDecision(p.id, 'dismiss')}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                        {isDismissed && (
                          <button
                            type="button"
                            onClick={() => handleOptimizationDecision(p.id, 'reopen')}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-neutral-950 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                          1. Observation
                        </span>
                        <p className="text-neutral-300 leading-relaxed">{p.observation}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-neutral-950 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                          2. Diagnosis
                        </span>
                        <p className="text-neutral-300 leading-relaxed">{p.diagnosis}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-neutral-950 border border-white/5">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">
                          3. Governed Action
                        </span>
                        <p className="text-amber-200/90 leading-relaxed">{p.recommendation}</p>
                      </div>
                    </div>

                    {p.implementationSummary && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>
                          <strong>Implemented ({p.approvedBy}):</strong> {p.implementationSummary}
                        </span>
                        {p.baselineAtImplementation && (
                          <span className="font-mono text-[11px] text-emerald-300 shrink-0">
                            Baseline locked: {p.baselineAtImplementation.ytSearchViews28d ?? 0} 28d YT Search views ·{' '}
                            {p.baselineAtImplementation.orphanReleasesCount} orphans
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            13. INTEGRATION HEALTH & AUDIT LOGS
           ═══════════════════════════════════════════════════════════════════════ */}
        {showSection('13_health') && (
          <section className="bg-neutral-950 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  Module 13 · Integration Health & Submission Audit Logs
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Live API Verification Matrix & Recent Indexing Ledger
                </h2>
              </div>
              <ProvenanceTag source="Real Runtime Health Checks" syncAt={data?.generatedAt} tone="emerald" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((intg: any) => {
                const ok = intg.status === 'WORKING' || intg.status === 'CONNECTED';
                const unconfigured =
                  intg.status === 'NOT_CONFIGURED' || intg.status === 'PENDING_HOST_DEPLOY';
                return (
                  <div
                    key={intg.id}
                    className="p-4 rounded-xl bg-neutral-900/70 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{intg.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          ok
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : unconfigured
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/15 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {intg.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{intg.detail}</p>
                    {intg.lastSync && (
                      <div className="text-[10px] font-mono text-neutral-500">
                        Checked: {intg.lastSync}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Indexing Audit Ledger */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Recent Search Submission & Verification Audit Entries
              </div>
              {(idxCrawl?.indexingLog?.entries || []).length === 0 ? (
                <p className="text-xs text-neutral-500">
                  No IndexNow or Search Console API submissions triggered yet in this environment.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(idxCrawl?.indexingLog?.entries || []).slice(0, 12).map((entry: any) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-lg bg-neutral-900 border border-white/5 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] uppercase text-amber-300">
                          {entry.protocol}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] text-neutral-300">
                          {entry.state}
                        </span>
                        <span className="font-mono text-[11px] text-neutral-200 truncate">{entry.url}</span>
                      </div>
                      <span className="text-[11px] text-neutral-400 shrink-0 font-mono">
                        {entry.httpStatus ? `HTTP ${entry.httpStatus} · ` : ''}
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
