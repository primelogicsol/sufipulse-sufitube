import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/server/middleware/authenticate';
import { privateProductionSourceStorage } from '@/server/storage/private-production-source-storage';
import {
  fetchConfiguredPrivateAudioStream,
  isPrivateAudioStreamConfigured,
} from '@/server/integrations/private-audio-stream';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const source = privateProductionSourceStorage.get(id);
  if (!source) {
    return NextResponse.json(
      { error: 'No private production source is linked to this release.' },
      { status: 404 },
    );
  }

  if (!isPrivateAudioStreamConfigured()) {
    return NextResponse.json(
      { error: 'Private audio streaming is not configured on this server.' },
      { status: 409 },
    );
  }

  try {
    // Probe one byte only. If the upstream ignores Range and returns 200, cancel
    // the body immediately so this health check never downloads or stores a song.
    const upstream = await fetchConfiguredPrivateAudioStream(source.sourceAssetId, 'bytes=0-0');
    const result = {
      reachable: upstream.status === 200 || upstream.status === 206,
      status: upstream.status,
      partialContent: upstream.status === 206,
      contentType: upstream.headers.get('content-type'),
      contentLength: upstream.headers.get('content-length'),
      contentRange: upstream.headers.get('content-range'),
      acceptRanges: upstream.headers.get('accept-ranges'),
      checkedAt: new Date().toISOString(),
    };

    try {
      await upstream.body?.cancel();
    } catch {
      // The probe is complete once headers are received; body cancellation is best-effort.
    }

    if (!result.reachable) {
      return NextResponse.json(
        { ...result, error: 'Private audio source did not return a playable response.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        reachable: false,
        error: error?.name === 'AbortError'
          ? 'Private audio source connection timed out.'
          : 'Private audio source probe failed.',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
