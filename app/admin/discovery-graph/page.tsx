"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Network, Film, BarChart2, Eye, Clock, Percent, 
  Search, Link2, Unlink, RefreshCw, AlertTriangle, EyeOff, Globe, BookOpen, Music2, Tag, Award
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useAuth } from '@/app/contexts/AuthContext';

interface ReleaseSummary {
  id: string;
  slug: string;
  title: string;
  viewCount: number;
  durationFormatted: string;
  status: string;
}

interface JoinRelation {
  id: string;
  releaseId: string;
  registryId: string;
  relationshipType: 'concept' | 'theme' | 'mood' | 'region' | 'language' | 'diasporaMarket' | 'playlist';
  confidence: number;
}

interface PerformanceScore {
  slug: string;
  title: string;
  type: string;
  totalReleases: number;
  totalViews: number;
  totalWatchTime: number;
  averageCtr: number;
  discoveryScore: number;
  authorityScore: number;
}

const TABS: {
  key: 'concepts' | 'themes' | 'moods' | 'regions' | 'languages' | 'diasporaMarkets' | 'playlists';
  label: string;
  relationType: 'concept' | 'theme' | 'mood' | 'region' | 'language' | 'diasporaMarket' | 'playlist';
}[] = [
  { key: 'concepts', label: 'Concepts', relationType: 'concept' },
  { key: 'themes', label: 'Themes', relationType: 'theme' },
  { key: 'moods', label: 'Moods', relationType: 'mood' },
  { key: 'regions', label: 'Regions', relationType: 'region' },
  { key: 'languages', label: 'Languages', relationType: 'language' },
  { key: 'diasporaMarkets', label: 'Diaspora', relationType: 'diasporaMarket' },
  { key: 'playlists', label: 'Playlists', relationType: 'playlist' }
];

