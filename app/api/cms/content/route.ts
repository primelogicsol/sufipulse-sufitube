import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

/**
 * GET /api/cms/content
 * Aggregated endpoint to fetch releases and unique categories in a single call.
 * This reduces the number of initial network requests for the CMS dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    
    // Fetch all releases (optionally filtered by status)
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
      draft: releases.filter(r => r.status === 'draft').length,
      archived: releases.filter(r => r.status === 'archived').length,
      categoriesCount: categories.length
    };

    return NextResponse.json({
      releases,
      categories,
      stats,
      timestamp: new Date().toISOString()
    }, { headers: cacheHeaders });

  } catch (error: any) {
    console.error(`[API /api/cms/content] ERROR:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
