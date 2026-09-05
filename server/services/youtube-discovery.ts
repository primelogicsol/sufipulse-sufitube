import { CMSRelease } from '@/lib/cms-storage';

export type TimelineBoundaryStatus = 'VERIFIED_CONTIGUOUS' | 'VERIFIED_WITH_GAP' | 'NEEDS_SONG_END' | 'NEEDS_POST_SONG_START' | 'INVALID' | 'UNRESOLVED';
export type CaptionReadinessStatus = 'READY' | 'MISSING_ALIGNMENT' | 'INVALID' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE';
export type ChapterReadinessStatus = 'READY' | 'NEEDS_SONG_END' | 'NEEDS_POST_SONG_START' | 'INVALID' | 'UNVERIFIED';

export interface YouTubeDiscoveryPackage {
  identity: {
    releaseId: string;
    slug: string;
    canonicalTitle: string;
    nativeTitle?: string;
    romanTitle?: string;
    englishTitle?: string;
    aliases: string[];
    youtubeId: string;
    canonicalReleaseUrl: string;
    officialYoutubeUrl: string;
  };
  creative: {
    artist: string;
    lyricist: string;
    composer: string;
    musicProducer: string;
    performers: string[];
  };
  language: {
    compositionLanguage: string;
    audioLanguage: string;
    metadataLanguage?: string;
    availableLanguages: string[];
  };
  timeline: {
    videoStartMs: number;
    lastLyricCueEndMs: number | null;
    songEndMs: number | null;
    postSongStartMs: number | null;
    videoEndMs: number | null;
    boundaryStatus: TimelineBoundaryStatus;
  };
  segments: {
    part1?: {
      segmentType: 'MUSIC_WORK';
      scope: 'PART_1';
      startMs: number;
      endMs: number | null;
      belongsToReleaseComposition: boolean;
      belongsToReleaseLyrics: boolean;
    };
    part2?: {
      segmentType: 'POST_SONG_EXPERIENCE';
      scope: 'PART_2';
      startMs: number | null;
      endMs: number | null;
      belongsToReleaseComposition: boolean;
      belongsToReleaseLyrics: boolean;
    };
  };
  captions: {
    source: 'subtitleCues' | 'unknown';
    cueCount: number;
    originalLanguage: string;
    readiness: CaptionReadinessStatus;
  };
  chapters: {
    readiness: ChapterReadinessStatus;
    proposed: any[];
  };
  metadata: {
    current?: any;
    proposed: {
      title: string;
      description: string;
      defaultAudioLanguage: string;
      defaultLanguage?: string;
      tags?: string[];
    };
  };
  localizations: Array<{
    locale: string;
    translationAvailable: boolean;
    localizedTitleAvailable: boolean;
    localizedDescriptionAvailable: boolean;
    humanReviewed: boolean;
    approved: boolean;
    readiness: 'READY' | 'MISSING' | 'PENDING_REVIEW';
  }>;
  playlists: string[];
  readiness: {
    identity: string;
    creative: string;
    language: string;
    webRelationship: string;
    captions: string;
    chapters: string;
    localization: string;
    metadata: string;
    youtubeWrite: string;
  };
  diagnostics: Array<{
    code: string;
    severity: string;
    message: string;
  }>;
}

