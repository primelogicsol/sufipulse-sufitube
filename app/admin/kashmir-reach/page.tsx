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
  FileCheck
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
  }, []);

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (selectedPillar !== 'all' && p.pillar !== selectedPillar) return false;
      if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
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
  }, [partners, selectedPillar, selectedDistrict, searchQuery]);

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
            <div className="text-2xl font-bold text-white">
              {stats?.verifiedPartners || 0}
              <span className="text-xs text-neutral-500 font-normal ml-2">/ {stats?.totalPartners || 0} Total</span>
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
                onClick={() => { setSelectedRelease('footprints-behind'); setActiveKit(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedRelease === 'footprints-behind'
                    ? 'bg-[var(--color-gold,#D4AF37)] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Footprints Behind
              </button>
              <button
                onClick={() => { setSelectedRelease('how-long-will-you-remain-silent'); setActiveKit(null); }}
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
            </div>
          </div>

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
                        <div className="font-bold text-white">{partner.name}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{partner.primaryHandle}</div>
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
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
