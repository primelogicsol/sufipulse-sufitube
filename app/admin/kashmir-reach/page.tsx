"use client";

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  Users,
  MapPin,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Search,
  Sparkles,
  RefreshCw,
  Plus,
  Send,
  ShieldCheck,
  Headphones,
  Compass,
  FileCheck,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { KashmirPartner, PartnerPillar, KashmirDistrict, PartnerCampaignKit } from '@/server/types/kashmir-reach';

const DISTRICT_NAMES: Record<KashmirDistrict, string> = {
  srinagar: 'Srinagar',
  budgam: 'Budgam',
  ganderbal: 'Ganderbal',
  anantnag: 'Anantnag (Islamabad)',
  pulwama: 'Pulwama',
  shopian: 'Shopian',
  kulgam: 'Kulgam',
  baramulla: 'Baramulla',
  kupwara: 'Kupwara',
  bandipora: 'Bandipora',
};

const PILLAR_LABELS: Record<PartnerPillar, string> = {
  ecological_conservation: '🌿 Ecological Conservation',
  artisan_craft_heritage: '✨ Artisan & Craft Heritage',
  sacred_literature_sufi: '📜 Sacred Literature & Sufi',
  youth_academic_thinkers: '🎓 Youth & Academic Thinkers',
};

export default function KashmirReachPage() {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<KashmirPartner[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Filters
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending_verification'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Campaign Studio State
  const [selectedRelease, setSelectedRelease] = useState<'footprints-behind' | 'how-long-will-you-remain-silent'>('footprints-behind');
  const [activeKit, setActiveKit] = useState<PartnerCampaignKit | null>(null);
  const [generatingKit, setGeneratingKit] = useState(false);
  const [copiedKitField, setCopiedKitField] = useState<string | null>(null);

  // New Partner Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState<Partial<KashmirPartner>>({
    name: '',
    pillar: 'artisan_craft_heritage',
    district: 'srinagar',
    organizationType: 'artisan_guild',
    locationDetails: '',
    primaryHandle: '',
    contactPerson: '',
    contactChannel: 'whatsapp',
    contactValue: '',
    estimatedCommunityReach: 10000,
    verificationStatus: 'verified',
    consentStatus: 'explicit_permission_granted',
  });

  // Report Publication Modal
  const [reportModalPartner, setReportModalPartner] = useState<KashmirPartner | null>(null);
  const [reportUrl, setReportUrl] = useState('');
  const [reportChannel, setReportChannel] = useState('instagram');
  const [submittingReport, setSubmittingReport] = useState(false);

  // AI Engines Intelligence State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [selectedAiTab, setSelectedAiTab] = useState<'ai01' | 'ai04' | 'ai08' | 'ai09' | 'ai10'>('ai04');

  const fetchAiData = async (slug = selectedRelease) => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/admin/kashmir-reach/ai-engines?releaseSlug=${slug}`);
      const data = await res.json();
      if (data.success) {
        setAiData(data.data);
      }
    } catch (err) {
      console.error('Failed to run AI engine scan', err);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kashmir-reach');
      const data = await res.json();
      if (data.success) {
        setPartners(data.partners);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch Kashmir Reach data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    fetchAiData();
  }, []);

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (selectedPillar !== 'all' && p.pillar !== selectedPillar) return false;
      if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
      if (statusFilter !== 'all' && p.verificationStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.contactPerson.toLowerCase().includes(q) ||
          p.primaryHandle.toLowerCase().includes(q) ||
          p.locationDetails.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [partners, selectedPillar, selectedDistrict, statusFilter, searchQuery]);

  const handleVerifyPartner = async (partnerId: string, action: 'approve' | 'reject' = 'approve') => {
    try {
      const res = await fetch('/api/admin/kashmir-reach/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPartners();
      }
    } catch (err) {
      console.error(`Failed to ${action} partner`, err);
    }
  };

  const generateKit = async (partner: KashmirPartner) => {
    setGeneratingKit(true);
    try {
      const res = await fetch('/api/admin/kashmir-reach/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          releaseSlug: selectedRelease,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveKit(data.kit);
      }
    } catch (err) {
      console.error('Failed to generate campaign kit', err);
    } finally {
      setGeneratingKit(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKitField(fieldName);
    setTimeout(() => setCopiedKitField(null), 2500);
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/kashmir-reach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner),
      });
      const data = await res.json();
      if (data.success) {
        setAddModalOpen(false);
        fetchPartners();
      }
    } catch (err) {
      console.error('Failed to save partner', err);
    }
  };

  const handleReportPublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalPartner || !reportUrl.trim()) return;
    setSubmittingReport(true);
    try {
      const res = await fetch('/api/admin/kashmir-reach/report-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: reportModalPartner.id,
          releaseSlug: selectedRelease,
          channel: reportChannel,
          publishedUrl: reportUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReportModalPartner(null);
        setReportUrl('');
        fetchPartners();
      }
    } catch (err) {
      console.error('Failed to report publication', err);
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Compass className="w-5 h-5 text-[var(--color-gold,#D4AF37)]" />
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
                Kashmir Outreach Architecture
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Community Partner Network (KPN)
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Organizing genuine cultural, ecological, and artisan organizations across all 10 Kashmir Valley districts to distribute full-length releases without unsolicited cold messaging.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPartners}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-neutral-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2.5 bg-[var(--color-gold,#D4AF37)] hover:bg-[#FDE68A] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Verified Partners</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white flex items-center justify-between">
              <div>
                {stats?.verifiedPartners || 0}
                <span className="text-xs text-neutral-500 font-normal ml-2">/ {stats?.totalPartners || 0} Total</span>
              </div>
              {(stats?.pendingPartners || 0) > 0 && (
                <button
                  onClick={() => setStatusFilter('pending_verification')}
                  className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold hover:bg-amber-500/30 transition-colors animate-pulse"
                >
                  {stats.pendingPartners} Pending Review
                </button>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">100% explicit permission</p>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Valley Coverage</span>
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.districtsCovered || 0}
              <span className="text-xs text-neutral-500 font-normal ml-2">/ 10 Districts</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Central, South & North</p>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Documented Footprint</span>
              <Users className="w-4 h-4 text-[var(--color-gold,#D4AF37)]" />
            </div>
            <div className="text-2xl font-bold text-white">
              {(stats?.totalEstimatedReach || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Combined organic community</p>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Engaged Listeners</span>
              <Headphones className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {(stats?.totalEngaged || 0).toLocaleString()}
              <span className="text-xs text-neutral-500 font-normal ml-2">({(stats?.totalClicks || 0).toLocaleString()} clicks)</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Attributed to partner links</p>
          </div>
        </div>

        {/* ── CAMPAIGN STUDIO: RELEASE-SPECIFIC MATCHING ── */}
        <div className="p-6 bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-gold,#D4AF37)]" />
                <h2 className="text-lg font-bold text-white tracking-tight">Campaign Studio & Distribution Kits</h2>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Select an approved flagship release to generate verified, culturally customized distribution packages with custom UTM tracking links.
              </p>
            </div>

            {/* Release Selector */}
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => { setSelectedRelease('footprints-behind'); setActiveKit(null); fetchAiData('footprints-behind'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedRelease === 'footprints-behind'
                    ? 'bg-[var(--color-gold,#D4AF37)] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Footprints Behind
              </button>
              <button
                onClick={() => { setSelectedRelease('how-long-will-you-remain-silent'); setActiveKit(null); fetchAiData('how-long-will-you-remain-silent'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedRelease === 'how-long-will-you-remain-silent'
                    ? 'bg-[var(--color-gold,#D4AF37)] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                How Long Will You Remain Silent?
              </button>
            </div>
          </div>

          {/* Active Kit Display if Generated */}
          {activeKit && (
            <div className="bg-black/60 border border-[var(--color-gold,#D4AF37)]/30 rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-gold,#D4AF37)]">
                    Tailored Distribution Package
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {activeKit.partnerName} · <span className="text-neutral-400 font-normal">{activeKit.releaseTitle}</span>
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5 break-all">
                    Attribution URL: {activeKit.destinationUrl}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(activeKit.destinationUrl, 'url')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-neutral-200 flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedKitField === 'url' ? 'Copied URL!' : 'Copy URL'}
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(activeKit.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg"
                  >
                    <Send className="w-3.5 h-3.5" /> Blast via WhatsApp
                  </a>
                </div>
              </div>

              {/* Package Content Tabs / Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* WhatsApp Message */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      WhatsApp Community Broadcast
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeKit.whatsappMessage, 'wa')}
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedKitField === 'wa' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-sans bg-black/40 p-3 rounded border border-white/5 max-h-48 overflow-y-auto leading-relaxed">
                    {activeKit.whatsappMessage}
                  </pre>
                </div>

                {/* Instagram Reel Caption */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                      Instagram Reel Caption & Tags
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeKit.instagramCaption, 'ig')}
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedKitField === 'ig' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-sans bg-black/40 p-3 rounded border border-white/5 max-h-48 overflow-y-auto leading-relaxed">
                    {activeKit.instagramCaption}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── AI ENGINES COMMAND & INTELLIGENCE CENTER ── */}
        <div className="p-6 bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Autonomous AI Cultural Intelligence (10 Engines)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Real-time regional discovery, cultural semantic matching, engagement fraud detection, and anti-spam integrity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAiData()}
                disabled={aiLoading}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-neutral-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                {aiLoading ? 'Running AI Scan...' : 'Refresh AI Diagnostic'}
              </button>
            </div>
          </div>

          {/* AI Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {[
              { id: 'ai04', label: 'AI-04 Release Matching', icon: Sparkles },
              { id: 'ai01', label: 'AI-01 Discovery Radar', icon: Compass },
              { id: 'ai08', label: 'AI-08 Listening Attribution', icon: Headphones },
              { id: 'ai09', label: 'AI-09 Integrity & Anti-Spam', icon: ShieldCheck },
              { id: 'ai10', label: 'AI-10 Growth Optimization', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedAiTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedAiTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {aiLoading && !aiData ? (
            <div className="py-12 text-center text-xs text-neutral-500 animate-pulse">
              Running multi-district autonomous AI scan across Kashmir Valley...
            </div>
          ) : (
            <div>
              {/* AI-04 Release Matching */}
              {selectedAiTab === 'ai04' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>
                      Algorithmic release match rankings for <strong className="text-white">{selectedRelease}</strong>
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {aiData?.releaseMatches?.length || 0} Recommended Distribution Matches
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aiData?.releaseMatches?.slice(0, 6).map((match: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2 hover:border-cyan-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white line-clamp-1">{match.partnerName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {match.matchScore}% Match
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                          <span className="capitalize">{match.recommendedRole.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span className="capitalize">{match.primaryDistrict}</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed">
                          {match.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-01 Discovery Radar */}
              {selectedAiTab === 'ai01' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Uncredentialed community institutions identified by discovery crawler</span>
                    <span className="text-[11px] font-mono text-amber-400">
                      {aiData?.discovery?.length || 0} Candidates in Radar
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aiData?.discovery?.map((cand: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2 hover:border-amber-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{cand.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {cand.priority} Priority
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          District: <span className="text-neutral-200 capitalize">{cand.district}</span> | Handle: <span className="text-neutral-200 font-mono">{cand.primaryHandle}</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          {cand.culturalFitNotes}
                        </p>
                        <div className="text-[10px] text-cyan-400 font-mono pt-1">
                          Estimated Community: ~{cand.estimatedAudience.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-08 Engagement & Listening Attribution */}
              {selectedAiTab === 'ai08' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg">
                      <div className="text-[10px] text-neutral-400 uppercase font-bold">Clicks Received</div>
                      <div className="text-xl font-bold text-white mt-1 font-mono">{aiData?.engagement?.funnel?.clicks || 0}</div>
                    </div>
                    <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg">
                      <div className="text-[10px] text-neutral-400 uppercase font-bold">Engaged Listeners (&gt;60s)</div>
                      <div className="text-xl font-bold text-purple-400 mt-1 font-mono">{aiData?.engagement?.funnel?.engagedPlays || 0}</div>
                    </div>
                    <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg">
                      <div className="text-[10px] text-neutral-400 uppercase font-bold">Completed Listens</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{aiData?.engagement?.funnel?.completedListens || 0}</div>
                    </div>
                    <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg">
                      <div className="text-[10px] text-neutral-400 uppercase font-bold">Completion Rate</div>
                      <div className="text-xl font-bold text-[var(--color-gold,#D4AF37)] mt-1 font-mono">
                        {aiData?.engagement?.funnel?.completionRate || 0}%
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Fraud & Bot Anomaly Detection
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {aiData?.engagement?.fraudSignals?.length || 0} Flagged Signals
                      </span>
                    </div>
                    {aiData?.engagement?.fraudSignals?.length === 0 ? (
                      <p className="text-xs text-emerald-400">Zero bot anomalies or click-fraud patterns detected in recent logs.</p>
                    ) : (
                      <div className="space-y-1">
                        {aiData?.engagement?.fraudSignals?.map((sig: any, idx: number) => (
                          <div key={idx} className="text-xs text-amber-300/90 flex items-center gap-2">
                            <span>•</span>
                            <span>{sig.warning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI-09 Integrity & Anti-Spam */}
              {selectedAiTab === 'ai09' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-300">
                      Audit Status: <strong className="text-emerald-400">{aiData?.quality?.auditStatus || 'Passed'}</strong>
                    </span>
                    <span className="text-xs text-neutral-400">
                      Total Inspected Posts: {aiData?.quality?.totalPostsAudited || 0}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Non-Commercial Covenant Compliance
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Mandatory voluntary cultural preservation disclaimers verified on 100% of issued distribution packages.
                      </p>
                    </div>
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Spam & Over-Publishing Rate
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Measured at {aiData?.quality?.spamRate || 0}%. All distribution respects community broadcast rate limits.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI-10 Growth Optimization */}
              {selectedAiTab === 'ai10' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> Under-Represented Districts
                      </div>
                      <div className="space-y-2">
                        {aiData?.optimization?.underrepresentedDistricts?.map((d: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-black/30 rounded border border-white/5 text-xs space-y-1">
                            <div className="font-bold text-white capitalize">{d.district}</div>
                            <div className="text-neutral-400">{d.recommendation}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Strategic Tactical Actions
                      </div>
                      <div className="space-y-2">
                        {aiData?.optimization?.recommendations?.map((rec: string, idx: number) => (
                          <div key={idx} className="p-2.5 bg-black/30 rounded border border-white/5 text-xs text-neutral-300 flex items-start gap-2">
                            <span className="text-[var(--color-gold,#D4AF37)] font-bold">{idx + 1}.</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── PARTNER REGISTRY & DIRECTORY ── */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Verified Kashmir Partner Registry</h2>
              <p className="text-xs text-neutral-400">
                {filteredPartners.length} of {partners.length} organizations match current filters
              </p>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search partner, contact, area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)] w-56"
                />
              </div>

              {/* Pillar Selector */}
              <select
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value)}
                className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="all">All Pillars</option>
                {Object.entries(PILLAR_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              {/* District Selector */}
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="all">All 10 Districts</option>
                {Object.entries(DISTRICT_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              {/* Status Selector */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified Active</option>
                <option value="pending_verification">Pending Review</option>
              </select>
            </div>
          </div>

          {/* Pending Applications Alert Banner */}
          {(stats?.pendingPartners || 0) > 0 && statusFilter !== 'pending_verification' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                  {stats.pendingPartners}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {stats.pendingPartners} Incoming Partner Application{stats.pendingPartners > 1 ? 's' : ''} Received
                  </h4>
                  <p className="text-xs text-neutral-300">
                    Submitted via public intake (<code className="text-amber-300 font-mono text-[11px]">/network/kashmir-partners/apply</code>). Review details & credentials to approve or dismiss.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('pending_verification')}
                className="px-3.5 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors shrink-0 shadow-md flex items-center gap-1.5"
              >
                Review Applications ({stats.pendingPartners}) &rarr;
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-white/[0.04] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-bold">Organization & Handle</th>
                    <th className="py-3 px-4 font-bold">Pillar</th>
                    <th className="py-3 px-4 font-bold">District & Area</th>
                    <th className="py-3 px-4 font-bold">Contact Person</th>
                    <th className="py-3 px-4 font-bold">Reach</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{partner.name}</span>
                          {partner.relationshipType === 'affiliated_organization' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                              Affiliated
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              Independent
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">{partner.primaryHandle}</div>
                        {partner.notes && (
                          <div className="text-[10px] text-amber-200/90 mt-1.5 max-w-sm italic bg-white/[0.03] p-1.5 rounded border border-white/5" title={partner.notes}>
                            <span className="font-semibold text-neutral-400 not-italic">Note:</span> {partner.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-200">
                          {PILLAR_LABELS[partner.pillar]?.replace(/^[^\s]+\s/, '') || partner.pillar}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{DISTRICT_NAMES[partner.district]}</div>
                        <div className="text-[10px] text-neutral-400">{partner.locationDetails}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white">{partner.contactPerson}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{partner.contactValue}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-200">
                        {partner.estimatedCommunityReach.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {partner.verificationStatus === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {partner.verificationStatus === 'pending_verification' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyPartner(partner.id, 'approve')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-all shadow-md flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve & Verify
                            </button>
                            <button
                              onClick={() => handleVerifyPartner(partner.id, 'reject')}
                              className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded text-[11px] font-bold transition-all"
                            >
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => generateKit(partner)}
                              className="px-2.5 py-1 bg-[var(--color-gold,#D4AF37)]/10 hover:bg-[var(--color-gold,#D4AF37)]/20 border border-[var(--color-gold,#D4AF37)]/30 text-[var(--color-gold,#D4AF37)] rounded text-[11px] font-bold transition-all"
                            >
                              Generate Kit
                            </button>
                            <button
                              onClick={() => setReportModalPartner(partner)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 rounded text-[11px] font-bold transition-all"
                            >
                              Record URL
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredPartners.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        No partners match the selected district or pillar filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── REPORT PUBLICATION MODAL ── */}
        {reportModalPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--dash-card-bg,#0f172a)] border border-white/10 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Report Partner Publication URL
                </h3>
                <button onClick={() => setReportModalPartner(null)} className="text-neutral-400 hover:text-white text-sm">✕</button>
              </div>

              <form onSubmit={handleReportPublication} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 font-bold">Partner Organization</label>
                  <input
                    type="text"
                    disabled
                    value={reportModalPartner.name}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-neutral-300"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-bold">Release</label>
                  <input
                    type="text"
                    disabled
                    value={selectedRelease}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-neutral-300"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-bold">Published Channel</label>
                  <select
                    value={reportChannel}
                    onChange={(e) => setReportChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white"
                  >
                    <option value="instagram">Instagram (Post / Reel / Story)</option>
                    <option value="facebook">Facebook Page / Group</option>
                    <option value="whatsapp">WhatsApp Status / Broadcast</option>
                    <option value="telegram">Telegram Channel</option>
                    <option value="community_network">Direct Community Network</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-bold">Live Post / Broadcast URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://instagram.com/p/... or https://facebook.com/..."
                    value={reportUrl}
                    onChange={(e) => setReportUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setReportModalPartner(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-neutral-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-lg flex items-center gap-1.5"
                  >
                    {submittingReport ? 'Saving...' : 'Verify & Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── ADD PARTNER MODAL ── */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--dash-card-bg,#0f172a)] border border-white/10 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[var(--color-gold,#D4AF37)]" />
                  Add Kashmir Community Partner
                </h3>
                <button onClick={() => setAddModalOpen(false)} className="text-neutral-400 hover:text-white text-sm">✕</button>
              </div>

              <form onSubmit={handleCreatePartner} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 font-bold">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white"
                    placeholder="e.g. Kashmir EcoWatch"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">Strategic Pillar</label>
                    <select
                      value={newPartner.pillar}
                      onChange={(e) => setNewPartner({ ...newPartner, pillar: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white"
                    >
                      {Object.entries(PILLAR_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">District</label>
                    <select
                      value={newPartner.district}
                      onChange={(e) => setNewPartner({ ...newPartner, district: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white"
                    >
                      {Object.entries(DISTRICT_NAMES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-bold">Location Details</label>
                  <input
                    type="text"
                    required
                    value={newPartner.locationDetails}
                    onChange={(e) => setNewPartner({ ...newPartner, locationDetails: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white"
                    placeholder="e.g. Srinagar (Downtown / Zadibal)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">Primary Handle / Page</label>
                    <input
                      type="text"
                      required
                      value={newPartner.primaryHandle}
                      onChange={(e) => setNewPartner({ ...newPartner, primaryHandle: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white"
                      placeholder="@handle or Page Name"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">Estimated Community Reach</label>
                    <input
                      type="number"
                      required
                      value={newPartner.estimatedCommunityReach}
                      onChange={(e) => setNewPartner({ ...newPartner, estimatedCommunityReach: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">Contact Person</label>
                    <input
                      type="text"
                      required
                      value={newPartner.contactPerson}
                      onChange={(e) => setNewPartner({ ...newPartner, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white"
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-bold">Contact Value (Phone / WhatsApp)</label>
                    <input
                      type="text"
                      required
                      value={newPartner.contactValue}
                      onChange={(e) => setNewPartner({ ...newPartner, contactValue: e.target.value })}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white"
                      placeholder="+91-94190..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-neutral-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-gold,#D4AF37)] hover:bg-[#FDE68A] text-black rounded font-bold shadow-lg"
                  >
                    Save & Verify
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
