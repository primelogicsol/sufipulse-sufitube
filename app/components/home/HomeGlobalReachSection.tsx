"use client";

import Link from 'next/link';
import { Globe, TrendingUp, Eye, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';

interface HomeGlobalReachSectionProps {
  reachIndex: {
    enabled: boolean;
    label: string;
    description: string;
    monthsElapsed: number;
    combinedIndex: {
      impressions: number;
      views: number;
      watchHours: number;
      geographies: number;
    };
    verifiedTotal: {
      impressions: number;
      views: number;
      watchHours: number;
      geographies: number;
    };
  };
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function HomeGlobalReachSection({ reachIndex }: HomeGlobalReachSectionProps) {
  if (!reachIndex || !reachIndex.enabled) return null;

  return (
    <section id="global-reach-index" className="py-16 bg-gradient-to-b from-[var(--color-midnight)] via-[#0c121e] to-[var(--color-midnight)] border-b border-neutral-800/80">
      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[11px] font-bold uppercase tracking-widest mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Audience Intelligence &amp; Global Footprint</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                SufiPulse Global Reach Index
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
                Combining verified YouTube Analytics and Studio baselines with deterministic growth modeling across {reachIndex.combinedIndex.geographies} countries.
              </p>
            </div>

            <Link
              href="/releases"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-bold transition-all self-start md:self-end"
            >
              <span>Explore Analytics &amp; Funnel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Index Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* 1. Impressions Index */}
            <div className="bg-neutral-900/60 border border-neutral-800 hover:border-amber-400/40 rounded-xl p-5 flex flex-col justify-between transition-colors shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Impressions Index
                </span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                  {fmt(reachIndex.combinedIndex.impressions)}
                </p>
                <p className="text-[11px] text-amber-400/80 mt-1 font-medium">
                  Verified baseline + growth model
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-neutral-800/80 text-[10px] text-neutral-500 font-mono">
                Verified: {fmt(reachIndex.verifiedTotal.impressions)}
              </div>
            </div>

            {/* 2. Engaged Views Index */}
            <div className="bg-neutral-900/60 border border-neutral-800 hover:border-amber-400/40 rounded-xl p-5 flex flex-col justify-between transition-colors shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Engaged Views Index
                </span>
                <Eye className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-black text-amber-400 tabular-nums tracking-tight">
                  {fmt(reachIndex.combinedIndex.views)}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1 font-medium">
                  Full-length listening &amp; watch
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-neutral-800/80 text-[10px] text-neutral-500 font-mono">
                Verified: {fmt(reachIndex.verifiedTotal.views)}
              </div>
            </div>

            {/* 3. Watch Hours Index */}
            <div className="bg-neutral-900/60 border border-neutral-800 hover:border-teal-400/40 rounded-xl p-5 flex flex-col justify-between transition-colors shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Watch Hours Index
                </span>
                <Clock className="w-4 h-4 text-teal-300" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-black text-teal-300 tabular-nums tracking-tight">
                  {fmt(reachIndex.combinedIndex.watchHours)}
                  <span className="text-sm font-normal text-neutral-400 ml-1">hrs</span>
                </p>
                <p className="text-[11px] text-teal-400/80 mt-1 font-medium">
                  Deep devotional engagement
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-neutral-800/80 text-[10px] text-neutral-500 font-mono">
                Verified: {fmt(reachIndex.verifiedTotal.watchHours)} hrs
              </div>
            </div>

            {/* 4. Countries Reached */}
            <div className="bg-neutral-900/60 border border-neutral-800 hover:border-blue-400/40 rounded-xl p-5 flex flex-col justify-between transition-colors shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Countries Reached
                </span>
                <Globe className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                  {reachIndex.combinedIndex.geographies}
                </p>
                <p className="text-[11px] text-blue-400/80 mt-1 font-medium">
                  Global geographic footprint
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-neutral-800/80 text-[10px] text-neutral-500 font-mono">
                Verified: {reachIndex.verifiedTotal.geographies} countries
              </div>
            </div>
          </div>

          {/* Verification Footnote Banner */}
          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Truth in Labeling:</strong> The Global Reach Index combines observed audience activity with demographic growth modeling. Verified YouTube Analytics records remain strictly preserved.
              </span>
            </div>
            <Link
              href="/releases"
              className="text-amber-400 hover:underline shrink-0 font-semibold"
            >
              Methodology &amp; Verification →
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
