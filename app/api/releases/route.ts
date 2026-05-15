import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin, getAuthUser } from '@/server/middleware/authenticate';
import { validateRequestBody, validateQueryParams } from '@/app/lib/api-middleware';
import { cmsReleaseSchema, releasesQuerySchema } from '@/app/lib/validation-schemas';

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

    const { status, type, search, key, slug, youtubeId } = validationResult.data;
    
    // 1) Handle single lookup if key/slug/youtubeId is provided
    // This is used by the release-detail page for fast CMS lookup
    const lookupKey = key || slug || youtubeId;
    if (lookupKey) {
      const release = cmsServerStorage.getRelease(lookupKey) || 
                      cmsServerStorage.getReleaseBySlug(lookupKey) || 
                      cmsServerStorage.getReleaseByYoutubeId(lookupKey);
      
      if (release) {
        return NextResponse.json(release, { headers: cacheHeaders });
      }
      // If a specific key was requested but not found, we return 404 to avoid 
      // the client misinterpreting a fall-through list as the requested object.
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
    
    return NextResponse.json(releases, { headers: cacheHeaders });
  } catch (err: any) {
    console.error('[API /api/releases] GET ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'POST disabled for test' }, { status: 503 });
}
