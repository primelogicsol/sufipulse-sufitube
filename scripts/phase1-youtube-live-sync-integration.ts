import assert from 'node:assert/strict';
import { fetchReadOnlyYouTubeChannelVideos } from '../lib/youtube-data-api-readonly';
import { cmsServerStorage } from '../lib/cms-storage-server';
import { mapVideoToRelease } from '../lib/release-mapping';

const MIN_EXPECTED_UPLOADS = Math.max(1, Number(process.env.MIN_EXPECTED_UPLOADS || 95));
const LOOKBACK_DAYS = Math.max(1, Math.min(Number(process.env.INCREMENTAL_LOOKBACK_DAYS || 30), 3650));

function uniqueYoutubeIds(): Set<string> {
  return new Set(
    cmsServerStorage
      .getAllReleases()
      .map(release => String(release.youtubeId || '').trim())
      .filter(Boolean)
  );
}

async function main() {
  const before = cmsServerStorage.getAllReleases();
  const beforeYoutubeIds = uniqueYoutubeIds();
  const live = await fetchReadOnlyYouTubeChannelVideos(500);
  const videos = live.videos;

  assert.equal(live.credentialMode, 'youtube-oauth-client', 'Live sync integration must use owner OAuth in Phase 1 CI');
  assert.ok(videos.length >= MIN_EXPECTED_UPLOADS, `Expected at least ${MIN_EXPECTED_UPLOADS} live uploads, got ${videos.length}`);

  const cutoff = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const recent = videos.filter(video => {
    const published = new Date(video.publishedDate || 0).getTime();
    return Number.isFinite(published) && published >= cutoff;
  });

  let incrementalCreates = 0;
  let incrementalUpdates = 0;
  const incrementalRecords = recent.map(video => {
    const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
    if (existing) incrementalUpdates += 1;
    else incrementalCreates += 1;
    const mapped = mapVideoToRelease(video, existing);
    mapped.status = 'published';
    mapped.visibility = 'public';
    return mapped;
  });

  if (incrementalRecords.length > 0) {
    const saved = cmsServerStorage.bulkSaveReleases(incrementalRecords);
    assert.equal(saved.length, incrementalRecords.length, 'Incremental sync must persist every selected live upload');
  }
  cmsServerStorage.forceHydrate();

  for (const video of recent) {
    assert.ok(cmsServerStorage.getReleaseByYoutubeId(video.id), `Incremental sync did not persist ${video.id}`);
  }

  let fullCreates = 0;
  let fullUpdates = 0;
  const fullRecords = videos.map(video => {
    const existing = cmsServerStorage.getReleaseByYoutubeId(video.id);
    if (existing) fullUpdates += 1;
    else fullCreates += 1;
    const mapped = mapVideoToRelease(video, existing);
    mapped.status = 'published';
    mapped.visibility = 'public';
    return mapped;
  });

  const fullSaved = cmsServerStorage.bulkSaveReleases(fullRecords);
  assert.equal(fullSaved.length, videos.length, 'Full sync must persist every live upload');
  cmsServerStorage.forceHydrate();

  const afterYoutubeIds = uniqueYoutubeIds();
  for (const video of videos) {
    assert.ok(afterYoutubeIds.has(video.id), `Full sync did not reconcile live video ${video.id}`);
  }
  assert.equal(
    videos.filter(video => afterYoutubeIds.has(video.id)).length,
    videos.length,
    'Every live upload must exist in the reconciled CMS registry'
  );

  console.log(`SYNC_INTEGRATION_SOURCE=${live.credentialMode}`);
  console.log(`SYNC_INTEGRATION_LIVE_UPLOADS=${videos.length}`);
  console.log(`SYNC_INTEGRATION_INITIAL_RELEASES=${before.length}`);
  console.log(`SYNC_INTEGRATION_INITIAL_YOUTUBE_IDS=${beforeYoutubeIds.size}`);
  console.log(`SYNC_INTEGRATION_INCREMENTAL_${LOOKBACK_DAYS}D_COUNT=${recent.length}`);
  console.log(`SYNC_INTEGRATION_INCREMENTAL_CREATES=${incrementalCreates}`);
  console.log(`SYNC_INTEGRATION_INCREMENTAL_UPDATES=${incrementalUpdates}`);
  console.log(`SYNC_INTEGRATION_FULL_CREATES_AFTER_INCREMENTAL=${fullCreates}`);
  console.log(`SYNC_INTEGRATION_FULL_UPDATES_AFTER_INCREMENTAL=${fullUpdates}`);
  console.log(`SYNC_INTEGRATION_FINAL_YOUTUBE_IDS=${afterYoutubeIds.size}`);
  console.log('Phase 1 live YouTube CMS sync integration passed.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
