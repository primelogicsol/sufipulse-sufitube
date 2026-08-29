const fs = require('fs');
const file = 'lib/release-mapping.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /export const mapVideoToRelease = \(video: any, existing\?: CMSRelease \| null, resolution\?: 'youtube' \| 'cms'\): CMSRelease => \{[\s\S]*?return \{[\s\S]*?\} as CMSRelease;\s*\};/g;

const newFunction = `export const mapVideoToRelease = (video: any, existing?: CMSRelease | null, resolution?: 'youtube' | 'cms'): CMSRelease => {
  const liveTitle = video.title || video.snippet?.title || '';
  const liveDescription = video.description || video.snippet?.description || '';
  
  let titleSource: 'youtube' | 'admin' = existing?.titleSource || 'youtube';
  
  // If resolution is used from the UI (legacy, or if they force 'youtube')
  if (resolution === 'youtube') titleSource = 'youtube';
  
  const finalTitle = titleSource === 'admin' ? (existing?.title || liveTitle) : liveTitle;
  const finalCanonicalTitle = titleSource === 'admin' ? (existing?.canonicalTitle || liveTitle) : liveTitle;
  const finalDescriptionText = titleSource === 'admin' ? (existing?.description || liveDescription) : liveDescription;

  const id = existing?.id || \`release_\${Date.now()}_\${video.id}\`;
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
    id,
    slug,
    youtubeId: video.id,
    youtubeUrl: \`https://www.youtube.com/watch?v=\${video.id}\`,
    
    // Title Governance
    titleSource,
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
    
    metadataStatus: titleSource === 'admin' ? 'overridden' : 'synced',
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
    format: existing?.format || (video.formatClassificationSource === 'youtube_shorts_surface' ? 'short' : video.liveBroadcastContent === 'none' ? 'video' : 'live'),
    formatClassificationSource: existing?.formatClassificationSource || video.formatClassificationSource || 'inferred',
    
    availableLanguages: existing?.availableLanguages || ['en', 'ur'],
    defaultLanguage: existing?.defaultLanguage || 'en',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    
    enableLyrics: false,
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
};`;

content = content.replace(regex, newFunction);
fs.writeFileSync(file, content);
