import { type CMSRelease, getDefaultDistribution } from './cms-storage';
import { cmsServerStorage } from './cms-storage-server';


export function initializeCanonicalTitle(youtubeTitle: string): string {
  if (!youtubeTitle || !youtubeTitle.trim()) {
    throw new Error('Release validation failed: Missing canonical title');
  }
  
  // 1. Normalize whitespace
  let title = youtubeTitle.replace(/\s+/g, ' ').trim();
  
  // 2. Remove exact terminal channel branding
  if (title.endsWith(' | SufiPulse USA')) {
    title = title.replace(' | SufiPulse USA', '');
  }
  
  // 3. Take leading identity segment before first spaced pipe separator
  const parts = title.split(' | ');
  const finalTitle = parts[0].trim();
  
  if (!finalTitle) {
    throw new Error('Release validation failed: Missing canonical title after normalization');
  }
  
  return finalTitle;
}

export const slugify = (value: string): string => {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'release';
};

export const buildUniqueSlug = (title: string, youtubeId: string, currentReleaseId?: string): string => {
  const base = slugify(title);
  
  // 1. Try base slug
  const byBase = cmsServerStorage.getReleaseBySlug(base);
  if (!byBase || byBase.id === currentReleaseId) {
    return base;
  }

  // 2. Try base + youtubeId (canonical unique fallback)
  const fallback = `${base}-${youtubeId.toLowerCase()}`;
  const byFallback = cmsServerStorage.getReleaseBySlug(fallback);
  if (!byFallback || byFallback.id === currentReleaseId) {
    return fallback;
  }

  // 3. Absolute fallback
  return `${fallback}-${Date.now()}`;
};

export const mapVideoToRelease = (video: any, existing?: CMSRelease | null, resolution?: 'youtube' | 'cms'): CMSRelease => {
  const liveTitle = video.title || video.snippet?.title || '';
  const liveDescription = video.description || video.snippet?.description || '';
  
  let titleOverride: boolean = !!existing?.titleOverride;
    let descriptionOverride: boolean = !!existing?.descriptionOverride;
  
  // If resolution is used from the UI (legacy, or if they force 'youtube')
  if (resolution === 'youtube') { titleOverride = false; descriptionOverride = false; }
  
  const initialCanonical = initializeCanonicalTitle(liveTitle);
  const finalCanonicalTitle = existing?.canonicalTitle || existing?.title || initialCanonical;
  const finalTitle = existing?.title || finalCanonicalTitle;
  
  const finalDescriptionText = descriptionOverride ? (existing?.description || liveDescription) : liveDescription;

  const id = existing?.id || `release_${Date.now()}_${video.id}`;
  const slug = existing?.slug || buildUniqueSlug(finalTitle, video.id, existing?.id);
  const now = new Date().toISOString();
  
  const thumbnailUrl = video.thumbnailUrl || video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '';
  const durationFormatted = video.durationFormatted || '0:00';
  const durationSeconds = Number(video.durationSeconds || 0);
  const views = Number(video.views || video.statistics?.viewCount || 0);
  const likes = Number(video.likes || video.statistics?.likeCount || 0);
  const comments = Number(video.comments || video.statistics?.commentCount || 0);
  const publishedAt = video.publishedDate || video.snippet?.publishedAt || now;

  // Infer release type from title if not already set
  const lowerTitle = liveTitle.toLowerCase();
  let releaseType = existing?.releaseType || 'studio-release';
  if (lowerTitle.includes('teaser') || lowerTitle.includes('official teaser')) {
    releaseType = 'teaser';
  } else if (lowerTitle.includes('promo')) {
    releaseType = 'promo';
  } else if (lowerTitle.includes('trailer')) {
    releaseType = 'trailer';
  }

  const youtubeStats = {
    viewCount: views,
    likeCount: likes,
    commentCount: comments,
    duration: durationFormatted,
    durationSeconds: durationSeconds,
    publishedAt: publishedAt,
    thumbnailUrl: thumbnailUrl,
    title: liveTitle,
    liveBroadcastContent: video.liveBroadcastContent || video.snippet?.liveBroadcastContent || 'none',
  };

  return {
    ...(existing || {}),
    youtubeCategory: video.categoryId ? { id: video.categoryId, name: video.categoryName } : existing?.youtubeCategory,
    youtubeLicense: video.license ?? existing?.youtubeLicense,
    privacyStatus: video.privacyStatus ?? existing?.privacyStatus,
    embeddable: video.embeddable ?? existing?.embeddable,
    regionRestriction: video.regionRestriction ?? existing?.regionRestriction,
    licensedContent: video.licensedContent ?? existing?.licensedContent,
    recordingDate: existing?.recordingDate || video.recordingDate,
    recordingLocation: existing?.recordingLocation,
    releaseDate: existing?.releaseDate || (publishedAt ? publishedAt.slice(0, 10) : undefined),
    publishedAt: existing?.publishedAt || publishedAt,
    defaultAudioLanguage: video.defaultAudioLanguage ?? existing?.defaultAudioLanguage,
    
    youtubeCaptionTracks: (() => {
      const tracks = { ...(existing?.youtubeCaptionTracks || {}) };
      if (video.captionTracks) {
        for (const track of video.captionTracks) {
          const lang = track.language || 'unknown';
          tracks[lang] = {
            ...(tracks[lang] || {}),
            captionId: track.id,
            language: track.language,
            captionCertification: {
              ...(tracks[lang]?.captionCertification || {}),
              youtubeStatus: track.status,
              youtubeTrackKind: track.trackKind,
              sufipulseStatus: tracks[lang]?.captionCertification?.sufipulseStatus || 'unreviewed'
            }
          };
        }
      }
      return tracks;
    })(),
    id,
    slug,
    youtubeId: video.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
    
    // Title Governance
    titleOverride,
    titleOverrideAt: existing?.titleOverrideAt || null,
    titleOverrideBy: existing?.titleOverrideBy || null,
      descriptionOverride,
      descriptionOverrideAt: existing?.descriptionOverrideAt || null,
      descriptionOverrideBy: existing?.descriptionOverrideBy || null,
    title: finalTitle,
    canonicalTitle: finalCanonicalTitle,
    canonicalStatus: existing?.canonicalStatus || 'verified',
    governanceOrigin: existing?.governanceOrigin || 'native_governed',
    youtubeTitleVariantA: existing?.youtubeTitleVariantA,
    youtubeTitleVariantB: existing?.youtubeTitleVariantB,
    youtubeTitleVariantC: existing?.youtubeTitleVariantC,
    youtubeWinningVariant: existing?.youtubeWinningVariant,
    youtubeTitleLastSyncedAt: now,
    thumbnailUrl: existing?.canonicalThumbnail || existing?.thumbnailUrl || thumbnailUrl,
    canonicalThumbnail: existing?.canonicalThumbnail || existing?.thumbnailUrl || thumbnailUrl,
    
    // YouTube distribution packaging
    youtubeTitle: liveTitle,
    youtubeThumbnailUrl: thumbnailUrl,
    youtubeDescription: liveDescription,
    
    metadataStatus: titleOverride ? 'overridden' : 'synced',
    description: finalDescriptionText,
    
    viewCount: youtubeStats.viewCount,
    likeCount: youtubeStats.likeCount,
    durationSeconds: youtubeStats.durationSeconds,
    durationFormatted: youtubeStats.duration,
    
    youtubeStats,
    lastYoutubeSyncAt: now,

    status: existing?.status || 'published',
    visibility: existing?.visibility || 'public',
    source: existing?.source || 'youtube',
    releaseType,
    format: existing?.format || (video.youtubeContentType === 'SHORTS' ? 'short' : video.youtubeContentType === 'LIVE_STREAM' ? 'live' : 'video'),
    formatClassificationSource: existing?.formatClassificationSource || video.formatClassificationSource || 'inferred',
    
    availableLanguages: existing?.availableLanguages || ['en', 'ur'],
    defaultLanguage: existing?.defaultLanguage || 'en',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    
    enableLyrics: existing?.enableLyrics || false,
    enableCommentary: existing?.enableCommentary !== false,
    enableSponsors: !!existing?.enableSponsors,
    enableAdoption: existing?.enableAdoption !== false,
    enableCredits: existing?.enableCredits !== false,
    distribution: existing?.distribution || getDefaultDistribution(),

    targetRegions: existing?.targetRegions,
    targetDiaspora: existing?.targetDiaspora,
    targetLanguages: existing?.targetLanguages,
    sufiConcepts: existing?.sufiConcepts,
    themes: existing?.themes,
    moods: existing?.moods,
    seoKeywords: existing?.seoKeywords,
    relatedReleases: existing?.relatedReleases,
    relatedPlaylists: existing?.relatedPlaylists,
    intelligenceStatus: existing?.intelligenceStatus,
    intelligenceUpdatedAt: existing?.intelligenceUpdatedAt,
  } as CMSRelease;
};

