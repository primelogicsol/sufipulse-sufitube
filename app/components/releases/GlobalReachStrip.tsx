"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Globe, Users, TrendingUp, Loader2, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import type { GlobalReachPayload } from "@/lib/analytics-storage";
import { useAuth } from "@/app/contexts/AuthContext";

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
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
      className={`bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl p-6 flex flex-col gap-4 ${className}`}
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
  pct: number | null | undefined;
  color?: string;
}) {
  const width = pct === null || pct === undefined ? 0 : Math.min(pct, 100);
  return (
    <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function DiscoveryCard({ p }: { p: GlobalReachPayload['performance'] & { recommendation?: number | null } }) {
  return (
    <Card
      icon={<TrendingUp className="w-4 h-4" />}
      title="Impressions to Watch Time"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-center min-w-[60px]">
          <p className="text-2xl font-bold text-white tabular-nums leading-none">
            {fmt(p.impressions)}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wide">
            Impressions
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-700 shrink-0" />
        <div className="text-center min-w-[52px]">
          <p className="text-2xl font-bold text-amber-400 tabular-nums leading-none">
            {fmt(p.views)}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wide">
            Views
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-700 shrink-0" />
        <div className="text-center min-w-[60px]">
          <p className="text-2xl font-bold text-white tabular-nums leading-none">
            {fmt(p.watchTimeHours)}
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
            {p.clickThroughRate !== null ? `${p.clickThroughRate}%` : "Unavailable"}
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            Click-through rate
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-white tabular-nums">
            {p.averageViewDurationFormatted || "Unavailable"}
          </p>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            Avg view duration
          </p>
        </div>
      </div>

      {p.recommendation !== null && p.recommendation !== undefined && (
        <p className="text-[10px] text-neutral-600 pt-1 border-t border-neutral-800/40 leading-relaxed">
          <span className="text-amber-400/70 font-semibold">
            {p.recommendation}%
          </span>{" "}
          of views driven by the recommendation engine.
        </p>
      )}
    </Card>
  );
}

function AudienceCard({ a }: { a: GlobalReachPayload['ageGender'] }) {
  const ageEntries = a.ageGroups.filter(
    (g) => g.percentage !== null && g.percentage > 0,
  );

  return (
    <Card icon={<Users className="w-4 h-4" />} title="Age and Gender">
      <div className="space-y-3">
        {[
          {
            label: "Female",
            pct: a.gender.female,
            color: "bg-rose-400/70",
          },
          {
            label: "Male",
            pct: a.gender.male,
            color: "bg-blue-400/70",
          },
        ].map(({ label, pct, color }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-neutral-300">{label}</span>
              <span className="text-xs font-bold text-amber-400 tabular-nums">
                {pct !== null ? `${pct}%` : "Unavailable"}
              </span>
            </div>
            <Bar pct={pct} color={color} />
          </div>
        ))}
      </div>

      {ageEntries.length > 0 && (
        <div className="pt-4 border-t border-neutral-800/50 space-y-2">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2">
            Age groups
          </p>
          {ageEntries.map((g) => (
            <div key={g.ageGroup} className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 w-12 shrink-0 tabular-nums">
                {g.ageGroup}
              </span>
              <Bar pct={g.percentage} />
              <span className="text-[11px] text-neutral-500 tabular-nums w-10 text-right">
                {g.percentage}%
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

function FootprintCard({ g }: { g: GlobalReachPayload['geographies'] }) {
  return (
    <Card icon={<Globe className="w-4 h-4" />} title="Geographies">
      <div className="flex flex-col items-start justify-center flex-1 gap-1">
        <p className="text-6xl font-extrabold text-white tabular-nums leading-none">
          {g.totalCountries}
        </p>
        <p className="text-sm text-neutral-400 font-medium">
          Countries Reached
        </p>
      </div>
      <p className="text-[10px] text-neutral-600 pt-3 border-t border-neutral-800/40 leading-relaxed">
        SufiPulse listeners span{" "}
        <span className="text-amber-400/70 font-semibold">
          {g.totalCountries} countries
        </span>
        , reflecting the universal reach of sacred music across cultures and
        continents.
      </p>
    </Card>
  );
}

export default function GlobalReachStrip() {
  const { user } = useAuth();
  const [data, setData] = useState<GlobalReachPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isManualRefresh = false) => {
    try {
      const url = isManualRefresh 
        ? `/api/public/youtube/global-reach?refresh=1&t=${Date.now()}` 
        : `/api/public/youtube/global-reach`;
      const r = await fetch(url, { cache: 'no-store' });
      const d = await r.json();
      if (d && !d.error) setData(d);
    } catch (err) {
      console.error("Failed to fetch global reach:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timeout);
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/youtube-analytics/global-reach/refresh", { 
        method: 'POST',
        credentials: 'include'
      });
      const result = await res.json();
      if (result.success) {
        // Pass true to trigger cache-busting and fresh fetch
        await fetchAnalytics(true);
      } else {
        throw new Error(result.error || "Refresh failed");
      }
    } catch (err: unknown) {
      console.error("Refresh failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("token exchange failed") || msg.includes("Bad Request") || msg.includes("credentials missing")) {
        alert("YouTube API connection notice:\n\nThe current YouTube OAuth refresh token is expired or missing. Please authenticate through YouTube Studio / Admin Settings or update your environment variables to enable live sync.");
      } else {
        alert("Failed to refresh analytics: " + msg);
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (!loading && !data) return null;

  const isStale = data?.status === 'stale';
  const isError = data?.status === 'error';
  const errorMessage = data?.errorMessage;

  return (
    <section className="py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 className="text-sm font-black text-amber-400 uppercase tracking-[0.2em] mb-2">
            {data?.title || "SufiPulse Global Reach"}
          </h2>
          <p className="text-base text-neutral-400 max-w-2xl">
            {data?.subtitle || "Lifetime audience intelligence from the official SufiPulse SufiTube channel, updated from the latest verified YouTube Analytics snapshot."}
          </p>
        </div>

        {user && ['admin', 'administrator', 'super_admin', 'governance_admin'].includes(user.role) && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-400/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Global Reach'}
            </button>
            {isError && errorMessage && (
              /* Suppress detailed error UI to keep focus on objective results */
              null
            )}
            {isStale && !isError && (
              <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                <AlertCircle className="w-3 h-3" />
                Snapshot is stale. Refresh recommended.
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl flex items-center justify-center">
             <Loader2 className="w-8 h-8 text-amber-500/20 animate-spin" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="h-44 bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl" />
            <div className="h-44 bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AudienceCard a={data!.ageGender} />
            <div className="flex flex-col gap-6">
              <DiscoveryCard p={{ ...data!.performance, recommendation: data!.recommendationEngine.viewsPercentage }} />
              <FootprintCard g={data!.geographies} />
            </div>
          </div>
          <div className="mt-6 border border-neutral-800/50 rounded-xl bg-neutral-900/30 overflow-hidden">
            <div className="px-4 py-2 bg-neutral-800/20 border-b border-neutral-800/50 flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-amber-500/70" />
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Verified Analytics Source</span>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Data Source</span>
                <span className="text-xs text-amber-400/90 font-medium">YouTube Analytics API / Verified Snapshot</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Last Sync</span>
                <span className="text-xs text-neutral-300 font-mono">
                  {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "Verified snapshot on file"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Snapshot Type</span>
                <span className="text-xs text-neutral-300">Lifetime</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Channel ID</span>
                <span className="text-[11px] text-neutral-400 font-mono">UCraDr3i5A3k0j7typ6tOOsQ</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Public Display Mode</span>
                <span className="text-xs text-neutral-300">Cached Verified Snapshot</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Data Range</span>
                <span className="text-xs text-neutral-300">May 20, 2025 – Aug 26, 2026</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Live API Dependency</span>
                <span className="text-xs text-neutral-300">No public-page dependency</span>
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Snapshot Status</span>
                <span className="text-xs text-amber-500/90 font-bold">{data?.snapshotStatus || 'Preserved verified fallback'}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

