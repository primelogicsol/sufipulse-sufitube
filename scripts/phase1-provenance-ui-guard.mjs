import fs from 'node:fs';

const failures = [];
const read = file => fs.readFileSync(file, 'utf8');
const requireText = (file, text, reason) => {
  const source = read(file);
  if (!source.includes(text)) failures.push(`${file}: missing ${reason}`);
};

const discovery = 'app/admin/discovery-performance/page.tsx';
const analytics = 'app/admin/youtube-analytics/page.tsx';
const sync = 'app/admin/youtube-sync/page.tsx';

requireText(discovery, 'Authoritative Data Provenance', 'visible provenance section');
requireText(discovery, 'Simulation is isolated and non-authoritative', 'visible simulation isolation warning');
requireText(discovery, 'YOUTUBE LIVE API', 'live YouTube provenance label');
requireText(discovery, 'YOUTUBE UNAVAILABLE', 'unavailable YouTube provenance label');
requireText(discovery, 'REGISTRY / OBSERVATION', 'internal/registry provenance label');

requireText(analytics, 'Metric provenance', 'metric provenance legend');
requireText(analytics, "return 'LIVE API'", 'LIVE API source label');
requireText(analytics, "return 'STUDIO CSV'", 'STUDIO CSV source label');
requireText(analytics, "return 'UNAVAILABLE'", 'UNAVAILABLE source label');
requireText(analytics, 'SourceBadge', 'per-metric provenance badges');

requireText(sync, 'Read-only channel synchronization', 'read-only workflow statement');
requireText(sync, 'Channel ↔ CMS Reconciliation', 'CMS reconciliation label');
requireText(sync, 'STUDIO CSV', 'Studio CSV reconciliation provenance');
requireText(sync, 'LIVE DATA API', 'live Data API reconciliation provenance');
requireText(sync, 'CMS', 'CMS provenance vocabulary');

if (failures.length > 0) {
  console.error('Phase 1 UI provenance guard FAILED:');
  failures.forEach(failure => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Phase 1 UI provenance guard passed: simulation/live state and LIVE API / STUDIO CSV / CMS / UNAVAILABLE provenance are visibly represented across the relevant admin surfaces.');
