import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';

const slugify = (value: string): string =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'playlist';

/**
 * GET /api/releases/import-youtube/playlists
 * Admin: list all public playlists on the SufiPulse YouTube channel.
 *
 * POST /api/releases/import-youtube/playlists
 * Admin: import selected playlist IDs as releases with format='playlist'.
 * Body: { playlistIds: string[] }
 *
 * NOTE: This route creates one release record per playlist.
 * Individual video items within the playlist are NOT imported as separate releases.
 * That would require a follow-up playlistItems.list call per playlist.
 */

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const playlists = await youtubeService.getChannelPlaylists(50);
    const rows = playlists.map((pl) => ({
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

    const now = new Date().toISOString();
    const imported: CMSRelease[] = [];

    for (const pl of selected) {
      const slug = slugify(pl.title);
      const existing = cmsServerStorage.getReleaseBySlug(slug);

      const release: CMSRelease = {
        ...(existing || {}),
        id: existing?.id || `playlist_${Date.now()}_${pl.id}`,
        title: pl.title,
        slug,
        youtubeId: '',
        youtubePlaylistId: pl.id,
        youtubeUrl: `https://www.youtube.com/playlist?list=${pl.id}`,
        thumbnailUrl: pl.thumbnailUrl,
        description: pl.description,
        releaseDate: pl.publishedDate ? pl.publishedDate.slice(0, 10) : now.slice(0, 10),
        durationSeconds: 0,
        durationFormatted: '—',
        viewCount: existing?.viewCount || 0,
        likeCount: existing?.likeCount || 0,
        status: existing?.status || 'draft',
        contentReadinessState: existing?.contentReadinessState || 'draft',
        format: 'playlist',
        enableLyrics: false,
        enableCommentary: existing?.enableCommentary !== false,
        enableSponsors: !!existing?.enableSponsors,
        enableAdoption: existing?.enableAdoption !== false,
        enableCredits: existing?.enableCredits !== false,
        publicCommentary: existing?.publicCommentary || [],
        publicSponsorsIntro: existing?.publicSponsorsIntro || '',
        publicSponsors: existing?.publicSponsors || [],
        publicCredits: existing?.publicCredits || {},
        availableLanguages: existing?.availableLanguages || ['en', 'ur'],
        defaultLanguage: existing?.defaultLanguage || 'en',
        lyrics: existing?.lyrics || {},
        lyricsStructure: existing?.lyricsStructure || {},
        masterTimingVersion: existing?.masterTimingVersion || 1,
        subtitleCues: existing?.subtitleCues || [],
        subtitleTranslations: existing?.subtitleTranslations || {},
        subtitleLanguageStatuses: existing?.subtitleLanguageStatuses || {},
        subtitleLanguageAssignments: existing?.subtitleLanguageAssignments || {},
        subtitleCueMetadata: existing?.subtitleCueMetadata || {},
        subtitleStylePacks: existing?.subtitleStylePacks || {},
        subtitleReviewLogs: existing?.subtitleReviewLogs || [],
        youtubeSubtitleAutoSync: false,
        youtubeCaptionTracks: existing?.youtubeCaptionTracks || {},
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      imported.push(cmsServerStorage.saveRelease(release));
    }

    return NextResponse.json({ importedCount: imported.length, items: imported });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to import playlists' }, { status: 500 });
  }
}
