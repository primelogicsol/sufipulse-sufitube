import { NextRequest, NextResponse } from 'next/server';
import { youtubeService } from '@/lib/youtube-service';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { revalidatePath } from 'next/cache';
import { mapVideoToRelease } from '@/lib/release-mapping';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const videoIdsParam = searchParams.get('videoIds');
    const fetchAll = searchParams.get('fetchAll') === '1';
    
    let videos: any[] = [];
    
    if (videoIdsParam) {
      const ids = videoIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        // Special case for mock testing without a key
        if (ids.length === 1 && ids[0] === 'q58mRXIsi-Y') {
           const mock = await youtubeService.getVideoById('q58mRXIsi-Y');
           videos = mock ? [mock] : [];
        } else {
           videos = await youtubeService.getVideosByIds(ids);
        }
      }
    } else {
      const max = fetchAll
        ? 500
        : Math.max(1, Math.min(Number(searchParams.get('max') || 25), 500));
      videos = await youtubeService.getLatestVideos(max);
    }

    const rows = (videos || []).map((video: any) => ({
      id: video.id,
      title: video.title || video.snippet?.title,
      description: video.description || video.snippet?.description,
      thumbnailUrl: video.thumbnailUrl || video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url,
      publishedDate: video.publishedDate || video.snippet?.publishedAt,
      durationSeconds: video.durationSeconds,
      durationFormatted: video.durationFormatted,
      views: video.views,
      alreadyImported: !!cmsServerStorage.getReleaseByYoutubeId(video.id),
    }));

    return NextResponse.json({
      count: rows.length,
      requestedMax: fetchAll ? 500 : 25,
      fetchAll,
      items: rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch YouTube videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    youtubeService.clearCache();
    const body = await request.json().catch(() => ({}));
    const requestedIds = Array.isArray(body.videoIds) ? body.videoIds.filter(Boolean) : [];
    const lookbackDays = Number(body.lookbackDays || 30);
    const lookbackMs = lookbackDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const cutoffDate = new Date(now - lookbackMs);

    let selected: any[] = [];
    let isFallback = false;

    if (requestedIds.length) {
      for (const vid of requestedIds) {
        const detail = await youtubeService.getVideoById(vid);
        if (detail) selected.push(detail);
      }
    } else {
      // 1. Fetch latest videos from uploads playlist
      const latestVideos = await youtubeService.getLatestVideos(100);
      selected = [...latestVideos];
      
      // 2. Fetch latest completed live streams
      try {
        const liveStreams = await youtubeService.getCompletedLiveStreams(25);
        // Add only unique IDs
        const existingIds = new Set(selected.map(v => v.id));
        for (const stream of liveStreams) {
          if (!existingIds.has(stream.id)) {
            selected.push(stream);
          }
        }
      } catch (err) {
        console.error('[Import] Failed to fetch live streams during sync:', err);
      }
      
      isFallback = selected.some(v => v.source === 'native' || !v.source);
    }

    if (!selected.length) {
      return NextResponse.json({ 
        error: 'No videos found to import',
        diagnostics: {
          checkedCount: 0,
          lookbackDays
        }
      }, { status: 404 });
    }

    // Sort by date to identify the latest
    selected.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    const latestVideo = selected[0];

    const toSave: CMSRelease[] = [];
    const diagnostics: any[] = [];
    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const video of selected) {
      const diag: any = {
        youtubeId: video.id,
        title: video.title,
        publishedAt: video.publishedDate,
        durationSeconds: video.durationSeconds,
        format: video.format,
        candidateForImport: true,
        importAction: 'none',
        importReason: 'none',
        publicVisibleAfterSync: false,
        reasonHiddenAfterSync: 'none'
      };

      try {
        const pubDate = new Date(video.publishedDate);
        const isLatest = video.id === latestVideo.id;

        if (pubDate < cutoffDate && !requestedIds.length && !isLatest) {
          skippedCount++;
          diag.candidateForImport = false;
          diag.importAction = 'skipped';
          diag.importReason = `Published before cutoff date (${cutoffDate.toLocaleDateString()})`;
          diagnostics.push(diag);
          continue;
        }

        const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
        if (!existing) {
          newCount++;
          diag.importAction = 'created';
          diag.importReason = 'New YouTube upload detected';
        } else {
          updatedCount++;
          diag.importAction = 'updated';
          diag.importReason = 'Existing registry record updated with fresh metadata';
          diag.dbRecordId = existing.id;
        }
        
        const mapped = mapVideoToRelease(video, existing);
        toSave.push(mapped);
        
        // Immediate visibility check on mapped data
        diag.publicVisibleAfterSync = mapped.status === 'published' && mapped.visibility === 'public';
        if (!diag.publicVisibleAfterSync) {
          diag.reasonHiddenAfterSync = mapped.status !== 'published' ? 'status_not_published' : 'visibility_not_public';
        }
      } catch (err: any) {
        console.error(`[Import] Failed to process video ${video.id}:`, err);
        errorCount++;
        diag.importAction = 'failed';
        diag.importReason = err.message || 'Mapping or validation error';
        diag.dbErrorMessage = err.message;
      }
      diagnostics.push(diag);
    }

    const saved = cmsServerStorage.bulkSaveReleases(toSave);
    cmsServerStorage.forceHydrate();
    revalidatePath('/');
    revalidatePath('/releases');

    // Diagnostic for latest video specifically
    const latestDiag = diagnostics.find(d => d.youtubeId === latestVideo.id);
    const latestInDb = cmsServerStorage.getReleaseByYoutubeId(latestVideo.id);
    
    if (latestDiag) {
      latestDiag.existsInDb = !!latestInDb;
      if (latestInDb) {
        latestDiag.dbRecordId = latestInDb.id;
        latestDiag.publicVisibleAfterSync = latestInDb.status === 'published' && latestInDb.visibility === 'public';
        latestDiag.reasonHiddenAfterSync = !latestDiag.publicVisibleAfterSync 
          ? (latestInDb.status !== 'published' ? 'status_not_published' : 'visibility_not_public')
          : 'none';
      } else {
        latestDiag.existsInDb = false;
        latestDiag.reasonHiddenAfterSync = 'missing_from_db';
      }
    }

    return NextResponse.json({
      importedCount: saved.length,
      newCount,
      updatedCount,
      skippedCount,
      errorCount,
      checkedCount: selected.length,
      isFallback,
      diagnostic: latestDiag,
      diagnostics: diagnostics.slice(0, 50), // Return details for first 50 to avoid huge response
      message: isFallback 
        ? 'Sync completed using static fallback data (API key missing or quota exceeded).' 
        : `Sync Registry Complete. Checked ${selected.length} uploads from last ${lookbackDays} days. ${newCount} new, ${updatedCount} updated, ${skippedCount} skipped.`,
      details: {
        lookbackDays,
        latestVideo: latestDiag
      }
    });
  } catch (error: any) {
    console.error('[API /api/releases/import-youtube] POST ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to import YouTube videos' }, { status: 500 });
  }
}
