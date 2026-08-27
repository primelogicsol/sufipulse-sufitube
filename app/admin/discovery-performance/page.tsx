"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Eye,
  ListMusic,
  MousePointerClick,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useAuth } from '@/app/contexts/AuthContext';

interface ClickMetricItem {
  slug: string;
  video_clicks: number;
  playlist_clicks: number;
  subscribe_clicks: number;
  page_views: number;
  total: number;
  conversion_rate: number;
  type?: string;
}

interface RecommendationItem {
  type: 'orphan' | 'density' | 'playlist' | 'localization' | 'subscribe';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionUrl: string;
}

interface CrawlerStatItem {
  crawler: string;
  lastSeen: string;
  pagesCrawled: number;
  frequency: number;
  firstSeen: string;
}

interface BrandAssetItem {
  id: string;
  name: string;
  type: 'master_brand' | 'website' | 'youtube_channel' | 'production_brand' | 'media_brand' | 'release_brand' | 'knowledge_brand';
  url: string;
  description: string;
  status: 'verified' | 'monitoring' | 'pending';
}

interface SearchOwnershipItem {
  keyword: string;
  platform: 'google' | 'bing' | 'youtube';
  ownedResultsCount: number;
  rankingUrls: string[];
  occupancyPercent: number;
  lastChecked: string;
}

