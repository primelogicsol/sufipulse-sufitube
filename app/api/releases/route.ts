import { getReleaseStorageBackend, getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease, toPublicPremiereRelease, toPublicRelease } from '@/server/storage/release-dto';
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
      let release = null;
      let source = '';

      if (slug) {
        release = await store.getBySlug(slug);
        source = 'cms_slug';
      }
      if (!release && youtubeId) {
        release = await store.getByYoutubeId(youtubeId);
        source = 'cms_youtube_compat';
      }
      if (!release) {
        release = await store.getBySlug(lookupKey);
        source = 'cms_slug';
      }
      if (!release) {
        release = await store.getByYoutubeId(lookupKey);
        source = 'cms_youtube_compat';
      }
      if (!release) {
        release = await store.getById(lookupKey);
        source = 'cms_key';
      }

      if (release) {
        const canonical = toCanonicalCMSRelease(release);
        const auth = await getAuthUser(request);
        const isAdmin = auth?.role === 'admin';

        if (canonical.status !== 'published') {
          if (!isAdmin) {
            return NextResponse.json({ error: 'Release not found' }, { status: 404 });
          }
          return NextResponse.json({ ...canonical, resolution_source: source });
        }

        if (!isAdmin && ['upcoming', 'teaser_live', 'premiere_scheduled'].includes(canonical.releaseLifecycle || '')) {
          if (canonical.visibility !== 'public' || canonical.premiereVisibility !== 'public') {
            return NextResponse.json({ error: 'Release not found' }, { status: 404 });
          }
          return NextResponse.json({ ...toPublicPremiereRelease(canonical), resolution_source: source }, { headers: cacheHeaders });
        }

        if (isAdmin) {
          return NextResponse.json({ ...canonical, resolution_source: source }, { headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } });
        }

        // Return PublicRelease for published
        return NextResponse.json({ ...toPublicRelease(canonical), resolution_source: source }, { headers: cacheHeaders });
      }
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    if (backend === 'postgres') {
      const store = getReleaseReadStore();
      const paginationRequested = searchParams.has('page') || searchParams.has('pageSize') || searchParams.has('limit');

      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
      const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '12', 10) || 12);
      const offset = searchParams.has('offset') ? parseInt(searchParams.get('offset') || '0', 10) : undefined;

      const auth = await getAuthUser(request);
      const isAdmin = auth?.role === 'admin';

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
        requirePublicEligibility: !isAdmin,
      });

      const headers = isAdmin ? { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } : cacheHeaders;

      let finalItems = [];
      if (isAdmin) {
        finalItems = result.items.map(toCanonicalCMSRelease);
      } else {
        for (const r of result.items) {
          if (r.status !== 'published' || r.visibility !== 'public') continue;
          if (['upcoming', 'teaser_live', 'premiere_scheduled'].includes(r.releaseLifecycle || '')) {
            if (r.premiereVisibility !== 'public') continue;
            finalItems.push(toPublicPremiereRelease(r));
          } else {
            finalItems.push(toPublicRelease(r));
          }
        }
      }

      if (!paginationRequested) {
        return NextResponse.json(finalItems, { headers });
      }

      return NextResponse.json({
        items: finalItems,
        count: isAdmin ? result.count : finalItems.length,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        facets: result.facets || { years: [] }
      }, { headers });
    }

