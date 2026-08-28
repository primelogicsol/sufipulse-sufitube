import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin, getAuthUser } from '@/server/middleware/authenticate';
import { validateRequestBody, validateQueryParams } from '@/app/lib/api-middleware';
import { cmsReleaseSchema, releasesQuerySchema } from '@/app/lib/validation-schemas';


const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=3600',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validationResult = validateQueryParams(searchParams, releasesQuerySchema);

    if (!validationResult.success) {
      return NextResponse.json(validationResult.error, { status: 400 });
    }

    // NOTE: t and forceHydrate are not in the schema and will not be present.
    // Public GET endpoints must never trigger storage hydration.
    const { status, type, search, key, slug, youtubeId, governance, format, duration, year, sort } = validationResult.data;

    // ── Single-record lookup path ──────────────────────────────────────────
    // Resolution precedence: slug > youtubeId > key (slug/youtubeId/id fallback)
    const lookupKey = key || slug || youtubeId;
    if (lookupKey) {
      if (slug) {
        const release = cmsServerStorage.getReleaseBySlug(slug);
        if (release) return NextResponse.json({ ...release, resolution_source: 'cms_slug' }, { headers: cacheHeaders });
      }
      if (youtubeId) {
        const release = cmsServerStorage.getReleaseByYoutubeId(youtubeId);
        if (release) return NextResponse.json({ ...release, resolution_source: 'cms_youtube_compat' }, { headers: cacheHeaders });
      }
      const releaseBySlug = cmsServerStorage.getReleaseBySlug(lookupKey);
      if (releaseBySlug) return NextResponse.json({ ...releaseBySlug, resolution_source: 'cms_slug' }, { headers: cacheHeaders });
      const releaseByYoutubeId = cmsServerStorage.getReleaseByYoutubeId(lookupKey);
      if (releaseByYoutubeId) return NextResponse.json({ ...releaseByYoutubeId, resolution_source: 'cms_youtube_compat' }, { headers: cacheHeaders });
      const releaseById = cmsServerStorage.getRelease(lookupKey);
      if (releaseById) return NextResponse.json({ ...releaseById, resolution_source: 'cms_key' }, { headers: cacheHeaders });
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // ── Collection filter pipeline ─────────────────────────────────────────
    // Order: status → type → governance → search → format → duration → year → sort → COUNT → paginate

    // 1. status
    let releases = status
      ? cmsServerStorage.getAllReleases({ status })
      : cmsServerStorage.getAllReleases();

    // 2. type (legacy compat: matches releaseType field)
    if (type && type !== 'all') {
      releases = releases.filter(r => r.releaseType === type);
    }

    // 3. governance (governanceOrigin / govType)
    if (governance && governance !== 'all') {
      releases = releases.filter(r => {
        const govType = (r as any).governanceOrigin || (r as any).govType || (r as any).source;
        return govType === governance;
      });
    }

    // 4. search — full parity: canonical title, YouTube title, description, vocalist, writer, tags, youtubeId, slug
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      releases = releases.filter(r => {
        const canonical = ((r as any).canonicalTitle || r.title || '').toLowerCase();
        const youtube  = ((r as any).youtubeTitle || (r as any).youtubeStats?.title || '').toLowerCase();
        const desc     = (r.description || '').toLowerCase();
        const vocalist = typeof (r as any).vocalist === 'string'
          ? (r as any).vocalist.toLowerCase()
          : ([(r as any).vocalist?.name, (r as any).vocalist?.nameUrdu].filter(Boolean).join(' ').toLowerCase());
        const writer   = typeof (r as any).writer === 'string'
          ? (r as any).writer.toLowerCase()
          : ([(r as any).writer?.name, (r as any).writer?.nameUrdu].filter(Boolean).join(' ').toLowerCase());
        const tags     = Array.isArray((r as any).tags)
          ? (r as any).tags.join(' ').toLowerCase()
          : '';
        const ytId     = (r.youtubeId || '').toLowerCase();
        const slug     = (r.slug || '').toLowerCase();
        return canonical.includes(q) || youtube.includes(q) || desc.includes(q) ||
               vocalist.includes(q) || writer.includes(q) || tags.includes(q) ||
               ytId.includes(q) || slug.includes(q);
      });
    }

    // 5. format
    if (format && format !== 'all') {
      releases = releases.filter(r => (r as any).format === format);
    }

    // 6. duration (in seconds)
    // 'default' = Standard + Long only (>= 180s and not a 'short' format)
    // 'all' / absent = no filter
    if (duration && duration !== 'all') {
      releases = releases.filter(r => {
        const secs = (r as any).durationSeconds || 0;
        if (duration === 'default')  return secs >= 180 && (r as any).format !== 'short';
        if (duration === 'short')    return secs > 0 && secs < 180;
        if (duration === 'standard') return secs >= 180 && secs <= 480;
        if (duration === 'long')     return secs > 480;
        return true;
      });
    }

    // 7. year
    if (year && year !== 'all') {
      const y = parseInt(year, 10);
      releases = releases.filter(r => {
        const d = new Date((r as any).releaseDate || (r as any).publishedAt || (r as any).createdAt);
        return d.getFullYear() === y;
      });
    }

    // 8. sort
    const sortParam = sort || (searchParams.get('sort') as string | null) || 'newest';
    if (sortParam === 'newest') {
      releases.sort((a, b) => new Date((b as any).releaseDate || (b as any).createdAt).getTime() - new Date((a as any).releaseDate || (a as any).createdAt).getTime());
    } else if (sortParam === 'oldest') {
      releases.sort((a, b) => new Date((a as any).releaseDate || (a as any).createdAt).getTime() - new Date((b as any).releaseDate || (b as any).createdAt).getTime());
    } else if (sortParam === 'popular') {
      releases.sort((a, b) => ((b as any).viewCount || 0) - ((a as any).viewCount || 0));
    }

    // 9. COUNT (filtered total before pagination)
    const count = releases.length;

    // 9b. FACETS — computed from full filtered set, before pagination
    // Year facets let the client show correct year choices regardless of current page
    const yearFacets: number[] = Array.from(new Set(
      releases.map(r => {
        const d = new Date((r as any).releaseDate || (r as any).publishedAt || (r as any).createdAt);
        const y = d.getFullYear();
        return isNaN(y) ? null : y;
      }).filter((y): y is number => y !== null)
    )).sort((a, b) => b - a);
    const facets = { years: yearFacets };

    // 10. paginate
    const pageParam    = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit');

    if (pageParam || pageSizeParam) {
      const page     = Math.max(1, parseInt(pageParam || '1', 10) || 1);
      const pageSize = Math.max(1, parseInt(pageSizeParam || '12', 10) || 12);
      const offset   = parseInt(searchParams.get('offset') || '0', 10) || (page - 1) * pageSize;
      const totalPages = Math.ceil(count / pageSize);
      const items    = releases.slice(offset, offset + pageSize);

      return NextResponse.json({ items, count, page, pageSize, totalPages, facets }, { headers: cacheHeaders });
    }

    return NextResponse.json(releases, { headers: cacheHeaders });

  } catch (err: any) {
    console.error('[API /api/releases] GET ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const rawBody = await request.json();
    const body = normalizeFieldNames(rawBody);
    const now = new Date().toISOString();
    
    const id = body.id || `release_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const slug = body.slug || id;

    // Check for collisions
    if (cmsServerStorage.getRelease(id)) {
      return NextResponse.json({ error: 'Release ID already exists' }, { status: 409 });
    }
    if (cmsServerStorage.getReleaseBySlug(slug)) {
      return NextResponse.json({ error: 'Release slug already exists' }, { status: 409 });
    }

    const release: CMSRelease = {
      id,
      title: body.title || 'Untitled Release',
      slug,
      youtubeId: body.youtubeId || '',
      description: body.description || '',
      releaseDate: body.releaseDate || now,
      durationSeconds: body.durationSeconds || 0,
      durationFormatted: body.durationFormatted || '0:00',
      viewCount: body.viewCount || 0,
      likeCount: body.likeCount || 0,
      status: body.status || 'draft',
      visibility: body.visibility || 'public',
      source: body.source || 'cms',
      format: body.format || 'video',
      createdAt: now,
      updatedAt: now,
      availableLanguages: body.availableLanguages || ['en', 'ur'],
      defaultLanguage: body.defaultLanguage || 'en',
      lyrics: body.lyrics || {},
      enableLyrics: body.enableLyrics !== false,
      enableCommentary: body.enableCommentary !== false,
      enableSponsors: !!body.enableSponsors,
      enableAdoption: body.enableAdoption !== false,
      enableCredits: body.enableCredits !== false,
      ...body,
    };

    // Run Zod validation schema
    const validationResult = cmsReleaseSchema.safeParse(release);
    if (!validationResult.success) {
      console.warn('[API /api/releases] POST Validation failed:', validationResult.error.format());
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const saved = cmsServerStorage.saveRelease(release);

    // --- CACHE INVALIDATION ---
    try {
      revalidatePath('/');
      revalidatePath('/releases');
      revalidatePath(`/release-detail/${slug}`);
      revalidatePath('/release-detail/[slug]', 'page');
    } catch (cacheErr) {
      console.warn('Cache revalidation failed during POST:', cacheErr);
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/releases] POST ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Normalizes field names from potential snake_case to camelCase
 */
function normalizeFieldNames(body: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...body };
  const fieldMap: Record<string, string> = {
    release_title: 'title',
    youtube_video_id: 'youtubeId',
    duration_seconds: 'durationSeconds',
    view_count: 'viewCount',
    like_count: 'likeCount',
  };

  for (const [key, val] of Object.entries(fieldMap)) {
    if (body[key] !== undefined && body[val] === undefined) {
      result[val] = body[key];
    }
  }
  return result;
}
