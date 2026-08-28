'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Disc3, Youtube, CheckCircle2, AlertTriangle, ArrowRight,
  RefreshCw, Search, Edit3, Check, X, ExternalLink, Sparkles, SlidersHorizontal
} from 'lucide-react';
import Link from 'next/link';

interface ReleaseReviewItem {
  id: string;
  slug: string;
  youtubeId: string;
  canonicalTitle: string;
  youtubeTitle: string;
  subtitle?: string;
  canonicalThumbnail: string;
  youtubeThumbnailUrl: string;
  canonicalStatus: 'verified' | 'inferred' | 'unresolved';
  governanceOrigin: 'native_governed' | 'legacy_registry';
  metadataStatus: 'synced' | 'drift_detected' | 'overridden';
  hasTitleDrift: boolean;
  hasThumbnailDrift: boolean;
  lastYoutubeSyncAt?: string;
  updatedAt?: string;
  views: number;
  format: string;
}

export default function MetadataAuthorityPage() {
  const [releases, setReleases] = useState<ReleaseReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'drift' | 'unresolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ReleaseReviewItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editGovernance, setEditGovernance] = useState<'native_governed' | 'legacy_registry'>('native_governed');

  const fetchReleases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/metadata-authority');
      if (!res.ok) throw new Error('Failed to fetch metadata authority records');
      const data = await res.json();
      setReleases(data.releases || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleDecision = async (releaseId: string, action: 'keep_canonical' | 'adopt_youtube') => {
    setActionLoadingId(releaseId);
    try {
      const res = await fetch('/api/admin/metadata-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      await fetchReleases();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setActionLoadingId(editingItem.id);
    try {
      const res = await fetch('/api/admin/metadata-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId: editingItem.id,
          action: 'edit_canonical',
          newCanonicalTitle: editTitle,
          newSubtitle: editSubtitle,
          newGovernanceOrigin: editGovernance,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setEditingItem(null);
      await fetchReleases();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (item: ReleaseReviewItem) => {
    setEditingItem(item);
    setEditTitle(item.canonicalTitle);
    setEditSubtitle(item.subtitle || '');
    setEditGovernance(item.governanceOrigin || 'native_governed');
  };

  const filteredReleases = useMemo(() => {
    return releases.filter(r => {
      if (filterMode === 'drift' && !r.hasTitleDrift && !r.hasThumbnailDrift) return false;
      if (filterMode === 'unresolved' && r.canonicalStatus === 'verified') return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.canonicalTitle.toLowerCase().includes(q) ||
          r.youtubeTitle.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.youtubeId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [releases, filterMode, searchQuery]);

  const stats = useMemo(() => {
    const total = releases.length;
    const drifts = releases.filter(r => r.hasTitleDrift || r.hasThumbnailDrift).length;
    const verified = releases.filter(r => r.canonicalStatus === 'verified').length;
    const synced = releases.filter(r => r.metadataStatus === 'synced').length;
    return { total, drifts, verified, synced };
  }, [releases]);

  return (
    <div className="min-h-screen bg-[#07090E] text-white p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                SufiPulse Diwan-e-Amanat
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Metadata Authority Review
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Strict dual-authority governance: Canonical Registry Title represents immutable artistic identity; YouTube Title represents live distribution packaging & A/B variants.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReleases}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/admin/cms-releases"
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
            >
              CMS Releases
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Catalogue</div>
            <div className="text-3xl font-black text-white">{stats.total}</div>
          </div>
          <div className="bg-amber-400/[0.04] border border-amber-400/20 rounded-2xl p-5">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Packaging Drifts</div>
            <div className="text-3xl font-black text-amber-400">{stats.drifts}</div>
          </div>
          <div className="bg-emerald-400/[0.04] border border-emerald-400/20 rounded-2xl p-5">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Verified Canonical</div>
            <div className="text-3xl font-black text-emerald-400">{stats.verified}</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Synced Status</div>
            <div className="text-3xl font-black text-white">{stats.synced}</div>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
                filterMode === 'all' ? 'bg-amber-400 text-black' : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              All Records ({stats.total})
            </button>
            <button
              onClick={() => setFilterMode('drift')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
                filterMode === 'drift' ? 'bg-amber-400 text-black' : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Drifts Detected ({stats.drifts})
            </button>
            <button
              onClick={() => setFilterMode('unresolved')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${
                filterMode === 'unresolved' ? 'bg-amber-400 text-black' : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Unresolved ({stats.total - stats.verified})
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search canonical title, YouTube title, slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>
        </div>

        {/* Comparison List */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-amber-400" />
            Loading catalogue metadata records...
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-sm bg-white/[0.01] border border-white/5 rounded-3xl">
            No metadata records match the current filters.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReleases.map((item) => (
              <div 
                key={item.id}
                className={`bg-white/[0.02] border rounded-3xl p-6 transition-all ${
                  item.hasTitleDrift ? 'border-amber-400/30 shadow-[0_0_30px_rgba(245,158,11,0.05)]' : 'border-white/5'
                }`}
              >
                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wider ${
                      item.governanceOrigin === 'native_governed' 
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}>
                      {item.governanceOrigin === 'native_governed' ? 'Governed Release' : 'Legacy Registry'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                      item.canonicalStatus === 'verified'
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                        : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    }`}>
                      {item.canonicalStatus === 'verified' ? 'Canonical Verified' : 'Inferred'}
                    </span>
                    <span className="text-zinc-500 font-mono">slug: {item.slug}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.hasTitleDrift && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px] bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                        <AlertTriangle className="w-3.5 h-3.5" /> Title Packaging Drift
                      </span>
                    )}
                    {item.hasThumbnailDrift && (
                      <span className="flex items-center gap-1 text-amber-300 font-bold text-[11px] bg-amber-300/10 px-2.5 py-1 rounded-lg border border-amber-300/20">
                        <AlertTriangle className="w-3.5 h-3.5" /> Artwork Drift
                      </span>
                    )}
                  </div>
                </div>

                {/* Dual Comparison Columns */}
                <div className="grid md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Canonical Registry Authority */}
                  <div className="md:col-span-5 space-y-3 p-5 bg-black/40 border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                          SufiPulse Canonical Registry
                        </span>
                      </div>
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-zinc-400 hover:text-white text-xs flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="text-lg font-bold text-white leading-snug">
                        {item.canonicalTitle}
                      </div>
                      {item.subtitle && (
                        <div className="text-xs text-zinc-400 italic">
                          {item.subtitle}
                        </div>
                      )}
                    </div>

                    {item.canonicalThumbnail && (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/5 max-w-[200px]">
                        <img 
                          src={item.canonicalThumbnail} 
                          alt="Canonical Artwork" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/80 text-[9px] font-mono px-1.5 py-0.5 rounded text-zinc-300">
                          Canonical Artwork
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center Column: Sync Drift & Actions */}
                  <div className="md:col-span-2 flex flex-col items-center justify-center space-y-3 py-4">
                    <ArrowRight className="w-5 h-5 text-zinc-500 hidden md:block" />
                    
                    <button
                      onClick={() => handleDecision(item.id, 'keep_canonical')}
                      disabled={actionLoadingId === item.id}
                      className="w-full py-2 px-3 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/40 border border-white/10 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Keep Canonical
                    </button>

                    <button
                      onClick={() => handleDecision(item.id, 'adopt_youtube')}
                      disabled={actionLoadingId === item.id || !item.hasTitleDrift}
                      className="w-full py-2 px-3 bg-amber-400/10 hover:bg-amber-400 hover:text-black border border-amber-400/20 text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      Adopt YouTube
                    </button>
                  </div>

                  {/* Right Column: YouTube Live Packaging */}
                  <div className="md:col-span-5 space-y-3 p-5 bg-black/40 border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-red-400">
                          Current YouTube Distribution Packaging
                        </span>
                      </div>
                      {item.youtubeId && (
                        <a 
                          href={`https://youtube.com/watch?v=${item.youtubeId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-red-400 text-xs flex items-center gap-1"
                        >
                          Watch <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="text-sm font-medium text-zinc-300 leading-snug break-words">
                      {item.youtubeTitle}
                    </div>

                    {item.youtubeThumbnailUrl && (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/5 max-w-[200px]">
                        <img 
                          src={item.youtubeThumbnailUrl} 
                          alt="YouTube Live Thumbnail" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/80 text-[9px] font-mono px-1.5 py-0.5 rounded text-zinc-300">
                          YouTube Thumbnail
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inline Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0D111A] border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" /> Edit Canonical Metadata
                </h3>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Canonical Title (Artistic Name)</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Subtitle / Thematic Descriptor</label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    placeholder="e.g. Kashmir: Water Bears Witness"
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Governance Provenance</label>
                  <select
                    value={editGovernance}
                    onChange={(e) => setEditGovernance(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="native_governed">Governed Release (SufiPulse Studio)</option>
                    <option value="legacy_registry">Legacy Registry (Archival Indexed)</option>
                  </select>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-zinc-400 text-[11px] leading-relaxed">
                  Note: Editing canonical metadata preserves the existing permanent URL slug (<span className="text-amber-400 font-mono">{editingItem.slug}</span>) to ensure permanent SEO citation.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoadingId === editingItem.id}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
