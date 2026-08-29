import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { mapVideoToRelease } from '@/lib/release-mapping';
import {
  fetchReadOnlyYouTubeChannelVideos,
  fetchReadOnlyYouTubeVideosByIds,
  YouTubeDataApiReadError,
  type YouTubeReadCredentialMode,
} from '@/lib/youtube-data-api-readonly';
import type { CMSRelease } from '@/lib/cms-storage';
import { queryYouTubeAnalytics } from '@/lib/youtube-analytics-client';
import { getValidYTAnalyticsAccessToken } from '@/app/lib/server/youtube-analytics-oauth-store';

const MAX_CHANNEL_VIDEOS = 500;
const STALE_AFTER_DAYS = 30;

type ReconciliationStatus = 'matched' | 'youtube_only' | 'metadata_mismatch' | 'duplicate' | 'admin_override';

function dedupeVideos(videos: any[]): any[] {
  const byId = new Map<string, any>();
  for (const video of videos) {
    if (video?.id && !byId.has(video.id)) byId.set(video.id, video);
  }
  return Array.from(byId.values());
}

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function getMismatchFields(existing: CMSRelease, video: any): string[] {
    const fields: string[] = [];
    const liveTitle = video.title || video.snippet?.title || '';
    const liveDescription = video.description || video.snippet?.description || '';
  
    if (existing.youtubeTitle !== undefined) {
      if (normalizeText(existing.youtubeTitle) !== normalizeText(liveTitle)) fields.push('title');
    } else {
      if (normalizeText(existing.title) !== normalizeText(liveTitle)) fields.push('title');
    }
    
    if (existing.youtubeDescription !== undefined) {
      if (normalizeText(existing.youtubeDescription) !== normalizeText(liveDescription)) fields.push('description');
    } else {
      if (normalizeText(existing.description) !== normalizeText(liveDescription)) fields.push('description');
    }
  
    return fields;
  }

