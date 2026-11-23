import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getAuthUser, checkIsAdmin } from '@/server/middleware/authenticate';
import { toCanonicalCMSRelease, toPublicRelease } from '@/server/storage/release-dto';

const publicCacheHeaders = {
  'Cache-Control': 'public, max-age=0, s-maxage=0, must-revalidate',
};

const adminCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

/**
 * GET /api/cms/content
 * Aggregated endpoint to fetch releases and unique categories in a single call.
 * Anonymous callers receive strictly published + public releases via toPublicRelease.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const isAdmin = checkIsAdmin(user);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    if (!isAdmin) {
      if (status && status !== 'published') {
        return NextResponse.json({
          releases: [],
          categories: [],
          stats: { total: 0, published: 0, draft: 0, archived: 0, categoriesCount: 0 },
          timestamp: new Date().toISOString(),
        }, { headers: publicCacheHeaders });
      }

      const publicReleases = cmsServerStorage.getPublicReleases();
      const categories = Array.from(
        new Set(
          publicReleases
            .map((r) => r.category)
            .filter((c): c is string => !!c && typeof c === 'string')
        )
      ).sort();

      return NextResponse.json({
        releases: publicReleases.map((r) => toPublicRelease(toCanonicalCMSRelease(r))),
        categories,
        stats: {
          total: publicReleases.length,
          published: publicReleases.length,
          draft: 0,
          archived: 0,
          categoriesCount: categories.length,
        },
        timestamp: new Date().toISOString(),
      }, { headers: publicCacheHeaders });
    }

    // Admin view: Fetch all releases (optionally filtered by status)
    const releases = cmsServerStorage.getAllReleases(status ? { status } : undefined);

    // Extract unique categories
    const categories = Array.from(
      new Set(
        releases
          .map((r) => r.category)
          .filter((c): c is string => !!c && typeof c === 'string')
      )
    ).sort();

    // Grouping by status for stats
    const stats = {
      total: releases.length,
      published: releases.filter(r => r.status === 'published').length,
      unpublished: releases.filter(r => r.status === 'unpublished').length,
      draft: releases.filter(r => r.status === 'draft').length,
      archived: releases.filter(r => r.status === 'archived').length,
      categoriesCount: categories.length
    };

    return NextResponse.json({
      releases,
      categories,
      stats,
      timestamp: new Date().toISOString()
    }, { headers: adminCacheHeaders });

  } catch (error: any) {
    console.error(`[API /api/cms/content] ERROR:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
