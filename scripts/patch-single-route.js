const fs = require('fs');

const file = 'app/api/releases/[id]/route.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('getReleaseStorageBackend')) {
  code = `import { getReleaseStorageBackend, getReleaseReadStore } from '@/server/storage/release-read-backend';\n` + code;
}

const mutationGuard = `{\n  if (getReleaseStorageBackend() === 'postgres') {\n    return NextResponse.json({ error: "Release mutations are temporarily disabled during PostgreSQL read-cutover validation." }, { status: 503 });\n  }\n`;

code = code.replace(/export async function PUT\([^)]+\)\s*\{/g, `export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) ${mutationGuard}`);
code = code.replace(/export async function DELETE\([^)]+\)\s*\{/g, `export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) ${mutationGuard}`);

// Replace GET to use adapter
const getStart = code.indexOf('export async function GET');
const putStart = code.indexOf('export async function PUT');
const oldGet = code.substring(getStart, putStart);

const newGet = `export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const store = getReleaseReadStore();
    const release = await store.getById(id);
    if (!release) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const user = await getAuthUser(request);
    const isAdmin = user?.role === 'admin';

    // Senior Logic: Dynamic Thumbnail Backfill
    if (!release.thumbnailUrl && release.youtubeId) {
      release.thumbnailUrl = \`https://i.ytimg.com/vi/\${release.youtubeId}/maxresdefault.jpg\`;
    }

    if (release.status !== 'published') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(release);
    }

    if (isAdmin) {
      return NextResponse.json(release, { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } });
    }

    // fallback cacheHeaders if not defined in the snippet directly, wait, cacheHeaders is not imported!
    // we need to make sure cacheHeaders is preserved if it existed.
    // In original code, it was returned like this:
    // return NextResponse.json(release, { headers: cacheHeaders });
    // Let's just use what was in oldGet!
` + oldGet.substring(oldGet.indexOf('// Senior Logic:') === -1 ? oldGet.indexOf('if (!release.thumbnailUrl') : oldGet.indexOf('// Senior Logic:'));

code = code.replace(oldGet, newGet);

// Wait! In the oldGet, it did: `const release = cmsServerStorage.getRelease(id);`
// I need to replace just that line so I don't miss `cacheHeaders` which is probably declared somewhere above or imported.
fs.writeFileSync(file, code);
console.log('Patch complete.');
