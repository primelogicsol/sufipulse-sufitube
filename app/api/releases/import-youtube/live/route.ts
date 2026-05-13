import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { mapVideoToRelease } from '@/lib/release-mapping';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const streams = await youtubeService.getCompletedLiveStreams(50);
    const rows = (streams || []).map((v) => ({
      ...v,
      alreadyImported: !!cmsServerStorage.getReleaseByYoutubeId(v.id),
    }));
    return NextResponse.json({ count: rows.length, items: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch live streams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const videoIds: string[] = Array.isArray(body.videoIds) ? body.videoIds.filter(Boolean) : [];
    if (!videoIds.length) {
      return NextResponse.json({ error: 'No videoIds provided' }, { status: 400 });
    }

    const toSave = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = await youtubeService.getVideosByIds(videoIds.slice(i, i + 50));
      for (const video of batch) {
        const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
        // Force format to 'live' if it's from this route, or let it infer
        toSave.push(mapVideoToRelease(video, existing));
      }
    }

    const saved = cmsServerStorage.bulkSaveReleases(toSave);
    cmsServerStorage.forceHydrate();
    revalidatePath('/');
    revalidatePath('/releases');

    return NextResponse.json({ importedCount: saved.length, items: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to import live streams' }, { status: 500 });
  }
}
