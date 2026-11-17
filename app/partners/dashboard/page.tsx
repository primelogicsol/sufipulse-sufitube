"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/app/components/layout/PageContainer';
import {
  Compass,
  CheckCircle2,
  Copy,
  Send,
  MapPin,
  Headphones,
  Users,
  Sparkles,
  ExternalLink,
  FileCheck,
  ArrowLeft
} from 'lucide-react';
import { KashmirPartner, PartnerCampaignKit } from '@/server/types/kashmir-reach';

export default function PartnerDashboardPage() {
  const searchParams = useSearchParams();
  const partnerIdParam = searchParams.get('id');

  const [partner, setPartner] = useState<KashmirPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<'footprints-behind' | 'how-long-will-you-remain-silent'>('footprints-behind');
  const [campaignKit, setCampaignKit] = useState<PartnerCampaignKit | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Report Form
  const [reportUrl, setReportUrl] = useState('');
  const [reportChannel, setReportChannel] = useState('instagram');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    const id = partnerIdParam || localStorage.getItem('kpn_partner_id') || 'kpn_ecowatch_sgr';
    fetch(`/api/admin/kashmir-reach?q=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.partners?.length > 0) {
          const found = data.partners.find((p: any) => p.id === id || p.trackingCode === id) || data.partners[0];
          setPartner(found);
          loadKit(found.id, selectedRelease);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [partnerIdParam]);

  const loadKit = async (partnerId: string, slug: string) => {
    try {
      const res = await fetch('/api/admin/kashmir-reach/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, releaseSlug: slug }),
      });
      const data = await res.json();
      if (data.success) {
        setCampaignKit(data.kit);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseChange = (slug: 'footprints-behind' | 'how-long-will-you-remain-silent') => {
    setSelectedRelease(slug);
    if (partner) {
      loadKit(partner.id, slug);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleReportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !reportUrl.trim()) return;

    setReporting(true);
    try {
      const res = await fetch('/api/admin/kashmir-reach/report-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          releaseSlug: selectedRelease,
          channel: reportChannel,
          publishedUrl: reportUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReportSuccess(true);
        setReportUrl('');
        setTimeout(() => setReportSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--color-midnight,#0B0F17)] text-white min-h-screen py-24 text-center text-xs text-neutral-400">
        Loading partner portal...
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="bg-[var(--color-midnight,#0B0F17)] text-white min-h-screen py-24 text-center space-y-4">
        <h2 className="text-xl font-bold">Partner Session Expired</h2>
        <Link href="/partners/login" className="px-4 py-2 bg-[var(--color-gold,#D4AF37)] text-black rounded font-bold text-xs">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-midnight,#0B0F17)] text-white min-h-screen py-16">
      <PageContainer>
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Compass className="w-4 h-4 text-[var(--color-gold,#D4AF37)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
                  Partner Distribution Portal
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{partner.name}</h1>
              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                <span>{partner.locationDetails} · Assigned Code: <span className="font-mono text-white">{partner.trackingCode}</span></span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Active Partner
              </span>
            </div>
          </div>

          {/* Performance & Attribution Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Documented Reach</span>
              <div className="text-xl font-bold text-white">{partner.estimatedCommunityReach.toLocaleString()}</div>
              <p className="text-[10px] text-neutral-500">Community footprint</p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Referral Clicks</span>
              <div className="text-xl font-bold text-white">{partner.metrics.totalReferralClicks.toLocaleString()}</div>
              <p className="text-[10px] text-neutral-500">Tracked via your unique link</p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Engaged Plays</span>
              <div className="text-xl font-bold text-purple-400">{partner.metrics.engagedListens.toLocaleString()}</div>
              <p className="text-[10px] text-neutral-500">&gt;60s active listening</p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">Complete Plays</span>
              <div className="text-xl font-bold text-emerald-400">{partner.metrics.completedListens.toLocaleString()}</div>
              <p className="text-[10px] text-neutral-500">Full track playback</p>
            </div>
          </div>

          {/* Active Campaigns Studio */}
          <div className="p-6 bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-gold,#D4AF37)]" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Active Release Campaign Packages</h2>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Select a song to access pre-approved captions, video clips, and your dedicated referral URL.
                </p>
              </div>

              {/* Release Toggles */}
              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                <button
                  onClick={() => handleReleaseChange('footprints-behind')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedRelease === 'footprints-behind'
                      ? 'bg-[var(--color-gold,#D4AF37)] text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Footprints Behind
                </button>
                <button
                  onClick={() => handleReleaseChange('how-long-will-you-remain-silent')}
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

            {campaignKit && (
              <div className="space-y-4">
                {/* Destination Link Box */}
                <div className="p-4 bg-black/60 border border-[var(--color-gold,#D4AF37)]/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-gold,#D4AF37)]">
                      Your Dedicated Attribution Link
                    </span>
                    <div className="text-xs font-mono text-white break-all mt-0.5">
                      {campaignKit.destinationUrl}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(campaignKit.destinationUrl, 'url')}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedField === 'url' ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a
                      href={campaignKit.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Kits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* WhatsApp */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        WhatsApp Broadcast Message
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(campaignKit.whatsappMessage, 'wa')}
                          className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedField === 'wa' ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(campaignKit.whatsappMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow"
                        >
                          <Send className="w-3 h-3" /> Share
                        </a>
                      </div>
                    </div>
                    <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-sans bg-black/40 p-3 rounded border border-white/5 max-h-48 overflow-y-auto leading-relaxed">
                      {campaignKit.whatsappMessage}
                    </pre>
                  </div>

                  {/* Instagram */}
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                        Instagram Reel Caption & Tags
                      </span>
                      <button
                        onClick={() => copyToClipboard(campaignKit.instagramCaption, 'ig')}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedField === 'ig' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-sans bg-black/40 p-3 rounded border border-white/5 max-h-48 overflow-y-auto leading-relaxed">
                      {campaignKit.instagramCaption}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Report Publication Tool */}
          <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Report Publication URL</h3>
            </div>
            <p className="text-xs text-neutral-400">
              When you publish an approved release package to your Instagram, Facebook, or community broadcast, submit the URL here to confirm distribution.
            </p>

            {reportSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
                Publication URL recorded successfully. Thank you for championing this release!
              </div>
            )}

            <form onSubmit={handleReportUrl} className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={reportChannel}
                onChange={(e) => setReportChannel(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="community_network">Community Network</option>
              </select>

              <input
                type="url"
                required
                placeholder="https://instagram.com/p/... or live post URL"
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                className="w-full flex-1 px-3.5 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 font-mono"
              />

              <button
                type="submit"
                disabled={reporting}
                className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md whitespace-nowrap"
              >
                {reporting ? 'Submitting...' : 'Confirm Post'}
              </button>
            </form>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
