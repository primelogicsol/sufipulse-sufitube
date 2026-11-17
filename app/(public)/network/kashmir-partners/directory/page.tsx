"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { Section } from '@/app/components/layout/Section';
import { Compass, Search, MapPin, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { KashmirPartner, PartnerPillar, KashmirDistrict } from '@/server/types/kashmir-reach';

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
  sacred_literature_sufi: '📜 Sacred Literature & Reshi',
  youth_academic_thinkers: '🎓 Youth & Academic Thinkers',
};

export default function KashmirPartnersDirectoryPage() {
  const [partners, setPartners] = useState<KashmirPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/public/kpn-directory')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPartners(data.partners);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (selectedPillar !== 'all' && p.pillar !== selectedPillar) return false;
      if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.locationDetails.toLowerCase().includes(q) ||
          p.primaryHandle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [partners, selectedPillar, selectedDistrict, searchQuery]);

  return (
    <div className="bg-[var(--color-midnight,#0B0F17)] text-white min-h-screen py-20">
      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Link
              href="/network/kashmir-partners"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Network Overview
            </Link>

            <Link
              href="/network/kashmir-partners/apply"
              className="px-4 py-2 bg-[var(--color-gold,#D4AF37)] hover:bg-[#FDE68A] text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center gap-1.5"
            >
              Apply to Join <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-[var(--color-gold,#D4AF37)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
                Official Valley Registry
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Approved Cultural Partner Directory
            </h1>
            <p className="text-sm text-neutral-400 mt-2 max-w-2xl">
              Publicly documented organizations, artisan guilds, environmental stewards, and student forums authorized to distribute SufiPulse releases in Kashmir.
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search partner by name, handle, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[var(--color-gold,#D4AF37)]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedPillar}
                onChange={(e) => setSelectedPillar(e.target.value)}
                className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="all">All Pillars</option>
                {Object.entries(PILLAR_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 focus:outline-none"
              >
                <option value="all">All 10 Districts</option>
                {Object.entries(DISTRICT_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Directory Grid */}
          {loading ? (
            <div className="py-24 text-center text-neutral-400 text-xs">Loading approved partner registry...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((partner) => (
                <div
                  key={partner.id}
                  className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4 hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-300">
                        {PILLAR_LABELS[partner.pillar]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{partner.name}</h3>
                      <div className="text-xs text-[var(--color-gold,#D4AF37)] font-mono mt-0.5">{partner.primaryHandle}</div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{DISTRICT_NAMES[partner.district]} · <span className="text-neutral-500">{partner.locationDetails}</span></span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Reach: {partner.estimatedCommunityReach.toLocaleString()}
                    </span>
                    {partner.relationshipType === 'affiliated_organization' ? (
                      <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded font-bold">
                        Institutional Collaborator
                      </span>
                    ) : (
                      <span className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold">
                        Independent Cultural Partner
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center text-neutral-400 text-xs">
                  No partners match the selected district or pillar filters.
                </div>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
