import fs from 'node:fs';

const failures = [];
const read = file => fs.readFileSync(file, 'utf8');
const requireText = (file, text, reason) => {
  const source = read(file);
  if (!source.includes(text)) failures.push(`${file}: missing ${reason}`);
};
const forbidText = (file, text, reason) => {
  const source = read(file);
  if (source.includes(text)) failures.push(`${file}: forbidden ${reason}`);
};

const youtubePhase1Files = [
  'app/api/admin/youtube-analytics/connect/route.ts',
  'app/api/admin/youtube-analytics/callback/route.ts',
  'app/api/admin/youtube-analytics/impressions/route.ts',
  'app/api/admin/youtube-analytics/status/route.ts',
  'app/api/admin/youtube-analytics/studio-import/route.ts',
  'app/api/releases/import-youtube/route.ts',
  'app/api/releases/import-youtube/studio-reconciliation/route.ts',
  'lib/youtube-analytics-client.ts',
  'lib/youtube-data-api-readonly.ts',
  'lib/youtube-studio-import.ts',
];

for (const file of youtubePhase1Files) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}: required Phase 1 file missing`);
    continue;
  }
  forbidText(file, 'youtube.upload', 'YouTube upload scope');
  forbidText(file, 'youtube.force-ssl', 'YouTube write/delete scope');
  forbidText(file, 'Math.random', 'fabricated/random telemetry');
  forbidText(file, 'q58mRXIsi-Y', 'hard-coded test video ID');
  forbidText(file, '0.075', 'legacy fixed CTR derivation');
}

requireText('app/api/admin/youtube-analytics/connect/route.ts', 'youtube.readonly', 'read-only YouTube scope');
requireText('app/api/admin/youtube-analytics/connect/route.ts', 'yt-analytics.readonly', 'read-only Analytics scope');
requireText('app/api/admin/youtube-analytics/connect/route.ts', "url.searchParams.set('state', state)", 'OAuth CSRF state parameter');
requireText('app/api/admin/youtube-analytics/callback/route.ts', 'timingSafeEqual', 'constant-time OAuth state validation');
requireText('app/api/admin/youtube-analytics/impressions/route.ts', 'metricSources', 'per-field analytics provenance');
requireText('app/api/admin/youtube-analytics/impressions/route.ts', 'No synthetic fallback data was generated', 'explicit no-synthetic fallback contract');
requireText('app/api/releases/import-youtube/route.ts', "source: 'youtube_data_api'", 'live catalog provenance');
requireText('app/api/releases/import-youtube/studio-reconciliation/route.ts', "source: 'studio_csv'", 'Studio catalog provenance');
requireText('app/api/releases/import-youtube/studio-reconciliation/route.ts', 'authoritative: true', 'Studio first-party authority marker');
requireText('app/api/admin/discovery-performance/route.ts', 'Simulation is disabled on production hosts.', 'production simulation rejection');
requireText('app/api/admin/discovery-performance/route.ts', 'authoritative: false', 'non-authoritative simulation marker');
requireText('app/admin/discovery-performance/page.tsx', 'Simulation is isolated and non-authoritative', 'visible simulation warning');
requireText('app/admin/youtube-analytics/page.tsx', 'Metric provenance', 'analytics provenance legend');
requireText('app/admin/youtube-sync/page.tsx', 'Channel ↔ CMS Reconciliation', 'catalog reconciliation UI');
requireText('app/admin/youtube-sync/page.tsx', 'STUDIO CSV', 'Studio CSV provenance badge');

if (failures.length > 0) {
  console.error('Phase 1 final code-review guard FAILED:');
  failures.forEach(failure => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Phase 1 final code-review guard passed: no YouTube write scopes, fabricated telemetry, hard-coded test ID, or missing Phase-1 provenance/OAuth safeguards detected.');
