const fs = require('fs');

let code = fs.readFileSync('app/api/releases/route.ts', 'utf8');

if (!code.includes('getReleaseStorageBackend')) {
  code = `import { getReleaseStorageBackend, getReleaseReadStore } from '@/server/storage/release-read-backend';\n` + code;
}

// Block mutations if postgres is active
const mutationGuard = `{\n  if (getReleaseStorageBackend() === 'postgres') {\n    return NextResponse.json({ error: "Release mutations are temporarily disabled during PostgreSQL read-cutover validation." }, { status: 503 });\n  }\n`;
code = code.replace(/export async function POST\(request: NextRequest\) \{/g, `export async function POST(request: NextRequest) ${mutationGuard}`);
code = code.replace(/export async function PUT\(request: NextRequest\) \{/g, `export async function PUT(request: NextRequest) ${mutationGuard}`);
code = code.replace(/export async function DELETE\(request: NextRequest\) \{/g, `export async function DELETE(request: NextRequest) ${mutationGuard}`);

// Replace GET
const getStart = code.indexOf('export async function GET');
const postStart = code.indexOf('export async function POST');
const oldGet = code.substring(getStart, postStart);

const newGet = `export async function GET(request: NextRequest) {
  try {
    const backend = getReleaseStorageBackend();
    const { searchParams } = new URL(request.url);
    const validationResult = validateQueryParams(searchParams, releasesQuerySchema);

    if (!validationResult.success) {
      return NextResponse.json(validationResult.error, { status: 400 });
    }

    const { status, type, search, key, slug, youtubeId, governance, format, duration, year, sort } = validationResult.data;

    const lookupKey = key || slug || youtubeId;
    if (lookupKey) {
      const store = getReleaseReadStore();
      if (slug) {
        const release = await store.getBySlug(slug);
        if (release) return NextResponse.json({ ...release, resolution_source: 'cms_slug' }, { headers: cacheHeaders });
      }
      if (youtubeId) {
        const release = await store.getByYoutubeId(youtubeId);
        if (release) return NextResponse.json({ ...release, resolution_source: 'cms_youtube_compat' }, { headers: cacheHeaders });
      }
      const releaseBySlug = await store.getBySlug(lookupKey);
      if (releaseBySlug) return NextResponse.json({ ...releaseBySlug, resolution_source: 'cms_slug' }, { headers: cacheHeaders });
      const releaseByYoutubeId = await store.getByYoutubeId(lookupKey);
      if (releaseByYoutubeId) return NextResponse.json({ ...releaseByYoutubeId, resolution_source: 'cms_youtube_compat' }, { headers: cacheHeaders });
      const releaseById = await store.getById(lookupKey);
      if (releaseById) return NextResponse.json({ ...releaseById, resolution_source: 'cms_key' }, { headers: cacheHeaders });
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    if (backend === 'postgres') {
      const store = getReleaseReadStore();
      const paginationRequested = searchParams.has('page') || searchParams.has('pageSize') || searchParams.has('limit');
      
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
      const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '12', 10) || 12);
      const offset = searchParams.has('offset') ? parseInt(searchParams.get('offset') || '0', 10) : undefined;
      
      const result = await store.query({
        q: search || undefined,
        status: status || undefined,
        type: type || undefined,
        format: format || undefined,
        duration: duration || undefined,
        year: year || undefined,
        governance: governance || undefined,
        sort: sort || undefined,
        page,
        pageSize,
        offset,
        paginate: paginationRequested,
        facets: paginationRequested,
      });

      if (!paginationRequested) {
        return NextResponse.json(result.items, { headers: cacheHeaders });
      }

      return NextResponse.json({
        items: result.items,
        count: result.count,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        facets: result.facets || { years: [] }
      }, { headers: cacheHeaders });
    }

` + oldGet.substring(oldGet.indexOf('// 1. status'));

code = code.replace(oldGet, newGet);

fs.writeFileSync('app/api/releases/route.ts', code);
console.log('Patch complete.');
