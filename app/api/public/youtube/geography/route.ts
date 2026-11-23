import { NextResponse } from 'next/server';
import { getYouTubeGeographySnapshot } from '@/lib/youtube-geography-import';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/youtube/geography
 * Public read-only endpoint serving the published, verified YouTube Studio Geography snapshot.
 * Never exposes local filesystem paths, credentials, or internal ingestion state.
 */
export async function GET() {
  try {
    const snapshot = getYouTubeGeographySnapshot();
    if (!snapshot) {
      return NextResponse.json(
        {
          available: false,
          snapshot: null,
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
          },
        }
      );
    }

    const { importHistory: _history, ...publicSnapshot } = snapshot;

    return NextResponse.json(
      {
        available: true,
        snapshot: publicSnapshot,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[API /api/public/youtube/geography] ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to load verified geography snapshot' },
      { status: 500 }
    );
  }
}
