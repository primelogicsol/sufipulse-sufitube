/**
 * SufiPulse YouTube Studio Geography Analytics — Shared Types, Normalization & Pure Ranking Helpers
 *
 * All metrics originate strictly from verified YouTube Studio Geography CSV exports.
 * Never fabricates countries, metrics, or missing records.
 */

export type SampleSizeClass = 'zero_suppressed' | 'very_small' | 'small' | 'established';

export type MinimumViewsThreshold = 0 | 10 | 25 | 50 | 100;

export interface GeographyCountryRecord {
  /** ISO 3166-1 alpha-2 code from YouTube Studio export (e.g. "IN", "BD", "US") */
  isoCode: string;
  /** Normalized English display name (e.g. "India", "Bangladesh", "United States") */
  countryName: string;
  /** Additional search aliases (e.g. ["UAE", "Emirates"] for AE, ["UK", "Britain"] for GB) */
  searchAliases: string[];
  /** Zero-based position among country rows in the source Table data.csv */
  sourceRowOrder: number;
  /** Verified view count from Table data.csv */
  views: number;
  /** Raw duration string as exported by YouTube Studio (e.g. "0:10:22", or "" when suppressed) */
  avgViewDurationRaw: string | null;
  /** Normalized MM:SS duration string from native field (e.g. "10:22", "08:54", or null when unavailable) */
  avgViewDurationFormatted: string | null;
  /** Native average view duration in whole seconds, or null when empty/suppressed */
  avgViewDurationSecs: number | null;
  /** Derived unrounded duration (watchTimeHours * 3600 / views) for reconciliation & exact tie-breaking */
  derivedAvgViewDurationSecs: number | null;
  /** Verified watch time in hours from Table data.csv */
  watchTimeHours: number;
  /** Percentage of total country-attributed views (0-100) */
  viewsShareAttributedPct: number;
  /** Percentage of channel Total row views (0-100) */
  viewsShareChannelTotalPct: number;
  /** Percentage of total country-attributed watch time hours (0-100) */
  watchTimeShareAttributedPct: number;
  /** Percentage of channel Total row watch time hours (0-100) */
  watchTimeShareChannelTotalPct: number;
  /** Sample classification to flag small-view average duration skew */
  sampleClass: SampleSizeClass;
  /** Yearly average view duration (seconds) from Chart data.csv, keyed by year ("2025", "2026") */
  yearlyAvgViewDurationSecs: Record<string, number | null>;
  /** Yearly average view duration (MM:SS) from Chart data.csv, keyed by year ("2025", "2026") */
  yearlyAvgViewDurationFormatted: Record<string, string | null>;
}

export interface GeographyExtractedFileMeta {
  fileName: string;
  byteLength: number;
  rowCount: number;
  columns: string[];
}

export interface GeographyLeaderSummary {
  isoCode: string;
  countryName: string;
  views: number;
  watchTimeHours: number;
  avgViewDurationFormatted: string | null;
  avgViewDurationSecs: number | null;
  viewsShareAttributedPct: number;
  watchTimeShareAttributedPct: number;
  sampleClass: SampleSizeClass;
}

export interface GeographySnapshotVersionRecord {
  version: number;
  importedAt: string;
  zipFileName: string;
  zipSha256: string;
  reportingPeriodStart: string | null;
  reportingPeriodEnd: string | null;
  measurableCountries: number;
  listedCountryRows: number;
  countryAttributedViews: number;
  exportTotalRowViews: number;
  countryAttributedWatchTimeHours: number;
  exportTotalRowWatchTimeHours: number;
}