function isStale(release: CMSRelease): boolean {
  if (!release.lastYoutubeSyncAt) return true;
  const syncedAt = new Date(release.lastYoutubeSyncAt).getTime();
  if (!Number.isFinite(syncedAt)) return true;
  return Date.now() - syncedAt > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

function failureResponse(error: unknown, fallback: string) {
  const message = error instanceof Error && error.message ? error.message : fallback;
  if (error instanceof YouTubeDataApiReadError) {
    return NextResponse.json(
      {
        error: message,
        reason: error.reason,
        reconnectRequired: error.reconnectRequired,
        source: 'youtube_data_api',
      },
      { status: error.status >= 400 && error.status <= 599 ? error.status : 502 }
    );
  }
  return NextResponse.json(
    { error: message, source: 'youtube_data_api' },
    { status: 502 }
  );
}

async function readVideos(params: { ids?: string[]; max?: number }): Promise<{
  videos: any[];
  credentialMode: YouTubeReadCredentialMode;
}> {
  if (params.ids && params.ids.length > 0) {
    return fetchReadOnlyYouTubeVideosByIds(params.ids);
  }
  return fetchReadOnlyYouTubeChannelVideos(params.max ?? MAX_CHANNEL_VIDEOS);
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const videoIdsParam = searchParams.get('videoIds');
    const fetchAll = searchParams.get('fetchAll') === '1';
    const ids = videoIdsParam
      ? videoIdsParam.split(',').map(id => id.trim()).filter(Boolean)
      : [];
    const max = fetchAll
      ? MAX_CHANNEL_VIDEOS
      : Math.max(1, Math.min(Number(searchParams.get('max') || 25), MAX_CHANNEL_VIDEOS));

    const live = await readVideos({ ids, max });
    const videos = dedupeVideos(live.videos);
    const cmsReleases = cmsServerStorage.getAllReleases();
    const cmsByYoutubeId = new Map<string, CMSRelease[]>();

    for (const release of cmsReleases) {
      if (!release.youtubeId) continue;
      const list = cmsByYoutubeId.get(release.youtubeId) || [];
      list.push(release);
      cmsByYoutubeId.set(release.youtubeId, list);
    }

    const rows = videos.map((video: any) => {
      const matches = cmsByYoutubeId.get(video.id) || [];
      const existing = matches[0] || null;
      const mismatchFields = existing ? getMismatchFields(existing, video) : [];
      let reconciliationStatus: ReconciliationStatus = 'matched';
  
        if (matches.length > 1) {
          reconciliationStatus = 'duplicate';
        } else if (!existing) {
          reconciliationStatus = 'youtube_only';
        } else if (mismatchFields.length > 0) {
          reconciliationStatus = 'metadata_mismatch';
        } else if (existing.titleOverride) {
          reconciliationStatus = 'admin_override';
        }

      return {
        id: video.id,
        title: video.title || video.snippet?.title,
        description: video.description || video.snippet?.description,
        thumbnailUrl:
          video.thumbnailUrl ||
          video.snippet?.thumbnails?.maxres?.url ||
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.medium?.url,
        publishedDate: video.publishedDate || video.snippet?.publishedAt,
        durationSeconds: video.durationSeconds,
        durationFormatted: video.durationFormatted,
        views: video.views,
        alreadyImported: !!existing,
        reconciliationStatus,
        mismatchFields,
        cmsReleaseId: existing?.id ?? null,
        cmsData: existing ? {
          title: existing.title,
          description: existing.description,
          youtubeTitle: existing.youtubeTitle
        } : null,
        lastYoutubeSyncAt: existing?.lastYoutubeSyncAt ?? null,
        stale: existing ? isStale(existing) : false,
      };
    });

    const youtubeIds = new Set(videos.map(video => video.id));
    const cmsOnly = fetchAll
      ? cmsReleases
          .filter(release => release.youtubeId && !youtubeIds.has(release.youtubeId))
          .map(release => ({
            cmsReleaseId: release.id,
            title: release.title,
            youtubeId: release.youtubeId,
            status: 'cms_only_or_nonpublic' as const,
            lastYoutubeSyncAt: release.lastYoutubeSyncAt ?? null,
            stale: isStale(release),
          }))
      : [];

    const missingYoutubeId = fetchAll
      ? cmsReleases
          .filter(release => !release.youtubeId && release.format !== 'playlist')
          .map(release => ({
            cmsReleaseId: release.id,
            title: release.title,
            status: 'missing_youtube_id' as const,
          }))
      : [];

    const reconciliation = {
      matched: rows.filter(row => row.reconciliationStatus === 'matched').length,
      youtubeOnly: rows.filter(row => row.reconciliationStatus === 'youtube_only').length,
      metadataMismatch: rows.filter(row => row.reconciliationStatus === 'metadata_mismatch').length,
        adminOverride: rows.filter(row => row.reconciliationStatus === 'admin_override').length,
      duplicates: rows.filter(row => row.reconciliationStatus === 'duplicate').length,
      stale: rows.filter(row => row.stale).length,
      cmsOnlyOrNonpublic: cmsOnly.length,
      missingYoutubeId: missingYoutubeId.length,
    };

    return NextResponse.json({
      count: rows.length,
      requestedMax: max,
      fetchAll,
      items: rows,
      reconciliation,
      cmsOnly,
      missingYoutubeId,
      source: 'youtube_data_api',
      credentialMode: live.credentialMode,
      note: fetchAll
        ? 'CMS-only records may represent deleted, private, or unlisted videos. Live reconciliation uses the authenticated uploads playlist when OAuth is connected.'
        : null,
    });
  } catch (error: unknown) {
    console.error('[api/releases/import-youtube][GET]', error);
    return failureResponse(error, 'Failed to fetch YouTube videos');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
      const resolutions = body.resolutions || {}; // { [videoId]: 'youtube' | 'cms' }
    const requestedIds = Array.isArray(body.videoIds)
      ? body.videoIds.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];
    const mode = body.mode === 'incremental' ? 'incremental' : 'full';
    const lookbackDays = Math.max(1, Math.min(Number(body.lookbackDays || 30), 3650));
    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const live = await readVideos({ ids: requestedIds, max: MAX_CHANNEL_VIDEOS });
    let selected = dedupeVideos(live.videos);

    if (mode === 'incremental' && requestedIds.length === 0) {
      selected = selected.filter(video => {
        const published = new Date(video.publishedDate || video.snippet?.publishedAt || 0);
        return Number.isFinite(published.getTime()) && published >= cutoff;
      });
    }

    if (selected.length === 0) {
      return NextResponse.json({
        importedCount: 0,
        imported: 0,
        count: 0,
        newCount: 0,
        updatedCount: 0,
        checkedCount: 0,
        registryCount: cmsServerStorage.getAllReleases().length,
        mode,
        source: 'youtube_data_api',
        credentialMode: live.credentialMode,
        message: mode === 'incremental'
          ? `No YouTube uploads found in the last ${lookbackDays} days.`
          : 'No live YouTube videos were returned for the configured channel.',
      });
    }

    const toSave: CMSRelease[] = [];
    const diagnostics: Array<{
      youtubeId: string;
      title: string;
      action: 'created' | 'updated' | 'failed';
      error?: string;
    }> = [];

    let contentTypeMap = new Map<string, string>();
    try {
      const token = await getValidYTAnalyticsAccessToken();
      if (token) {
        const res = await queryYouTubeAnalytics({
          metrics: 'views',
          dimensions: 'video,creatorContentType'
        }, token);
        if (res?.rows) {
          for (const row of res.rows) {
            contentTypeMap.set(String(row[0]), String(row[1]));
          }
        }
      }
    } catch (err) {
      console.warn('Analytics map fetch failed', err);
    }

    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const video of selected) {
      if (contentTypeMap.has(video.id)) {
        video.youtubeContentType = contentTypeMap.get(video.id);
        video.formatClassificationSource = 'youtube_analytics';
      }
      try {
        const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
        const mapped = mapVideoToRelease(video, existing, resolutions[video.id]);

        mapped.status = 'published';
        mapped.visibility = 'public';

        if (existing) updatedCount += 1;
        else newCount += 1;

        toSave.push(mapped);
        diagnostics.push({
          youtubeId: video.id,
          title: video.title || video.snippet?.title || video.id,
          action: existing ? 'updated' : 'created',
        });
      } catch (error: unknown) {
        errorCount += 1;
        diagnostics.push({
          youtubeId: video?.id || 'unknown',
          title: video?.title || video?.snippet?.title || 'Unknown video',
          action: 'failed',
          error: error instanceof Error ? error.message : 'Mapping failed',
        });
      }
    }

    if (toSave.length === 0 && errorCount > 0) {
      return NextResponse.json(
        {
          error: 'All YouTube videos failed during mapping; no CMS records were changed.',
          checkedCount: selected.length,
          errorCount,
          diagnostics,
          source: 'youtube_data_api',
          credentialMode: live.credentialMode,
        },
        { status: 422 }
      );
    }

    const saved = cmsServerStorage.bulkSaveReleasesTransactional(toSave);
    cmsServerStorage.forceHydrate();
    
    // Read-back verification
    const allReleasesAfter = cmsServerStorage.getAllReleases();
    const verifiedCount = saved.filter(s => allReleasesAfter.some(r => r.id === s.id)).length;


    revalidatePath('/');
    revalidatePath('/releases');
    revalidatePath('/admin/cms-releases');
    revalidatePath('/admin/youtube-sync');

    const registryCount = cmsServerStorage.getAllReleases().length;

    return NextResponse.json({
      importedCount: saved.length,
      imported: saved.length,
      count: saved.length,
      verifiedCount,
      newCount,
      updatedCount,
      errorCount,
      checkedCount: selected.length,
      registryCount,
      mode,
      lookbackDays: mode === 'incremental' ? lookbackDays : null,
      source: 'youtube_data_api',
      credentialMode: live.credentialMode,
      diagnostics,
      message: `YouTube sync complete. Checked ${selected.length}; ${newCount} created, ${updatedCount} updated, ${errorCount} failed. Registry now contains ${registryCount} releases.`,
    });
  } catch (error: unknown) {
    console.error('[api/releases/import-youtube][POST]', error);
    return failureResponse(error, 'Failed to import YouTube videos');
  }
}