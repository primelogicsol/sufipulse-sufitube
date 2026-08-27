import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.join(process.cwd(), '.next', 'server', 'app-paths-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('Phase 1 route regression guard FAILED: production app-paths manifest is missing. Run after next build.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const routes = new Set(Object.keys(manifest));

const requiredRoutes = [
  '/',
  '/releases/page',
  '/release-detail/[slug]/page',
  '/admin/page',
  '/admin/cms-releases/page',
  '/admin/discovery-graph/page',
  '/admin/discovery-performance/page',
  '/admin/youtube-analytics/page',
  '/admin/youtube-sync/page',
  '/api/admin/discovery-performance/route',
  '/api/admin/graph/route',
  '/api/admin/youtube-analytics/connect/route',
  '/api/admin/youtube-analytics/callback/route',
  '/api/admin/youtube-analytics/impressions/route',
  '/api/admin/youtube-analytics/status/route',
  '/api/admin/youtube-analytics/studio-import/route',
  '/api/releases/import-youtube/route',
  '/api/releases/import-youtube/studio-reconciliation/route',
];

const missing = requiredRoutes.filter(route => !routes.has(route));
if (missing.length > 0) {
  console.error('Phase 1 route regression guard FAILED. Missing built routes:');
  missing.forEach(route => console.error(` - ${route}`));
  process.exit(1);
}

console.log(`Phase 1 route regression guard passed: ${requiredRoutes.length} critical public/admin/API routes are present in the production build.`);
