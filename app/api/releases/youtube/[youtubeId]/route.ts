import { NextResponse } from 'next/server';
import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease, toPublicRelease } from '@/server/storage/release-dto';

const PUBLIC_CACHE = 'public, s-maxage=300, stale-while-revalidate=3600';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ youtubeId: string }> },
) {
  const { youtubeId } = await params;

  if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
    return NextResponse.json({ error: 'Invalid YouTube video ID' }, { status: 400 });
  }

  try {
    const store = getReleaseReadStore();
    const raw = await store.getByYoutubeId(youtubeId);

    if (!raw) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const release = toCanonicalCMSRelease(raw);
    if (release.status !== 'published' || release.visibility !== 'public') {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const publicRelease = toPublicRelease(release);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

    return NextResponse.json(
      {
        ...publicRelease,
        canonicalUrl: `${baseUrl}/release-detail/${release.slug || youtubeId}`,
        metadataUrl: `${baseUrl}/release-metadata/${youtubeId}`,
        youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        retrievalSource: 'sufipulse-canonical-registry',
      },
      {
        headers: {
          'Cache-Control': PUBLIC_CACHE,
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  } catch (error) {
    console.error('[release youtube resolver] Failed:', error);
    return NextResponse.json({ error: 'Release lookup failed' }, { status: 500 });
  }
}
