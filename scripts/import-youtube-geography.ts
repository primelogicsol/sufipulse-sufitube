/**
 * CLI Pipeline: Import & Verify Official YouTube Studio Geography ZIP Export
 *
 * Usage:
 *   npm run geography:import -- "C:\path\to\Geography YYYY-MM-DD_YYYY-MM-DD SufiPulse USA.zip"
 *
 * Safely extracts the ZIP into an isolated temporary working directory to inspect/verify
 * archive members, runs the canonical server-side ingestion & reconciliation pipeline,
 * and persists the sanitized versioned snapshot to `.data/youtube-studio-geography.json`.
 * Never stores local filesystem paths inside the published snapshot.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import {
  getTopCountriesByAvgDuration,
  getTopCountriesByViews,
  getTopCountriesByWatchTime,
} from '../lib/youtube-geography';
import {
  ingestYouTubeGeographyZipBuffer,
  saveYouTubeGeographySnapshot,
} from '../lib/youtube-geography-import';

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error(
      'Usage: npm run geography:import -- "<path-to-YouTube-Studio-Geography-export.zip>"'
    );
    process.exit(1);
  }

  const resolvedZipPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedZipPath)) {
    console.error(`Error: Geography ZIP file not found at: ${resolvedZipPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolvedZipPath);
  if (!stat.isFile()) {
    console.error(`Error: Path is not a file: ${resolvedZipPath}`);
    process.exit(1);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sufipulse-yt-geo-'));

  try {
    const zipBuffer = fs.readFileSync(resolvedZipPath);
    const originalFileName = path.basename(resolvedZipPath);

    // Extract safely into isolated temporary working directory for physical file verification
    const archive = await JSZip.loadAsync(zipBuffer);
    const extractedOnDisk: string[] = [];

    for (const [entryName, entry] of Object.entries(archive.files)) {
      if (entry.dir || entryName.includes('__MACOSX')) continue;
      const safeName = path.basename(entryName.replace(/\\/g, '/'));
      const targetFile = path.join(tempDir, safeName);
      const content = await entry.async('nodebuffer');
      fs.writeFileSync(targetFile, content);
      extractedOnDisk.push(`${safeName} (${content.length} bytes)`);
    }

    // Run canonical ingestion & reconciliation pipeline
    const snapshot = await ingestYouTubeGeographyZipBuffer(zipBuffer, originalFileName);
    saveYouTubeGeographySnapshot(snapshot);

    console.log('================================================================');
    console.log(' SUFIPULSE YOUTUBE GEOGRAPHY SNAPSHOT IMPORT COMPLETE');
    console.log('================================================================');
    console.log(`ZIP Filename:        ${snapshot.zipFileName}`);
    console.log(`SHA-256 Checksum:    ${snapshot.zipSha256}`);
    console.log(`Snapshot Version:    v${snapshot.version}`);
    console.log(`Reporting Period:    ${snapshot.reportingPeriodLabel}`);
    console.log(`Channel ID:          ${snapshot.channelId}`);
    console.log(`Extracted CSV Files: ${extractedOnDisk.join(', ')}`);
    console.log(`Listed Territories:  ${snapshot.counts.listedCountryRows}`);
    console.log(`Measurable Views:    ${snapshot.counts.measurableCountries} countries`);
    console.log(`Suppressed (0-view): ${snapshot.counts.zeroOrSuppressedRows} territories`);
    console.log(
      `Views Reconcile:     ${snapshot.totals.countryAttributedViews.toLocaleString()} country-attributed / ${snapshot.totals.exportTotalRowViews.toLocaleString()} channel total (${snapshot.totals.unattributedViewsDelta.toLocaleString()} unattributed)`
    );
    console.log(
      `Watch Hrs Reconcile: ${snapshot.totals.countryAttributedWatchTimeHours.toFixed(4)} hrs country-attributed / ${snapshot.totals.exportTotalRowWatchTimeHours.toFixed(4)} hrs channel total`
    );

    console.log('\n--- Top 10 Countries by Views ---');
    getTopCountriesByViews(snapshot.countries, 10).forEach((c, idx) => {
      console.log(
        `  #${idx + 1} ${c.countryName} (${c.isoCode}): ${c.views.toLocaleString()} views (${c.viewsShareAttributedPct}%) | ${c.watchTimeHours.toFixed(2)} hrs | AVD ${c.avgViewDurationFormatted}`
      );
    });

    console.log('\n--- Top 10 Countries by Average View Duration (All) ---');
    getTopCountriesByAvgDuration(snapshot.countries, 0, 10).forEach((c, idx) => {
      console.log(
        `  #${idx + 1} ${c.countryName} (${c.isoCode}): AVD ${c.avgViewDurationFormatted} | ${c.views.toLocaleString()} views (${c.sampleClass}) | ${c.watchTimeHours.toFixed(2)} hrs`
      );
    });

    console.log('\n--- Top 10 Countries by Watch Time (Hours) ---');
    getTopCountriesByWatchTime(snapshot.countries, 10).forEach((c, idx) => {
      console.log(
        `  #${idx + 1} ${c.countryName} (${c.isoCode}): ${c.watchTimeHours.toFixed(2)} hrs (${c.watchTimeShareAttributedPct}%) | ${c.views.toLocaleString()} views | AVD ${c.avgViewDurationFormatted}`
      );
    });
    console.log('\nSaved verified snapshot -> .data/youtube-studio-geography.json');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('[geography:import] Fatal error:', err);
  process.exit(1);
});
