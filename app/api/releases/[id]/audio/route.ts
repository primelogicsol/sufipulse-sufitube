import { NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/server/middleware/authenticate';
import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease } from '@/server/storage/release-dto';
import { privateProductionSourceStorage } from '@/server/storage/private-production-source-storage';
import { isAssemblyDirectStreamCompatible } from '@/server/integrations/private-audio-assembly';
import { isPublicTemporaryAudioEligible } from '@/server/integrations/runtime-media-policy';
import {
  buildSafeAudioProxyHeaders,
  fetchConfiguredPrivateAudioStream,
  normalizeSingleRangeHeader,
} from '@/server/integrations/private-audio-stream';

export const dynamic = 'force-dynamic';

const notFound = () =>
  NextResponse.json(
    { error: 'Audio preview not found' },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  );

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = getReleaseReadStore();

  let release = await store.getById(id);
  if (!release) release = await store.getBySlug(id);
  if (!release) return notFound();

  const canonical = toCanonicalCMSRelease(release);
  const source = privateProductionSourceStorage.get(canonical.id);
  if (!source) return notFound();

  const auth = await getAuthUser(request);
  const isAdmin = auth?.role === 'admin';
  const assemblyDirectStreamCompatible = isAssemblyDirectStreamCompatible(
    source.assembly,
    source.sourceAssetId,
    source.alignment.durationSeconds,
  );

  if (!isAdmin) {
    // Temporary public audio is only valid before the canonical release has a
    // final YouTube video. Once YouTube is linked, even a bookmarked relay URL
    // must stop exposing the temporary production stream.
    if (!isPublicTemporaryAudioEligible(canonical)) return notFound();
    if (source.publicAudioPreviewEnabled !== true) return notFound();

    // The relay can proxy one untouched source only. If Studio has defined a
    // trim, offset, repeat, crossfade, or extension assembly, exposing the
    // primary clip would no longer represent the canonical song.
    if (!assemblyDirectStreamCompatible) return notFound();
  }

  let rangeHeader: string | undefined;
  try {
    rangeHeader = normalizeSingleRangeHeader(request.headers.get('range'));
  } catch {
    return new NextResponse(null, {
      status: 416,
      headers: {
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      },
    });
  }

  try {
    const upstream = await fetchConfiguredPrivateAudioStream(source.sourceAssetId, rangeHeader);

    if (upstream.status === 416) {
      const headers = buildSafeAudioProxyHeaders(upstream);
      return new NextResponse(null, { status: 416, headers });
    }

    if (upstream.status !== 200 && upstream.status !== 206) {
      if (!isAdmin) return notFound();
      return NextResponse.json(
        { error: 'Private audio source is currently unavailable.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const headers = buildSafeAudioProxyHeaders(upstream);
    if (isAdmin && !assemblyDirectStreamCompatible) {
      headers.set('X-SufiPulse-Stream-Scope', 'primary-source-only');
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error: any) {
    if (!isAdmin) return notFound();
    const timedOut = error?.name === 'AbortError';
    return NextResponse.json(
      {
        error: timedOut
          ? 'Private audio source connection timed out.'
          : 'Private audio source could not be streamed.',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
