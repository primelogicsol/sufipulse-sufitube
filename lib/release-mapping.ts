import { type CMSRelease } from './cms-storage';
import { cmsServerStorage } from './cms-storage-server';

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
  const fallback = `${base}-${youtubeId.toLowerCase()}`;

  const byBase = cmsServerStorage.getReleaseBySlug(base);
  if (!byBase || byBase.id === currentReleaseId) {
    return base;
  }

  const byFallback = cmsServerStorage.getReleaseBySlug(fallback);
  if (!byFallback || byFallback.id === currentReleaseId) {
    return fallback;
  }

  return `${fallback}-${Date.now()}`;
};

export const mapVideoToRelease = (video: any, existing?: CMSRelease | null): CMSRelease => {
  const id = existing?.id || `release_${Date.now()}_${video.id}`;
  const slug = existing?.slug || buildUniqueSlug(video.title || video.snippet?.title || 'Untitled', video.id, existing?.id);
  const now = new Date().toISOString();
  
  const title = video.title || video.snippet?.title || '';
  const thumbnailUrl = video.thumbnailUrl || video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '';
  const durationFormatted = video.durationFormatted || '0:00';
  const durationSeconds = Number(video.durationSeconds || 0);
  const views = Number(video.views || video.statistics?.viewCount || 0);
  const likes = Number(video.likes || video.statistics?.likeCount || 0);
  const comments = Number(video.comments || video.statistics?.commentCount || 0);
  const publishedAt = video.publishedDate || video.snippet?.publishedAt || now;

  const youtubeStats = {
    viewCount: views,
    likeCount: likes,
    commentCount: comments,
    duration: durationFormatted,
    durationSeconds: durationSeconds,
    publishedAt: publishedAt,
    thumbnailUrl: thumbnailUrl,
    title: title,
    liveBroadcastContent: video.liveBroadcastContent || video.snippet?.liveBroadcastContent || 'none',
  };

  return {
    ...(existing || {}),
    id,
    slug,
    youtubeId: video.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
    
    title: existing?.title || title,
    thumbnailUrl: existing?.thumbnailUrl || thumbnailUrl,
    description: existing?.description || video.description || video.snippet?.description || '',
    
    viewCount: youtubeStats.viewCount,
    likeCount: youtubeStats.likeCount,
    durationSeconds: youtubeStats.durationSeconds,
    durationFormatted: youtubeStats.duration,
    
    youtubeStats,
    lastYoutubeSyncAt: now,

    status: existing?.status || 'published',
    visibility: existing?.visibility || 'public',
    availableLanguages: existing?.availableLanguages || ['en', 'ur'],
    defaultLanguage: existing?.defaultLanguage || 'en',
    lyrics: existing?.lyrics || {},
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    format: existing?.format || video.format || 'video',
    
    // System preserves
    enableLyrics: existing?.enableLyrics !== false,
    enableCommentary: existing?.enableCommentary !== false,
    enableSponsors: !!existing?.enableSponsors,
    enableAdoption: existing?.enableAdoption !== false,
    enableCredits: existing?.enableCredits !== false,
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
        enableLyrics: false,
        enableCommentary: existing?.enableCommentary !== false,
        enableSponsors: !!existing?.enableSponsors,
        enableAdoption: existing?.enableAdoption !== false,
        enableCredits: existing?.enableCredits !== false,
    } as CMSRelease;
};
