
const fs = require('fs');
let service = fs.readFileSync('server/services/youtube-discovery.ts', 'utf8');

service = service.replace(
  /export type TimelineBoundaryStatus = .*/,
  "export type TimelineBoundaryStatus = 'VERIFIED_CONTIGUOUS' | 'VERIFIED_WITH_GAP' | 'NEEDS_SONG_END' | 'NEEDS_POST_SONG_START' | 'INVALID' | 'UNRESOLVED';"
);
service = service.replace(
  /export type CaptionReadinessStatus = .*/,
  "export type CaptionReadinessStatus = 'READY' | 'MISSING_ALIGNMENT' | 'INVALID' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE';"
);
service = service.replace(
  /export type ChapterReadinessStatus = .*/,
  "export type ChapterReadinessStatus = 'READY' | 'NEEDS_SONG_END' | 'NEEDS_POST_SONG_START' | 'INVALID';"
);

const oldBoundaryBlock = \  let boundaryStatus: TimelineBoundaryStatus = 'INVALID';
  if (songEndMs !== null) {
    boundaryStatus = postSongStartMs !== null ? 'VERIFIED' : 'NO_POST_SONG';
  } else {
    boundaryStatus = 'NEEDS_SONG_END';
    diagnostics.push({
      code: 'SONG_END_UNVERIFIED',
      severity: 'BLOCKER_FOR_CHAPTERS',
      message: 'Part 1 end / Part 2 start has not been verified.',
    });
  }\;

const newBoundaryBlock = \  let boundaryStatus: TimelineBoundaryStatus = 'UNRESOLVED';
  let chapterReadiness: ChapterReadinessStatus = 'INVALID';

  if (songEndMs === null && postSongStartMs === null) {
    boundaryStatus = 'NEEDS_SONG_END';
    chapterReadiness = 'NEEDS_SONG_END';
    diagnostics.push({
      code: 'SONG_END_UNVERIFIED',
      severity: 'BLOCKER_FOR_CHAPTERS',
      message: 'Part 1 end has not been verified.',
    });
  } else if (songEndMs !== null && postSongStartMs === null) {
    boundaryStatus = 'NEEDS_POST_SONG_START';
    chapterReadiness = 'NEEDS_POST_SONG_START';
    diagnostics.push({
      code: 'POST_SONG_START_UNVERIFIED',
      severity: 'BLOCKER_FOR_CHAPTERS',
      message: 'Part 1 end is known, but Part 2 start is unverified.',
    });
  } else if (songEndMs === null && postSongStartMs !== null) {
    boundaryStatus = 'INVALID';
    chapterReadiness = 'INVALID';
    diagnostics.push({
      code: 'INVALID_BOUNDARY_STATE',
      severity: 'BLOCKER_FOR_CHAPTERS',
      message: 'postSongStartMs is present but songEndMs is null.',
    });
  } else if (songEndMs !== null && postSongStartMs !== null) {
    if (songEndMs > postSongStartMs) {
      boundaryStatus = 'INVALID';
      chapterReadiness = 'INVALID';
      diagnostics.push({
        code: 'INVALID_BOUNDARY_ORDER',
        severity: 'BLOCKER_FOR_CHAPTERS',
        message: 'songEndMs cannot be greater than postSongStartMs.',
      });
    } else if (songEndMs === postSongStartMs) {
      boundaryStatus = 'VERIFIED_CONTIGUOUS';
      chapterReadiness = 'READY';
    } else {
      boundaryStatus = 'VERIFIED_WITH_GAP';
      chapterReadiness = 'READY';
    }
  }\;

service = service.replace(oldBoundaryBlock, newBoundaryBlock);
service = service.replace(/  const chapterReadiness: ChapterReadinessStatus = songEndMs !== null \? 'READY' : 'NEEDS_SONG_END';\\n/, '');

const oldCaptionBlock = \  let captionReadiness: CaptionReadinessStatus = 'READY';
  if (cueCount === 0) {
    captionReadiness = 'MISSING_ALIGNMENT';
    diagnostics.push({
      code: 'CAPTION_ALIGNMENT_MISSING',
      severity: 'BLOCKER_FOR_CAPTIONS',
      message: 'No subtitle cues exist for this release.',
    });
  }\;

const newCaptionBlock = \  let captionReadiness: CaptionReadinessStatus = 'READY';
  if (release.defaultAudioLanguage === 'zxx') {
    captionReadiness = 'NOT_APPLICABLE';
  } else if (cueCount === 0) {
    captionReadiness = 'MISSING_ALIGNMENT';
    diagnostics.push({
      code: 'CAPTION_ALIGNMENT_MISSING',
      severity: 'BLOCKER_FOR_CAPTIONS',
      message: 'No subtitle cues exist for this release.',
    });
  }\;

service = service.replace(oldCaptionBlock, newCaptionBlock);
fs.writeFileSync('server/services/youtube-discovery.ts', service);

