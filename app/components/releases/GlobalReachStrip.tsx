"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Globe, Users, TrendingUp } from "lucide-react";
import type { AnalyticsSnapshot } from "@/lib/analytics-storage";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function Card({
  icon,
  title,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl p-4 flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-amber-400/80">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function Bar({
  pct,
  color = "bg-amber-400/60",
}: {
  pct: number;
  color?: string;
}) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function DiscoveryCard({ d }: { d: AnalyticsSnapshot }) {
  return (
    <Card
      icon={<TrendingUp className="w-4 h-4" />}
      title="Impressions to Watch Time"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-center min-w-[60px]">
          <p className="text-2xl font-bold text-white tabular-nums leading-none">
            {fmt(d.discovery.impressions)}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wide">
            Impressions
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-700 shrink-0" />
        <div className="text-center min-w-[52px]">
          <p className="text-2xl font-bold text-amber-400 tabular-nums leading-none">
            {fmt(d.discovery.viewsFromImpressions)}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wide">
            Views
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-700 shrink-0" />
        <div className="text-center min-w-[60px]">
          <p className="text-2xl font-bold text-white tabular-nums leading-none">
            {fmt(d.discovery.watchTimeHours)}
            <span className="text-xs font-normal text-neutral-500 ml-1">
              hrs
            </span>
          </p>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wide">
            Watch Time
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800/50">
        <div>
          <p className="text-sm font-bold text-amber-400 tabular-nums">
            {d.discovery.ctr}%
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            Click-through rate
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-white tabular-nums">
            {d.discovery.avgViewDuration}
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            Avg view duration
          </p>
        </div>
      </div>

      <p className="text-[10px] text-neutral-600 pt-1 border-t border-neutral-800/40 leading-relaxed">
        <span className="text-amber-400/70 font-semibold">
          {d.discovery.recommendationShare}%
        </span>{" "}
        of views driven by the recommendation engine.
      </p>
    </Card>
  );
}

function AudienceCard({ d }: { d: AnalyticsSnapshot }) {
  const ageEntries = Object.entries(d.audience.ageGroups).filter(
    ([, v]) => v > 0,
  );

  return (
    <Card icon={<Users className="w-4 h-4" />} title="Age and Gender">
      <div className="space-y-2">
        {[
          {
            label: "Female",
            pct: d.audience.genderSplit.female,
            color: "bg-rose-400/70",
          },
          {
            label: "Male",
            pct: d.audience.genderSplit.male,
            color: "bg-blue-400/70",
          },
        ].map(({ label, pct, color }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-neutral-300">{label}</span>
              <span className="text-xs font-bold text-amber-400 tabular-nums">
                {pct}%
              </span>
            </div>
            <Bar pct={pct} color={color} />
          </div>
        ))}
      </div>

      {ageEntries.length > 0 && (
        <div className="pt-3 border-t border-neutral-800/50 space-y-2">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2">
            Age groups
          </p>
          {ageEntries.map(([label, pct]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 w-10 shrink-0 tabular-nums">
                {label}
              </span>
              <Bar pct={pct} />
              <span className="text-[11px] text-neutral-500 tabular-nums w-8 text-right">
                {pct}%
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-neutral-600 pt-1 border-t border-neutral-800/40 leading-relaxed">
        Global listener profile across all SufiPulse releases.
      </p>
    </Card>
  );
}

function FootprintCard({ d }: { d: AnalyticsSnapshot }) {
  return (
    <Card icon={<Globe className="w-4 h-4" />} title="Geographies">
      <div className="flex flex-col items-start justify-center flex-1 gap-1">
        <p className="text-6xl font-extrabold text-white tabular-nums leading-none">
          {d.geography.countriesReached}
        </p>
        <p className="text-sm text-neutral-400 font-medium">
          Countries Reached
        </p>
      </div>
      <p className="text-[10px] text-neutral-600 pt-3 border-t border-neutral-800/40 leading-relaxed">
        SufiPulse listeners span{" "}
        <span className="text-amber-400/70 font-semibold">
          {d.geography.countriesReached} countries
        </span>
        , reflecting the universal reach of sacred music across cultures and
        continents.
      </p>
    </Card>
  );
}

export default function GlobalReachStrip() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/youtube-reach")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timeout);
  }, []);

  if (!loading && !data) return null;

  return (
    <section className="py-8">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-1">
          SufiPulse Global Reach
        </h2>
        <p className="text-xs text-neutral-500">
          Continuously updated lifetime audience intelligence from the official
          SufiPulse SufiTube channel.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-96 bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-44 bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl animate-pulse" />
            <div className="h-44 bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AudienceCard d={data!} />
            <div className="flex flex-col gap-4">
              <DiscoveryCard d={data!} />
              <FootprintCard d={data!} />
            </div>
          </div>
          <div className="mt-4 flex flex-col items-end gap-1 opacity-60">
            <p className="text-[10px] text-neutral-600">
              Lifetime analytics, refreshed weekly.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
