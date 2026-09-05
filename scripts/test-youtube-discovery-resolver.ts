import { resolveYouTubeDiscoveryPackage } from '../server/services/youtube-discovery';
import { CMSRelease } from '../lib/cms-storage';
import { parseTimecodeToMs } from '../lib/time-utils';

function buildMockRelease(overrides: Partial<CMSRelease>): CMSRelease {
  return {
    id: 'mock-id',
    title: 'MOCK TITLE',
    slug: 'mock-slug',
    youtubeId: 'mockYtId',
    description: '',
    releaseDate: '2026-01-01',
    durationSeconds: 30, // 30,000 ms videoEndMs
    durationFormatted: '00:30',
    viewCount: 0,
    likeCount: 0,
    status: 'published',
    enableLyrics: true,
    enableCommentary: false,
    enableSponsors: false,
    enableAdoption: false,
    enableCredits: false,
    defaultAudioLanguage: 'ur',
    availableLanguages: ['en', 'ur'],
    ...overrides
  } as CMSRelease;
}

function runTests() {
  console.log('=== PHASE 2 RESOLVER TESTS ===\n');

  // 1. Timecode parser 00:04:21
  console.log('Test 1 - 00:04:21 ->', parseTimecodeToMs('00:04:21'));
  // 2. Timecode parser 04:21.500
  console.log('Test 2 - 04:21.500 ->', parseTimecodeToMs('04:21.500'));
  // 3. Timecode parser malformed
  console.log('Test 3 - invalid ->', parseTimecodeToMs('hello:world'));
  // 4. Timecode negative -> handled by logic

  // 5. Contiguous boundary
  const contiguous = buildMockRelease({ videoStructure: { songEndMs: 15000, postSongStartMs: 15000 }});
  console.log('Test 5 - Contiguous:', resolveYouTubeDiscoveryPackage(contiguous).timeline.boundaryStatus);

  // 6. Valid gap
  const gap = buildMockRelease({ videoStructure: { songEndMs: 15000, postSongStartMs: 18000 }});
  console.log('Test 6 - Gap:', resolveYouTubeDiscoveryPackage(gap).timeline.boundaryStatus);

  // 7. Reversed boundary
  const reversed = buildMockRelease({ videoStructure: { songEndMs: 20000, postSongStartMs: 15000 }});
  console.log('Test 7 - Reversed:', resolveYouTubeDiscoveryPackage(reversed).timeline.boundaryStatus);

  // 8. Song end after video end
  const songAfter = buildMockRelease({ durationSeconds: 20, videoStructure: { songEndMs: 25000, postSongStartMs: 26000 }});
  console.log('Test 8 - Song End Exceeds Video:', resolveYouTubeDiscoveryPackage(songAfter).timeline.boundaryStatus);

  // 9. Post song start after video end
  const postAfter = buildMockRelease({ durationSeconds: 20, videoStructure: { songEndMs: 15000, postSongStartMs: 25000 }});
  console.log('Test 9 - Post Start Exceeds Video:', resolveYouTubeDiscoveryPackage(postAfter).timeline.boundaryStatus);

  // 10. Missing post-song start
  const missingPost = buildMockRelease({ videoStructure: { songEndMs: 15000 }});
  console.log('Test 10 - Missing Post Start:', resolveYouTubeDiscoveryPackage(missingPost).timeline.boundaryStatus);

  // 11. Missing song end
  const missingSong = buildMockRelease({ videoStructure: { postSongStartMs: 15000 }});
  console.log('Test 11 - Missing Song End:', resolveYouTubeDiscoveryPackage(missingSong).timeline.boundaryStatus);

  // 12. Part 2 remains excluded
  const p2 = resolveYouTubeDiscoveryPackage(gap).segments.part2;
  console.log('Test 12 - Part 2 excluded from lyrics?', p2?.belongsToReleaseLyrics === false);

  // 13. Chapter generation blocked for incomplete boundary
  const inc = resolveYouTubeDiscoveryPackage(missingPost).chapters;
  console.log('Test 13 - Chapters Blocked?', inc.readiness === 'NEEDS_POST_SONG_START');

  // 14. Provenance Invalidation Test
  const boundA = buildMockRelease({ videoStructure: { songEndMs: 10000, postSongStartMs: 10000, boundarySource: 'EDITOR_VERIFIED', boundaryVerifiedAt: '2026-09-04T00:00:00.000Z' }});
  console.log('Test 14.1 - Verified A Chapters:', resolveYouTubeDiscoveryPackage(boundA).chapters.readiness);

  const boundBUnverified = buildMockRelease({ videoStructure: { songEndMs: 15000, postSongStartMs: 15000, boundarySource: 'EDITOR_VERIFIED' }});
  console.log('Test 14.2 - Changed B Chapters (UNVERIFIED):', resolveYouTubeDiscoveryPackage(boundBUnverified).chapters.readiness);

  const boundBVerified = buildMockRelease({ videoStructure: { songEndMs: 15000, postSongStartMs: 15000, boundarySource: 'EDITOR_VERIFIED', boundaryVerifiedAt: '2026-09-04T00:01:00.000Z' }});
  console.log('Test 14.3 - Re-verified B Chapters:', resolveYouTubeDiscoveryPackage(boundBVerified).chapters.readiness);

  // Caption boundary exceeding
  const captionExceeds = buildMockRelease({
    subtitleCues: [{ id: '1', cueNumber: 1, startTime: '00:00:10.000', endTime: '00:00:20.000' }],
    videoStructure: { songEndMs: 15000, postSongStartMs: 16000 }
  });
  console.log('Test - Caption crosses Part 2:', resolveYouTubeDiscoveryPackage(captionExceeds).captions.readiness);

  // PEHCHAAN Control
  const pehchaan = buildMockRelease({
    id: 'pehchaan-khud-ko',
    slug: 'pehchaan-khud-ko',
    youtubeId: 'Hc1TjcyZLnM',
    canonicalTitle: 'PEHCHAAN KHUD KO',
    subtitleCues: [],
    videoStructure: {}
  });
  console.log('--- PEHCHAAN KHUD KO (Pre-entry) ---');
  console.log('Chapters:', resolveYouTubeDiscoveryPackage(pehchaan).chapters.readiness);

  const pehchaanReady = buildMockRelease({
    id: 'pehchaan-khud-ko',
    slug: 'pehchaan-khud-ko',
    youtubeId: 'Hc1TjcyZLnM',
    canonicalTitle: 'PEHCHAAN KHUD KO',
    subtitleCues: [{ id: '1', cueNumber: 1, startTime: '00:00:00.000', endTime: '00:00:10.000' }],
    videoStructure: { songEndMs: 10000, postSongStartMs: 12000, boundarySource: 'EDITOR_VERIFIED', boundaryVerifiedAt: '2026-09-04T00:00:00.000Z' }
  });
  console.log('--- PEHCHAAN SYNTHETIC READY FIXTURE ---');
  console.log('Chapters:', resolveYouTubeDiscoveryPackage(pehchaanReady).chapters.readiness);
  console.log('Captions:', resolveYouTubeDiscoveryPackage(pehchaanReady).captions.readiness);
}

runTests();
