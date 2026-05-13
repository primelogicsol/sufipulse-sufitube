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
    const rows = (playlists || []).map((pl) => ({
      ...pl,
      alreadyImported: !!cmsServerStorage.getReleaseBySlug(slugify(pl.title)),
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

    const saved = cmsServerStorage.bulkSaveReleases(toSave);
    cmsServerStorage.forceHydrate();
    revalidatePath('/');
    revalidatePath('/releases');

    return NextResponse.json({ importedCount: saved.length, items: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to import playlists' }, { status: 500 });
  }
}
