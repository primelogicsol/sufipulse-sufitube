"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart2, RefreshCw, AlertCircle, ExternalLink, PlayCircle, 
  ListMusic, UserPlus, MousePointerClick, TrendingUp, TrendingDown, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Eye, ShieldCheck, 
  Cpu, Award, Search, HelpCircle, FileText
} from 'lucide-react';
import Link from 'next/link';
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
  productionReadiness?: {
    environment: 'Local Development' | 'Staging' | 'Production';
    gscStatus: 'Connected' | 'Configured' | 'Warning' | 'Error';
    gscChecks: {
      oauthConfigured: boolean;
      propertyVerified: boolean;
      lastSyncSuccessful: boolean;
    };
    youtubeStatus: 'Connected' | 'Configured' | 'Warning' | 'Error';
    youtubeChecks: {
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
    gscConnected?: boolean;
    youtubeConnected?: boolean;
    telemetryActive?: boolean;
    lastSync?: string;
    observationStart?: string;
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
  { key: 'crawlers', label: 'AI Crawlers' }
] as const;

type TabKey = typeof TABS[number]['key'];

export default function DiscoveryPerformanceDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role.includes('admin') ?? false;

  useEffect(() => {
    if (!isAdmin && user) {
      router.push('/admin');
    }
  }, [user, isAdmin]);

  const [activeTab, setActiveTab] = useState<TabKey>('concepts');
  const [data, setData] = useState<DiscoveryPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/discovery-performance');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        const text = await res.text();
        setError(`Failed to fetch performance data: ${text || res.statusText}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to analytics performance endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPerformanceData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Get active items list depending on tab
  const getActiveTabItems = () => {
    if (!data) return [];
    if (activeTab === 'crawlers') return data.crawlerStats;
    if (activeTab === 'brand_assets') return data.brandAssets;
    if (activeTab === 'serp_occupancy') return data.searchOwnership;
    if (activeTab === 'ai_citations') return data.aiCitations;
    return data[activeTab];
  };

  const activeItems = getActiveTabItems();
  
  const filteredActiveItems = activeItems.filter((item: any) => {
    const searchVal = tableSearch.toLowerCase();
    if (activeTab === 'crawlers') {
      return item.crawler.toLowerCase().includes(searchVal);
    }
    if (activeTab === 'brand_assets') {
      return item.name.toLowerCase().includes(searchVal) || item.type.toLowerCase().includes(searchVal);
    }
    if (activeTab === 'serp_occupancy') {
      return item.keyword.toLowerCase().includes(searchVal) || item.platform.toLowerCase().includes(searchVal);
    }
    if (activeTab === 'ai_citations') {
      return item.engine.toLowerCase().includes(searchVal);
    }
    return item.slug.toLowerCase().includes(searchVal);
  });

  const activeTabConfig = {
    concepts: { label: 'Concepts', path: 'concepts', key: 'concepts' },
    themes: { label: 'Themes', path: 'themes', key: 'themes' },
    regions: { label: 'Regions', path: 'regions', key: 'regions' },
    releases: { label: 'Releases', path: 'release-detail', key: 'releases' },
    playlists: { label: 'Playlists', path: 'playlists', key: 'playlists' },
    brand_assets: { label: 'Brand Registry', path: 'brand_assets', key: 'brand_assets' },
    serp_occupancy: { label: 'Search Occupancy', path: 'serp_occupancy', key: 'serp_occupancy' },
    ai_citations: { label: 'AI Citations', path: 'ai_citations', key: 'ai_citations' },
    crawlers: { label: 'AI Crawlers', path: 'crawlers', key: 'crawlers' }
  }[activeTab];

  // Compute total clicks
  const totalClicks = data
    ? data.totals.video_click + data.totals.playlist_click + data.totals.subscribe_click
    : 0;

  // Compute average conversion rate
  const avgConversionRate = data && data.totals.page_view > 0
    ? parseFloat(((totalClicks / data.totals.page_view) * 100).toFixed(1))
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} className="text-amber-500" />
              Authority & Brand Command Center
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Ecosystem Governance
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl">
              Track search occupancy, AI citation logs, whitelisted entities, crawler sensors, and visibility diagnostics.
            </p>
          </div>
          <button
            onClick={fetchPerformanceData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-xs font-semibold text-neutral-300 hover:text-amber-500 rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Telemetry
          </button>
        </div>

        {/* Global Warning Banner */}
        {data && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Simulation Mode Active</h4>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Some authority metrics are currently using baseline simulation data. Production outcomes require Search Console, YouTube Analytics, and live telemetry integration.
              </p>
            </div>
          </div>
        )}

        {/* Global Action Cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Page Views (Impressions) */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  Page Impressions
                  <span className="px-1.5 py-0.2 bg-amber-500/15 border border-amber-500/20 text-amber-500 text-[8px] font-bold rounded uppercase">Simulated</span>
                </span>
                <span className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Eye size={16} /></span>
              </div>
              <div className="mt-4 space-y-1">
                <span className="text-3xl font-black text-white tracking-tight font-mono">{data.totals.page_view.toLocaleString()}</span>
                <p className="text-[10px] text-neutral-500">Node loads (Concepts, Regions, Themes)</p>
              </div>
            </div>

            {/* Video Clicks Sent */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  Video Clicks Sent
                  <span className="px-1.5 py-0.2 bg-red-500/15 border border-red-500/20 text-red-400 text-[8px] font-bold rounded uppercase">Simulated</span>
                </span>
                <span className="p-2 bg-red-500/10 text-red-500 rounded-lg"><PlayCircle size={16} /></span>
              </div>
              <div className="mt-4 space-y-1">
                <span className="text-3xl font-black text-white tracking-tight font-mono">{data.totals.video_click.toLocaleString()}</span>
                <p className="text-[10px] text-neutral-500">Outbound video click redirects</p>
              </div>
            </div>

            {/* Playlist Clicks */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  Playlist Clicks
                  <span className="px-1.5 py-0.2 bg-blue-500/15 border border-blue-500/20 text-blue-400 text-[8px] font-bold rounded uppercase">Simulated</span>
                </span>
                <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><ListMusic size={16} /></span>
              </div>
              <div className="mt-4 space-y-1">
                <span className="text-3xl font-black text-white tracking-tight font-mono">{data.totals.playlist_click.toLocaleString()}</span>
                <p className="text-[10px] text-neutral-500">Curated playlist outbound redirects</p>
              </div>
            </div>

            {/* Subscribe Clicks */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  Subscribe Clicks
                  <span className="px-1.5 py-0.2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded uppercase">Simulated</span>
                </span>
                <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><UserPlus size={16} /></span>
              </div>
              <div className="mt-4 space-y-1">
                <span className="text-3xl font-black text-white tracking-tight font-mono">{data.totals.subscribe_click.toLocaleString()}</span>
                <p className="text-[10px] text-neutral-500">Subscriber prompt conversions</p>
              </div>
            </div>
          </div>
        )}

        {/* Visibility & Authority Score Cards */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ecosystem Visibility Score Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-stretch gap-6 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
              
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    Ecosystem Visibility Score
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Calculated search engine and AI exposure weighting (impressions, clicks, crawl frequency, and asset diversity factors).
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 text-center">
                    <span className="text-sm font-bold text-neutral-300 font-mono">{data.ecosystemVisibility.breakdown.impressionsFactor}/30</span>
                    <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mt-1">Impressions</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 text-center">
                    <span className="text-sm font-bold text-neutral-300 font-mono">{data.ecosystemVisibility.breakdown.outboundClicksFactor}/30</span>
                    <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mt-1">Clicks</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 text-center">
                    <span className="text-sm font-bold text-neutral-300 font-mono">{data.ecosystemVisibility.breakdown.crawlerFactor}/30</span>
                    <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mt-1">AI Crawls</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 text-center">
                    <span className="text-sm font-bold text-neutral-300 font-mono">{data.ecosystemVisibility.breakdown.diversityFactor}/10</span>
                    <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mt-1">Diversity</p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center w-full md:w-40 relative overflow-hidden group">
                <span className="text-5xl font-black text-amber-500 font-mono tracking-tighter">
                  {data.ecosystemVisibility.score}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2">Visibility Index</span>
                <span className="text-[9px] text-neutral-500 font-mono mt-1">Scale: 0-100</span>
              </div>
            </div>

            {/* Ecosystem Authority Score Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-stretch gap-6 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
              
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Award size={16} className="text-purple-400" />
                    Ecosystem Authority Score
                    <span className="px-1.5 py-0.2 bg-purple-500/15 border border-purple-500/20 text-purple-400 text-[8px] font-bold rounded uppercase">Simulated / Manual</span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    True semantic authority weight based on asset verification, entity relations, knowledge density, brand occupancy, and verified AI citations.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-2">
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2 text-center" title="Verified Assets in Registry">
                    <span className="text-xs font-bold text-neutral-300 font-mono">{data.ecosystemAuthority?.breakdown.indexedAssetsFactor || 0}/20</span>
                    <p className="text-[8px] text-neutral-500 uppercase font-black tracking-tighter mt-1">Assets</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2 text-center" title="Dense Knowledge Nodes (>150 char description)">
                    <span className="text-xs font-bold text-neutral-300 font-mono">{data.ecosystemAuthority?.breakdown.knowledgeDensityFactor || 0}/20</span>
                    <p className="text-[8px] text-neutral-500 uppercase font-black tracking-tighter mt-1">Density</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2 text-center" title="Active edges in Discovery Graph">
                    <span className="text-xs font-bold text-neutral-300 font-mono">{data.ecosystemAuthority?.breakdown.entityRelationshipsFactor || 0}/20</span>
                    <p className="text-[8px] text-neutral-500 uppercase font-black tracking-tighter mt-1">Relations</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2 text-center" title="SERP occupancies across keywords">
                    <span className="text-xs font-bold text-neutral-300 font-mono">{data.ecosystemAuthority?.breakdown.brandOccupancyFactor || 0}/20</span>
                    <p className="text-[8px] text-neutral-500 uppercase font-black tracking-tighter mt-1">Occupancy</p>
                  </div>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-2 text-center" title="Verified citations in AI platforms">
                    <span className="text-xs font-bold text-neutral-300 font-mono">{data.ecosystemAuthority?.breakdown.aiCitationsFactor || 0}/20</span>
                    <p className="text-[8px] text-neutral-500 uppercase font-black tracking-tighter mt-1">Citations</p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 bg-purple-500/5 border border-purple-500/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center w-full md:w-40 relative overflow-hidden group">
                <span className="text-5xl font-black text-purple-400 font-mono tracking-tighter">
                  {data.ecosystemAuthority?.score || 0}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2">Authority Index</span>
                <span className="text-[9px] text-neutral-500 font-mono mt-1">Scale: 0-100</span>
              </div>
            </div>
          </div>
        )}

        {/* Brand Whitelist, SERP Occupancy, and Production Readiness Grid */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brand Whitelist Panel */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Ecosystem Whitelist
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Whitelisted ecosystem properties exempt from confusion flags, risk alerts, and brand hijacking triggers:
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {['SufiPulse', 'SufiPulse.com', 'SufiPulse-USA', 'SufiPulse Studio', 'SufiTube', 'SufiPulse Records', 'SufiPulse Encyclopedia'].map(brand => (
                  <span 
                    key={brand}
                    className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg tracking-wider"
                  >
                    🛡️ {brand}
                  </span>
                ))}
              </div>
            </div>

            {/* Search Occupancy Summary Panel */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Search size={14} className="text-blue-500" />
                  SERP Occupancy
                  <span className="px-1.5 py-0.2 bg-blue-500/15 border border-blue-500/20 text-blue-400 text-[8px] font-bold rounded uppercase normal-case font-sans scale-90">Manual Observation</span>
                </h3>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Monitored organic listings owned by SufiPulse on Page 1 of search engines (organic search index capture).
              </p>

              <div className="space-y-2.5 pt-1">
                {data.searchOwnership.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="bg-black/20 border border-white/5 rounded-xl p-2.5 flex justify-between items-center text-xs">
                    <span className="font-bold text-white">"{item.keyword}" <span className="text-[9px] text-neutral-500 font-mono">({item.platform})</span></span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-white/5 rounded-full h-1">
                        <div className="bg-blue-400 h-full rounded-full" style={{ width: `${item.occupancyPercent}%` }}></div>
                      </div>
                      <span className="font-mono text-neutral-400 text-[10px] font-bold">{item.occupancyPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Production Data Readiness Panel */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <RefreshCw size={14} className="text-amber-500 animate-pulse" />
                  Production Readiness
                </h3>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Verification status of direct API integrations and live server metrics required for real-time tracking.
              </p>
              
              <div className="space-y-3 pt-1 text-xs">
                {/* 1. Environment */}
                <div className="flex justify-between items-center bg-black/20 border border-white/5 rounded-xl p-2.5">
                  <span className="text-neutral-400 font-medium">Environment</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                    data.productionReadiness?.environment === 'Production'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : data.productionReadiness?.environment === 'Staging'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                  }`}>
                    {data.productionReadiness?.environment || 'Local Development'}
                  </span>
                </div>
                {/* 2. Google Search Console */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">Google Search Console</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                      data.productionReadiness?.gscStatus === 'Connected'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : data.productionReadiness?.gscStatus === 'Configured'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                          : data.productionReadiness?.gscStatus === 'Warning'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                      {data.productionReadiness?.gscStatus || 'Error'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/5 text-[9px] text-neutral-500 font-mono">
                    <div className="flex flex-col items-center p-1 bg-black/10 rounded">
                      <span className="text-neutral-400">OAuth Config</span>
                      <span className={data.productionReadiness?.gscChecks?.oauthConfigured ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {data.productionReadiness?.gscChecks?.oauthConfigured ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-1 bg-black/10 rounded">
                      <span className="text-neutral-400">Verified</span>
                      <span className={data.productionReadiness?.gscChecks?.propertyVerified ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {data.productionReadiness?.gscChecks?.propertyVerified ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-1 bg-black/10 rounded">
                      <span className="text-neutral-400">Sync Status</span>
                      <span className={data.productionReadiness?.gscChecks?.lastSyncSuccessful ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {data.productionReadiness?.gscChecks?.lastSyncSuccessful ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. YouTube Analytics */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 font-medium">YouTube Analytics API</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                      data.productionReadiness?.youtubeStatus === 'Connected'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : data.productionReadiness?.youtubeStatus === 'Configured'
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                          : data.productionReadiness?.youtubeStatus === 'Warning'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                      {data.productionReadiness?.youtubeStatus || 'Error'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/5 text-[9px] text-neutral-500 font-mono">
                    <div className="flex flex-col items-center p-1 bg-black/10 rounded">
                      <span className="text-neutral-400">Token Valid</span>
                      <span className={data.productionReadiness?.youtubeChecks?.oauthTokenValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {data.productionReadiness?.youtubeChecks?.oauthTokenValid ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-1 bg-black/10 rounded">
                      <span className="text-neutral-400">Refresh Tkn</span>
                      <span className={data.productionReadiness?.youtubeChecks?.refreshTokenValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {data.productionReadiness?.youtubeChecks?.refreshTokenValid ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-1 bg-black/10 rounded">
                      <span className="text-neutral-400">Sync Status</span>
                      <span className={data.productionReadiness?.youtubeChecks?.lastSyncSuccessful ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {data.productionReadiness?.youtubeChecks?.lastSyncSuccessful ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Sitemap */}
                <div className="flex justify-between items-center bg-black/20 border border-white/5 rounded-xl p-2.5">
                  <span className="text-neutral-400 font-medium">Sitemap Status</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                    data.productionReadiness?.sitemapStatus === 'Healthy'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/20 text-red-400'
                  }`}>
                    {data.productionReadiness?.sitemapStatus || 'Healthy'}
                  </span>
                </div>

                {/* 5. Telemetry Status */}
                <div className="flex justify-between items-center bg-black/20 border border-white/5 rounded-xl p-2.5">
                  <span className="text-neutral-400 font-medium">Telemetry Status</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                    data.productionReadiness?.telemetryStatus === 'Active'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                  }`}>
                    {data.productionReadiness?.telemetryStatus || 'Active'}
                  </span>
                </div>

                {/* 6. AI Audit Status */}
                <div className="flex justify-between items-center bg-black/20 border border-white/5 rounded-xl p-2.5">
                  <span className="text-neutral-400 font-medium">AI Audit</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                    data.productionReadiness?.aiAuditStatus === 'Active'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                  }`}>
                    {data.productionReadiness?.aiAuditStatus || 'Active'}
                  </span>
                </div>

                {/* 7. Authority Observation Window */}
                <div className="flex justify-between items-center bg-black/20 border border-white/5 rounded-xl p-2.5">
                  <span className="text-neutral-400 font-medium">Authority Observation</span>
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black rounded">
                    {data.productionReadiness?.observationWindow || 'Day 1 of 90'}
                  </span>
                </div>

                {/* Sync Timestamps */}
                <div className="bg-black/20 border border-white/5 rounded-xl p-2.5 space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Last Search Console Sync</span>
                    <span className="font-mono text-neutral-400">{data.productionReadiness?.lastGscSync || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-1.5">
                    <span className="text-neutral-500">Last YouTube Sync</span>
                    <span className="font-mono text-neutral-400">{data.productionReadiness?.lastYoutubeSync || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-1.5">
                    <span className="text-neutral-500 font-bold">Last Successful Sync</span>
                    <span className="font-mono text-emerald-400 font-bold">{data.productionReadiness?.lastSuccessfulSync || 'None'}</span>
                  </div>
                </div>

                {/* Diagnostic & Simulation Triggers */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      if (confirm("Run live connection diagnostics to query Google Search Console and YouTube Analytics?")) {
                        try {
                          const res = await fetch('/api/admin/discovery-performance', { method: 'POST' });
                          const result = await res.json();
                          if (result.success) {
                            alert("Diagnostics completed successfully! Both APIs connected.");
                          } else {
                            alert(`Diagnostics completed: \n- GSC: ${result.gscError || 'Success'}\n- YouTube: ${result.ytError || 'Success'}`);
                          }
                          fetchPerformanceData(); // Refresh UI
                        } catch (e: any) {
                          alert(`Diagnostics failed to execute: ${e.message}`);
                        }
                      }
                    }}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 text-neutral-300 font-bold rounded-xl transition text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={10} />
                    Run Diagnostics
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm("Trigger simulated success for local sandbox testing? This forces GSC and YouTube to Connected.")) {
                        try {
                          const res = await fetch('/api/admin/discovery-performance', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ simulateSuccess: true })
                          });
                          const result = await res.json();
                          if (result.success) {
                            alert("Simulated connection success timestamps activated!");
                          }
                          fetchPerformanceData(); // Refresh UI
                        } catch (e: any) {
                          alert(`Simulation failed: ${e.message}`);
                        }
                      }
                    }}
                    className="py-2 px-3 bg-purple-500/15 hover:bg-purple-500/25 active:bg-purple-500/35 border border-purple-500/25 text-purple-400 font-bold rounded-xl transition text-[10px] tracking-wider uppercase cursor-pointer"
                    title="Simulation Mode - For local diagnostics only"
                  >
                    Simulate (Local Dev Only)
                  </button>
                </div>
                <p className="text-[9px] text-purple-400 font-medium italic mt-1 bg-purple-500/5 p-1.5 border border-purple-500/10 rounded-lg text-center">
                  ⚠️ Simulation Mode: For local diagnostics only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2 Observation Window Card */}
        {data && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Award size={16} className="text-purple-400" />
                Phase 2 Observation Window
                <span className="px-1.5 py-0.2 bg-purple-500/15 border border-purple-500/20 text-purple-400 text-[8px] font-bold rounded uppercase">Outcome Tracker</span>
              </h3>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                Observation Started: 2026-06-03
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Monitors live outcome indices during the 90-day observation window, including search console indexation coverage, crawler hits from major search/LLM engines, and branded occupancy queries.
            </p>

            {/* Timeline Progress Bar */}
            <div className="space-y-4">
              {(() => {
                const start = new Date('2026-06-03T00:00:00.000Z').getTime();
                const now = Date.now();
                const elapsedDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
                const progressPercent = Math.min(100, Math.max(0, (elapsedDays / 90) * 100));

                const milestones = [
                  { day: 0, label: 'Day 0', title: 'Baseline Check', desc: 'Sitemap submission & index baselines', active: elapsedDays >= 0 },
                  { day: 7, label: 'Day 7', title: 'Crawler Indexing', desc: 'Googlebot, Bingbot & LLM scrapers scans', active: elapsedDays >= 7 },
                  { day: 30, label: 'Day 30', title: 'Authority Outcome Audit', desc: 'Outcome checks & playlist continuation', active: elapsedDays >= 30 },
                  { day: 60, label: 'Day 60', title: 'Trust Accrual Check', desc: 'Branded search organic occupy gains', active: elapsedDays >= 60 },
                  { day: 90, label: 'Day 90', title: 'Ecosystem Recognition', desc: 'Canonical AI & search registry complete', active: elapsedDays >= 90 },
                ];

                return (
                  <div className="space-y-6">
                    {/* Progress Bar Header */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-400">Current Progress</span>
                      <span className="font-mono text-purple-400 font-bold bg-purple-500/5 px-2 py-0.5 border border-purple-500/10 rounded-lg">
                        {elapsedDays >= 90 ? 'Completed' : `Day ${elapsedDays + 1} of 90 (${progressPercent.toFixed(1)}%)`}
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="relative w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    {/* Milestones Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                      {milestones.map((m) => (
                        <div 
                          key={m.day} 
                          className={`border rounded-2xl p-3.5 space-y-1.5 transition-all duration-300 ${
                            m.active 
                              ? 'bg-purple-500/5 border-purple-500/20 text-white' 
                              : 'bg-black/20 border-white/5 text-neutral-500'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black tracking-wider uppercase font-mono">{m.label}</span>
                            {m.active ? (
                              <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-1 rounded font-bold uppercase">Active</span>
                            ) : (
                              <span className="text-[9px] bg-white/5 border border-white/5 text-neutral-600 px-1 rounded font-bold uppercase">Pending</span>
                            )}
                          </div>
                          <h4 className={`text-xs font-black ${m.active ? 'text-white' : 'text-neutral-400'}`}>{m.title}</h4>
                          <p className="text-[9px] leading-normal text-neutral-400">{m.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* AI & Discovery Tracking Grid */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Crawl Activity Panel */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Cpu size={16} className="text-amber-500" />
                  AI Crawl Activity (Bot Scans)
                  <span className="px-1.5 py-0.2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold rounded uppercase">Live Telemetry</span>
                </h3>
                <span className="text-[9px] font-mono uppercase bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">Crawl Telemetry</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Measures raw crawler and search index request hits from LLM bots and search scrapers. Visited page counts do NOT mean the brand is citation-indexed.
              </p>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {data.crawlerStats.slice(0, 4).map((bot, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black/20 border border-white/5 rounded-xl p-3 text-xs font-mono">
                    <span className="font-sans font-bold text-white">{bot.crawler}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-neutral-400">{bot.pagesCrawled} scans</span>
                      <span className="text-amber-500 font-bold">{bot.frequency.toFixed(1)} req/hr</span>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('crawlers')}
                className="text-xs font-bold text-amber-500 hover:text-amber-400 inline-flex items-center gap-1 mt-2 transition"
              >
                View full crawler registry logs <ArrowRight size={12} />
              </button>
            </div>

            {/* AI Citation Tracking Panel */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Award size={16} className="text-purple-400" />
                  AI Citation Tracking
                  <span className="px-1.5 py-0.2 bg-purple-500/15 border border-purple-500/20 text-purple-400 text-[8px] font-bold rounded uppercase">Manual Audit</span>
                </h3>
                <span className="text-[9px] font-mono uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">Semantic Presence</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Tracks active citations and references of SufiPulse entities in LLM search synthesis. High confidence reflects accurate brand knowledge retrieval.
              </p>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {data.aiCitations.slice(0, 4).map((cit, idx) => (
                  <div key={idx} className="flex flex-col bg-black/20 border border-white/5 rounded-xl p-3 gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-sans font-bold text-white">{cit.engine}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-400 text-[10px] font-mono">{cit.citationCount} verified cites</span>
                        <span className="text-emerald-400 font-bold font-mono">{cit.citationConfidence}% match</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-neutral-500 italic font-serif leading-relaxed line-clamp-1">
                      "{cit.sampleQuery}"
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('ai_citations')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 mt-2 transition"
              >
                View full AI citation matching logs <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ==================== 1. AUTHORITY GAP DETECTION PANEL ==================== */}
        {data && data.authorityGaps.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                Authority Gap Detection (Action Required)
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Ecosystem vulnerabilities that dilute brand presence or decrease search crawl indexability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.authorityGaps.map(task => {
                const isHigh = task.priority === 'high';
                return (
                  <div 
                    key={task.id} 
                    className={`backdrop-blur-md bg-white/5 border rounded-2xl p-5 flex justify-between items-start gap-4 hover:bg-white/[0.08] transition-all duration-300 ${
                      isHigh ? 'border-red-500/20' : 'border-amber-500/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isHigh ? 'bg-red-500/15 text-red-500 border border-red-500/30' : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono font-bold">
                          {task.gapType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white tracking-tight pt-1">{task.targetAsset}</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">{task.message}</p>
                    </div>

                    <Link href={task.actionUrl}>
                      <button className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/5 text-[10px] font-bold text-white rounded-lg flex items-center gap-1 transition">
                        Fix <ArrowRight size={10} />
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== 2. OPTIMIZATION RECOMMENDATIONS ==================== */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/10 pt-8">
            {/* Left: Discovery funnels */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  Discovery Optimization Engine
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Actionable changes targeting outbound YouTube traffic conversion paths.
                </p>
              </div>

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {data.recommendations.map((rec, idx) => {
                  const isHigh = rec.priority === 'high';
                  return (
                    <div 
                      key={idx}
                      className={`backdrop-blur-md bg-white/5 border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/[0.07] transition-all duration-300 ${
                        isHigh ? 'border-red-500/30' : 'border-white/10'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isHigh ? 'bg-red-500/15 text-red-500 border border-red-500/30' : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                            Category: {rec.type}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-bold text-white tracking-tight">{rec.title}</h4>
                        <p className="text-xs text-neutral-400 leading-relaxed">{rec.message}</p>
                      </div>

                      <Link href={rec.actionUrl} className="w-full md:w-auto">
                        <button className="w-full md:w-auto px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/5 text-white rounded-xl flex items-center justify-center gap-1.5 transition">
                          Configure <ArrowRight size={12} />
                        </button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Winners & Losers */}
            <div className="space-y-6">
              {/* Winners (Top Performers) */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-500" />
                  Winners (Top Performers)
                </h3>
                
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  {/* Concept Winner */}
                  {data.winners.concepts.length > 0 && (
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                      <span className="text-neutral-500">Top Concept</span>
                      <div className="text-right">
                        <Link href={`/concepts/${data.winners.concepts[0].slug}`} className="font-bold text-white hover:text-amber-500 transition-colors">
                          {data.winners.concepts[0].slug}
                        </Link>
                        <span className="block text-[9px] text-neutral-500 font-mono">{data.winners.concepts[0].total} clicks</span>
                      </div>
                    </div>
                  )}

                  {/* Region Winner */}
                  {data.winners.regions.length > 0 && (
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                      <span className="text-neutral-500">Top Region</span>
                      <div className="text-right">
                        <Link href={`/regions/${data.winners.regions[0].slug}`} className="font-bold text-white hover:text-amber-500 transition-colors">
                          {data.winners.regions[0].slug}
                        </Link>
                        <span className="block text-[9px] text-neutral-500 font-mono">{data.winners.regions[0].total} clicks</span>
                      </div>
                    </div>
                  )}

                  {/* Release Winner */}
                  {data.winners.releases.length > 0 && (
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                      <span className="text-neutral-500">Top Release</span>
                      <div className="text-right">
                        <Link href={`/release-detail/${data.winners.releases[0].slug}`} className="font-bold text-white hover:text-amber-500 transition-colors">
                          {data.winners.releases[0].slug}
                        </Link>
                        <span className="block text-[9px] text-neutral-500 font-mono">{data.winners.releases[0].total} clicks</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Losers (Underperforming Pathways) */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-red-500" />
                  Losers (Underperformers)
                </h3>

                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Traffic with Zero Clicks</span>
                    {data.losers.no_clicks.length === 0 ? (
                      <span className="text-xs text-neutral-600 block italic">None detected</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {data.losers.no_clicks.slice(0, 3).map((node, i) => (
                          <span key={i} className="px-2 py-1 bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] rounded-lg font-mono" title={`${node.page_views} page views`}>
                            {node.slug}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Low Conversion Rates (&lt;10%)</span>
                    {data.losers.low_conversion.length === 0 ? (
                      <span className="text-xs text-neutral-600 block italic">None detected</span>
                    ) : (
                      <div className="space-y-1.5">
                        {data.losers.low_conversion.slice(0, 2).map((node, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="text-neutral-400 font-semibold">{node.slug}</span>
                            <span className="font-mono text-red-500">{node.conversion_rate}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3. COMMAND REGISTRY EXPLORER ==================== */}
        {data && (
          <div className="space-y-6 border-t border-white/10 pt-8">
            {/* Custom Tab Switcher & Table Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div className="flex border-b border-white/10 pb-2 overflow-x-auto gap-1 w-full xl:w-auto scrollbar-hide">
                {TABS.map(tab => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setTableSearch('');
                      }}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition duration-300 whitespace-nowrap ${
                        isActive 
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500 font-black' 
                          : 'border border-transparent text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Table search filter */}
              <input
                type="text"
                placeholder={
                  activeTab === 'crawlers' ? "Search AI crawlers..." :
                  activeTab === 'brand_assets' ? "Search assets..." :
                  activeTab === 'serp_occupancy' ? "Search keywords..." :
                  activeTab === 'ai_citations' ? "Search AI platforms..." :
                  `Search ${activeTab.replace(/_/g, ' ')}...`
                }
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full xl:w-64 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/40 transition duration-300"
              />
            </div>

            {/* Dynamic performance/telemetry table */}
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {activeTab === 'crawlers' ? (
                // ── T1: AI & SEARCH CRAWLERS (CRAWL ACTIVITY) ───────────────────
                <div className="overflow-x-auto">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Cpu size={16} className="text-amber-500" />
                        AI Crawl Activity Monitor
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Telemetry tracking search bots and LLM crawler index requests hitting discovery pages.</p>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-neutral-500 uppercase tracking-wider bg-white/[0.01] opacity-70">
                        <th className="py-4 px-6">Crawler Name</th>
                        <th className="py-4 px-6 text-center">First Detected</th>
                        <th className="py-4 px-6 text-center">Last Scan Detected</th>
                        <th className="py-4 px-6 text-center">Total Crawl Hits</th>
                        <th className="py-4 px-6 text-center">Crawl Frequency</th>
                        <th className="py-4 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-neutral-300 font-medium font-mono">
                      {filteredActiveItems.map((item: any, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6 font-bold text-white font-sans">{item.crawler}</td>
                          <td className="py-4 px-6 text-center text-neutral-400">
                            {new Date(item.firstSeen).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-center text-neutral-400">
                            {new Date(item.lastSeen).toLocaleTimeString()}
                          </td>
                          <td className="py-4 px-6 text-center text-amber-500 font-bold">{item.pagesCrawled.toLocaleString()}</td>
                          <td className="py-4 px-6 text-center text-neutral-300">{item.frequency.toFixed(1)} req/hr</td>
                          <td className="py-4 px-6 text-right font-sans">
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-lg">
                              Active Sensor
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === 'ai_citations' ? (
                // ── T2: AI CITATION TRACKING ──────────────────────────────────
                <div className="overflow-x-auto">
                  <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      AI Citation & LLM Mentions Tracking
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Monitors mentions and citations of SufiPulse references in LLM search generator results.</p>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-neutral-500 uppercase tracking-wider bg-white/[0.01] opacity-70">
                        <th className="py-4 px-6">AI Search Engine</th>
                        <th className="py-4 px-6 text-center">Verified Citations</th>
                        <th className="py-4 px-6 text-center">Last Cited</th>
                        <th className="py-4 px-6">Sample Citation Query</th>
                        <th className="py-4 px-6 text-center">Citation Confidence</th>
                        <th className="py-4 px-6 text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-neutral-300 font-medium">
                      {filteredActiveItems.map((item: any, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6 font-bold text-white">{item.engine}</td>
                          <td className="py-4 px-6 text-center font-mono text-amber-500 font-bold">{item.citationCount}</td>
                          <td className="py-4 px-6 text-center font-mono text-neutral-400">
                            {new Date(item.lastCitedDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-neutral-400 italic text-[11px] font-serif max-w-xs truncate">
                            "{item.sampleQuery}"
                          </td>
                          <td className="py-4 px-6 text-center font-mono font-bold text-emerald-400">
                            {item.citationConfidence}%
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                              item.trend === 'increasing' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                              'bg-neutral-500/10 border border-neutral-500/20 text-neutral-400'
                            }`}>
                              {item.trend === 'increasing' ? '▲ Growth' : '■ Stable'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === 'brand_assets' ? (
                // ── T3: OFFICIAL BRAND ASSET REGISTRY ─────────────────────────
                <div className="overflow-x-auto">
                  <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck size={16} className="text-amber-500" />
                      Official Brand Asset Registry
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Verified catalog of the primary assets comprising the SufiPulse ecosystem identity.</p>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-neutral-500 uppercase tracking-wider bg-white/[0.01] opacity-70">
                        <th className="py-4 px-6">Asset Name</th>
                        <th className="py-4 px-6 text-center">Brand Type</th>
                        <th className="py-4 px-6">Target Url</th>
                        <th className="py-4 px-6">Description</th>
                        <th className="py-4 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-neutral-300 font-medium">
                      {filteredActiveItems.map((item: any, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6 font-bold text-white">{item.name}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-neutral-400 text-[10px] rounded-lg tracking-wider uppercase font-mono font-bold">
                              {item.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-[11px] text-neutral-400">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 hover:underline inline-flex items-center gap-0.5">
                              {item.url} <ExternalLink size={8} />
                            </a>
                          </td>
                          <td className="py-4 px-6 text-neutral-400 leading-relaxed text-xs">{item.description}</td>
                          <td className="py-4 px-6 text-right">
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg">
                              Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === 'serp_occupancy' ? (
                // ── T4: SERP SEARCH OCCUPANCY TRACKING ────────────────────────
                <div className="overflow-x-auto">
                  <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Search size={16} className="text-amber-500" />
                      Search Ownership & SERP Occupancy Tracker
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Measures result listings owned by the SufiPulse ecosystem on Page 1 of search result pages.</p>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-neutral-500 uppercase tracking-wider bg-white/[0.01] opacity-70">
                        <th className="py-4 px-6">Target Search Keyword</th>
                        <th className="py-4 px-6 text-center">Platform</th>
                        <th className="py-4 px-6 text-center">Owned Asset Results</th>
                        <th className="py-4 px-6">Top Ranking Pages</th>
                        <th className="py-4 px-6 text-center">SERP Occupancy Share</th>
                        <th className="py-4 px-6 text-right">Last Verified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-neutral-300 font-medium">
                      {filteredActiveItems.map((item: any, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6 font-bold text-white">"{item.keyword}"</td>
                          <td className="py-4 px-6 text-center font-mono capitalize text-neutral-400">{item.platform}</td>
                          <td className="py-4 px-6 text-center font-mono text-amber-500 font-bold">{item.ownedResultsCount} results</td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {item.rankingUrls.map((url: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 text-neutral-400 text-[10px] rounded-md font-mono">
                                  {url}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-amber-500 h-full" style={{ width: `${item.occupancyPercent}%` }}></div>
                              </div>
                              <span className="font-mono font-bold text-neutral-300 text-[10px]">{item.occupancyPercent}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-mono text-neutral-500 text-[10px]">
                            {new Date(item.lastChecked).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // ── T5: DEFAULT DISCOVERY NO DE TALLIES ─────────────────────────
                <div className="overflow-x-auto">
                  <div className="p-6 border-b border-white/5">
                    <h3 className="text-base font-bold text-white capitalize">{activeTabConfig?.label} Metrics Registry</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Telemetry metrics logs and conversion rate breakdown</p>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-neutral-500 uppercase tracking-wider bg-white/[0.01]">
                        <th className="py-4 px-6">Rank</th>
                        <th className="py-4 px-6">Entity / Slug</th>
                        <th className="py-4 px-6 text-center">Page Impressions</th>
                        <th className="py-4 px-6 text-center">Video Clicks</th>
                        <th className="py-4 px-6 text-center">Playlist Clicks</th>
                        <th className="py-4 px-6 text-center">Subscribe Clicks</th>
                        <th className="py-4 px-6 text-center font-bold text-neutral-400">Conversion Rate</th>
                        <th className="py-4 px-6 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-neutral-300 font-medium">
                      {filteredActiveItems.map((item: any, idx) => {
                        const rank = idx + 1;
                        let viewLink = '';
                        if (activeTabConfig) {
                          if (activeTabConfig.key === 'playlists') {
                            viewLink = `https://www.youtube.com/playlist?list=${item.slug}`;
                          } else if (activeTabConfig.key === 'releases') {
                            viewLink = `/release-detail/${item.slug}`;
                          } else {
                            viewLink = `/${activeTabConfig.path}/${item.slug}`;
                          }
                        }

                        return (
                          <tr key={item.slug} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-4 px-6 font-mono text-neutral-500 font-bold">
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-white group-hover:text-amber-500 transition-colors">
                                {item.slug}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center font-mono font-semibold text-neutral-400">
                              {item.page_views.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-center font-mono font-semibold text-neutral-400">
                              {item.video_clicks.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-center font-mono font-semibold text-neutral-400">
                              {item.playlist_clicks.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-center font-mono font-semibold text-neutral-400">
                              {item.subscribe_clicks.toLocaleString()}
                            </td>
                            <td className={`py-4 px-6 text-center font-mono font-bold ${
                              item.conversion_rate >= 15 ? 'text-emerald-500' :
                              item.conversion_rate >= 8 ? 'text-amber-500' : 'text-neutral-400'
                            }`}>
                              {item.conversion_rate}%
                            </td>
                            <td className="py-4 px-6 text-right">
                              <a
                                href={viewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-500 hover:text-amber-500 tracking-wider uppercase transition-colors"
                              >
                                View Live <ExternalLink size={10} />
                              </a>
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
        )}
      </div>
    </DashboardLayout>
  );
}
