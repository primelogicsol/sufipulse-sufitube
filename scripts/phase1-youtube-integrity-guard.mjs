import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const failures = [];

function requireText(path, text, reason) {
  const source = read(path);
  if (!source.includes(text)) failures.push(`${path}: missing ${reason}`);
}

function forbidText(path, text, reason) {
  const source = read(path);
  if (source.includes(text)) failures.push(`${path}: forbidden ${reason}`);
}

const analyticsRoute = 'app/api/admin/youtube-analytics/impressions/route.ts';
const oauthConnect = 'app/api/admin/youtube-analytics/connect/route.ts';
const oauthCallback = 'app/api/admin/youtube-analytics/callback/route.ts';
const graphRoute = 'app/api/admin/graph/route.ts';
const discoveryRoute = 'app/api/admin/discovery-performance/route.ts';
const syncRoute = 'app/api/releases/import-youtube/route.ts';
const studioRecon = 'app/api/releases/import-youtube/studio-reconciliation/route.ts';
const analyticsPage = 'app/admin/youtube-analytics/page.tsx';
const syncPage = 'app/admin/youtube-sync/page.tsx';

forbidText(analyticsRoute, 'derivedCtr', 'derived CTR logic');
forbidText(analyticsRoute, 'Math.random', 'random/synthetic analytics');
requireText(analyticsRoute, 'metricSources', 'per-metric provenance');
requireText(analyticsRoute, 'studioFallbackResponse', 'Studio first-party fallback');
requireText(analyticsRoute, 'No synthetic fallback data was generated', 'explicit no-synthetic failure behavior');

requireText(oauthConnect, 'yt-analytics.readonly', 'YouTube Analytics read-only scope');
requireText(oauthConnect, 'youtube.readonly', 'YouTube account read-only scope');
requireText(oauthConnect, "url.searchParams.set('state', state)", 'OAuth CSRF state');
forbidText(oauthConnect, 'youtube.upload', 'YouTube upload scope');
forbidText(oauthConnect, 'youtube.force-ssl', 'YouTube write/delete scope');
requireText(oauthCallback, 'statesMatch', 'OAuth state validation');
requireText(oauthCallback, 'timingSafeEqual', 'constant-time OAuth state comparison');

requireText(graphRoute, "watchTime: 'unavailable'", 'Graph watch-time unavailable provenance');
requireText(graphRoute, "ctr: 'unavailable'", 'Graph CTR unavailable provenance');
forbidText(graphRoute, 'estimateCtr', 'synthetic Graph CTR estimator');
forbidText(graphRoute, '0.45', 'fixed-retention Graph estimate');

requireText(discoveryRoute, 'authoritative: false', 'isolated non-authoritative simulation');
requireText(discoveryRoute, 'Simulation is disabled on production hosts.', 'production simulation rejection');
requireText(discoveryRoute, 'dataProvenance', 'Discovery provenance payload');

forbidText(syncRoute, 'q58mRXIsi-Y', 'hard-coded test video in sync route');
requireText(syncRoute, "source: 'youtube_data_api'", 'live catalog source labeling');
requireText(studioRecon, "source: 'studio_csv'", 'Studio reconciliation provenance');
requireText(studioRecon, 'authoritative: true', 'first-party Studio reconciliation authority flag');

requireText(analyticsPage, 'Metric provenance', 'analytics provenance legend');
requireText(analyticsPage, 'SourceBadge', 'per-field analytics provenance badges');
requireText(syncPage, 'Reconcile Studio Snapshot', 'quota-independent reconciliation workflow');
requireText(syncPage, 'LIVE DATA API', 'live reconciliation provenance label');
requireText(syncPage, 'STUDIO CSV', 'Studio reconciliation provenance label');

if (failures.length > 0) {
  console.error('Phase 1 YouTube integrity guard FAILED:');
  failures.forEach(failure => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Phase 1 YouTube integrity guard passed.');