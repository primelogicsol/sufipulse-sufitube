import { NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/server/middleware/authenticate';
import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease } from '@/server/storage/release-dto';
import { privateProductionSourceStorage } from '@/server/storage/private-production-source-storage';
import { isPrivateAudioStreamConfigured } from '@/server/integrations/private-audio-stream';

export const dynamic = 'force-dynamic';

const notFound = () =>
  NextResponse.json(
    { error: 'Release media not found' },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  );

const publicReleaseEligible = (release: any) =>
  release?.status === 'published' && release?.visibility === 'public';

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

  if (!isAdmin && !publicReleaseEligible(canonical)) return notFound();

  // Final YouTube distribution always wins once linked to the canonical release.
  if (canonical.youtubeId) {
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
  const publicAudioEligible =
    canonical.format === 'audio' &&
    publicReleaseEligible(canonical) &&
    streamConfigured &&
    source?.publicAudioPreviewEnabled === true;

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
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