// 1. status
    let releases = status
      ? cmsServerStorage.getAllReleases({ status })
      : cmsServerStorage.getAllReleases();

    // 2. type (legacy compat: matches releaseType field)
    if (type && type !== 'all') {
      releases = releases.filter(r => r.releaseType === type);
    }

    // 3. governance (governanceOrigin / govType only)
    // NOTE: r.source is intentionally NOT used as a fallback here.
    // Distribution/import source and governance provenance are independent domains.
    // A SufiPulse-governed release can be imported from YouTube; source tells us
    // how the record entered the system, not who governs the content.
    if (governance && governance !== 'all') {
      releases = releases.filter(r => {
        const govOrigin = (r as any).governanceOrigin || (r as any).govType;
        return govOrigin === governance;
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
        if (duration === 'short')    return secs > 0 && secs < 180 && (r as any).format !== 'short';
        if (duration === 'standard') return secs >= 180 && secs <= 480 && (r as any).format !== 'short';
        if (duration === 'long')     return secs > 480 && (r as any).format !== 'short';
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
      releases.sort((a, b) => {
        const ta = (a as any).releaseDate || ((a as any).publishedAt || (a as any).published_at) || ((a as any).createdAt || (a as any).created_at) ? new Date((a as any).releaseDate || ((a as any).publishedAt || (a as any).published_at) || ((a as any).createdAt || (a as any).created_at)).getTime() : -Infinity;
        const tb = (b as any).releaseDate || ((b as any).publishedAt || (b as any).published_at) || ((b as any).createdAt || (b as any).created_at) ? new Date((b as any).releaseDate || ((b as any).publishedAt || (b as any).published_at) || ((b as any).createdAt || (b as any).created_at)).getTime() : -Infinity;
        return ta === tb ? ((a as any).registryOrder || 0) - ((b as any).registryOrder || 0) : tb - ta;
      });
    } else if (sortParam === 'oldest') {
      releases.sort((a, b) => {
        const ta = (a as any).releaseDate || ((a as any).publishedAt || (a as any).published_at) || ((a as any).createdAt || (a as any).created_at) ? new Date((a as any).releaseDate || ((a as any).publishedAt || (a as any).published_at) || ((a as any).createdAt || (a as any).created_at)).getTime() : Infinity;
        const tb = (b as any).releaseDate || ((b as any).publishedAt || (b as any).published_at) || ((b as any).createdAt || (b as any).created_at) ? new Date((b as any).releaseDate || ((b as any).publishedAt || (b as any).published_at) || ((b as any).createdAt || (b as any).created_at)).getTime() : Infinity;
        return ta === tb ? ((a as any).registryOrder || 0) - ((b as any).registryOrder || 0) : ta - tb;
      });
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

    const auth = await getAuthUser(request);
    const isAdmin = auth?.role === 'admin';
    const headers = isAdmin ? { 'Cache-Control': 'no-store, max-age=0, must-revalidate' } : cacheHeaders;

    let finalReleases = [];
    if (isAdmin) {
      finalReleases = releases.map(toCanonicalCMSRelease);
    } else {
      for (const r of releases) {
        if (r.status !== 'published' || r.visibility !== 'public') continue;
        if (['upcoming', 'teaser_live', 'premiere_scheduled'].includes((r as any).releaseLifecycle || '')) {
          if ((r as any).premiereVisibility !== 'public') continue;
          finalReleases.push(toPublicPremiereRelease(r));
        } else {
          finalReleases.push(toPublicRelease(r));
        }
      }
    }

    if (pageParam || pageSizeParam) {
      const page     = Math.max(1, parseInt(pageParam || '1', 10) || 1);
      const pageSize = Math.max(1, parseInt(pageSizeParam || '12', 10) || 12);
      const offset   = parseInt(searchParams.get('offset') || '0', 10) || (page - 1) * pageSize;
      const totalPages = Math.ceil(finalReleases.length / pageSize);
      const sliced = finalReleases.slice(offset, offset + pageSize);

      return NextResponse.json({ items: sliced, count: finalReleases.length, page, pageSize, totalPages, facets }, { headers });
    }

    return NextResponse.json(finalReleases, { headers });
  } catch (err: any) {
    console.error('[API /api/releases] GET ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  // Note: Mutations are enabled. Postgres replication is handled after canonical mutation.

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

    // Generate social share kit whenever status becomes published
    if (release.status === 'published' && release.youtubeId) {
      const { generateSocialShareKit } = await import('@/lib/social-share-generator');
      release.socialShareKit = generateSocialShareKit(release as any);
    }

    const saved = cmsServerStorage.saveRelease(release);

    // --- Postgres Replication ---
    if (process.env.RELEASE_STORAGE_BACKEND === 'postgres') {
      try {
        const { PostgresReleaseRepository } = await import('@/server/db/release-repository');
        const repo = new PostgresReleaseRepository();
        await repo.insert(saved as any);
      } catch (err) {
        cmsServerStorage.deleteRelease(saved.id);
        console.error('Postgres replication failed, rolled back registry', { err: String(err) });
        throw new Error('Postgres replication failed: ' + String(err));
      }
    }

    // --- CACHE INVALIDATION ---
    try {
      revalidatePath('/');
      revalidatePath('/releases');
      revalidatePath(`/release-detail/${slug}`);
      revalidatePath('/release-detail/[slug]', 'page');
    } catch (cacheErr) {
      console.warn('Cache revalidation failed during POST:', cacheErr);
    }

    // Auto-notify subscribers when a release is first published
    if (saved.status === 'published' && saved.youtubeId) {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${base}/api/admin/notify-subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
        body: JSON.stringify({
          title: saved.title,
          youtubeId: saved.youtubeId,
          youtubePlaylistId: saved.youtubePlaylistId,
          slug: saved.slug,
          releaseId: saved.id,
        }),
      }).catch((err) => console.warn('Subscriber notification failed', { err: String(err) }));
    }

    // --- LYRICS REQUEST NOTIFICATIONS ---
    const newlyPublishedLanguages: string[] = [];
    if (body.subtitleLanguageStatuses) {
      for (const [lang, status] of Object.entries(body.subtitleLanguageStatuses)) {
        if (status === 'published') {
          newlyPublishedLanguages.push(lang);
        }
      }
    }

    if (newlyPublishedLanguages.length > 0) {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      for (const langCode of newlyPublishedLanguages) {
        fetch(`${base}/api/admin/notify-lyrics-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
          body: JSON.stringify({
            releaseId: saved.id,
            languageCode: langCode,
          }),
        }).catch((err) => console.warn(`Lyrics request notification failed for ${langCode}`, { err: String(err) }));
      }
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
