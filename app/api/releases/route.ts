import { NextRequest, NextResponse } from 'next/server';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { resolveRelease } from '@/lib/release-resolver';

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

export async function GET(request: NextRequest) {
  console.time('[releases] total');
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const slug = searchParams.get('slug');
    const youtubeId = searchParams.get('youtubeId');

    // --- SINGLE DETAIL MODE ---
    const lookupKey = key || slug || youtubeId;
    if (lookupKey) {
      const release = resolveRelease(lookupKey);
      if (!release) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(release, { headers: cacheHeaders });
    }

    // --- FAST LIST MODE ---
    console.time('[releases] loadAll');
    let base = cmsServerStorage.getPublishedReleases();
    console.timeEnd('[releases] loadAll');

    // 24-hour staleness check
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let needsRefresh = false;

    // Merge and filter
    const format = searchParams.get('format') || '';
    const type = searchParams.get('type') || '';
    const duration = searchParams.get('duration') || '';
    const year = searchParams.get('year') || '';
    const search = (searchParams.get('search') || '').toLowerCase().trim();

    const merged = base.map((r) => {
      const lastSync = r.lastYoutubeSyncAt ? new Date(r.lastYoutubeSyncAt).getTime() : 0;
      if (now - lastSync > oneDayMs) needsRefresh = true;

      // Merge Strategy: CMS editorial priority, then YouTube Operational Cache
      return {
        id: r.id,
        slug: r.slug,
        youtubeId: r.youtubeId,
        title: r.title, // CMS editorial title
        thumbnail: r.thumbnailUrl, // CMS editorial thumb
        duration: r.youtubeStats?.duration || r.durationFormatted || '0:00',
        durationSeconds: r.youtubeStats?.durationSeconds || r.durationSeconds || 0,
        publishedAt: r.youtubeStats?.publishedAt || r.publishedAt || r.releaseDate || r.createdAt,
        viewCount: r.youtubeStats?.viewCount ?? r.viewCount ?? 0,
        likeCount: r.youtubeStats?.likeCount ?? r.likeCount ?? 0,
        format: r.format || 'video',
        releaseType: r.releaseType || 'studio-release',
        source: r.source || 'native',
        lastYoutubeSyncAt: r.lastYoutubeSyncAt,
        description: r.description,
        vocalist: r.vocalist,
        writer: r.writer,
        tags: r.tags,
      };
    });

    console.time('[releases] filter');
    let filtered = merged;
    if (format || type || duration || year || search) {
      filtered = merged.filter((r) => {
        if (format && r.format !== format) return false;
        if (type && r.releaseType !== type) return false;
        if (duration) {
          const mins = (r.durationSeconds || 0) / 60;
          if (duration === 'short' && mins >= 3) return false;
          if (duration === 'standard' && (mins < 3 || mins > 8)) return false;
          if (duration === 'long' && mins <= 8) return false;
        }
        if (year) {
          const releaseYear = new Date(r.publishedAt).getFullYear();
          if (releaseYear !== parseInt(year)) return false;
        }
        if (search) {
          const haystack = `${r.title} ${r.description || ''}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      });
    }
    console.timeEnd('[releases] filter');

    const responseData = {
        items: filtered,
        needsRefresh,
        count: filtered.length
    };

    console.timeEnd('[releases] total');
    return NextResponse.json(responseData, { headers: cacheHeaders });

  } catch (error: any) {
    console.error(`[API /api/releases] ERROR:`, error);
    console.timeEnd('[releases] total');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// ... (rest of file)