export function resolveYouTubeDiscoveryPackage(release: CMSRelease): YouTubeDiscoveryPackage {
  const diagnostics: YouTubeDiscoveryPackage['diagnostics'] = [];

  // 1. Identity
  const identity = {
    releaseId: release.id,
    slug: release.slug,
    canonicalTitle: release.canonicalTitle || release.title,
    nativeTitle: undefined,
    romanTitle: undefined,
    englishTitle: undefined,
    aliases: [],
    youtubeId: release.youtubeId,
    canonicalReleaseUrl: `https://sufipulse.com/release-detail/${release.slug}`,
    officialYoutubeUrl: `https://www.youtube.com/watch?v=${release.youtubeId}`,
  };

  if (!identity.canonicalTitle) {
    diagnostics.push({
      code: 'MISSING_CANONICAL_TITLE',
      severity: 'BLOCKER',
      message: 'Canonical title is completely missing.',
    });
  }

  // 2. Creative
  const publicArtistic = release.publicCredits?.artistic;
  const performers = [];
  if (publicArtistic?.leadVocalist) performers.push(publicArtistic.leadVocalist);
  if (release.chorusVocalists && release.chorusVocalists.length > 0) {
    performers.push(...release.chorusVocalists);
  }

  const creative = {
    artist: 'SufiPulse USA',
    lyricist: 'Dr. Zarf-e-Noori',
    composer: 'Dr. Zarf-e-Noori',
    musicProducer: 'Dr. Zarf-e-Noori',
    performers,
  };

  // 3. Language
  const audioLanguage = release.defaultAudioLanguage || 'ur';
  const language = {
    compositionLanguage: audioLanguage,
    audioLanguage: audioLanguage,
    metadataLanguage: undefined,
    availableLanguages: release.availableLanguages || [],
  };

  // 4. Timeline
  const videoStructure = release.videoStructure || {};
  const songEndMs = videoStructure.songEndMs ?? null;
  const postSongStartMs = videoStructure.postSongStartMs ?? null;
  const videoEndMs = (release.durationSeconds && release.durationSeconds > 0) ? release.durationSeconds * 1000 : null;
  
  if (videoEndMs === null) {
    diagnostics.push({
      code: 'VIDEO_DURATION_UNKNOWN',
      severity: 'WARNING',
      message: 'Video duration is missing or 0. Cannot verify post-song end boundary relative to video.'
    });
  }

  let lastLyricCueEndMs: number | null = null;
  const cueCount = release.subtitleCues ? release.subtitleCues.length : 0;
  
  if (cueCount > 0 && release.subtitleCues) {
    const lastCue = release.subtitleCues[cueCount - 1];
    if (typeof lastCue.endTime === 'string') {
      const parts = lastCue.endTime.split(':');
      if (parts.length === 3) {
        const secs = parts[2].split('.');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const s = parseInt(secs[0], 10);
        const ms = secs[1] ? parseInt(secs[1].substring(0,3).padEnd(3, '0'), 10) : 0;
        lastLyricCueEndMs = ((h * 3600) + (m * 60) + s) * 1000 + ms;
      }
    }
  }

  let boundaryStatus: TimelineBoundaryStatus = 'UNRESOLVED';
  let chapterReadiness: ChapterReadinessStatus = 'INVALID';

  if (songEndMs === null && postSongStartMs === null) {
    boundaryStatus = 'NEEDS_SONG_END';
    chapterReadiness = 'NEEDS_SONG_END';
    diagnostics.push({ code: 'SONG_END_UNVERIFIED', severity: 'BLOCKER_FOR_CHAPTERS', message: 'Part 1 end has not been verified.' });
  } else if (songEndMs !== null && postSongStartMs === null) {
    boundaryStatus = 'NEEDS_POST_SONG_START';
    chapterReadiness = 'NEEDS_POST_SONG_START';
    diagnostics.push({ code: 'POST_SONG_START_MISSING', severity: 'BLOCKER_FOR_CHAPTERS', message: 'Part 1 end is known, but Part 2 start is unverified.' });
  } else if (songEndMs === null && postSongStartMs !== null) {
    boundaryStatus = 'INVALID';
    chapterReadiness = 'INVALID';
    diagnostics.push({ code: 'INVALID_BOUNDARY_STATE', severity: 'BLOCKER_FOR_CHAPTERS', message: 'postSongStartMs is present but songEndMs is null.' });
  } else if (songEndMs !== null && postSongStartMs !== null) {
    if (songEndMs < 0 || postSongStartMs < 0) {
      boundaryStatus = 'INVALID';
      chapterReadiness = 'INVALID';
      diagnostics.push({ code: 'BOUNDARY_NEGATIVE', severity: 'BLOCKER_FOR_CHAPTERS', message: 'Boundaries cannot be negative.' });
    } else if (songEndMs > postSongStartMs) {
      boundaryStatus = 'INVALID';
      chapterReadiness = 'INVALID';
      diagnostics.push({ code: 'BOUNDARY_REVERSED', severity: 'BLOCKER_FOR_CHAPTERS', message: 'songEndMs cannot be greater than postSongStartMs.' });
    } else if (videoEndMs !== null && postSongStartMs > videoEndMs) {
      boundaryStatus = 'INVALID';
      chapterReadiness = 'INVALID';
      diagnostics.push({ code: 'POST_SONG_AFTER_VIDEO_END', severity: 'BLOCKER_FOR_CHAPTERS', message: 'postSongStartMs cannot exceed videoEndMs.' });
    } else if (videoEndMs !== null && songEndMs > videoEndMs) {
      boundaryStatus = 'INVALID';
      chapterReadiness = 'INVALID';
      diagnostics.push({ code: 'SONG_END_AFTER_VIDEO_END', severity: 'BLOCKER_FOR_CHAPTERS', message: 'songEndMs cannot exceed videoEndMs.' });
    } else {
      boundaryStatus = (songEndMs === postSongStartMs) ? 'VERIFIED_CONTIGUOUS' : 'VERIFIED_WITH_GAP';
      
      if (videoStructure.boundarySource === 'EDITOR_VERIFIED' && videoStructure.boundaryVerifiedAt) {
        chapterReadiness = 'READY';
      } else {
        chapterReadiness = 'UNVERIFIED';
        diagnostics.push({ code: 'BOUNDARY_UNVERIFIED', severity: 'BLOCKER_FOR_CHAPTERS', message: 'Boundary is structurally valid but lacks explicit editorial verification.' });
      }
    }
  }

  const timeline = {
    videoStartMs: 0,
    lastLyricCueEndMs,
    songEndMs,
    postSongStartMs,
    videoEndMs,
    boundaryStatus,
  };

  // 5. Segments
  const segments = {
    part1: {
      segmentType: 'MUSIC_WORK' as const,
      scope: 'PART_1' as const,
      startMs: 0,
      endMs: songEndMs,
      belongsToReleaseComposition: true,
      belongsToReleaseLyrics: true,
    },
    part2: {
      segmentType: 'POST_SONG_EXPERIENCE' as const,
      scope: 'PART_2' as const,
      startMs: postSongStartMs,
      endMs: videoEndMs,
      belongsToReleaseComposition: false,
      belongsToReleaseLyrics: false,
    },
  };

  // 6. Captions
  let captionReadiness: CaptionReadinessStatus = 'READY';
  if (release.defaultAudioLanguage === 'zxx') {
    captionReadiness = 'NOT_APPLICABLE';
  } else if (lastLyricCueEndMs !== null && songEndMs !== null && lastLyricCueEndMs > songEndMs) {
    captionReadiness = 'INVALID';
    diagnostics.push({
      code: 'CAPTION_CROSSES_PART_2',
      severity: 'BLOCKER_FOR_CAPTIONS',
      message: 'Caption cues exceed songEndMs boundary.',
    });
  } else if (cueCount === 0) {
    captionReadiness = 'MISSING_ALIGNMENT';
    diagnostics.push({
      code: 'CAPTION_ALIGNMENT_MISSING',
      severity: 'BLOCKER_FOR_CAPTIONS',
      message: 'No subtitle cues exist for this release.',
    });
  }

  const captions = {
    source: 'subtitleCues' as const,
    cueCount,
    originalLanguage: audioLanguage,
    readiness: captionReadiness,
  };

  // 7. Chapters
  const chapters = {
    readiness: chapterReadiness,
    proposed: [],
  };

  // 8. Metadata
  const proposedTitle = release.youtubeTitleVariantA || `${identity.canonicalTitle} | SufiPulse USA`;
  const proposedDescription = `${identity.canonicalTitle}\nSufiPulse USA\n\nLyricist & Composer: Dr. Zarf-e-Noori\nMusic Producer: Dr. Zarf-e-Noori\nLanguage: ${language.audioLanguage}\n\nExplore full lyrics, commentary, and translation:\n${identity.canonicalReleaseUrl}\n\n--- SufiPulse Post-Song Experience ---`;

  const metadata = {
    proposed: {
      title: proposedTitle,
      description: proposedDescription,
      defaultAudioLanguage: language.audioLanguage,
    },
  };

  // 9. Localizations
  const localizations = language.availableLanguages.map(locale => {
    return {
      locale,
      translationAvailable: false,
      localizedTitleAvailable: false,
      localizedDescriptionAvailable: false,
      humanReviewed: false,
      approved: false,
      readiness: 'PENDING_REVIEW' as const,
    };
  });

  // 10. Readiness Summary
  const readiness = {
    identity: identity.canonicalTitle ? 'READY' : 'INVALID',
    creative: 'READY',
    language: 'READY',
    webRelationship: 'READY',
    captions: captions.readiness,
    chapters: chapters.readiness,
    localization: 'PENDING_REVIEW',
    metadata: 'READY_FOR_REVIEW',
    youtubeWrite: 'BLOCKED',
  };

  return {
    identity,
    creative,
    language,
    timeline,
    segments,
    captions,
    chapters,
    metadata,
    localizations,
    playlists: [],
    readiness,
    diagnostics,
  };
}