interface AiCitationItem {
  engine: 'ChatGPT' | 'Gemini' | 'Claude' | 'Perplexity';
  citationCount: number;
  lastCitedDate: string;
  sampleQuery: string;
  citationConfidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface AuthorityGapTask {
  id: string;
  targetAsset: string;
  gapType: 'missing_page' | 'missing_schema' | 'missing_faq' | 'missing_capture';
  message: string;
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
  actionUrl: string;
}

interface ProductionReadiness {
  environment: 'Local Development' | 'Staging' | 'Production';
  gscStatus: 'Connected' | 'Configured' | 'Warning' | 'Error';
  gscChecks: {
    oauthConfigured: boolean;
    propertyVerified: boolean;
    lastSyncSuccessful: boolean;
  };
  youtubeStatus: 'Connected' | 'Configured' | 'Warning' | 'Error';
  youtubeChecks: {
    dataApiConfigured?: boolean;
    oauthConfigured?: boolean;
    oauthTokenValid: boolean;
    refreshTokenValid: boolean;
    lastSyncSuccessful: boolean;
  };
  sitemapStatus: 'Healthy' | 'Error';
  telemetryStatus: 'Active' | 'Inactive';
  aiAuditStatus: 'Active' | 'Inactive';
  observationWindow: string;
  lastGscSync: string;
  lastYoutubeSync: string;
  lastSuccessfulSync: string;
}

interface DiscoveryPerformanceData {
  totals: {
    video_click: number;
    playlist_click: number;
    subscribe_click: number;
    page_view: number;
  };
  concepts: ClickMetricItem[];
  themes: ClickMetricItem[];
  regions: ClickMetricItem[];
  releases: ClickMetricItem[];
  playlists: ClickMetricItem[];
  winners: {
    concepts: ClickMetricItem[];
    themes: ClickMetricItem[];
    regions: ClickMetricItem[];
    playlists: ClickMetricItem[];
    releases: ClickMetricItem[];
  };
  losers: {
    no_clicks: ClickMetricItem[];
    low_conversion: ClickMetricItem[];
    no_continuation: ClickMetricItem[];
  };
  recommendations: RecommendationItem[];
  crawlerStats: CrawlerStatItem[];
  ecosystemVisibility: {
    score: number;
    breakdown: {
      impressionsFactor: number;
      outboundClicksFactor: number;
      crawlerFactor: number;
      diversityFactor: number;
    };
  };
  ecosystemAuthority: {
    score: number;
    breakdown: {
      indexedAssetsFactor: number;
      knowledgeDensityFactor: number;
      entityRelationshipsFactor: number;
      brandOccupancyFactor: number;
      aiCitationsFactor: number;
    };
  };
  brandAssets: BrandAssetItem[];
  searchOwnership: SearchOwnershipItem[];
  aiCitations: AiCitationItem[];
  authorityGaps: AuthorityGapTask[];
  productionReadiness?: ProductionReadiness;
  dataProvenance?: {
    discoveryTelemetry: 'first_party_runtime_telemetry' | 'unavailable';
    youtubeAnalytics: 'youtube_analytics_api' | 'unavailable';
    searchOwnership: 'manual_or_registry_observation';
    aiCitations: 'registry_observation';
    simulation: 'isolated_non_authoritative';
  };
}

const TABS = [
  { key: 'concepts', label: 'Concepts' },
  { key: 'themes', label: 'Themes' },
  { key: 'regions', label: 'Regions' },
  { key: 'releases', label: 'Releases' },
  { key: 'playlists', label: 'Playlists' },
  { key: 'brand_assets', label: 'Brand Registry' },
  { key: 'serp_occupancy', label: 'Search Occupancy' },
  { key: 'ai_citations', label: 'AI Citations' },
  { key: 'crawlers', label: 'AI Crawlers' },
] as const;

type TabKey = typeof TABS[number]['key'];

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function statusClass(status: string): string {
  if (status === 'Connected' || status === 'Healthy' || status === 'Active') {
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  }
  if (status === 'Configured') return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
  if (status === 'Warning' || status === 'Inactive') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  return 'bg-red-500/10 border-red-500/20 text-red-400';
}

function ProvenanceBadge({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'sky' | 'amber' | 'neutral' }) {
  const classes = {
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    neutral: 'bg-neutral-800 border-neutral-700 text-neutral-400',
  }[tone];
  return <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${classes}`}>{children}</span>;
}

function KpiCard({ label, value, description, icon, provenance }: { label: string; value: string; description: string; icon: React.ReactNode; provenance: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{label}</p>
          {provenance}
        </div>
        <span className="p-2 bg-white/5 rounded-lg text-amber-400">{icon}</span>
      </div>
      <p className="text-3xl font-black text-white font-mono">{value}</p>
      <p className="text-[10px] text-neutral-500">{description}</p>
    </div>
  );
}

export default function DiscoveryPerformanceDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role.includes('admin') ?? false;
  const [activeTab, setActiveTab] = useState<TabKey>('concepts');
  const [data, setData] = useState<DiscoveryPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  useEffect(() => {
    if (!isAdmin && user) router.push('/admin');
  }, [user, isAdmin, router]);

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/discovery-performance', { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch performance data: ${text || res.statusText}`);
      }
      setData(await res.json() as DiscoveryPerformanceData);
    } catch (error: unknown) {
      setError(errorMessage(error, 'Error connecting to analytics performance endpoint.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void fetchPerformanceData();
  }, [isAdmin, fetchPerformanceData]);

  const runDiagnostics = async () => {
    setDiagnosing(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/discovery-performance', { method: 'POST' });
      const result = await res.json() as { success?: boolean; gscError?: string | null; ytError?: string | null };
      if (!res.ok) throw new Error(result.ytError || result.gscError || `Diagnostics failed with HTTP ${res.status}`);
      setNotice(result.success
        ? 'Live diagnostics completed successfully. Verified integration timestamps were refreshed.'
        : `Diagnostics completed with integration warnings. GSC: ${result.gscError || 'OK'} · YouTube: ${result.ytError || 'OK'}`);
      await fetchPerformanceData();
    } catch (error: unknown) {
      setError(errorMessage(error, 'Live diagnostics could not be completed.'));
    } finally {
      setDiagnosing(false);
    }
  };

  const clickRows = useMemo(() => {
    if (!data) return [];
    const source = activeTab === 'concepts' ? data.concepts
      : activeTab === 'themes' ? data.themes
        : activeTab === 'regions' ? data.regions
          : activeTab === 'releases' ? data.releases
            : activeTab === 'playlists' ? data.playlists
              : [];
    const search = tableSearch.toLowerCase();
    return source.filter(item => item.slug.toLowerCase().includes(search));
  }, [data, activeTab, tableSearch]);

  const filteredBrands = useMemo(() => {
    if (!data) return [];
    const search = tableSearch.toLowerCase();
    return data.brandAssets.filter(item => item.name.toLowerCase().includes(search) || item.type.toLowerCase().includes(search));
  }, [data, tableSearch]);

  const filteredSearch = useMemo(() => {
    if (!data) return [];
    const search = tableSearch.toLowerCase();
    return data.searchOwnership.filter(item => item.keyword.toLowerCase().includes(search) || item.platform.toLowerCase().includes(search));
  }, [data, tableSearch]);

  const filteredCitations = useMemo(() => {
    if (!data) return [];
    const search = tableSearch.toLowerCase();
    return data.aiCitations.filter(item => item.engine.toLowerCase().includes(search));
  }, [data, tableSearch]);

  const filteredCrawlers = useMemo(() => {
    if (!data) return [];
    const search = tableSearch.toLowerCase();
    return data.crawlerStats.filter(item => item.crawler.toLowerCase().includes(search));
  }, [data, tableSearch]);

  if (!isAdmin) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  }

  const telemetryAvailable = data?.dataProvenance?.discoveryTelemetry === 'first_party_runtime_telemetry';
  const totalClicks = data ? data.totals.video_click + data.totals.playlist_click + data.totals.subscribe_click : 0;
  const avgConversionRate = data && data.totals.page_view > 0 ? ((totalClicks / data.totals.page_view) * 100).toFixed(1) : '—';

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} className="text-amber-500" /> Authority & Brand Command Center
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Ecosystem Governance</h1>
            <p className="text-sm text-neutral-400 max-w-2xl">Verified discovery telemetry, registry observations, integration readiness and optimization diagnostics.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void fetchPerformanceData()} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 rounded-xl disabled:opacity-50">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
            </button>
            <button onClick={() => void runDiagnostics()} disabled={diagnosing} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-xs font-semibold text-amber-300 rounded-xl disabled:opacity-50">
              <ShieldCheck size={14} /> {diagnosing ? 'Running…' : 'Run Live Diagnostics'}
            </button>
          </div>
        </div>

        <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="text-sky-400 shrink-0 mt-0.5" size={16} />
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-sky-300 uppercase tracking-wider">Authoritative Data Provenance</h2>
            <p className="text-[11px] text-neutral-300 leading-relaxed">Simulation is isolated and non-authoritative. It cannot update readiness timestamps, Analytics snapshots, Graph scoring, reconciliation or optimization state. This dashboard displays measured telemetry, verified API state, registry observations, or unavailable status only.</p>
            <div className="flex flex-wrap gap-2">
              <ProvenanceBadge tone={telemetryAvailable ? 'green' : 'neutral'}>{telemetryAvailable ? 'FIRST-PARTY TELEMETRY' : 'TELEMETRY UNAVAILABLE'}</ProvenanceBadge>
              <ProvenanceBadge tone={data?.dataProvenance?.youtubeAnalytics === 'youtube_analytics_api' ? 'green' : 'neutral'}>{data?.dataProvenance?.youtubeAnalytics === 'youtube_analytics_api' ? 'YOUTUBE LIVE API' : 'YOUTUBE UNAVAILABLE'}</ProvenanceBadge>
              <ProvenanceBadge tone="amber">SEARCH: MANUAL / REGISTRY</ProvenanceBadge>
              <ProvenanceBadge tone="amber">AI CITATIONS: REGISTRY OBSERVATION</ProvenanceBadge>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300 flex gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" />{error}</div>}
        {notice && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-300 flex gap-2"><CheckCircle2 size={16} className="shrink-0 mt-0.5" />{notice}</div>}

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Page Views" value={data.totals.page_view.toLocaleString()} description="Discovery node page loads" icon={<Eye size={16} />} provenance={<ProvenanceBadge tone={telemetryAvailable ? 'green' : 'neutral'}>{telemetryAvailable ? 'RUNTIME' : 'UNAVAILABLE'}</ProvenanceBadge>} />
            <KpiCard label="Video Clicks" value={data.totals.video_click.toLocaleString()} description="Outbound video redirects" icon={<PlayCircle size={16} />} provenance={<ProvenanceBadge tone={telemetryAvailable ? 'green' : 'neutral'}>{telemetryAvailable ? 'RUNTIME' : 'UNAVAILABLE'}</ProvenanceBadge>} />
            <KpiCard label="Playlist Clicks" value={data.totals.playlist_click.toLocaleString()} description="Playlist outbound redirects" icon={<ListMusic size={16} />} provenance={<ProvenanceBadge tone={telemetryAvailable ? 'green' : 'neutral'}>{telemetryAvailable ? 'RUNTIME' : 'UNAVAILABLE'}</ProvenanceBadge>} />
            <KpiCard label="Subscribe Clicks" value={data.totals.subscribe_click.toLocaleString()} description="Subscribe prompt interactions" icon={<UserPlus size={16} />} provenance={<ProvenanceBadge tone={telemetryAvailable ? 'green' : 'neutral'}>{telemetryAvailable ? 'RUNTIME' : 'UNAVAILABLE'}</ProvenanceBadge>} />
            <KpiCard label="Conversion" value={`${avgConversionRate}${avgConversionRate === '—' ? '' : '%'}`} description="Clicks ÷ measured page views" icon={<MousePointerClick size={16} />} provenance={<ProvenanceBadge tone={telemetryAvailable ? 'green' : 'neutral'}>{telemetryAvailable ? 'DERIVED FROM RUNTIME' : 'UNAVAILABLE'}</ProvenanceBadge>} />
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-black text-white flex items-center gap-2"><Sparkles size={16} className="text-amber-400" /> Ecosystem Visibility Score</h3><ProvenanceBadge tone={telemetryAvailable ? 'green' : 'neutral'}>{telemetryAvailable ? 'MIXED VERIFIED INPUTS' : 'PARTIAL INPUTS'}</ProvenanceBadge></div>
              <p className="text-5xl font-black text-amber-400 font-mono">{data.ecosystemVisibility.score}</p>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemVisibility.breakdown.impressionsFactor}/30</b><p className="text-neutral-500">Views</p></div>
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemVisibility.breakdown.outboundClicksFactor}/30</b><p className="text-neutral-500">Clicks</p></div>
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemVisibility.breakdown.crawlerFactor}/30</b><p className="text-neutral-500">Crawls</p></div>
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemVisibility.breakdown.diversityFactor}/10</b><p className="text-neutral-500">Diversity</p></div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-3"><h3 className="font-black text-white flex items-center gap-2"><Award size={16} className="text-purple-400" /> Ecosystem Authority Score</h3><ProvenanceBadge tone="amber">REGISTRY / OBSERVATION</ProvenanceBadge></div>
              <p className="text-5xl font-black text-purple-400 font-mono">{data.ecosystemAuthority.score}</p>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemAuthority.breakdown.indexedAssetsFactor}/20</b><p className="text-neutral-500">Assets</p></div>
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemAuthority.breakdown.knowledgeDensityFactor}/20</b><p className="text-neutral-500">Density</p></div>
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemAuthority.breakdown.entityRelationshipsFactor}/20</b><p className="text-neutral-500">Relations</p></div>
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemAuthority.breakdown.brandOccupancyFactor}/20</b><p className="text-neutral-500">SERP</p></div>
                <div className="bg-black/20 rounded-lg p-2"><b>{data.ecosystemAuthority.breakdown.aiCitationsFactor}/20</b><p className="text-neutral-500">Citations</p></div>
              </div>
            </div>
          </div>
        )}

        {data?.productionReadiness && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between"><h3 className="font-black text-white flex items-center gap-2"><ShieldCheck size={16} className="text-amber-400" /> Production Readiness</h3><ProvenanceBadge tone="green">LIVE STATUS</ProvenanceBadge></div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                ['Environment', data.productionReadiness.environment],
                ['YouTube Analytics', data.productionReadiness.youtubeStatus],
                ['Search Console', data.productionReadiness.gscStatus],
                ['Sitemap', data.productionReadiness.sitemapStatus],
                ['Telemetry', data.productionReadiness.telemetryStatus],
                ['AI Audit', data.productionReadiness.aiAuditStatus],
              ].map(([label, status]) => (
                <div key={label} className="bg-black/20 border border-white/5 rounded-xl p-3"><p className="text-[9px] text-neutral-500 uppercase font-bold">{label}</p><span className={`inline-flex mt-2 px-2 py-0.5 border rounded text-[9px] font-black uppercase ${statusClass(status)}`}>{status}</span></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-black/20 rounded-xl p-3 space-y-1"><b className="text-neutral-300">YouTube checks</b><p className="text-neutral-500">OAuth configured: {data.productionReadiness.youtubeChecks.oauthConfigured ? 'Yes' : 'No'} · Refresh token: {data.productionReadiness.youtubeChecks.refreshTokenValid ? 'Yes' : 'No'} · Last live sync: {data.productionReadiness.youtubeChecks.lastSyncSuccessful ? 'Yes' : 'No'}</p></div>
              <div className="bg-black/20 rounded-xl p-3 space-y-1"><b className="text-neutral-300">Search checks</b><p className="text-neutral-500">OAuth configured: {data.productionReadiness.gscChecks.oauthConfigured ? 'Yes' : 'No'} · Property verified: {data.productionReadiness.gscChecks.propertyVerified ? 'Yes' : 'No'} · Last sync: {data.productionReadiness.gscChecks.lastSyncSuccessful ? 'Yes' : 'No'}</p></div>
              <div className="bg-black/20 rounded-xl p-3 space-y-1"><b className="text-neutral-300">Last successful integration</b><p className="text-neutral-500 font-mono">{data.productionReadiness.lastSuccessfulSync}</p></div>
            </div>
          </div>
        )}

        {data && (data.authorityGaps.length > 0 || data.recommendations.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-black text-white flex items-center gap-2"><AlertTriangle size={16} className="text-red-400" /> Authority Gaps</h3>
              {data.authorityGaps.length === 0 ? <p className="text-sm text-neutral-500">No unresolved authority gaps.</p> : data.authorityGaps.map(task => (
                <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between gap-4"><div><p className="text-[9px] uppercase text-red-400 font-black">{task.priority} · {task.gapType.replaceAll('_', ' ')}</p><h4 className="text-sm font-bold text-white mt-1">{task.targetAsset}</h4><p className="text-xs text-neutral-400 mt-1">{task.message}</p></div><Link href={task.actionUrl} className="self-center text-xs text-amber-400 whitespace-nowrap">Fix <ArrowRight size={11} className="inline" /></Link></div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="font-black text-white flex items-center gap-2"><Sparkles size={16} className="text-amber-400" /> Discovery Recommendations</h3>
              {data.recommendations.length === 0 ? <p className="text-sm text-neutral-500">No current optimization recommendations.</p> : data.recommendations.slice(0, 8).map((rec, index) => (
                <div key={`${rec.type}-${index}`} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between gap-4"><div><p className="text-[9px] uppercase text-amber-400 font-black">{rec.priority} · {rec.type}</p><h4 className="text-sm font-bold text-white mt-1">{rec.title}</h4><p className="text-xs text-neutral-400 mt-1">{rec.message}</p></div><Link href={rec.actionUrl} className="self-center text-xs text-amber-400 whitespace-nowrap">Open <ArrowRight size={11} className="inline" /></Link></div>
              ))}
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3"><h3 className="font-black text-white flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" /> Top Measured Pathways</h3>{[
              ['Concept', data.winners.concepts[0]], ['Theme', data.winners.themes[0]], ['Region', data.winners.regions[0]], ['Release', data.winners.releases[0]], ['Playlist', data.winners.playlists[0]],
            ].map(([label, row]) => <div key={String(label)} className="flex justify-between text-xs border-b border-white/5 pb-2"><span className="text-neutral-500">{String(label)}</span><span className="text-neutral-200 font-mono">{typeof row === 'object' && row ? `${row.slug} · ${row.total}` : 'No measured activity'}</span></div>)}</div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3"><h3 className="font-black text-white flex items-center gap-2"><TrendingDown size={16} className="text-red-400" /> Underperforming Measured Pathways</h3><p className="text-xs text-neutral-500">Zero-click nodes: {data.losers.no_clicks.length}</p><p className="text-xs text-neutral-500">Low-conversion nodes: {data.losers.low_conversion.length}</p><p className="text-xs text-neutral-500">No-continuation nodes: {data.losers.no_continuation.length}</p></div>
          </div>
        )}

        {data && (
          <div className="space-y-5 border-t border-white/10 pt-8">
            <div className="flex flex-col xl:flex-row justify-between gap-4">
              <div className="flex overflow-x-auto gap-1 pb-1">
                {TABS.map(tab => <button key={tab.key} onClick={() => { setActiveTab(tab.key); setTableSearch(''); }} className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg whitespace-nowrap ${activeTab === tab.key ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' : 'border border-transparent text-neutral-500 hover:text-neutral-300'}`}>{tab.label}</button>)}
              </div>
              <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" /><input value={tableSearch} onChange={event => setTableSearch(event.target.value)} placeholder={`Search ${TABS.find(tab => tab.key === activeTab)?.label.toLowerCase()}…`} className="w-full xl:w-72 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/30" /></div>
            </div>

            <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl">
              {(activeTab === 'concepts' || activeTab === 'themes' || activeTab === 'regions' || activeTab === 'releases' || activeTab === 'playlists') && (
                <table className="w-full text-xs"><thead><tr className="text-[9px] uppercase text-neutral-500 border-b border-white/10"><th className="text-left p-4">Entity</th><th>Page Views</th><th>Video Clicks</th><th>Playlist Clicks</th><th>Subscribe</th><th>Conversion</th><th /></tr></thead><tbody>{clickRows.map(row => {
                  const href = activeTab === 'playlists' ? `https://www.youtube.com/playlist?list=${row.slug}` : activeTab === 'releases' ? `/release-detail/${row.slug}` : `/${activeTab}/${row.slug}`;
                  return <tr key={row.slug} className="border-b border-white/5"><td className="p-4 font-bold text-white">{row.slug}</td><td className="text-center font-mono">{row.page_views}</td><td className="text-center font-mono">{row.video_clicks}</td><td className="text-center font-mono">{row.playlist_clicks}</td><td className="text-center font-mono">{row.subscribe_clicks}</td><td className="text-center font-mono">{row.conversion_rate}%</td><td className="p-4 text-right"><a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-400">View <ExternalLink size={10} className="inline" /></a></td></tr>;
                })}</tbody></table>
              )}

              {activeTab === 'brand_assets' && <table className="w-full text-xs"><thead><tr className="text-[9px] uppercase text-neutral-500 border-b border-white/10"><th className="text-left p-4">Asset</th><th>Type</th><th className="text-left">Description</th><th>Status</th><th /></tr></thead><tbody>{filteredBrands.map(item => <tr key={item.id} className="border-b border-white/5"><td className="p-4 font-bold text-white">{item.name}</td><td className="text-center font-mono">{item.type.replaceAll('_', ' ')}</td><td className="text-neutral-400 p-3">{item.description}</td><td className="text-center">{item.status}</td><td className="p-4 text-right"><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-amber-400">Open <ExternalLink size={10} className="inline" /></a></td></tr>)}</tbody></table>}

              {activeTab === 'serp_occupancy' && <table className="w-full text-xs"><thead><tr className="text-[9px] uppercase text-neutral-500 border-b border-white/10"><th className="text-left p-4">Keyword</th><th>Platform</th><th>Owned Results</th><th>Occupancy</th><th>Last Observed</th></tr></thead><tbody>{filteredSearch.map(item => <tr key={`${item.platform}-${item.keyword}`} className="border-b border-white/5"><td className="p-4 font-bold text-white">{item.keyword}</td><td className="text-center">{item.platform}</td><td className="text-center font-mono">{item.ownedResultsCount}</td><td className="text-center font-mono">{item.occupancyPercent}%</td><td className="text-center font-mono text-neutral-500">{new Date(item.lastChecked).toLocaleDateString()}</td></tr>)}</tbody></table>}

              {activeTab === 'ai_citations' && <table className="w-full text-xs"><thead><tr className="text-[9px] uppercase text-neutral-500 border-b border-white/10"><th className="text-left p-4">Engine</th><th>Citations</th><th>Confidence</th><th>Trend</th><th className="text-left">Sample Query</th></tr></thead><tbody>{filteredCitations.map(item => <tr key={item.engine} className="border-b border-white/5"><td className="p-4 font-bold text-white">{item.engine}</td><td className="text-center font-mono">{item.citationCount}</td><td className="text-center font-mono">{item.citationConfidence}%</td><td className="text-center">{item.trend}</td><td className="p-3 text-neutral-400">{item.sampleQuery}</td></tr>)}</tbody></table>}

              {activeTab === 'crawlers' && <table className="w-full text-xs"><thead><tr className="text-[9px] uppercase text-neutral-500 border-b border-white/10"><th className="text-left p-4">Crawler</th><th>First Seen</th><th>Last Seen</th><th>Hits</th><th>Frequency</th></tr></thead><tbody>{filteredCrawlers.map(item => <tr key={`${item.crawler}-${item.firstSeen}`} className="border-b border-white/5"><td className="p-4 font-bold text-white flex items-center gap-2"><Cpu size={12} className="text-amber-400" />{item.crawler}</td><td className="text-center font-mono">{new Date(item.firstSeen).toLocaleDateString()}</td><td className="text-center font-mono">{new Date(item.lastSeen).toLocaleString()}</td><td className="text-center font-mono">{item.pagesCrawled}</td><td className="text-center font-mono">{item.frequency.toFixed(1)} req/hr</td></tr>)}</tbody></table>}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
