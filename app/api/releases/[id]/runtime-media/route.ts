import { NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/server/middleware/authenticate';
import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease } from '@/server/storage/release-dto';
import { privateProductionSourceStorage } from '@/server/storage/private-production-source-storage';
import { isPrivateAudioStreamConfigured } from '@/server/integrations/private-audio-stream';
import { isAssemblyDirectStreamCompatible } from '@/server/integrations/private-audio-assembly';
import {
  hasFinalYoutubeVideo,
  isPublicReleaseEligible,
  isPublicTemporaryAudioEligible,
} from '@/server/integrations/runtime-media-policy';

export const dynamic = 'force-dynamic';

const notFound = () =>
  NextResponse.json(
    { error: 'Release media not found' },
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
  if (!release) release = await store.getByYoutubeId(id);
  if (!release) return notFound();

  const canonical = toCanonicalCMSRelease(release);
  const auth = await getAuthUser(request);
  const isAdmin = auth?.role === 'admin';

  if (!isAdmin && !isPublicReleaseEligible(canonical)) return notFound();

  // Final YouTube distribution always wins once linked to the canonical release.
  if (hasFinalYoutubeVideo(canonical)) {
    return NextResponse.json(
      {
        releaseId: canonical.id,
        mode: 'youtube',
        youtubeId: canonical.youtubeId,
        audioUrl: null,
        audioDownloadAllowed: false,
      },
      { headers: { 'Cache-Control': isAdmin ? 'no-store' : 'public, s-maxage=30, stale-while-revalidate=300' } },
    );
  }

  const source = privateProductionSourceStorage.get(canonical.id);
  const streamConfigured = isPrivateAudioStreamConfigured();
  const assemblyDirectStreamCompatible = source
    ? isAssemblyDirectStreamCompatible(
        source.assembly,
        source.sourceAssetId,
        source.alignment.durationSeconds,
      )
    : false;
  const publicAudioEligible =
    isPublicTemporaryAudioEligible(canonical) &&
    streamConfigured &&
    assemblyDirectStreamCompatible &&
    source?.publicAudioPreviewEnabled === true;

  // Admins may still test the primary upstream source when an assembly exists,
  // but edited/multi-segment assemblies are never represented as one public
  // stream until a real assembled master exists.
  if (source && streamConfigured && (isAdmin || publicAudioEligible)) {
    return NextResponse.json(
      {
        releaseId: canonical.id,
        mode: 'audio_stream',
        youtubeId: null,
        audioUrl: `/api/releases/${encodeURIComponent(canonical.id)}/audio`,
        audioDownloadAllowed: false,
        audioStorageMode: 'stream_only',
        durationSeconds: canonical.durationSeconds || source.alignment.durationSeconds || 0,
        publicAudioEligible,
        assemblyDirectStreamCompatible,
        adminStreamScope: !assemblyDirectStreamCompatible ? 'primary_source_only' : 'canonical_source',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    {
      releaseId: canonical.id,
      mode: 'coming_soon',
      youtubeId: null,
      audioUrl: null,
      audioDownloadAllowed: false,
      publicAudioEligible: false,
      assemblyDirectStreamCompatible,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