export default function DiscoveryGraphPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role.includes('admin') ?? false;

  useEffect(() => {
    if (!isAdmin && user) {
      router.push('/admin');
    }
  }, [user, isAdmin]);

  // Global Graph States
  const [activeTab, setActiveTab] = useState<'concepts' | 'themes' | 'moods' | 'regions' | 'languages' | 'diasporaMarkets' | 'playlists' | 'orphans'>('concepts');
  const [data, setData] = useState<{
    joins: JoinRelation[];
    orphans: ReleaseSummary[];
    performance: Record<string, PerformanceScore>;
  } | null>(null);
  
  const [registries, setRegistries] = useState<any>(null);
  const [releases, setReleases] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selection state
  const [selectedNodeSlug, setSelectedNodeSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orphanSearch, setOrphanSearch] = useState('');

  // Link release state
  const [linkReleaseId, setLinkReleaseId] = useState('');
  const [linking, setLinking] = useState(false);

  // Fetch all graph intelligence
  const fetchGraphData = async () => {
    setLoading(true);
    try {
      // 1. Fetch graph joins, orphans & performances
      const graphRes = await fetch('/api/admin/graph');
      // 2. Fetch all raw registries
      const registriesRes = await fetch('/api/admin/registries');
      // 3. Fetch all releases for dropdown options
      const releasesRes = await fetch('/api/releases');

      if (graphRes.ok && registriesRes.ok && releasesRes.ok) {
        const graphData = await graphRes.json();
        const registriesData = await registriesRes.json();
        const releasesData = await releasesRes.json();

        setData(graphData);
        setRegistries(registriesData);
        setReleases(releasesData);
        
        // Select first node if nothing is selected or previous selection is invalid
        const currentRegistryItems = registriesData[activeTab] || [];
        if (currentRegistryItems.length > 0) {
          if (!selectedNodeSlug || !currentRegistryItems.some((i: any) => i.slug === selectedNodeSlug)) {
            setSelectedNodeSlug(currentRegistryItems[0].slug);
          }
        } else {
          setSelectedNodeSlug(null);
        }
      } else {
        setError('Failed to fetch graph data from API endpoints.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading Discovery Graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchGraphData();
    }
  }, [isAdmin]);

  // Trigger default selection on tab changes
  useEffect(() => {
    if (registries) {
      const items = registries[activeTab] || [];
      if (items.length > 0) {
        setSelectedNodeSlug(items[0].slug);
      } else {
        setSelectedNodeSlug(null);
      }
    }
  }, [activeTab]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkReleaseId || !selectedNodeSlug) return;

    setLinking(true);
    setError(null);
    setSuccess(null);

    const currentTabInfo = TABS.find(t => t.key === activeTab);
    if (!currentTabInfo) return;

    try {
      const res = await fetch('/api/admin/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          releaseId: linkReleaseId,
          registryId: selectedNodeSlug,
          relationshipType: currentTabInfo.relationType,
          confidence: 1.0
        })
      });

      if (res.ok) {
        setSuccess('Relationship linked and validated successfully.');
        setLinkReleaseId('');
        fetchGraphData();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to link relationship.');
      }
    } catch (err: any) {
      setError(err.message || 'Error linking relationship.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (releaseId: string) => {
    if (!selectedNodeSlug) return;
    const currentTabInfo = TABS.find(t => t.key === activeTab);
    if (!currentTabInfo) return;

    if (!confirm('Are you sure you want to unlink this release from this registry node?')) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          releaseId,
          registryId: selectedNodeSlug,
          relationshipType: currentTabInfo.relationType
        })
      });

      if (res.ok) {
        setSuccess('Relationship unlinked successfully.');
        fetchGraphData();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to unlink relationship.');
      }
    } catch (err: any) {
      setError(err.message || 'Error unlinking relationship.');
    }
  };

  // Helper resolvers
  const currentTabItems = registries ? registries[activeTab] || [] : [];
  const filteredRegistryItems = currentTabItems.filter((item: any) => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedNodeDetails = currentTabItems.find((item: any) => item.slug === selectedNodeSlug);
  const selectedNodePerformance = data && selectedNodeSlug ? data.performance[selectedNodeSlug] : null;

  const currentTabInfo = TABS.find(t => t.key === activeTab);

  // List of releases linked to this specific node
  const linkedReleases = data && selectedNodeSlug && currentTabInfo
    ? data.joins
        .filter(j => j.registryId === selectedNodeSlug && j.relationshipType === currentTabInfo.relationType)
        .map(j => releases.find(r => r.id === j.releaseId))
        .filter(Boolean)
    : [];

  // Dropdown options of releases not already linked to this node
  const unlinkableReleases = releases.filter(r => 
    !linkedReleases.some(lr => lr.id === r.id)
  );

  const filteredOrphans = data ? data.orphans.filter(r =>
    r.title.toLowerCase().includes(orphanSearch.toLowerCase()) ||
    r.slug.toLowerCase().includes(orphanSearch.toLowerCase())
  ) : [];

  return (
    <DashboardLayout>
      <div className="px-4 py-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="flex items-center gap-2 transition" style={{color: 'var(--dash-text-secondary)'}}>
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2" style={{color: 'var(--dash-text-primary)'}}>
                <Network className="text-amber-500" /> Discovery Graph Explorer
              </h1>
              <p className="text-sm mt-1" style={{color: 'var(--dash-text-muted)'}}>
                Manage, score, and verify semantic relationships connecting Releases with governed Master Registries.
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={fetchGraphData}
              className="dashboard-btn-secondary px-4 py-2 flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Re-Sync Graph
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{backgroundColor: 'var(--dash-status-rejected-bg)', border: '1px solid var(--dash-status-rejected)'}}>
            <AlertTriangle size={18} className="mt-0.5" style={{color: 'var(--dash-status-rejected)'}} />
            <p className="text-sm" style={{color: 'var(--dash-status-rejected)'}}><strong>Error:</strong> {error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{backgroundColor: 'var(--dash-status-approved-bg)', border: '1px solid var(--dash-status-approved)'}}>
            <Globe size={18} className="mt-0.5" style={{color: 'var(--dash-status-approved)'}} />
            <p className="text-sm" style={{color: 'var(--dash-status-approved)'}}><strong>Success:</strong> {success}</p>
          </div>
        )}

        {/* Outer Tabs (Categories & Orphan Manager) */}
        <div className="flex flex-wrap gap-1 mb-8 border-b" style={{ borderColor: 'var(--dash-border)' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setError(null); setSuccess(null); }}
                className="px-4 py-3 text-sm font-semibold border-b-2 transition"
                style={{
                  color: isActive ? 'var(--dash-accent)' : 'var(--dash-text-secondary)',
                  borderBottomColor: isActive ? 'var(--dash-accent)' : 'transparent',
                }}
              >
                {tab.label}
              </button>
            );
          })}
          
          {/* Orphans Special Tab */}
          <button
            onClick={() => { setActiveTab('orphans' as any); setSelectedNodeSlug(null); setError(null); setSuccess(null); }}
            className="px-4 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5"
            style={{
              color: activeTab === ('orphans' as any) ? 'var(--dash-status-warning)' : 'var(--dash-text-secondary)',
              borderBottomColor: activeTab === ('orphans' as any) ? 'var(--dash-status-warning)' : 'transparent',
            }}
          >
            <AlertTriangle size={14} /> Orphans Panel ({data?.orphans.length ?? 0})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20" style={{color: 'var(--dash-text-muted)'}}>
            <RefreshCw className="animate-spin mx-auto mb-3" size={32} />
            Resolving Graph relationships and compiling performance scores...
          </div>
        ) : activeTab === ('orphans' as any) ? (
          /* ORPHANS VIEW */
          <div className="dashboard-card p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2" style={{color: 'var(--dash-text-primary)'}}>
                  <AlertTriangle className="text-amber-500" /> Releases Without Metadata Connections
                </h3>
                <p className="text-xs" style={{color: 'var(--dash-text-muted)'}}>
                  These releases lack any verified Concept, Theme, Mood, Region, or Playlist links. Link them to improve SEO discovery.
                </p>
              </div>
              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-3.5" style={{color: 'var(--dash-text-muted)'}} />
                <input
                  type="text"
                  placeholder="Search orphan releases..."
                  value={orphanSearch}
                  onChange={(e) => setOrphanSearch(e.target.value)}
                  className="form-input w-full pl-9 text-xs"
                />
              </div>
            </div>

            {filteredOrphans.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{borderColor: 'var(--dash-border)', color: 'var(--dash-text-muted)'}}>
                <Globe size={40} className="mx-auto mb-3 opacity-20" />
                <h4 className="text-sm font-semibold">Clean Health Check Passed</h4>
                <p className="text-xs mt-1">Zero orphan releases found. Every release is connected to the Discovery Graph!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--dash-border)' }}>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{color: 'var(--dash-text-muted)'}}>Release Title</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{color: 'var(--dash-text-muted)'}}>Slug</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{color: 'var(--dash-text-muted)'}}>Status</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{color: 'var(--dash-text-muted)'}}>Lifetime Views</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-right" style={{color: 'var(--dash-text-muted)'}}>Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                    {filteredOrphans.map(orphan => (
                      <tr key={orphan.id} className="hover:bg-[var(--dash-bg-hover)] transition">
                        <td className="py-4 pr-3">
                          <div className="font-semibold text-sm" style={{color: 'var(--dash-text-primary)'}}>{orphan.title}</div>
                        </td>
                        <td className="py-4 pr-3 font-mono text-xs" style={{color: 'var(--dash-text-muted)'}}>
                          {orphan.slug}
                        </td>
                        <td className="py-4 pr-3 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold`} style={{
                            backgroundColor: orphan.status === 'published' ? 'var(--dash-status-approved-bg)' : 'var(--dash-status-review-bg)',
                            color: orphan.status === 'published' ? 'var(--dash-status-approved)' : 'var(--dash-status-review)'
                          }}>
                            {orphan.status}
                          </span>
                        </td>
                        <td className="py-4 pr-3 text-xs font-mono" style={{color: 'var(--dash-text-secondary)'}}>
                          {orphan.viewCount?.toLocaleString() ?? 0}
                        </td>
                        <td className="py-4 text-right">
                          <Link href={`/admin/cms-releases/${orphan.id}`}>
                            <button className="dashboard-btn-primary px-3 py-1.5 text-[10px] flex items-center gap-1 ml-auto">
                              <Tag size={12} /> Edit Metadata
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD GRAPH EXPLORER VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left sidebar: registry item list */}
            <div className="lg:col-span-1 space-y-4">
              <div className="dashboard-card p-4 space-y-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3.5" style={{color: 'var(--dash-text-muted)'}} />
                  <input
                    type="text"
                    placeholder={`Search ${TABS.find(t => t.key === activeTab)?.label}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input w-full pl-9 text-xs"
                  />
                </div>

                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                  {filteredRegistryItems.length === 0 ? (
                    <div className="text-center py-8 text-xs" style={{color: 'var(--dash-text-muted)'}}>
                      No nodes matching query.
                    </div>
                  ) : (
                    filteredRegistryItems.map((item: any) => {
                      const isSelected = selectedNodeSlug === item.slug;
                      return (
                        <button
                          key={item.slug}
                          onClick={() => { setSelectedNodeSlug(item.slug); setError(null); setSuccess(null); }}
                          className="w-full text-left p-3 rounded-lg text-xs font-semibold transition flex items-center justify-between border"
                          style={{
                            backgroundColor: isSelected ? 'var(--dash-accent-muted)' : 'var(--dash-bg-secondary)',
                            borderColor: isSelected ? 'var(--dash-accent)' : 'transparent',
                            color: isSelected ? 'var(--dash-text-primary)' : 'var(--dash-text-secondary)'
                          }}
                        >
                          <div>
                            <div>{item.title}</div>
                            <div className="font-mono text-[10px] mt-0.5 opacity-60">{item.slug}</div>
                          </div>
                          {!item.isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)'}}>
                              Inactive
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right content: performance & joins */}
            <div className="lg:col-span-2 space-y-6">
              {selectedNodeDetails ? (
                <>
                  {/* Registry Details & Performance Score Grid */}
                  <div className="dashboard-card p-6 space-y-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold" style={{color: 'var(--dash-text-primary)'}}>
                          {selectedNodeDetails.title}
                        </h2>
                        {!selectedNodeDetails.isPublic && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1" style={{backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)'}}>
                            <EyeOff size={10} /> Private Node
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{color: 'var(--dash-text-secondary)'}}>
                        {selectedNodeDetails.description || 'No description provided.'}
                      </p>
                      
                      {selectedNodeDetails.wikidataId && (
                        <div className="mt-3 flex gap-4 text-[10px] font-mono">
                          <span className="flex items-center gap-1" style={{color: 'var(--dash-text-muted)'}}>
                            Wikidata Entity: 
                            <a 
                              href={`https://www.wikidata.org/wiki/${selectedNodeDetails.wikidataId}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-amber-500 hover:underline"
                            >
                              {selectedNodeDetails.wikidataId}
                            </a>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Performance metrics dashboard widgets */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t" style={{borderColor: 'var(--dash-border)'}}>
                      
                      <div className="p-4 rounded-lg flex flex-col justify-between" style={{backgroundColor: 'var(--dash-bg-secondary)'}}>
                        <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{color: 'var(--dash-text-muted)'}}>
                          <Network size={12} className="text-amber-500" /> Discovery Score
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-2">
                          <span className="text-2xl font-black" style={{color: 'var(--dash-text-primary)'}}>
                            {selectedNodePerformance?.discoveryScore ?? 0}
                          </span>
                          <span className="text-[10px]" style={{color: 'var(--dash-text-muted)'}}>/100</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg flex flex-col justify-between" style={{backgroundColor: 'var(--dash-bg-secondary)'}}>
                        <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{color: 'var(--dash-text-muted)'}}>
                          <Award size={12} className="text-purple-500" /> Authority Score
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-2">
                          <span className="text-2xl font-black" style={{color: 'var(--dash-text-primary)'}}>
                            {selectedNodePerformance?.authorityScore ?? 0}
                          </span>
                          <span className="text-[10px]" style={{color: 'var(--dash-text-muted)'}}>/100</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg flex flex-col justify-between" style={{backgroundColor: 'var(--dash-bg-secondary)'}}>
                        <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{color: 'var(--dash-text-muted)'}}>
                          <Film size={12} /> Linked Releases
                        </span>
                        <span className="text-2xl font-black mt-2" style={{color: 'var(--dash-text-primary)'}}>
                          {selectedNodePerformance?.totalReleases ?? 0}
                        </span>
                      </div>

                      <div className="p-4 rounded-lg flex flex-col justify-between" style={{backgroundColor: 'var(--dash-bg-secondary)'}}>
                        <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{color: 'var(--dash-text-muted)'}}>
                          <Eye size={12} /> Measured Views
                        </span>
                        <span className="text-2xl font-black mt-2 font-mono" style={{color: 'var(--dash-text-primary)'}}>
                          {selectedNodePerformance?.totalViews.toLocaleString() ?? 0}
                        </span>
                      </div>

                      <div className="p-4 rounded-lg flex flex-col justify-between" style={{backgroundColor: 'var(--dash-bg-secondary)'}}>
                        <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{color: 'var(--dash-text-muted)'}}>
                          <Clock size={12} /> Est. Watch Time
                        </span>
                        <span className="text-2xl font-black mt-2 font-mono" style={{color: 'var(--dash-text-primary)'}}>
                          {selectedNodePerformance?.totalWatchTime.toLocaleString() ?? 0} hrs
                        </span>
                      </div>

                      <div className="p-4 rounded-lg flex flex-col justify-between" style={{backgroundColor: 'var(--dash-bg-secondary)'}}>
                        <span className="text-[10px] uppercase font-bold flex items-center gap-1" style={{color: 'var(--dash-text-muted)'}}>
                          <Percent size={12} /> Est. CTR
                        </span>
                        <span className="text-2xl font-black mt-2 font-mono" style={{color: 'var(--dash-text-primary)'}}>
                          {selectedNodePerformance?.averageCtr ?? 0}%
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Connected Releases & Linking Tool */}
                  <div className="dashboard-card p-6 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4" style={{borderColor: 'var(--dash-border)'}}>
                      <h3 className="text-lg font-bold" style={{color: 'var(--dash-text-primary)'}}>
                        Verified Graph Relationships ({linkedReleases.length})
                      </h3>

                      {/* Add connection form inline */}
                      <form onSubmit={handleLink} className="flex items-center gap-2">
                        <select
                          value={linkReleaseId}
                          onChange={(e) => setLinkReleaseId(e.target.value)}
                          className="form-input text-xs py-1.5"
                          style={{maxWidth: '220px'}}
                        >
                          <option value="">-- Choose Release to Link --</option>
                          {unlinkableReleases.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.title} ({r.slug})
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="dashboard-btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                          disabled={linking || !linkReleaseId}
                        >
                          <Link2 size={12} /> Link
                        </button>
                      </form>
                    </div>

                    {linkedReleases.length === 0 ? (
                      <div className="text-center py-12 text-xs" style={{color: 'var(--dash-text-muted)'}}>
                        No releases currently connected to this node. Use the linking dropdown above to construct a relationship.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedReleases.map((release: any) => (
                          <div
                            key={release.id}
                            className="p-3 rounded-lg flex items-center justify-between border hover:bg-[var(--dash-bg-hover)] transition"
                            style={{borderColor: 'var(--dash-border)'}}
                          >
                            <div>
                              <div className="font-semibold text-xs" style={{color: 'var(--dash-text-primary)'}}>
                                {release.title}
                              </div>
                              <div className="text-[10px] font-mono mt-0.5" style={{color: 'var(--dash-text-muted)'}}>
                                {release.slug} | Views: {release.viewCount?.toLocaleString() ?? 0}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnlink(release.id)}
                              className="p-1.5 text-neutral-400 hover:text-red-500 rounded transition"
                              title="Unlink from this node"
                            >
                              <Unlink size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="dashboard-card p-12 text-center" style={{color: 'var(--dash-text-muted)'}}>
                  <Network className="w-16 h-16 mx-auto mb-4 opacity-20 animate-pulse" />
                  <h3 className="font-bold text-sm" style={{color: 'var(--dash-text-primary)'}}>No Node Selected</h3>
                  <p className="text-xs max-w-sm mx-auto mt-1">
                    Select a taxonomy node from the left navigation drawer to explore its graph relationships, performance metrics, and connected tracks.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
