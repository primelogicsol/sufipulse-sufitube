import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import {
  classifyCountrySampleSize,
  formatDurationMmSs,
  getTopCountriesByAvgDuration,
  getTopCountriesByViews,
  getTopCountriesByWatchTime,
  normalizeCountryCode,
  parseStudioDurationSeconds,
  type GeographyCountryRecord,
  type GeographyExtractedFileMeta,
  type GeographyLeaderSummary,
  type GeographySnapshotVersionRecord,
  type YouTubeGeographySnapshot,
} from './youtube-geography';

const DEFAULT_CHANNEL_ID = 'UCraDr3i5A3k0j7typ6tOOsQ';
const DEFAULT_BASELINE_COUNTRIES_REACHED = 53;
const MAX_ZIP_BYTES = 15 * 1024 * 1024; // 15 MB guard
const MAX_EXTRACTED_CSV_BYTES = 5 * 1024 * 1024; // 5 MB per CSV guard

const resolveDataDir = (): string => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (fs.existsSync('/app/.data')) return '/app/.data';
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const GEOGRAPHY_SNAPSHOT_FILE = path.join(DATA_DIR, 'youtube-studio-geography.json');

export interface IngestGeographyOptions {
  channelId?: string;
  baselineCountriesReached?: number;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  importedAt?: string;
}

/**
 * RFC-4180 compliant CSV parser handling UTF-8 BOM, quoted fields, and CRLF/LF line endings.
 */
