import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const manifestPath = path.join(process.cwd(), '.next', 'server', 'app-paths-manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('Phase 1 route parity guard FAILED: production app-paths manifest is missing. Run after next build.');
  process.exit(1);
}

function normalizeRouteKey(key) {
  const normalized = key
    .replace(/^app\//, '/')
    .replace(/\/\([^/]+\)/g, '')
    .replace(/\/(page|route)(\.[^.]+)?$/, '')
    .replace(/\/+/g, '/');
  return normalized === '' ? '/' : normalized;
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const builtRoutes = new Set(Object.keys(manifest).map(normalizeRouteKey));

let mainFiles;
try {
  mainFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', 'origin/main', '--', 'app'], { encoding: 'utf8' })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
} catch (error) {
  console.error('Phase 1 route parity guard FAILED: could not enumerate origin/main app routes.');
  throw error;
}

const ordinaryRouteFile = /\/(page|route)\.(?:ts|tsx|js|jsx)$/;
const mainRouteFiles = mainFiles.filter(file => ordinaryRouteFile.test(file));
const mainRoutes = new Map();
for (const file of mainRouteFiles) {
  // Parallel/intercepting route slots do not represent independent public URLs.
  if (file.split('/').some(segment => segment.startsWith('@'))) continue;
  const route = normalizeRouteKey(file);
  if (!mainRoutes.has(route)) mainRoutes.set(route, []);
  mainRoutes.get(route).push(file);
}

const missing = [...mainRoutes.keys()].filter(route => !builtRoutes.has(route));
if (missing.length > 0) {
  console.error(`Phase 1 route parity guard FAILED: ${missing.length} route(s) from main are absent from the production build:`);
  for (const route of missing) {
    console.error(` - ${route} <= ${mainRoutes.get(route).join(', ')}`);
  }
  process.exit(1);
}

const allowedChangedRouteFiles = new Set([
  'app/(public)/discovery/page.tsx',
  'app/admin/discovery-performance/page.tsx',
  'app/admin/youtube-analytics/page.tsx',
  'app/admin/youtube-sync/page.tsx',
  'app/api/admin/discovery-performance/route.ts',
  'app/api/admin/graph/route.ts',
  'app/api/admin/youtube-analytics/callback/route.ts',
  'app/api/admin/youtube-analytics/connect/route.ts',
  'app/api/admin/youtube-analytics/impressions/route.ts',
  'app/api/admin/youtube-analytics/status/route.ts',
  'app/api/debug/youtube-sync/route.ts',
  'app/api/releases/import-youtube/route.ts',
]);

const changedFiles = execFileSync('git', ['diff', '--name-only', 'origin/main...HEAD', '--', 'app'], { encoding: 'utf8' })
  .split('\n')
  .map(line => line.trim())
  .filter(Boolean);

const changedExistingRouteFiles = changedFiles.filter(file => {
  if (!ordinaryRouteFile.test(file)) return false;
  try {
    execFileSync('git', ['cat-file', '-e', `origin/main:${file}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
});

const unrelatedRouteChanges = changedExistingRouteFiles.filter(file => !allowedChangedRouteFiles.has(file));
if (unrelatedRouteChanges.length > 0) {
  console.error('Phase 1 route parity guard FAILED: unrelated pre-existing route modules changed:');
  unrelatedRouteChanges.forEach(file => console.error(` - ${file}`));
  process.exit(1);
}

console.log(`Phase 1 route parity guard passed: all ${mainRoutes.size} ordinary main-branch app routes remain present in the production build, and no unrelated pre-existing route module was modified.`);
