import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { getYouTubeStudioSnapshot } from '@/lib/youtube-studio-import';
import type { CMSRelease } from '@/lib/cms-storage';

export const dynamic = 'force-dynamic';

const STALE_AFTER_DAYS = 30;

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function isStale(release: CMSRelease): boolean {
  if (!release.lastYoutubeSyncAt) return true;
  const syncedAt = new Date(release.lastYoutubeSyncAt).getTime();
  if (!Number.isFinite(syncedAt)) return true;
  return Date.now() - syncedAt > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const snapshot = getYouTubeStudioSnapshot();
  if (!snapshot || snapshot.rows.length === 0) {
    return NextResponse.json(
      {
        error: 'studio_snapshot_unavailable',
        message: 'Import a YouTube Studio Advanced Mode CSV before using Studio catalog reconciliation.',
        source: 'unavailable',
      },
      { status: 404 }
    );
  }

  const cmsReleases = cmsServerStorage.getAllReleases();
  const cmsByYoutubeId = new Map<string, CMSRelease[]>();

  for (const release of cmsReleases) {
    if (!release.youtubeId) continue;
    const list = cmsByYoutubeId.get(release.youtubeId) || [];
    list.push(release);
    cmsByYoutubeId.set(release.youtubeId, list);
  }

  const rows = snapshot.rows.map(video => {
    const matches = cmsByYoutubeId.get(video.videoId) || [];
    const existing = matches[0] || null;
    const titleMismatch = existing
      ? normalizeText(existing.title) !== normalizeText(video.title)
      : false;

    const status = matches.length > 1
      ? 'duplicate'
      : !existing
        ? 'youtube_only'
        : titleMismatch
          ? 'metadata_mismatch'
          : 'matched';

    return {
      videoId: video.videoId,
      title: video.title,
      cmsReleaseId: existing?.id ?? null,
      status,
      mismatchFields: titleMismatch ? ['title'] : [],
      lastYoutubeSyncAt: existing?.lastYoutubeSyncAt ?? null,
      stale: existing ? isStale(existing) : false,
      source: 'studio_csv' as const,
    };
  });

  const studioIds = new Set(snapshot.rows.map(row => row.videoId));
  const cmsOnly = cmsReleases
    .filter(release => release.youtubeId && !studioIds.has(release.youtubeId))
    .map(release => ({
      cmsReleaseId: release.id,
      title: release.title,
      youtubeId: release.youtubeId,
      status: 'cms_only_or_nonpublic' as const,
      lastYoutubeSyncAt: release.lastYoutubeSyncAt ?? null,
      stale: isStale(release),
    }));

  const missingYoutubeId = cmsReleases
    .filter(release => !release.youtubeId && release.format !== 'playlist')
    .map(release => ({
      cmsReleaseId: release.id,
      title: release.title,
      status: 'missing_youtube_id' as const,
    }));

  const reconciliation = {
    matched: rows.filter(row => row.status === 'matched').length,
    youtubeOnly: rows.filter(row => row.status === 'youtube_only').length,
    metadataMismatch: rows.filter(row => row.status === 'metadata_mismatch').length,
    duplicates: rows.filter(row => row.status === 'duplicate').length,
    stale: rows.filter(row => row.stale).length,
    cmsOnlyOrNonpublic: cmsOnly.length,
    missingYoutubeId: missingYoutubeId.length,
  };

  return NextResponse.json({
    source: 'studio_csv',
    authoritative: true,
    importedAt: snapshot.importedAt,
    fileName: snapshot.fileName,
    catalogCount: snapshot.rowCount,
    reconciliation,
    rows,
    cmsOnly,
    missingYoutubeId,
    note: 'Studio reconciliation is a verified first-party catalog fallback. It compares video IDs and titles; richer description/duration metadata remains a YouTube Data API concern when quota is available.',
  });
}
