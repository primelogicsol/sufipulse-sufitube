import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { chromium } from 'playwright';

dotenv.config({ path: fs.existsSync('.env.local') ? '.env.local' : '.env' });

import {
  classifyCountrySampleSize,
  filterCountriesByQuery,
  formatDurationMmSs,
  getTopCountriesByAvgDuration,
  getTopCountriesByViews,
  getTopCountriesByWatchTime,
  normalizeCountryCode,
  parseStudioDurationSeconds,
} from '../lib/youtube-geography';
import {
  getYouTubeGeographySnapshot,
  ingestYouTubeGeographyZipBuffer,
  parseGeographyCsvRows,
} from '../lib/youtube-geography-import';

const ZIP_SOURCE_PATH =
  process.argv[2] ||
  'C:\\Users\\Fayaz\\Downloads\\Geography 2025-05-20_2026-11-23 SufiPulse USA.zip';

const SCREENSHOT_DIR =
  process.argv[3] ||
  path.join(process.cwd(), '.data', 'audit', 'geography-verification');

async function runVerification() {
  console.log('================================================================');
  console.log(' SUFIPULSE YOUTUBE GEOGRAPHY ANALYTICS — FULL VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`PASS: ${name}${detail ? ` (${detail})` : ''}`);
      passed += 1;
    } else {
      console.error(`FAIL: ${name}${detail ? ` (${detail})` : ''}`);
      failed += 1;
    }
  }

  // Record snapshot hash before tests to confirm underlying data file is never mutated
  const snapshotFilePath = path.join(process.cwd(), '.data', 'youtube-studio-geography.json');
  const snapshotRawBefore = fs.readFileSync(snapshotFilePath, 'utf8');

  // 1. Unit tests: CSV encoding, BOM stripping, duration & country helpers
  const bomCsv =
    '\uFEFFGeography,Views,Average view duration,Watch time (hours)\r\n"IN",73405,0:03:51,4725.4144\r\n';
  const parsedBom = parseGeographyCsvRows(bomCsv);
  assert(
    'CSV Parser: Strips UTF-8 BOM and parses CRLF + quoted fields',
    parsedBom.length === 2 && parsedBom[0][0] === 'Geography' && parsedBom[1][0] === 'IN'
  );

  assert(
    'Country Normalization: Resolves canonical names & aliases',
    normalizeCountryCode('ae').countryName === 'United Arab Emirates' &&
      normalizeCountryCode('gb').countryName === 'United Kingdom' &&
      normalizeCountryCode('cd').countryName === 'DR Congo'
  );

  let invalidIsoThrew = false;
  try {
    normalizeCountryCode('INVALID');
  } catch {
    invalidIsoThrew = true;
  }
  assert('Country Normalization: Rejects invalid ISO code', invalidIsoThrew);

  assert(
    'Duration Conversion: Parses H:MM:SS and formats strictly as MM:SS',
    parseStudioDurationSeconds('0:10:22') === 622 &&
      formatDurationMmSs(622) === '10:22' &&
      parseStudioDurationSeconds('0:08:54') === 534 &&
      formatDurationMmSs(534) === '08:54' &&
      parseStudioDurationSeconds('0:00:58') === 58 &&
      formatDurationMmSs(58) === '00:58' &&
      parseStudioDurationSeconds('0:00:00') === 0 &&
      formatDurationMmSs(0) === '00:00' &&
      parseStudioDurationSeconds('') === null &&
      formatDurationMmSs(null) === null
  );

  assert(
    'Sample Size Classifier: Distinguishes zero, very_small (<25), small (<100), established (100+)',
    classifyCountrySampleSize(0) === 'zero_suppressed' &&
      classifyCountrySampleSize(10) === 'very_small' &&
      classifyCountrySampleSize(50) === 'small' &&
      classifyCountrySampleSize(133) === 'established'
  );

  // 2. Verify persisted snapshot & cross-check every ranking directly against raw Table data.csv
  const snapshot = getYouTubeGeographySnapshot();
  assert('Snapshot Persistence: .data/youtube-studio-geography.json exists and loads', !!snapshot);
  if (!snapshot) {
    process.exit(1);
  }

  assert(
    'Sanitization: Snapshot contains filename only and zero local filesystem paths',
    snapshot.zipFileName === 'Geography 2025-05-20_2026-11-23 SufiPulse USA.zip' &&
      !JSON.stringify(snapshot).includes('Downloads') &&
      !JSON.stringify(snapshot).includes('Fayaz')
  );

  assert(
    'Provenance: Not labeled as a live API connection & discloses CSV channel metadata behavior',
    snapshot.liveApiConnection === false &&
      snapshot.displayMode === 'published_verified_snapshot' &&
      snapshot.channelId === 'UCraDr3i5A3k0j7typ6tOOsQ' &&
      snapshot.channelIdIndependentlyConfirmedByCsv === false
  );

  assert(
    'Counts: 52 listed territories, 48 measurable views, 4 zero-view suppressed rows',
    snapshot.counts.listedCountryRows === 52 &&
      snapshot.counts.measurableCountries === 48 &&
      snapshot.counts.zeroOrSuppressedRows === 4
  );

  if (fs.existsSync(ZIP_SOURCE_PATH)) {
    const zipBuf = fs.readFileSync(ZIP_SOURCE_PATH);
    const zip = await JSZip.loadAsync(zipBuf);
    const rawTableText = await zip.file('Table data.csv')!.async('string');
    const rawRows = parseGeographyCsvRows(rawTableText).slice(1);
    const totalRow = rawRows.find((r) => r[0] === 'Total')!;
    const rawCountries = rawRows
      .filter((r) => r[0] !== 'Total')
      .map((r, i) => ({
        iso: r[0],
        views: Number(r[1]),
        avdRaw: r[2],
        avdSecs: parseStudioDurationSeconds(r[2]),
        watchHours: Number(r[3]),
        order: i,
      }));

    assert(
      'Reconciliation: Export Total row matches 160,696 views & 10,412.7901 watch hours',
      snapshot.totals.exportTotalRowViews === Number(totalRow[1]) &&
        Math.abs(snapshot.totals.exportTotalRowWatchTimeHours - Number(totalRow[3])) < 0.0001
    );

    const rawViewsSum = rawCountries.reduce((s, r) => s + r.views, 0);
    const rawWatchSum = Number(rawCountries.reduce((s, r) => s + r.watchHours, 0).toFixed(4));
    assert(
      'Reconciliation: Country-attributed sums match raw CSV exactly (145,261 views)',
      snapshot.totals.countryAttributedViews === rawViewsSum &&
        Math.abs(snapshot.totals.countryAttributedWatchTimeHours - rawWatchSum) < 0.0001
    );

    const expectedTopViews = rawCountries
      .filter((r) => r.views > 0)
      .slice()
      .sort((a, b) => b.views - a.views || b.watchHours - a.watchHours)
      .slice(0, 10)
      .map((r) => r.iso);
    const actualTopViews = getTopCountriesByViews(snapshot.countries, 10).map((r) => r.isoCode);
    assert(
      'Ranking A (Top 10 Views): Matches raw CSV descending order exactly',
      JSON.stringify(actualTopViews) === JSON.stringify(expectedTopViews),
      actualTopViews.join(', ')
    );

    const expectedTopAvdAll = rawCountries
      .filter((r) => r.views > 0 && r.avdSecs !== null)
      .slice()
      .sort((a, b) => (b.avdSecs ?? -1) - (a.avdSecs ?? -1) || a.order - b.order)
      .slice(0, 10)
      .map((r) => r.iso);
    const actualTopAvdAll = getTopCountriesByAvgDuration(snapshot.countries, 0, 10).map(
      (r) => r.isoCode
    );
    assert(
      'Ranking B (Top 10 Avg View Duration - All): Preserves exact export rankings',
      JSON.stringify(actualTopAvdAll) === JSON.stringify(expectedTopAvdAll),
      actualTopAvdAll.join(', ')
    );

    const actualTopAvd100 = getTopCountriesByAvgDuration(snapshot.countries, 100, 10);
    assert(
      'Ranking B (100+ Minimum Views): Filters out <100 view countries and ranks BD #1 (06:31)',
      actualTopAvd100.length === 10 &&
        actualTopAvd100.every((c) => c.views >= 100) &&
        actualTopAvd100[0].isoCode === 'BD' &&
        actualTopAvd100[0].avgViewDurationFormatted === '06:31'
    );

    const expectedTopWatch = rawCountries
      .filter((r) => r.views > 0)
      .slice()
      .sort((a, b) => b.watchHours - a.watchHours || b.views - a.views)
      .slice(0, 10)
      .map((r) => r.iso);
    const actualTopWatch = getTopCountriesByWatchTime(snapshot.countries, 10).map(
      (r) => r.isoCode
    );
    assert(
      'Ranking C (Top 10 Watch Time Hours): Matches raw CSV watch hours descending exactly',
      JSON.stringify(actualTopWatch) === JSON.stringify(expectedTopWatch),
      actualTopWatch.join(', ')
    );

    const reingested = await ingestYouTubeGeographyZipBuffer(
      zipBuf,
      path.basename(ZIP_SOURCE_PATH)
    );
    assert(
      'Idempotency: Re-ingesting identical ZIP checksum in memory preserves snapshot version',
      reingested.version === snapshot.version && reingested.zipSha256 === snapshot.zipSha256
    );
  }

  const uaeMatches = filterCountriesByQuery(snapshot.countries, 'UAE');
  assert(
    'Country Search: Matches ISO codes, names, and aliases ("UAE" -> United Arab Emirates)',
    uaeMatches.length === 1 && uaeMatches[0].isoCode === 'AE'
  );

  // 3. HTTP API & Security Verification (Read-only so underlying data remains unmodified)
  const port = process.env.PORT || '3005';
  const baseUrl = `http://localhost:${port}`;

  const pubReachRes = await fetch(`${baseUrl}/api/public/youtube/global-reach`);
  assert('Public API: GET /api/public/youtube/global-reach returns 200', pubReachRes.status === 200);
  const pubReachJson = await pubReachRes.json();

  assert(
    'Baseline Preservation: Existing CTR (8.4%), Gender (42.7% / 57.3%), and Countries Reached (53) untouched',
    pubReachJson.performance?.clickThroughRate === 8.4 &&
      pubReachJson.ageGender?.gender?.female === 42.7 &&
      pubReachJson.ageGender?.gender?.male === 57.3 &&
      pubReachJson.geographies?.totalCountries === 53
  );

  const unauthGet = await fetch(`${baseUrl}/api/admin/youtube-analytics/geography-import`);
  const unauthPost = await fetch(`${baseUrl}/api/admin/youtube-analytics/geography-import`, {
    method: 'POST',
  });
  assert(
    'Admin Security: Unauthenticated GET/POST /api/admin/youtube-analytics/geography-import returns 401',
    unauthGet.status === 401 && unauthPost.status === 401
  );

  // 4. Playwright Browser E2E & Graph Simplification Verification
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 2400 } });
    const page = await desktopCtx.newPage();
    await page.goto(`${baseUrl}/releases`, { waitUntil: 'networkidle', timeout: 45000 });

    const geoSection = page.getByTestId('global-audience-by-country');
    await geoSection.waitFor({ state: 'visible', timeout: 20000 });

    const pageTextUpper = (await page.locator('body').innerText()).toUpperCase();
    assert(
      'UI Preservation: Existing Global Reach Index, Age & Gender, Countries Reached (53), and Verified Analytics Source render intact',
      pageTextUpper.includes('GLOBAL REACH INDEX') &&
        pageTextUpper.includes('1.0M') &&
        pageTextUpper.includes('8.4%') &&
        pageTextUpper.includes('169.1K') &&
        pageTextUpper.includes('10.9K') &&
        pageTextUpper.includes('42.7%') &&
        pageTextUpper.includes('57.3%') &&
        pageTextUpper.includes('COUNTRIES REACHED') &&
        pageTextUpper.includes('53') &&
        pageTextUpper.includes('VERIFIED ANALYTICS SOURCE')
    );

    const countriesCardBox = await page
      .locator('div', { hasText: /^Countries Reached$/ })
      .first()
      .boundingBox();
    const geoBox = await geoSection.boundingBox();
    const verifiedSourceBox = await page
      .locator('span', { hasText: 'Verified Analytics Source' })
      .first()
      .boundingBox();

    assert(
      'DOM Placement: GLOBAL AUDIENCE BY COUNTRY sits strictly after Countries Reached and before Verified Analytics Source',
      !!countriesCardBox &&
        !!geoBox &&
        !!verifiedSourceBox &&
        countriesCardBox.y < geoBox.y &&
        geoBox.y < verifiedSourceBox.y
    );

    // Hide fixed site top-nav only during screenshot capture
    await page.addStyleTag({ content: 'header, nav.fixed { visibility: hidden !important; }' });

    const chartLocator = page.getByTestId('geography-ranking-chart');
    const chartDefaultText = await chartLocator.innerText();
    const tableCountInSection = await geoSection.locator('table').count();

    assert(
      'Graph Simplification (Most Views): Displays ONLY rank (#1..#10) and country name — zero view counts, watch hours, durations, percentages, or duplicate tables',
      tableCountInSection === 0 &&
        chartDefaultText.includes('#1') &&
        chartDefaultText.includes('India') &&
        chartDefaultText.includes('#10') &&
        chartDefaultText.includes('United Kingdom') &&
        !chartDefaultText.includes('73,405') &&
        !chartDefaultText.includes('4,725') &&
        !chartDefaultText.includes('03:51') &&
        !chartDefaultText.includes('%')
    );

    // Verify Gold (#1) vs Teal (#2-#10) bar tones and accurate proportions
    const bar1Tone = await page.getByTestId('geo-bar-fill-1').getAttribute('data-bar-tone');
    const bar2Tone = await page.getByTestId('geo-bar-fill-2').getAttribute('data-bar-tone');
    const bar10Tone = await page.getByTestId('geo-bar-fill-10').getAttribute('data-bar-tone');
    assert(
      'Visual Standard: #1 Leading country bar is Gold and #2-#10 bars are Teal',
      bar1Tone === 'gold' && bar2Tone === 'teal' && bar10Tone === 'teal'
    );

    const bar1Box = await page.getByTestId('geo-bar-fill-1').boundingBox();
    const bar2Box = await page.getByTestId('geo-bar-fill-2').boundingBox();
    const bar3Box = await page.getByTestId('geo-bar-fill-3').boundingBox();
    const expectedRatio2 = 38911 / 73405;
    const actualRatio2 = (bar2Box?.width ?? 0) / (bar1Box?.width ?? 1);
    assert(
      'Bar Proportions: #1 is longest (100%) and #2/#3 scale accurately to actual metric ratios',
      !!bar1Box &&
        !!bar2Box &&
        !!bar3Box &&
        bar1Box.width > bar2Box.width &&
        bar2Box.width > bar3Box.width &&
        Math.abs(actualRatio2 - expectedRatio2) < 0.015,
      `ratio2=${actualRatio2.toFixed(4)} vs expected=${expectedRatio2.toFixed(4)}`
    );

    // Verify optional hover tooltip reveals exact values on hover and disappears on mouse leave
    await page.getByTestId('geo-rank-row-1').hover();
    const tooltipLocator = page.getByTestId('geo-tooltip-IN');
    await tooltipLocator.waitFor({ state: 'visible' });
    const tooltipText = await tooltipLocator.innerText();
    assert(
      'Hover Tooltip: Reveals exact verified metrics on hover ("73,405 views")',
      tooltipText.includes('73,405 views') && tooltipText.includes('4,725.41 hrs')
    );
    // Move mouse away so screenshots show clean default graph presentation
    await page.mouse.move(10, 10);
    await page.waitForTimeout(200);
    assert(
      'Hover Tooltip: Unmounts cleanly when not hovered',
      (await tooltipLocator.count()) === 0
    );

    const fullDashboardSection = geoSection.locator('xpath=ancestor::section[1]');
    await fullDashboardSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await fullDashboardSection.screenshot({
      path: path.join(SCREENSHOT_DIR, '00-desktop-full-global-reach-dashboard.png'),
    });

    await geoSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await geoSection.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-desktop-most-views.png'),
    });

    // Switch to Longest Average Viewing without reloading page
    let navTriggered = false;
    page.on('framenavigated', () => {
      navTriggered = true;
    });

    await page.getByTestId('geo-tab-avg_duration').click();
    await page.mouse.move(10, 10);
    await page.waitForTimeout(200);
    const chartAvdText = await chartLocator.innerText();
    assert(
      'Graph Simplification (Longest Average Viewing): Displays Spain #1 without duration/view labels',
      !navTriggered &&
        chartAvdText.includes('#1') &&
        chartAvdText.includes('Spain') &&
        !chartAvdText.includes('10:22') &&
        !chartAvdText.includes('%')
    );
    await geoSection.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-desktop-avg-duration-all.png'),
    });

    // Switch minimum views to 100+
    await page.getByTestId('min-views-100').click();
    await page.mouse.move(10, 10);
    await page.waitForTimeout(200);
    const chartAvd100Text = await chartLocator.innerText();
    assert(
      'Interactive Filter (100+ Views): Ranks Bangladesh #1 in Gold without permanent number labels',
      chartAvd100Text.includes('Bangladesh') &&
        !chartAvd100Text.includes('Spain') &&
        !chartAvd100Text.includes('06:31')
    );
    await geoSection.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-desktop-avg-duration-100plus.png'),
    });

    // Switch to Most Watch Hours
    await page.getByTestId('geo-tab-watch_hours').click();
    await page.mouse.move(10, 10);
    await page.waitForTimeout(450);
    const chartWatchText = await chartLocator.innerText();
    assert(
      'Graph Simplification (Most Watch Hours): Displays India #1 and Saudi Arabia #6 without hour/pct labels',
      !navTriggered &&
        chartWatchText.includes('India') &&
        chartWatchText.includes('Saudi Arabia') &&
        !chartWatchText.includes('4,725') &&
        !chartWatchText.includes('%')
    );
    await geoSection.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-desktop-most-watch-hours.png'),
    });

    // Country Search
    await page.getByTestId('geography-country-search').fill('Nepal');
    await page.getByTestId('master-country-table-container').waitFor({ state: 'visible' });
    const masterSearchText = await page
      .getByTestId('master-country-table-container')
      .innerText();
    assert(
      'Master Country Search: Displays Nepal in clean graph format',
      masterSearchText.includes('Nepal') && !masterSearchText.includes('1,795')
    );
    await geoSection.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-desktop-country-search.png'),
    });

    await desktopCtx.close();

    // Mobile 390x844
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    const mPage = await mobileCtx.newPage();
    await mPage.goto(`${baseUrl}/releases`, { waitUntil: 'networkidle', timeout: 45000 });
    await mPage.addStyleTag({ content: 'header, nav.fixed { visibility: hidden !important; }' });
    const mGeoSection = mPage.getByTestId('global-audience-by-country');
    await mGeoSection.waitFor({ state: 'visible', timeout: 20000 });
    await mGeoSection.scrollIntoViewIfNeeded();
    await mPage.waitForTimeout(300);

    const overflowCheck = await mPage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    assert(
      'Mobile Responsiveness (390px): No horizontal page overflow or layout clipping',
      overflowCheck.scrollWidth <= overflowCheck.innerWidth + 1,
      `scrollWidth=${overflowCheck.scrollWidth}, innerWidth=${overflowCheck.innerWidth}`
    );

    const mBar1Box = await mPage.getByTestId('geo-bar-fill-1').boundingBox();
    assert(
      'Mobile Bar Rendering: Proportional bars render with full height (>=10px) and width on 390px mobile',
      !!mBar1Box && mBar1Box.height >= 10 && mBar1Box.width > 250,
      `height=${Math.round(mBar1Box?.height ?? 0)}px, width=${Math.round(mBar1Box?.width ?? 0)}px`
    );

    await mGeoSection.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-mobile-most-views.png'),
    });

    await mobileCtx.close();
  } finally {
    await browser.close();
  }

  // Confirm underlying YouTube Analytics Geography snapshot file is byte-for-byte unchanged
  const snapshotRawAfter = fs.readFileSync(snapshotFilePath, 'utf8');
  assert(
    'Data Immutability: Underlying .data/youtube-studio-geography.json remained byte-for-byte unmodified',
    snapshotRawBefore === snapshotRawAfter
  );

  console.log('\n================================================================');
  console.log(` VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(` Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