export const mapPlaylistToRelease = (playlist: any, existing?: CMSRelease | null): CMSRelease => {
    const slug = existing?.slug || slugify(playlist.title);
    const id = existing?.id || `playlist_${Date.now()}_${playlist.id}`;
    const now = new Date().toISOString();

    return {
        ...(existing || {}),
        id,
        title: existing?.title || playlist.title,
        slug,
        youtubeId: '',
        youtubePlaylistId: playlist.id,
        youtubeUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
        thumbnailUrl: existing?.thumbnailUrl || playlist.thumbnailUrl,
        description: existing?.description || playlist.description || '',
        releaseDate: (playlist.publishedDate || now).slice(0, 10),
        durationSeconds: 0,
        durationFormatted: '—',
        viewCount: existing?.viewCount || 0,
        likeCount: existing?.likeCount || 0,
        status: existing?.status || 'published',
        format: 'playlist',
        availableLanguages: existing?.availableLanguages || ['en', 'ur'],
        defaultLanguage: existing?.defaultLanguage || 'en',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        enableLyrics: existing?.enableLyrics || false,
        enableCommentary: existing?.enableCommentary !== false,
        enableSponsors: !!existing?.enableSponsors,
        enableAdoption: existing?.enableAdoption !== false,
        enableCredits: existing?.enableCredits !== false,
        distribution: existing?.distribution || getDefaultDistribution(),

        // Release Intelligence fields protected from YouTube Sync overwrites
        targetRegions: existing?.targetRegions,
        targetDiaspora: existing?.targetDiaspora,
        targetLanguages: existing?.targetLanguages,
        sufiConcepts: existing?.sufiConcepts,
        themes: existing?.themes,
        moods: existing?.moods,
        seoKeywords: existing?.seoKeywords,
        relatedReleases: existing?.relatedReleases,
        relatedPlaylists: existing?.relatedPlaylists,
        intelligenceStatus: existing?.intelligenceStatus,
        intelligenceUpdatedAt: existing?.intelligenceUpdatedAt,
    } as CMSRelease;
};