export interface YouTubeGeographySnapshot {
  version: number;
  source: 'youtube_studio_geography_csv';
  sourceLabel: 'YouTube Studio Geography CSV';
  displayMode: 'published_verified_snapshot';
  liveApiConnection: false;
  channelId: string;
  channelNameFromExport: string | null;
  channelIdIndependentlyConfirmedByCsv: boolean;
  channelVerificationNote: string;
  reportingPeriodStart: string | null;
  reportingPeriodEnd: string | null;
  reportingPeriodLabel: string;
  reportingPeriodSource: 'zip_filename_and_yearly_csv' | 'explicit_override' | 'yearly_csv_only';
  chartYears: string[];
  importedAt: string;
  zipFileName: string;
  zipSha256: string;
  extractedFiles: GeographyExtractedFileMeta[];
  counts: {
    listedCountryRows: number;
    measurableCountries: number;
    zeroOrSuppressedRows: number;
    zeroWatchTimeWithViewsRows: number;
    baselineCountriesReachedPreserved: number;
  };
  totals: {
    exportTotalRowViews: number;
    countryAttributedViews: number;
    unattributedViewsDelta: number;
    unattributedViewsPct: number;
    exportTotalRowWatchTimeHours: number;
    countryAttributedWatchTimeHours: number;
    unattributedWatchTimeHoursDelta: number;
    unattributedWatchTimePct: number;
    exportTotalRowAvgViewDurationRaw: string;
    exportTotalRowAvgViewDurationFormatted: string;
    exportTotalRowAvgViewDurationSecs: number;
    yearlyChannelAvgViewDuration: Record<string, { raw: string; formatted: string; seconds: number }>;
  };
  summary: {
    measurableCountries: number;
    leadingByViews: GeographyLeaderSummary | null;
    leadingByWatchHours: GeographyLeaderSummary | null;
    leadingByAvgDurationAll: GeographyLeaderSummary | null;
    leadingByAvgDuration100Plus: GeographyLeaderSummary | null;
    top10ViewsTotal: number;
    top10ViewsShareAttributedPct: number;
    top10WatchHoursTotal: number;
    top10WatchHoursShareAttributedPct: number;
    countriesReachedComparisonNote: string;
  };
  metricDefinitions: {
    views: string;
    watchTimeHours: string;
    averageViewDuration: string;
    countryAttributedShare: string;
    smallSampleFlag: string;
  };
  reconciliation: {
    status: 'verified_with_threshold_disclosure';
    isViewsReconciled: boolean;
    isWatchTimeReconciled: boolean;
    notes: string[];
  };
  countries: GeographyCountryRecord[];
  importHistory?: GeographySnapshotVersionRecord[];
}

/**
 * Curated canonical ISO-3166-1 alpha-2 country/territory names and search aliases
 * with automatic Intl.DisplayNames fallback for any additional territory codes.
 */
const CANONICAL_COUNTRY_NAMES: Record<string, { name: string; aliases?: string[] }> = {
  AE: { name: 'United Arab Emirates', aliases: ['UAE', 'Emirates', 'Dubai', 'Abu Dhabi'] },
  AT: { name: 'Austria', aliases: ['Osterreich', 'Österreich'] },
  AU: { name: 'Australia', aliases: ['AUS'] },
  BD: { name: 'Bangladesh', aliases: ['BGD', 'Bengal'] },
  BH: { name: 'Bahrain', aliases: ['BHR'] },
  BJ: { name: 'Benin', aliases: ['BEN'] },
  CA: { name: 'Canada', aliases: ['CAN'] },
  CD: { name: 'DR Congo', aliases: ['Democratic Republic of the Congo', 'DRC', 'Congo-Kinshasa'] },
  CL: { name: 'Chile', aliases: ['CHL'] },
  DE: { name: 'Germany', aliases: ['Deutschland', 'DEU'] },
  EG: { name: 'Egypt', aliases: ['EGY', 'Misr'] },
  ES: { name: 'Spain', aliases: ['Espana', 'España', 'ESP'] },
  ET: { name: 'Ethiopia', aliases: ['ETH'] },
  FR: { name: 'France', aliases: ['FRA'] },
  GB: { name: 'United Kingdom', aliases: ['UK', 'Great Britain', 'England', 'Scotland', 'Wales', 'GBR'] },
  GR: { name: 'Greece', aliases: ['Hellas', 'GRC'] },
  HK: { name: 'Hong Kong', aliases: ['Hong Kong SAR', 'HKG'] },
  ID: { name: 'Indonesia', aliases: ['IDN'] },
  IN: { name: 'India', aliases: ['IND', 'Bharat', 'Hindustan'] },
  IT: { name: 'Italy', aliases: ['Italia', 'ITA'] },
  JO: { name: 'Jordan', aliases: ['JOR'] },
  JP: { name: 'Japan', aliases: ['JPN', 'Nippon'] },
  KR: { name: 'South Korea', aliases: ['Republic of Korea', 'Korea', 'ROK', 'KOR'] },
  KW: { name: 'Kuwait', aliases: ['KWT'] },
  LK: { name: 'Sri Lanka', aliases: ['LKA', 'Ceylon'] },
  MG: { name: 'Madagascar', aliases: ['MDG'] },
  MM: { name: 'Myanmar', aliases: ['Burma', 'MMR'] },
  MU: { name: 'Mauritius', aliases: ['MUS'] },
  MV: { name: 'Maldives', aliases: ['MDV'] },
  MY: { name: 'Malaysia', aliases: ['MYS'] },
  NL: { name: 'Netherlands', aliases: ['Holland', 'NLD'] },
  NO: { name: 'Norway', aliases: ['Norge', 'NOR'] },
  NP: { name: 'Nepal', aliases: ['NPL'] },
  OM: { name: 'Oman', aliases: ['OMN'] },
  PE: { name: 'Peru', aliases: ['PER'] },
  PH: { name: 'Philippines', aliases: ['PHL'] },
  PK: { name: 'Pakistan', aliases: ['PAK'] },
  QA: { name: 'Qatar', aliases: ['QAT'] },
  RU: { name: 'Russia', aliases: ['Russian Federation', 'RUS'] },
  SA: { name: 'Saudi Arabia', aliases: ['KSA', 'Kingdom of Saudi Arabia', 'SAU'] },
  SD: { name: 'Sudan', aliases: ['SDN'] },
  SG: { name: 'Singapore', aliases: ['SGP'] },
  SO: { name: 'Somalia', aliases: ['SOM'] },
  SY: { name: 'Syria', aliases: ['Syrian Arab Republic', 'SYR'] },
  TH: { name: 'Thailand', aliases: ['THA'] },
  TR: { name: 'Turkey', aliases: ['Türkiye', 'Turkiye', 'TUR'] },
  UA: { name: 'Ukraine', aliases: ['UKR'] },
  UG: { name: 'Uganda', aliases: ['UGA'] },
  US: { name: 'United States', aliases: ['USA', 'United States of America', 'America'] },
  UZ: { name: 'Uzbekistan', aliases: ['UZB'] },
  VN: { name: 'Vietnam', aliases: ['Viet Nam', 'VNM'] },
  YE: { name: 'Yemen', aliases: ['YEM'] },
};

const regionDisplayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/**
 * Normalizes an ISO 3166-1 alpha-2 country code into a clean display name and search aliases.
 */
export function normalizeCountryCode(rawCode: string): {
  isoCode: string;
  countryName: string;
  searchAliases: string[];
} {
  const isoCode = rawCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(isoCode)) {
    throw new Error(`Invalid ISO-3166-1 alpha-2 country code: "${rawCode}"`);
  }

  const canonical = CANONICAL_COUNTRY_NAMES[isoCode];
  if (canonical) {
    return {
      isoCode,
      countryName: canonical.name,
      searchAliases: canonical.aliases ? [...canonical.aliases] : [],
    };
  }

  let fallbackName = isoCode;
  if (regionDisplayNames) {
    try {
      const resolved = regionDisplayNames.of(isoCode);
      if (resolved && resolved !== isoCode) {
        fallbackName = resolved;
      }
    } catch {
      fallbackName = isoCode;
    }
  }

  return {
    isoCode,
    countryName: fallbackName,
    searchAliases: [],
  };
}

/**
 * Parses YouTube Studio duration strings ("0:10:22", "10:22", "0:00:00") into whole seconds.
 * Returns null for empty, suppressed, or unavailable cells.
 */
export function parseStudioDurationSeconds(raw: string | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed.toLowerCase() === 'n/a') {
    return null;
  }

  const parts = trimmed.split(':');
  if (parts.length !== 2 && parts.length !== 3) {
    throw new Error(`Invalid duration format "${raw}"`);
  }

  const nums = parts.map((p) => {
    if (!/^\d+$/.test(p.trim())) return NaN;
    return Number(p.trim());
  });

  if (nums.some((n) => !Number.isFinite(n) || n < 0)) {
    throw new Error(`Invalid numeric duration component in "${raw}"`);
  }

  if (nums.length === 2) {
    const [mins, secs] = nums;
    if (secs >= 60) throw new Error(`Invalid seconds component in "${raw}"`);
    return mins * 60 + secs;
  }

  const [hours, mins, secs] = nums;
  if (mins >= 60 || secs >= 60) {
    throw new Error(`Invalid minutes/seconds component in "${raw}"`);
  }
  return hours * 3600 + mins * 60 + secs;
}

