import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin, getAuthUser } from '@/server/middleware/authenticate';
import { validateRequestBody, validateQueryParams } from '@/app/lib/api-middleware';
import { cmsReleaseSchema, releasesQuerySchema } from '@/app/lib/validation-schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const cacheHeaders = {
  'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=3600',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validationResult = validateQueryParams(searchParams, releasesQuerySchema);
    
    if (!validationResult.success) {
      return NextResponse.json(validationResult.error, { status: 400 });
    }

    const { status, type, search, key, slug, youtubeId, t, forceHydrate } = validationResult.data;
    
    // 0) Handle cache busting and re-hydration
    // Unconditionally re-check disk if t or forceHydrate is present
    if (forceHydrate || t) {
      console.log(`[API /api/releases] Forcing disk re-hydration check (t=${t})`);
      cmsServerStorage.forceHydrate();
    }

    const allReleases = cmsServerStorage.getAllReleases();
    const headers = new Headers();
    headers.set('X-Registry-Count', allReleases.length.toString());
    headers.set('Cache-Control', 'no-store, must-revalidate');
    // This is used by the release-detail page for fast CMS lookup
    const lookupKey = key || slug || youtubeId;
    if (lookupKey) {
      // PHASE 1: Contract Hardening - Resolution precedence
      // 1. Explicit slug lookup
      if (slug) {
        const release = cmsServerStorage.getReleaseBySlug(slug);
        if (release) return NextResponse.json({ ...release, resolution_source: 'cms_slug' }, { headers: cacheHeaders });
      }
      
      // 2. Explicit youtubeId lookup
      if (youtubeId) {
        const release = cmsServerStorage.getReleaseByYoutubeId(youtubeId);
        if (release) return NextResponse.json({ ...release, resolution_source: 'cms_youtube_compat' }, { headers: cacheHeaders });
      }

      // 3. Fallback: try key as slug then youtubeId then ID
      const releaseBySlug = cmsServerStorage.getReleaseBySlug(lookupKey);
      if (releaseBySlug) return NextResponse.json({ ...releaseBySlug, resolution_source: 'cms_slug' }, { headers: cacheHeaders });

      const releaseByYoutubeId = cmsServerStorage.getReleaseByYoutubeId(lookupKey);
      if (releaseByYoutubeId) return NextResponse.json({ ...releaseByYoutubeId, resolution_source: 'cms_youtube_compat' }, { headers: cacheHeaders });

      const releaseById = cmsServerStorage.getRelease(lookupKey);
      if (releaseById) return NextResponse.json({ ...releaseById, resolution_source: 'cms_key' }, { headers: cacheHeaders });
      
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // 2) Fetch releases based on status if provided
    let releases = status 
      ? cmsServerStorage.getAllReleases({ status }) 
      : cmsServerStorage.getAllReleases();

    // Filter by type (releaseType) if provided
    if (type && type !== 'all') {
      releases = releases.filter(r => r.releaseType === type);
    }

    // Filter by search query if provided
    if (search) {
      const query = search.toLowerCase();
      releases = releases.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description?.toLowerCase().includes(query) ||
        r.slug.toLowerCase().includes(query) ||
        r.youtubeId?.toLowerCase().includes(query)
      );
    }
    
    // Handle sort (default: newest)
    const sort = searchParams.get('sort') || 'newest';
    if (sort === 'newest') {
      releases.sort((a, b) => new Date(b.releaseDate || b.createdAt).getTime() - new Date(a.releaseDate || a.createdAt).getTime());
    } else if (sort === 'oldest') {
      releases.sort((a, b) => new Date(a.releaseDate || a.createdAt).getTime() - new Date(b.releaseDate || b.createdAt).getTime());
    } else if (sort === 'popular') {
      releases.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit');
    
    // Use dynamic headers if t is present, otherwise standard cache
    const finalHeaders = t ? Object.fromEntries(headers.entries()) : cacheHeaders;

    if (pageParam || pageSizeParam) {
      const page = parseInt(pageParam || '1', 10) || 1;
      const pageSize = parseInt(pageSizeParam || '12', 10) || 12;
      const offset = parseInt(searchParams.get('offset') || '0', 10) || (page - 1) * pageSize;
      
      const count = releases.length;
      const totalPages = Math.ceil(count / pageSize);
      const items = releases.slice(offset, offset + pageSize);
      
      return NextResponse.json({
        items,
        count,
        page,
        pageSize,
        totalPages
      }, { headers: finalHeaders });
    }
    
    return NextResponse.json(releases, { headers: finalHeaders });
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
