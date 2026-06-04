import { NextRequest, NextResponse } from 'next/server';
import { registriesStorage } from '@/lib/registries-storage';
import { graphResolver } from '@/lib/graph-resolver';
import { cmsServerStorage } from '@/lib/cms-storage-server';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    registriesStorage.forceHydrate();
    cmsServerStorage.forceHydrate();
    graphResolver.forceHydrate();

    const theme = registriesStorage.getItem('themes', slug);
    if (!theme || !theme.isActive || !theme.isPublic) {
      return NextResponse.json({ error: 'Theme not found or is set to private' }, { status: 404 });
    }

    const releases = graphResolver.getReleasesForRegistry(slug, 'theme');
    const publicReleases = releases
      .filter(r => r.status === 'published')
      .map(r => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        subtitle: r.subtitle,
        youtubeId: r.youtubeId,
        thumbnailUrl: r.thumbnailUrl || `https://i.ytimg.com/vi/${r.youtubeId}/maxresdefault.jpg`,
        durationFormatted: r.durationFormatted,
        viewCount: r.viewCount,
        releaseDate: r.releaseDate,
        writer: r.writer,
        vocalist: r.vocalist
      }));

    return NextResponse.json({
      theme,
      releases: publicReleases
    }, { headers: cacheHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