export function parseGeographyCsvRows(rawText: string): string[][] {
  const text = rawText.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (quoted && next === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (ch === ',' && !quoted) {
      row.push(field);
      field = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((v) => v.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += ch;
  }

  if (quoted) {
    throw new Error('Malformed CSV: unclosed quoted field.');
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.trim() !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function normalizeHeaderName(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function parseNonNegativeNumber(raw: string | undefined, fieldLabel: string): number {
  const cleaned = (raw ?? '').replace(/,/g, '').trim();
  if (!cleaned || cleaned === '—' || cleaned === '-') {
    return 0;
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid numeric value "${raw}" for ${fieldLabel}`);
  }
  return value;
}

function parseStrictNonNegativeInt(raw: string | undefined, fieldLabel: string): number {
  const value = parseNonNegativeNumber(raw, fieldLabel);
  if (!Number.isInteger(value)) {
    throw new Error(`Expected integer value for ${fieldLabel}, received "${raw}"`);
  }
  return value;
}

function formatIsoDateHuman(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monthIdx < 0 || monthIdx > 11) return isoDate;
  return `${months[monthIdx]} ${day}, ${year}`;
}

/**
 * Extracts reporting period and channel display name from official YouTube Studio Geography ZIP filenames
 * such as: "Geography 2025-05-20_2026-11-23 SufiPulse USA.zip"
 */
export function parseMetadataFromZipFileName(fileName: string): {
  sanitizedFileName: string;
  reportingPeriodStart: string | null;
  reportingPeriodEnd: string | null;
  channelNameFromExport: string | null;
} {
  const sanitizedFileName = path.basename(fileName.replace(/\\/g, '/')).trim();
  const baseNoExt = sanitizedFileName.replace(/\.zip$/i, '').trim();
  const match = baseNoExt.match(
    /^Geography\s+(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})(?:\s+(.+))?$/i
  );

  if (!match) {
    return {
      sanitizedFileName,
      reportingPeriodStart: null,
      reportingPeriodEnd: null,
      channelNameFromExport: null,
    };
  }

  return {
    sanitizedFileName,
    reportingPeriodStart: match[1],
    reportingPeriodEnd: match[2],
    channelNameFromExport: match[3]?.trim() || null,
  };
}

function roundPct(numerator: number, denominator: number, decimals = 2): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(decimals));
}

function toLeaderSummary(record: GeographyCountryRecord | undefined): GeographyLeaderSummary | null {
  if (!record) return null;
  return {
    isoCode: record.isoCode,
    countryName: record.countryName,
    views: record.views,
    watchTimeHours: Number(record.watchTimeHours.toFixed(4)),
    avgViewDurationFormatted: record.avgViewDurationFormatted,
    avgViewDurationSecs: record.avgViewDurationSecs,
    viewsShareAttributedPct: record.viewsShareAttributedPct,
    watchTimeShareAttributedPct: record.watchTimeShareAttributedPct,
    sampleClass: record.sampleClass,
  };
}

/**
 * Core deterministic parser & validator for extracted YouTube Studio Geography CSV files.
 */
export function buildSnapshotFromExtractedCsvs(params: {
  zipFileName: string;
  zipSha256: string;
  tableCsvText: string;
  tableByteLength: number;
  chartCsvText?: string | null;
  chartByteLength?: number;
  totalsCsvText?: string | null;
  totalsByteLength?: number;
  extraFiles?: GeographyExtractedFileMeta[];
  previousSnapshot?: YouTubeGeographySnapshot | null;
  options?: IngestGeographyOptions;
}): YouTubeGeographySnapshot {
  const {
    zipFileName,
    zipSha256,
    tableCsvText,
    tableByteLength,
    chartCsvText,
    chartByteLength = 0,
    totalsCsvText,
    totalsByteLength = 0,
    extraFiles = [],
    previousSnapshot = null,
    options = {},
  } = params;

  const fileMeta = parseMetadataFromZipFileName(zipFileName);
  const channelId = options.channelId || DEFAULT_CHANNEL_ID;
  const baselineCountriesReached =
    options.baselineCountriesReached ?? DEFAULT_BASELINE_COUNTRIES_REACHED;
  const importedAt = options.importedAt || new Date().toISOString();

  // 1. Parse Table data.csv
  const tableRows = parseGeographyCsvRows(tableCsvText);
  if (tableRows.length < 2) {
    throw new Error('Table data.csv must contain a header row and at least one data row.');
  }

  const rawTableHeaders = tableRows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
  const normTableHeaders = rawTableHeaders.map(normalizeHeaderName);

  const geoIdx = normTableHeaders.findIndex((h) => h === 'geography' || h === 'country');
  const viewsIdx = normTableHeaders.findIndex((h) => h === 'views');
  const avdIdx = normTableHeaders.findIndex(
    (h) => h === 'average view duration' || h === 'avg view duration'
  );
  const watchHoursIdx = normTableHeaders.findIndex((h) => h === 'watch time (hours)');
  const watchMinutesIdx = normTableHeaders.findIndex((h) => h === 'watch time (minutes)');

  if (geoIdx < 0) {
    throw new Error(
      `Geography column missing in Table data.csv. Found columns: ${rawTableHeaders.join(', ')}`
    );
  }
  if (viewsIdx < 0) {
    throw new Error(
      `Views column missing in Table data.csv. Found columns: ${rawTableHeaders.join(', ')}`
    );
  }
  if (avdIdx < 0) {
    throw new Error(
      `Average view duration column missing in Table data.csv. Found columns: ${rawTableHeaders.join(', ')}`
    );
  }
  if (watchHoursIdx < 0 && watchMinutesIdx < 0) {
    throw new Error(
      `Watch time column missing in Table data.csv. Found columns: ${rawTableHeaders.join(', ')}`
    );
  }

  // 2. Parse optional Chart data.csv (yearly per-country AVD)
  const yearlyByCountry: Record<
    string,
    { secs: Record<string, number | null>; formatted: Record<string, string | null> }
  > = {};
  const chartYearsSet = new Set<string>();
  let chartMeta: GeographyExtractedFileMeta | null = null;

  if (chartCsvText && chartCsvText.trim()) {
    const chartRows = parseGeographyCsvRows(chartCsvText);
    if (chartRows.length >= 1) {
      const chartHeaders = chartRows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
      const normChart = chartHeaders.map(normalizeHeaderName);
      const cDateIdx = normChart.indexOf('date');
      const cGeoIdx = normChart.findIndex((h) => h === 'geography' || h === 'country');
      const cAvdIdx = normChart.findIndex(
        (h) => h === 'average view duration' || h === 'avg view duration'
      );

      if (cDateIdx >= 0 && cGeoIdx >= 0 && cAvdIdx >= 0) {
        for (const r of chartRows.slice(1)) {
          const yr = (r[cDateIdx] ?? '').trim();
          const code = (r[cGeoIdx] ?? '').trim().toUpperCase();
          if (!yr || !code || code === 'TOTAL') continue;
          chartYearsSet.add(yr);
          const secs = parseStudioDurationSeconds(r[cAvdIdx]);
          if (!yearlyByCountry[code]) {
            yearlyByCountry[code] = { secs: {}, formatted: {} };
          }
          yearlyByCountry[code].secs[yr] = secs;
          yearlyByCountry[code].formatted[yr] = formatDurationMmSs(secs);
        }
      }

      chartMeta = {
        fileName: 'Chart data.csv',
        byteLength: chartByteLength,
        rowCount: Math.max(0, chartRows.length - 1),
        columns: chartHeaders,
      };
    }
  }

  // 3. Parse optional Totals.csv (yearly channel-wide AVD)
  const yearlyChannelAvgViewDuration: Record<
    string,
    { raw: string; formatted: string; seconds: number }
  > = {};
  let totalsMeta: GeographyExtractedFileMeta | null = null;

  if (totalsCsvText && totalsCsvText.trim()) {
    const totalsRows = parseGeographyCsvRows(totalsCsvText);
    if (totalsRows.length >= 1) {
      const totalsHeaders = totalsRows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
      const normTotals = totalsHeaders.map(normalizeHeaderName);
      const tDateIdx = normTotals.indexOf('date');
      const tAvdIdx = normTotals.findIndex(
        (h) => h === 'average view duration' || h === 'avg view duration'
      );

      if (tDateIdx >= 0 && tAvdIdx >= 0) {
        for (const r of totalsRows.slice(1)) {
          const yr = (r[tDateIdx] ?? '').trim();
          const rawAvd = (r[tAvdIdx] ?? '').trim();
          if (!yr || !rawAvd) continue;
          chartYearsSet.add(yr);
          const secs = parseStudioDurationSeconds(rawAvd);
          if (secs !== null) {
            yearlyChannelAvgViewDuration[yr] = {
              raw: rawAvd,
              formatted: formatDurationMmSs(secs) ?? rawAvd,
              seconds: secs,
            };
          }
        }
      }

      totalsMeta = {
        fileName: 'Totals.csv',
        byteLength: totalsByteLength,
        rowCount: Math.max(0, totalsRows.length - 1),
        columns: totalsHeaders,
      };
    }
  }

  // 4. Separate aggregate Total row from individual country rows in Table data.csv
  let hasTotalRow = false;
  let exportTotalRowViews = 0;
  let exportTotalRowWatchTimeHours = 0;
  let exportTotalRowAvgViewDurationRaw = '';
  let exportTotalRowAvgViewDurationSecs = 0;

  interface RawCountryDraft {
    isoCode: string;
    countryName: string;
    searchAliases: string[];
    sourceRowOrder: number;
    views: number;
    avgViewDurationRaw: string | null;
    avgViewDurationFormatted: string | null;
    avgViewDurationSecs: number | null;
    derivedAvgViewDurationSecs: number | null;
    watchTimeHours: number;
  }

  const draftsByIso = new Map<string, RawCountryDraft>();
  let sourceOrderCounter = 0;

  for (const row of tableRows.slice(1)) {
    const rawGeo = (row[geoIdx] ?? '').trim();
    if (!rawGeo) continue;

    if (rawGeo.toLowerCase() === 'total') {
      hasTotalRow = true;
      exportTotalRowViews = parseStrictNonNegativeInt(row[viewsIdx], 'Total Views');
      exportTotalRowWatchTimeHours =
        watchHoursIdx >= 0
          ? parseNonNegativeNumber(row[watchHoursIdx], 'Total Watch time (hours)')
          : parseNonNegativeNumber(row[watchMinutesIdx], 'Total Watch time (minutes)') / 60;
      exportTotalRowAvgViewDurationRaw = (row[avdIdx] ?? '').trim();
      exportTotalRowAvgViewDurationSecs =
        parseStudioDurationSeconds(exportTotalRowAvgViewDurationRaw) ?? 0;
      continue;
    }

    const { isoCode, countryName, searchAliases } = normalizeCountryCode(rawGeo);
    const views = parseStrictNonNegativeInt(row[viewsIdx], `Views (${isoCode})`);
    const watchTimeHours =
      watchHoursIdx >= 0
        ? parseNonNegativeNumber(row[watchHoursIdx], `Watch time hours (${isoCode})`)
        : parseNonNegativeNumber(row[watchMinutesIdx], `Watch time minutes (${isoCode})`) / 60;

    const avdCell = (row[avdIdx] ?? '').trim();
    const nativeAvdSecs = parseStudioDurationSeconds(avdCell);

    // If views === 0, treat empty/unavailable AVD strictly as null (never fabricate 0:00 for 0-view suppressed rows)
    const resolvedAvdSecs = views === 0 && nativeAvdSecs === null ? null : nativeAvdSecs;
    const derivedSecs =
      views > 0 && watchTimeHours >= 0 ? Number(((watchTimeHours * 3600) / views).toFixed(2)) : null;

    if (draftsByIso.has(isoCode)) {
      throw new Error(`Duplicate country row "${isoCode}" encountered in Table data.csv`);
    }

    draftsByIso.set(isoCode, {
      isoCode,
      countryName,
      searchAliases,
      sourceRowOrder: sourceOrderCounter++,
      views,
      avgViewDurationRaw: avdCell || null,
      avgViewDurationFormatted: formatDurationMmSs(resolvedAvdSecs),
      avgViewDurationSecs: resolvedAvdSecs,
      derivedAvgViewDurationSecs: derivedSecs,
      watchTimeHours: Number(watchTimeHours.toFixed(4)),
    });
  }

  const drafts = Array.from(draftsByIso.values());
  if (drafts.length === 0) {
    throw new Error('Table data.csv contained zero valid country rows.');
  }

  const countryAttributedViews = drafts.reduce((sum, c) => sum + c.views, 0);
  const countryAttributedWatchTimeHours = Number(
    drafts.reduce((sum, c) => sum + c.watchTimeHours, 0).toFixed(4)
  );

  if (!hasTotalRow) {
    exportTotalRowViews = countryAttributedViews;
    exportTotalRowWatchTimeHours = countryAttributedWatchTimeHours;
    exportTotalRowAvgViewDurationSecs =
      countryAttributedViews > 0
        ? Math.round((countryAttributedWatchTimeHours * 3600) / countryAttributedViews)
        : 0;
    exportTotalRowAvgViewDurationRaw =
      formatDurationMmSs(exportTotalRowAvgViewDurationSecs) ?? '00:00';
  }

  const countries: GeographyCountryRecord[] = drafts.map((d) => ({
    ...d,
    viewsShareAttributedPct: roundPct(d.views, countryAttributedViews, 2),
    viewsShareChannelTotalPct: roundPct(d.views, exportTotalRowViews, 2),
    watchTimeShareAttributedPct: roundPct(d.watchTimeHours, countryAttributedWatchTimeHours, 2),
    watchTimeShareChannelTotalPct: roundPct(d.watchTimeHours, exportTotalRowWatchTimeHours, 2),
    sampleClass: classifyCountrySampleSize(d.views),
    yearlyAvgViewDurationSecs: yearlyByCountry[d.isoCode]?.secs ?? {},
    yearlyAvgViewDurationFormatted: yearlyByCountry[d.isoCode]?.formatted ?? {},
  }));

  const measurableCountries = countries.filter((c) => c.views > 0).length;
  const zeroOrSuppressedRows = countries.filter((c) => c.views === 0).length;
  const zeroWatchTimeWithViewsRows = countries.filter(
    (c) => c.views > 0 && c.watchTimeHours === 0
  ).length;

  const unattributedViewsDelta = Math.max(0, exportTotalRowViews - countryAttributedViews);
  const unattributedViewsPct = roundPct(unattributedViewsDelta, exportTotalRowViews, 2);

  const unattributedWatchTimeHoursDelta = Number(
    Math.max(0, exportTotalRowWatchTimeHours - countryAttributedWatchTimeHours).toFixed(4)
  );
  const unattributedWatchTimePct = roundPct(
    unattributedWatchTimeHoursDelta,
    exportTotalRowWatchTimeHours,
    2
  );

  // 5. Compute Leaders & Top 10 Summaries
  const top10Views = getTopCountriesByViews(countries, 10);
  const top10Watch = getTopCountriesByWatchTime(countries, 10);
  const top10AvdAll = getTopCountriesByAvgDuration(countries, 0, 10);
  const top10Avd100Plus = getTopCountriesByAvgDuration(countries, 100, 10);

  const top10ViewsTotal = top10Views.reduce((sum, c) => sum + c.views, 0);
  const top10ViewsShareAttributedPct = roundPct(top10ViewsTotal, countryAttributedViews, 2);

  const top10WatchHoursTotal = Number(
    top10Watch.reduce((sum, c) => sum + c.watchTimeHours, 0).toFixed(4)
  );
  const top10WatchHoursShareAttributedPct = roundPct(
    top10WatchHoursTotal,
    countryAttributedWatchTimeHours,
    2
  );

  // 6. Reporting Period & Provenance Reconciliation Notes
  const startPeriod = options.reportingPeriodStart ?? fileMeta.reportingPeriodStart;
  const endPeriod = options.reportingPeriodEnd ?? fileMeta.reportingPeriodEnd;
  const chartYears = Array.from(chartYearsSet).sort();

  let reportingPeriodSource: YouTubeGeographySnapshot['reportingPeriodSource'] = 'yearly_csv_only';
  let reportingPeriodLabel =
    chartYears.length > 0 ? `${chartYears[0]} – ${chartYears[chartYears.length - 1]}` : 'Lifetime';

  if (options.reportingPeriodStart && options.reportingPeriodEnd) {
    reportingPeriodSource = 'explicit_override';
    reportingPeriodLabel = `${formatIsoDateHuman(options.reportingPeriodStart)} – ${formatIsoDateHuman(options.reportingPeriodEnd)}`;
  } else if (startPeriod && endPeriod) {
    reportingPeriodSource = 'zip_filename_and_yearly_csv';
    reportingPeriodLabel = `${formatIsoDateHuman(startPeriod)} – ${formatIsoDateHuman(endPeriod)}`;
  }

  // Check whether any CSV directly contained the UC... channel ID string
  const csvCombinedCheck = `${tableCsvText}\n${chartCsvText ?? ''}\n${totalsCsvText ?? ''}`;
  const channelIdIndependentlyConfirmedByCsv = csvCombinedCheck.includes(channelId);

  const channelVerificationNote = channelIdIndependentlyConfirmedByCsv
    ? `Independently confirmed channel ID ${channelId} inside exported CSV metadata.`
    : `YouTube Studio Geography CSV files do not embed a Channel ID column; export archive identifies "${fileMeta.channelNameFromExport || 'SufiPulse USA'}" and channel totals (${exportTotalRowViews.toLocaleString()} views, ${exportTotalRowWatchTimeHours.toFixed(1)} watch hrs, ${formatDurationMmSs(exportTotalRowAvgViewDurationSecs)} AVD) reconcile with configured channel ${channelId}.`;

  const reconciliationNotes: string[] = [];
  if (unattributedViewsDelta > 0) {
    reconciliationNotes.push(
      `Export Total row reports ${exportTotalRowViews.toLocaleString()} views vs ${countryAttributedViews.toLocaleString()} summed across ${measurableCountries} measurable countries (${unattributedViewsDelta.toLocaleString()} views / ${unattributedViewsPct}% unattributed due to YouTube Studio's per-country privacy threshold of ~10 views).`
    );
  }
  if (unattributedWatchTimeHoursDelta > 0) {
    reconciliationNotes.push(
      `Export Total row reports ${exportTotalRowWatchTimeHours.toFixed(4)} watch hours vs ${countryAttributedWatchTimeHours.toFixed(4)} summed across country rows (${unattributedWatchTimeHoursDelta.toFixed(4)} hrs / ${unattributedWatchTimePct}% unattributed across thresholded territories).`
    );
  }
  if (zeroOrSuppressedRows > 0) {
    const suppressedCodes = countries
      .filter((c) => c.views === 0)
      .map((c) => `${c.countryName} (${c.isoCode})`)
      .join(', ');
    reconciliationNotes.push(
      `${zeroOrSuppressedRows} listed territories (${suppressedCodes}) have 0 reported views and blank average view duration in Table data.csv; excluded from Top-10 active rankings and preserved in the master table.`
    );
  }
  if (zeroWatchTimeWithViewsRows > 0) {
    const subSecCodes = countries
      .filter((c) => c.views > 0 && c.watchTimeHours === 0)
      .map((c) => `${c.countryName} (${c.isoCode}: ${c.views} views)`)
      .join(', ');
    reconciliationNotes.push(
      `${zeroWatchTimeWithViewsRows} territories (${subSecCodes}) report measurable views with 0.0000 rounded watch hours and 00:00 native AVD due to brief/rounded impressions.`
    );
  }

  const countriesReachedComparisonNote =
    measurableCountries === baselineCountriesReached
      ? `Matches the verified channel baseline of ${baselineCountriesReached} countries.`
      : `The preserved Countries Reached card (${baselineCountriesReached}) reflects the channel-level verified snapshot (May 20, 2025 – Sep 11, 2026). This YouTube Studio Geography CSV (${reportingPeriodLabel}) lists ${countries.length} territories, of which ${measurableCountries} meet YouTube Studio's per-country reporting threshold (≥10 views) and ${zeroOrSuppressedRows} have privacy-suppressed zero-view rows.`;

  const extractedFiles: GeographyExtractedFileMeta[] = [
    {
      fileName: 'Table data.csv',
      byteLength: tableByteLength,
      rowCount: tableRows.length - 1, // 1 Total row + N country rows
      columns: rawTableHeaders,
    },
    ...(chartMeta ? [chartMeta] : []),
    ...(totalsMeta ? [totalsMeta] : []),
    ...extraFiles,
  ];

  // Build versioned import history (capped at 20 records, deduped if re-importing identical checksum)
  const prevHistory = previousSnapshot?.importHistory ?? [];
  const isSameChecksumAsPrev = previousSnapshot?.zipSha256 === zipSha256;
  const nextVersion = previousSnapshot
    ? isSameChecksumAsPrev
      ? previousSnapshot.version
      : previousSnapshot.version + 1
    : 1;

  const currentVersionEntry: GeographySnapshotVersionRecord = {
    version: nextVersion,
    importedAt,
    zipFileName: fileMeta.sanitizedFileName,
    zipSha256,
    reportingPeriodStart: startPeriod,
    reportingPeriodEnd: endPeriod,
    measurableCountries,
    listedCountryRows: countries.length,
    countryAttributedViews,
    exportTotalRowViews,
    countryAttributedWatchTimeHours,
    exportTotalRowWatchTimeHours: Number(exportTotalRowWatchTimeHours.toFixed(4)),
  };

  const filteredPrevHistory = prevHistory.filter((h) => h.zipSha256 !== zipSha256);
  const importHistory = [currentVersionEntry, ...filteredPrevHistory].slice(0, 20);

  return {
    version: nextVersion,
    source: 'youtube_studio_geography_csv',
    sourceLabel: 'YouTube Studio Geography CSV',
    displayMode: 'published_verified_snapshot',
    liveApiConnection: false,
    channelId,
    channelNameFromExport: fileMeta.channelNameFromExport,
    channelIdIndependentlyConfirmedByCsv,
    channelVerificationNote,
    reportingPeriodStart: startPeriod,
    reportingPeriodEnd: endPeriod,
    reportingPeriodLabel,
    reportingPeriodSource,
    chartYears,
    importedAt,
    zipFileName: fileMeta.sanitizedFileName,
    zipSha256,
    extractedFiles,
    counts: {
      listedCountryRows: countries.length,
      measurableCountries,
      zeroOrSuppressedRows,
      zeroWatchTimeWithViewsRows,
      baselineCountriesReachedPreserved: baselineCountriesReached,
    },
    totals: {
      exportTotalRowViews,
      countryAttributedViews,
      unattributedViewsDelta,
      unattributedViewsPct,
      exportTotalRowWatchTimeHours: Number(exportTotalRowWatchTimeHours.toFixed(4)),
      countryAttributedWatchTimeHours,
      unattributedWatchTimeHoursDelta,
      unattributedWatchTimePct,
      exportTotalRowAvgViewDurationRaw,
      exportTotalRowAvgViewDurationFormatted:
        formatDurationMmSs(exportTotalRowAvgViewDurationSecs) ?? '00:00',
      exportTotalRowAvgViewDurationSecs,
      yearlyChannelAvgViewDuration,
    },
    summary: {
      measurableCountries,
      leadingByViews: toLeaderSummary(top10Views[0]),
      leadingByWatchHours: toLeaderSummary(top10Watch[0]),
      leadingByAvgDurationAll: toLeaderSummary(top10AvdAll[0]),
      leadingByAvgDuration100Plus: toLeaderSummary(top10Avd100Plus[0]),
      top10ViewsTotal,
      top10ViewsShareAttributedPct,
      top10WatchHoursTotal,
      top10WatchHoursShareAttributedPct,
      countriesReachedComparisonNote,
    },
    metricDefinitions: {
      views:
        'Verified lifetime views attributed to each country in YouTube Studio Table data.csv (excluding the aggregate Total row).',
      watchTimeHours:
        'Total lifetime watch time expressed strictly in hours from YouTube Studio Watch time (hours).',
      averageViewDuration:
        'Native YouTube Studio Average view duration formatted as MM:SS; blank cells on 0-view rows remain unavailable.',
      countryAttributedShare:
        'Country metric divided by the sum of all country-attributed rows (100% across measurable countries), with unattributed privacy-thresholded channel totals disclosed separately.',
      smallSampleFlag:
        'Countries below 25 views ("Very Low Sample") and 25–99 views ("Low Sample") are flagged because 1–2 long sessions can skew average viewing duration.',
    },
    reconciliation: {
      status: 'verified_with_threshold_disclosure',
      isViewsReconciled: countryAttributedViews <= exportTotalRowViews,
      isWatchTimeReconciled:
        countryAttributedWatchTimeHours <= exportTotalRowWatchTimeHours + 0.01,
      notes: reconciliationNotes,
    },
    countries,
    importHistory,
  };
}

/**
 * Safely extracts a YouTube Studio Geography ZIP buffer in memory (with zip-slip & size guards),
 * validates all CSV tables, and returns a normalized YouTubeGeographySnapshot.
 */
export async function ingestYouTubeGeographyZipBuffer(
  zipBuffer: Buffer,
  originalFileName: string,
  options?: IngestGeographyOptions
): Promise<YouTubeGeographySnapshot> {
  if (!Buffer.isBuffer(zipBuffer) || zipBuffer.length === 0) {
    throw new Error('Uploaded Geography ZIP buffer is empty.');
  }
  if (zipBuffer.length > MAX_ZIP_BYTES) {
    throw new Error(`Geography ZIP exceeds maximum allowed size (${MAX_ZIP_BYTES} bytes).`);
  }

  const zipSha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');
  const archive = await JSZip.loadAsync(zipBuffer);

  let tableCsvText: string | null = null;
  let tableByteLength = 0;
  let chartCsvText: string | null = null;
  let chartByteLength = 0;
  let totalsCsvText: string | null = null;
  let totalsByteLength = 0;
  const extraFiles: GeographyExtractedFileMeta[] = [];

  const entryNames = Object.keys(archive.files).sort();
  for (const entryName of entryNames) {
    const entry = archive.files[entryName];
    if (entry.dir) continue;
    if (entryName.includes('..') || entryName.startsWith('/') || entryName.startsWith('\\')) {
      throw new Error(`Unsafe archive entry path rejected: "${entryName}"`);
    }
    if (entryName.includes('__MACOSX')) continue;

    const baseName = path.posix.basename(entryName.replace(/\\/g, '/'));
    if (!baseName.toLowerCase().endsWith('.csv')) continue;

    const rawBytes = await entry.async('nodebuffer');
    if (rawBytes.length > MAX_EXTRACTED_CSV_BYTES) {
      throw new Error(`CSV entry "${baseName}" exceeds 5 MB safety limit.`);
    }
    const text = rawBytes.toString('utf8');
    const lowerBase = baseName.toLowerCase();

    if (lowerBase === 'table data.csv') {
      tableCsvText = text;
      tableByteLength = rawBytes.length;
    } else if (lowerBase === 'chart data.csv') {
      chartCsvText = text;
      chartByteLength = rawBytes.length;
    } else if (lowerBase === 'totals.csv') {
      totalsCsvText = text;
      totalsByteLength = rawBytes.length;
    } else {
      const parsedExtra = parseGeographyCsvRows(text);
      extraFiles.push({
        fileName: baseName,
        byteLength: rawBytes.length,
        rowCount: Math.max(0, parsedExtra.length - 1),
        columns: parsedExtra[0]?.map((c) => c.trim()) ?? [],
      });
    }
  }

  if (!tableCsvText) {
    throw new Error(
      'Required "Table data.csv" was not found inside the YouTube Studio Geography ZIP archive.'
    );
  }

  const previousSnapshot = getYouTubeGeographySnapshot();

  return buildSnapshotFromExtractedCsvs({
    zipFileName: originalFileName,
    zipSha256,
    tableCsvText,
    tableByteLength,
    chartCsvText,
    chartByteLength,
    totalsCsvText,
    totalsByteLength,
    extraFiles,
    previousSnapshot,
    options,
  });
}

/**
 * Atomically persists the verified Geography snapshot into `.data/youtube-studio-geography.json`.
 */
export function saveYouTubeGeographySnapshot(snapshot: YouTubeGeographySnapshot): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempPath = `${GEOGRAPHY_SNAPSHOT_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(snapshot, null, 2), 'utf8');
  fs.renameSync(tempPath, GEOGRAPHY_SNAPSHOT_FILE);
}

/**
 * Reads the persisted verified Geography snapshot for public read-only consumption.
 * Never touches user Downloads or external filesystem paths.
 */
export function getYouTubeGeographySnapshot(): YouTubeGeographySnapshot | null {
  try {
    if (!fs.existsSync(GEOGRAPHY_SNAPSHOT_FILE)) return null;
    const raw = fs.readFileSync(GEOGRAPHY_SNAPSHOT_FILE, 'utf8');
    const parsed = JSON.parse(raw) as YouTubeGeographySnapshot;
    if (
      !parsed ||
      parsed.source !== 'youtube_studio_geography_csv' ||
      !Array.isArray(parsed.countries)
    ) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('[youtube-geography-import] Failed to read geography snapshot:', err);
    return null;
  }
}
