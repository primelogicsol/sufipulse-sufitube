import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.join(process.cwd(), '.next', 'server', 'app-paths-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('Phase 1 route regression guard FAILED: production app-paths manifest is missing. Run after next build.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function normalizeRouteKey(key) {
  const normalized = key
    // Next App Router route groups, e.g. /(public)/releases/page, are not URL segments.
    .replace(/\/\([^/]+\)/g, '')
    // Manifest keys end in /page for pages and /route for route handlers.
    .replace(/\/(page|route)$/, '')
    .replace(/\/+/g, '/');

  return normalized === '' ? '/' : normalized;
}

const routes = new Set(Object.keys(manifest).map(normalizeRouteKey));

const requiredRoutes = [
  '/',
  '/releases',
  '/release-detail/[slug]',
  '/admin',
  '/admin/cms-releases',
  '/admin/discovery-graph',
  '/admin/discovery-performance',
  '/admin/youtube-analytics',
  '/admin/youtube-sync',
  '/api/admin/discovery-performance',
  '/api/admin/graph',
  '/api/admin/youtube-analytics/connect',
  '/api/admin/youtube-analytics/callback',
  '/api/admin/youtube-analytics/impressions',
  '/api/admin/youtube-analytics/status',
  '/api/admin/youtube-analytics/studio-import',
  '/api/releases/import-youtube',
  '/api/releases/import-youtube/studio-reconciliation',
];

const missing = requiredRoutes.filter(route => !routes.has(route));
if (missing.length > 0) {
  console.error('Phase 1 route regression guard FAILED. Missing built routes after Next App Router normalization:');
  missing.forEach(route => console.error(` - ${route}`));
  process.exit(1);
}

console.log(`Phase 1 route regression guard passed: ${requiredRoutes.length} critical public/admin/API routes are present in the production build.`);
