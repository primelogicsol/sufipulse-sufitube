import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { mapPlaylistToRelease, slugify } from '@/lib/release-mapping';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const playlists = await youtubeService.getChannelPlaylists(50);
    const allCmsReleases = cmsServerStorage.getAllReleases();
    const importedPlaylistIds = new Set(
      allCmsReleases
        .filter(r => r.format === 'playlist' && r.youtubeId)
        .map(r => r.youtubeId)
    );
    const rows = (playlists || []).map((pl) => ({
      ...pl,
      alreadyImported: importedPlaylistIds.has(pl.id),
    }));
    return NextResponse.json({ count: rows.length, items: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const playlistIds: string[] = Array.isArray(body.playlistIds) ? body.playlistIds.filter(Boolean) : [];

    if (!playlistIds.length) {
      return NextResponse.json({ error: 'No playlistIds provided' }, { status: 400 });
    }

    const allPlaylists = await youtubeService.getChannelPlaylists(50);
    const selected = allPlaylists.filter((pl) => playlistIds.includes(pl.id));

    if (!selected.length) {
      return NextResponse.json({ error: 'None of the requested playlist IDs were found on the channel' }, { status: 404 });
    }

    const toSave = [];
    for (const pl of selected) {
      const slug = slugify(pl.title);
      const existing = cmsServerStorage.getReleaseBySlug(slug);
      toSave.push(mapPlaylistToRelease(pl, existing));
    }

    const saved = cmsServerStorage.bulkSaveReleasesTransactional(toSave);
    cmsServerStorage.forceHydrate();

    // Read-back verification
    const allReleasesAfter = cmsServerStorage.getAllReleases();
    const verifiedCount = saved.filter(s => allReleasesAfter.some(r => r.id === s.id)).length;
    revalidatePath('/');
    revalidatePath('/releases');
    revalidatePath('/admin/cms-releases');

    return NextResponse.json({ importedCount: saved.length, verifiedCount, items: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to import playlists' }, { status: 500 });
  }
}