/**
 * Formats seconds strictly as MM:SS (e.g. 622 -> "10:22", 534 -> "08:54", 58 -> "00:58", 0 -> "00:00").
 * If total minutes >= 100, expands naturally (e.g. "125:04").
 */
export function formatDurationMmSs(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return null;
  }
  const rounded = Math.round(seconds);
  const totalMinutes = Math.floor(rounded / 60);
  const remSeconds = rounded % 60;
  return `${String(totalMinutes).padStart(2, '0')}:${String(remSeconds).padStart(2, '0')}`;
}

/**
 * Classifies sample size for small-view average duration disclosures.
 * - 0 views -> 'zero_suppressed'
 * - 1..24 views -> 'very_small' (1-2 long sessions can heavily skew average)
 * - 25..99 views -> 'small'
 * - 100+ views -> 'established'
 */
export function classifyCountrySampleSize(views: number): SampleSizeClass {
  if (views <= 0) return 'zero_suppressed';
  if (views < 25) return 'very_small';
  if (views < 100) return 'small';
  return 'established';
}

/**
 * TABLE A: Top countries sorted descending by Views.
 * Excludes zero-view / suppressed rows.
 */
export function getTopCountriesByViews(
  countries: GeographyCountryRecord[],
  limit = 10
): GeographyCountryRecord[] {
  return countries
    .filter((c) => c.views > 0)
    .slice()
    .sort((a, b) => {
      if (b.views !== a.views) return b.views - a.views;
      if (b.watchTimeHours !== a.watchTimeHours) return b.watchTimeHours - a.watchTimeHours;
      return a.sourceRowOrder - b.sourceRowOrder;
    })
    .slice(0, limit);
}

/**
 * TABLE B: Top countries sorted descending by native Average View Duration.
 * Supports optional minimum-views filter (All=0, 10+, 25+, 50+, 100+).
 * Default All (0) preserves exact rankings from the YouTube Studio export for valid countries.
 */
export function getTopCountriesByAvgDuration(
  countries: GeographyCountryRecord[],
  minViews: MinimumViewsThreshold = 0,
  limit = 10
): GeographyCountryRecord[] {
  const effectiveFloor = Math.max(1, minViews);
  return countries
    .filter((c) => c.views >= effectiveFloor && c.avgViewDurationSecs !== null)
    .slice()
    .sort((a, b) => {
      const aSec = a.avgViewDurationSecs ?? -1;
      const bSec = b.avgViewDurationSecs ?? -1;
      if (bSec !== aSec) return bSec - aSec;
      // Preserve exact source export ordering when native whole-second AVD ties (e.g. OM 5:33 before MU 5:33)
      if (a.sourceRowOrder !== b.sourceRowOrder) return a.sourceRowOrder - b.sourceRowOrder;
      return b.views - a.views;
    })
    .slice(0, limit);
}

/**
 * TABLE C: Top countries sorted descending by total Watch Time (hours).
 * Excludes zero-view / zero-watch-time suppressed rows.
 */
export function getTopCountriesByWatchTime(
  countries: GeographyCountryRecord[],
  limit = 10
): GeographyCountryRecord[] {
  return countries
    .filter((c) => c.views > 0)
    .slice()
    .sort((a, b) => {
      if (b.watchTimeHours !== a.watchTimeHours) return b.watchTimeHours - a.watchTimeHours;
      if (b.views !== a.views) return b.views - a.views;
      return a.sourceRowOrder - b.sourceRowOrder;
    })
    .slice(0, limit);
}

/**
 * Filters all listed countries (including suppressed rows when searching) by country name, ISO code, or alias.
 */
export function filterCountriesByQuery(
  countries: GeographyCountryRecord[],
  query: string
): GeographyCountryRecord[] {
  const q = query.trim().toLowerCase();
  const sortedMaster = countries.slice().sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    if (b.watchTimeHours !== a.watchTimeHours) return b.watchTimeHours - a.watchTimeHours;
    return a.countryName.localeCompare(b.countryName);
  });

  if (!q) return sortedMaster;

  return sortedMaster.filter((c) => {
    if (c.isoCode.toLowerCase().includes(q)) return true;
    if (c.countryName.toLowerCase().includes(q)) return true;
    return c.searchAliases.some((alias) => alias.toLowerCase().includes(q));
  });
}
