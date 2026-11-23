"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileCheck2,
  Globe,
  Search,
  Timer,
  X,
} from "lucide-react";
import {
  filterCountriesByQuery,
  getTopCountriesByAvgDuration,
  getTopCountriesByViews,
  getTopCountriesByWatchTime,
  type GeographyCountryRecord,
  type MinimumViewsThreshold,
  type YouTubeGeographySnapshot,
} from "@/lib/youtube-geography";

type RankingTab = "views" | "avg_duration" | "watch_hours";

const MIN_VIEWS_OPTIONS: { value: MinimumViewsThreshold; label: string }[] = [
  { value: 0, label: "All" },
  { value: 10, label: "10+" },
  { value: 25, label: "25+" },
  { value: 50, label: "50+" },
  { value: 100, label: "100+" },
];

function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

function fmtHours(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (n === 0) return "0.00";
  if (n < 0.01) return n.toFixed(4);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (n > 0 && n < 0.01) return "<0.01%";
  return `${n.toFixed(2)}%`;
}

/**
 * Universal Card Design Standard: Icon positioned cleanly above the card title.
 */
function SummaryMetricCard({
  icon,
  title,
  value,
  accentClass = "text-white",
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  accentClass?: string;
}) {
  return (
    <div className="bg-gradient-to-b from-neutral-900/50 to-neutral-950/50 border border-neutral-800/90 rounded-xl p-4 flex flex-col items-start justify-between gap-3">
      <div className="flex flex-col items-start gap-2 w-full">
        <span className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400 leading-snug">
          {title}
        </p>
      </div>
      <p
        className={`text-xl sm:text-2xl font-black tabular-nums tracking-tight leading-tight ${accentClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Clean, full-width vertical proportional bar graph.
 * Displays ONLY:
 *  - Country rank (#1, #2, #3...)
 *  - Country name
 *  - Horizontal proportional bar (#1 in Gold, #2+ in Teal)
 *
 * Numerical metrics are retained internally for exact bar proportions and revealed
 * only inside an optional hover/tap tooltip — never rendered as permanent chart labels.
 */
function RankingBarList({
  rows,
  activeTab,
  chartTitle,
  testId = "geography-ranking-chart",
}: {
  rows: GeographyCountryRecord[];
  activeTab: RankingTab;
  chartTitle: string;
  testId?: string;
}) {
  const [activeTooltipIso, setActiveTooltipIso] = useState<string | null>(null);
  const [pinnedTooltipIso, setPinnedTooltipIso] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-neutral-950/50 border border-neutral-800/80 text-center text-xs text-neutral-400">
        No countries match the current selection in this verified export.
      </div>
    );
  }

  const getMetricValue = (r: GeographyCountryRecord): number => {
    if (activeTab === "views") return r.views;
    if (activeTab === "avg_duration") return r.avgViewDurationSecs ?? 0;
    return r.watchTimeHours;
  };

  // Same linear scale across every country within the active tab; #1 sets 100%
  const maxMetric = Math.max(0.0001, ...rows.map(getMetricValue));

  return (
    <div
      data-testid={testId}
      className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-neutral-800/60">
        <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-300">
          {chartTitle}
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        {rows.map((country, idx) => {
          const isLeader = idx === 0 && country.views > 0;
          const metricVal = getMetricValue(country);
          const widthPct =
            metricVal <= 0
              ? 0
              : isLeader
              ? 100
              : Math.min(100, (metricVal / maxMetric) * 100);

          const isTooltipOpen =
            activeTooltipIso === country.isoCode ||
            pinnedTooltipIso === country.isoCode;

          return (
            <div
              key={country.isoCode}
              role="button"
              tabIndex={0}
              data-testid={`geo-rank-row-${idx + 1}`}
              onMouseEnter={() => setActiveTooltipIso(country.isoCode)}
              onMouseLeave={() => setActiveTooltipIso(null)}
              onFocus={() => setActiveTooltipIso(country.isoCode)}
              onBlur={() => setActiveTooltipIso(null)}
              onClick={() =>
                setPinnedTooltipIso((prev) =>
                  prev === country.isoCode ? null : country.isoCode
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPinnedTooltipIso((prev) =>
                    prev === country.isoCode ? null : country.isoCode
                  );
                }
              }}
              className="relative flex flex-col items-stretch sm:flex-row sm:items-center gap-2 sm:gap-4 py-1 text-left rounded-lg hover:bg-neutral-900/40 focus:outline-none focus:bg-neutral-900/40 transition-colors cursor-pointer select-none"
            >
              {/* Rank + Country Name ONLY */}
              <div className="flex items-center justify-start gap-3 w-full sm:w-52 shrink-0 min-w-0">
                <span
                  className={`w-8 text-xs font-mono shrink-0 tabular-nums text-left ${
                    isLeader
                      ? "font-black text-amber-400"
                      : "font-bold text-neutral-400"
                  }`}
                >
                  #{idx + 1}
                </span>
                <span
                  className={`text-xs sm:text-sm truncate text-left ${
                    isLeader
                      ? "font-bold text-white"
                      : "font-medium text-neutral-200"
                  }`}
                >
                  {country.countryName}
                </span>
              </div>

              {/* Full-Width Proportional Horizontal Bar */}
              <div
                data-testid={`geo-bar-track-${idx + 1}`}
                className="w-full sm:flex-1 h-3 sm:h-3.5 shrink-0 rounded-full bg-neutral-900 border border-neutral-800/80 overflow-hidden"
              >
                <div
                  data-testid={`geo-bar-fill-${idx + 1}`}
                  data-bar-tone={isLeader ? "gold" : "teal"}
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLeader
                      ? "bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                      : "bg-gradient-to-r from-teal-500/90 to-teal-300"
                  }`}
                  style={{
                    width: `${widthPct}%`,
                    minWidth: metricVal > 0 ? "2px" : "0px",
                  }}
                />
              </div>

              {/* Optional Hover / Tap Tooltip (Unmounted by default so chart stays strictly graph-focused) */}
              {isTooltipOpen && (
                <div
                  role="tooltip"
                  data-testid={`geo-tooltip-${country.isoCode}`}
                  className="z-20 sm:absolute sm:right-2 sm:-top-11 px-3 py-2 rounded-lg bg-neutral-950/95 border border-amber-400/35 shadow-xl text-[11px] text-neutral-200 flex flex-wrap items-center gap-x-3 gap-y-1 pointer-events-none"
                >
                  <span className="font-bold text-white">
                    {country.countryName} ({country.isoCode})
                  </span>
                  <span className="text-amber-300 font-mono tabular-nums">
                    {fmtInt(country.views)} views ({fmtPct(country.viewsShareAttributedPct)})
                  </span>
                  <span className="text-teal-300 font-mono tabular-nums">
                    {fmtHours(country.watchTimeHours)} hrs
                  </span>
                  <span className="text-emerald-300 font-mono tabular-nums">
                    AVD {country.avgViewDurationFormatted ?? "—"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GlobalAudienceByCountrySection({
  geography,
}: {
  geography: YouTubeGeographySnapshot | null | undefined;
  baselineCountriesReached?: number;
}) {
  const [activeTab, setActiveTab] = useState<RankingTab>("views");
  const [minViews, setMinViews] = useState<MinimumViewsThreshold>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMasterList, setShowMasterList] = useState(false);

  const topByViews = useMemo(
    () => (geography ? getTopCountriesByViews(geography.countries, 10) : []),
    [geography]
  );

  const topByAvgDuration = useMemo(
    () =>
      geography ? getTopCountriesByAvgDuration(geography.countries, minViews, 10) : [],
    [geography, minViews]
  );

  const topByWatchTime = useMemo(
    () => (geography ? getTopCountriesByWatchTime(geography.countries, 10) : []),
    [geography]
  );

  const filteredMasterCountries = useMemo(
    () => (geography ? filterCountriesByQuery(geography.countries, searchQuery) : []),
    [geography, searchQuery]
  );

  if (!geography || geography.countries.length === 0) {
    return null;
  }

  const activeRows =
    activeTab === "views"
      ? topByViews
      : activeTab === "avg_duration"
      ? topByAvgDuration
      : topByWatchTime;

  const activeChartTitle =
    activeTab === "views"
      ? "Top 10 Countries — Most Views"
      : activeTab === "avg_duration"
      ? "Top 10 Countries — Longest Average Viewing"
      : "Top 10 Countries — Most Watch Hours";

  const isMasterExpanded = showMasterList || searchQuery.trim().length > 0;
  const { summary } = geography;

  return (
    <div
      id="global-audience-by-country"
      data-testid="global-audience-by-country"
      className="mt-6 bg-gradient-to-b from-neutral-900/45 via-neutral-900/25 to-neutral-950/40 border border-neutral-800 rounded-xl p-5 sm:p-6 space-y-6"
    >
      {/* ── Section Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-neutral-800/80">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/25 text-amber-400 text-[10px] font-bold uppercase tracking-[0.16em]">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>Geographic Intelligence Snapshot</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black uppercase tracking-[0.12em] text-white">
            GLOBAL AUDIENCE BY COUNTRY
          </h3>
          <p className="text-xs sm:text-sm text-amber-400/90 font-semibold">
            Lifetime Geographic Intelligence | YouTube Studio Verified Export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-neutral-300 font-mono">
            Period: {geography.reportingPeriodLabel}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-neutral-400">
            Published Verified Snapshot
          </span>
        </div>
      </div>

      {/* ── Geographic Summary Metric Cards (Icons Above Titles) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryMetricCard
          icon={<Eye className="w-4 h-4" />}
          title="Leading Country by Views"
          value={summary.leadingByViews?.countryName ?? "—"}
          accentClass="text-amber-400"
        />

        <SummaryMetricCard
          icon={<Clock className="w-4 h-4" />}
          title="Leading Country by Watch Hours"
          value={summary.leadingByWatchHours?.countryName ?? "—"}
          accentClass="text-teal-300"
        />

        <SummaryMetricCard
          icon={<Timer className="w-4 h-4" />}
          title="Leading Country by Avg Duration"
          value={summary.leadingByAvgDurationAll?.countryName ?? "—"}
          accentClass="text-emerald-300"
        />
      </div>

      {/* ── Three Interactive Ranking Tabs + Full-Width Proportional Graph ── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Country Rankings"
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 w-full md:w-auto"
          >
            {[
              {
                id: "views" as const,
                label: "Most Views",
                icon: <Eye className="w-3.5 h-3.5" />,
              },
              {
                id: "avg_duration" as const,
                label: "Longest Average Viewing",
                icon: <Timer className="w-3.5 h-3.5" />,
              },
              {
                id: "watch_hours" as const,
                label: "Most Watch Hours",
                icon: <Clock className="w-3.5 h-3.5" />,
              },
            ].map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid={`geo-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selected
                      ? "bg-amber-400 text-neutral-950 shadow-sm"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-800/60"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Optional Minimum-Views Selector on Longest Average Viewing Tab */}
          {activeTab === "avg_duration" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Minimum Views:
              </span>
              <div
                role="group"
                aria-label="Minimum views filter"
                className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-neutral-950/80 border border-neutral-800"
              >
                {MIN_VIEWS_OPTIONS.map((opt) => {
                  const active = minViews === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-testid={`min-views-${opt.value}`}
                      onClick={() => setMinViews(opt.value)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors tabular-nums ${
                        active
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Single Full-Width Vertical Ranking of 10 Countries */}
        <RankingBarList
          rows={activeRows}
          activeTab={activeTab}
          chartTitle={activeChartTitle}
          testId="geography-ranking-chart"
        />
      </div>

      {/* ── Optional Country Search & Expandable Graph Directory ── */}
      <div className="pt-2 border-t border-neutral-800/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country..."
              aria-label="Search countries"
              data-testid="geography-country-search"
              className="w-full pl-9 pr-9 py-2 rounded-lg bg-neutral-950/80 border border-neutral-800 focus:border-amber-400/50 focus:outline-none text-xs text-white placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear country search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            data-testid="toggle-master-country-table"
            onClick={() => setShowMasterList((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-bold text-neutral-200 transition-colors whitespace-nowrap"
          >
            <span>{isMasterExpanded ? "Hide All Countries" : "Explore All Countries"}</span>
            {isMasterExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>

        {isMasterExpanded && (
          <div data-testid="master-country-table-container">
            <RankingBarList
              rows={filteredMasterCountries}
              activeTab={activeTab}
              chartTitle="All Listed Territories"
              testId="geography-master-ranking-chart"
            />
          </div>
        )}
      </div>

      {/* ── Geography Export Provenance Strip ── */}
      <div className="rounded-xl border border-neutral-800/70 bg-neutral-950/50 overflow-hidden">
        <div className="px-4 py-2 bg-neutral-900/50 border-b border-neutral-800/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400/80" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">
              Geography Export Provenance
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400/90">
            <CheckCircle2 className="w-3 h-3" />
            SHA-256 Verified · Static Studio Export (Not Live API)
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block">
              Source &amp; Archive
            </span>
            <span className="text-amber-400/90 font-medium block">
              {geography.sourceLabel}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono break-all block">
              {geography.zipFileName}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block">
              Reporting Period &amp; Channel
            </span>
            <span className="text-neutral-200 font-medium block">
              {geography.reportingPeriodLabel}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono block">
              Channel ID: {geography.channelId}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block">
              Archive Integrity
            </span>
            <span
              title={geography.zipSha256}
              className="text-[11px] text-neutral-300 font-mono block"
            >
              SHA-256: {geography.zipSha256.slice(0, 12)}…{geography.zipSha256.slice(-8)}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono block">
              Imported: {new Date(geography.importedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
