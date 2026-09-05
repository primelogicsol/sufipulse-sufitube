import { resolveYouTubeDiscoveryPackage } from '../server/services/youtube-discovery';
import { CMSRelease } from '../lib/cms-storage';

// Base mock builder
function buildMockRelease(overrides: Partial<CMSRelease>): CMSRelease {
  return {
    id: 'mock-id',
    title: 'MOCK TITLE',
    slug: 'mock-slug',
    youtubeId: 'mockYtId',
    description: '',
    releaseDate: '2026-01-01',
    durationSeconds: 100,
    durationFormatted: '01:40',
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
  console.log('=== PHASE 1 RESOLVER TESTS ===\n');

  // 1. PEHCHAAN KHUD KO Test
  const pehchaan = buildMockRelease({
    id: 'pehchaan-khud-ko',
    slug: 'pehchaan-khud-ko',
    youtubeId: 'Hc1TjcyZLnM',
    canonicalTitle: 'PEHCHAAN KHUD KO',
    subtitleCues: [],
    videoStructure: {}
  });
  
  const pkgPehchaan = resolveYouTubeDiscoveryPackage(pehchaan);
  console.log('--- PEHCHAAN KHUD KO ---');
  console.log('Identity READY?', pkgPehchaan.readiness.identity === 'READY');
  console.log('Creative READY?', pkgPehchaan.readiness.creative === 'READY');
  console.log('Audio Language:', pkgPehchaan.language.audioLanguage);
  console.log('Caption Cue Count:', pkgPehchaan.captions.cueCount);
  console.log('Caption Readiness:', pkgPehchaan.captions.readiness);
  console.log('songEndMs:', pkgPehchaan.timeline.songEndMs);
  console.log('postSongStartMs:', pkgPehchaan.timeline.postSongStartMs);
  console.log('Chapter Readiness:', pkgPehchaan.chapters.readiness);
  console.log('Part 2 type:', pkgPehchaan.segments.part2?.segmentType);
  console.log('Part 2 in MusicComposition?', pkgPehchaan.segments.part2?.belongsToReleaseComposition);
  console.log('');

  // A. cues present + boundary present -> captions READY, chapters READY
  const scenarioA = buildMockRelease({
    subtitleCues: [{ id: '1', startTime: '00:00:01.000', endTime: '00:00:05.000', cueNumber: 1 }],
    videoStructure: { songEndMs: 10000, postSongStartMs: 10000 }
  });
  const pkgA = resolveYouTubeDiscoveryPackage(scenarioA);
  console.log('--- A. Cues + Boundary Present ---');
  console.log('Captions:', pkgA.captions.readiness, 'Chapters:', pkgA.chapters.readiness);

  // B. cues absent + boundary present -> captions MISSING_ALIGNMENT, chapters READY
  const scenarioB = buildMockRelease({
    subtitleCues: [],
    videoStructure: { songEndMs: 15000, postSongStartMs: 15000 }
  });
  const pkgB = resolveYouTubeDiscoveryPackage(scenarioB);
  console.log('--- B. No Cues + Boundary Present ---');
  console.log('Captions:', pkgB.captions.readiness, 'Chapters:', pkgB.chapters.readiness);

  // C. cues present + boundary absent -> captions READY, chapters NEEDS_SONG_END
  const scenarioC = buildMockRelease({
    subtitleCues: [{ id: '1', startTime: '00:00:01.000', endTime: '00:00:05.000', cueNumber: 1 }],
    videoStructure: {}
  });
  const pkgC = resolveYouTubeDiscoveryPackage(scenarioC);
  console.log('--- C. Cues Present + No Boundary ---');
  console.log('Captions:', pkgC.captions.readiness, 'Chapters:', pkgC.chapters.readiness);

  // D. cues absent + boundary absent -> both unresolved independently
  const scenarioD = buildMockRelease({
    subtitleCues: [],
    videoStructure: {}
  });
  const pkgD = resolveYouTubeDiscoveryPackage(scenarioD);
  console.log('--- D. No Cues + No Boundary ---');
  console.log('Captions:', pkgD.captions.readiness, 'Chapters:', pkgD.chapters.readiness);

  // E. instrumental zxx release -> no fabricated lyric captions
  // If format is audio or audioLanguage is zxx. Let's say we rely on missing subtitleCues = MISSING_ALIGNMENT
  // but if it's zxx, maybe it's naturally READY? Prompt says "no fabricated lyric captions".
  const scenarioE = buildMockRelease({
    subtitleCues: [],
    defaultAudioLanguage: 'zxx',
    videoStructure: { songEndMs: 20000, postSongStartMs: 20000 }
  });
  const pkgE = resolveYouTubeDiscoveryPackage(scenarioE);
  console.log('--- E. Instrumental (zxx) ---');
  console.log('Captions:', pkgE.captions.readiness, '(No fabricated cues)');

  // F. songEnd present + postSongStart missing
  const scenarioF = buildMockRelease({
    subtitleCues: [],
    videoStructure: { songEndMs: 10000 }
  });
  console.log('--- F. songEnd present + postSongStart missing ---');
  console.log('Chapters:', resolveYouTubeDiscoveryPackage(scenarioF).chapters.readiness);

  // G. songEnd < postSongStart (Gap)
  const scenarioG = buildMockRelease({
    subtitleCues: [],
    videoStructure: { songEndMs: 10000, postSongStartMs: 12000 }
  });
  console.log('--- G. songEnd < postSongStart (Gap) ---');
  console.log('Chapters:', resolveYouTubeDiscoveryPackage(scenarioG).chapters.readiness);
  console.log('Boundary:', resolveYouTubeDiscoveryPackage(scenarioG).timeline.boundaryStatus);

  // H. songEnd > postSongStart (Invalid)
  const scenarioH = buildMockRelease({
    subtitleCues: [],
    videoStructure: { songEndMs: 15000, postSongStartMs: 10000 }
  });
  console.log('--- H. songEnd > postSongStart (Invalid) ---');
  console.log('Chapters:', resolveYouTubeDiscoveryPackage(scenarioH).chapters.readiness);
  console.log('Boundary:', resolveYouTubeDiscoveryPackage(scenarioH).timeline.boundaryStatus);
}

runTests();
