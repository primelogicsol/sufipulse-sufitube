'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Compass,
  ArrowRight,
  Network,
  BarChart3,
  Globe2,
  BookOpen,
} from 'lucide-react';
import { getEntityRoute, getEntityLabel } from '@/lib/utils/pluralize';

interface Entity {
  id: string;
  canonicalName: string;
  slug: string;
  entityType: string;
  primaryDomain?: string;
  shortDescription: string;
  strategicGPS?: number;
  advantageScore?: number;
  connectedReleaseIds?: string[];
}

const CORE_TAXONOMY_SHORTCUTS = [
  { label: 'Ishq (Divine Love)', href: '/concepts/ishq', badge: 'Concept' },
  { label: 'Fana (Annihilation)', href: '/concepts/fana', badge: 'Concept' },
  { label: 'Sabr (Patience)', href: '/concepts/sabr', badge: 'Concept' },
  { label: 'Dhikr (Remembrance)', href: '/concepts/dhikr', badge: 'Concept' },
  { label: 'Spiritual Journey', href: '/themes/spiritual-journey', badge: 'Theme' },
  { label: 'Seeking Union', href: '/themes/seeking-union', badge: 'Theme' },
  { label: 'Contemplative (Fikr)', href: '/moods/contemplative', badge: 'Mood' },
  { label: 'Ecstatic (Wajd)', href: '/moods/ecstatic', badge: 'Mood' },
];

export function DiscoveryBuilder({ initialEntities }: { initialEntities: Entity[] }) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('All');

  const totalEntities = initialEntities.length;
  const distinctTypes = useMemo(
    () => Array.from(new Set(initialEntities.map((e) => e.entityType))).sort(),
    [initialEntities]
  );

  const filteredEntities = useMemo(() => {
    return initialEntities.filter((e) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        e.canonicalName.toLowerCase().includes(q) ||
        (e.shortDescription || '').toLowerCase().includes(q);
      const eType = (e.entityType || '').toLowerCase();
      const matchType =
        activeType === 'All' ||
        eType === activeType.toLowerCase() ||
        (activeType === 'Voices' && (eType === 'singer' || eType === 'artist'));
      return matchQuery && matchType;
    });
  }, [initialEntities, query, activeType]);

  return (
    <div className="w-full">
      {/* LAYER 1: DISCOVERY HEADER & TAXONOMY GATEWAYS */}
      <section className="bg-gradient-to-b from-slate-900 via-[#0A0A0A] to-[#0A0A0A] pt-24 pb-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-4">
                SufiPulse Cultural & Musical Discovery Graph
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                Global Sufi Music & Mystical Heritage
              </h1>
              <p className="text-slate-400 text-lg max-w-3xl">
                Explore classical Sufi traditions, poets, saints, spiritual concepts, and original full-length SufiPulse USA recordings with multilingual lyrics.
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 min-w-[130px]">
                <div className="text-emerald-400 font-bold text-2xl">{totalEntities}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Atlas Nodes
                </div>
              </div>
              <Link
                href="/releases"
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 py-4 flex items-center gap-2 font-bold text-sm transition"
              >
                Full-Length Songs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sufi Concepts, Themes & Moods */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center">
                <Compass className="w-4 h-4 mr-2 text-amber-400" /> Explore Songs by Sufi Concept, Theme & Mood
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {CORE_TAXONOMY_SHORTCUTS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="p-3 bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-xl transition group"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 mb-1">
                      {item.badge}
                    </div>
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-amber-300">
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Deep Knowledge & Literary Archive */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-emerald-400" /> Sacred Archives
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Traverse saint-poet biographies, Kashmiri Rishi heritage, Urdu kalam commentary, and the SufiPulse Literary Journal.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/knowledge"
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 text-sm font-semibold text-slate-200"
                >
                  <span>Sufi Knowledge Hub</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </Link>
                <Link
                  href="/literary-journal"
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 text-sm font-semibold text-slate-200"
                >
                  <span>SufiPulse Literary Journal</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LAYER 2: VERIFIED ATLAS ENTITY EXPLORER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-emerald-500" />
            Cultural & Musical Entity Directory ({filteredEntities.length})
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Globe2 className="w-4 h-4 text-emerald-500" />
            <span>{distinctTypes.length} Entity Classifications</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center mb-8">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Qawwali, Amir Khusrau, Sama, Chishti Order, Sufi songs..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['All', 'Voices', 'Tradition', 'Poet', 'Order', 'Song', 'Concept'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`px-4 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${
                  activeType === type
                    ? 'bg-emerald-500 text-slate-900'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {type === 'All' ? 'All Topics' : type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((entity) => (
            <Link
              key={entity.id}
              href={getEntityRoute(entity.entityType, entity.slug)}
              className="bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {getEntityLabel(entity.entityType)}
                  </span>
                  {entity.primaryDomain && (
                    <span className="text-[10px] font-medium text-slate-500 capitalize">
                      {entity.primaryDomain.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <h3 className="text-lg text-white font-bold group-hover:text-emerald-300 mb-2">
                  {entity.canonicalName}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                  {entity.shortDescription}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5" /> Explore Node & Songs
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
