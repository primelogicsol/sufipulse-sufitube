/**
 * Shared Release Utilities & Metadata Authority Framework
 */

export function getBestReleaseDate(r: any): string {
  return (
    r.publishedAt || 
    r.published_at || 
    r.releaseDate || 
    r.release_date || 
    r.createdAt || 
    r.created_at || 
    r.updatedAt || 
    r.updated_at ||
    r.youtubeStats?.publishedAt ||
    r.youtubePublishedAt || 
    new Date().toISOString()
  );
}

const getReleaseDateMs = (r: any): number => {
  const raw = getBestReleaseDate(r);
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

export function sortReleases(releases: any[], sortOrder: string = 'all') {
  const sorted = [...releases];

  if (sortOrder === 'updated') {
    sorted.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } else if (sortOrder === 'new' || sortOrder === 'newest' || sortOrder === 'all') {
    sorted.sort((a, b) => getReleaseDateMs(b) - getReleaseDateMs(a));
  } else if (sortOrder === 'old' || sortOrder === 'oldest') {
    sorted.sort((a, b) => getReleaseDateMs(a) - getReleaseDateMs(b));
  } else if (sortOrder === 'popular') {
    sorted.sort((a, b) => {
      const viewsA = a.youtubeStats?.viewCount ?? a.views ?? a.viewCount ?? a.view_count ?? 0;
      const viewsB = b.youtubeStats?.viewCount ?? b.views ?? b.viewCount ?? b.view_count ?? 0;
      return viewsB - viewsA;
    });
  }

  return sorted;
}

/**
 * Strips promotional channel branding suffixes/prefixes while preserving
 * the authentic devotional, artistic, and thematic name of the release.
 */
export function cleanDisplayTitle(rawTitle: string): string {
  if (!rawTitle) return 'Untitled Release';
  
  let title = rawTitle.trim();

  // Strip leading channel identifiers (e.g. "SufiPulse Studio I", "SufiPusle Studio I")
  title = title.replace(/^SufiPu?lse\s+Studio\s+[I|—|-]\s*/i, '');
  
  // Strip trailing channel markers (e.g. "| SufiPulse USA", "| SufiPulse", "I SufiPulse USA")
  title = title.replace(/[\s|I—–-]+\s*SufiPu?lse\s*(USA)?\s*$/i, '');
  
  // Clean trailing pipes or hyphens left over
  title = title.replace(/[\s|I—–-]+$/, '').trim();

  return title || rawTitle;
}

/**
 * Returns the stable canonical title from the SufiPulse Registry
 */
export function getCanonicalTitle(release: any): string {
  if (!release) return 'Untitled Release';
  return release.canonicalTitle || release.title || 'Untitled Release';
}

/**
 * Returns the current YouTube packaging title recorded from YouTube sync
 */
export function getYoutubeTitle(release: any): string {
  if (!release) return '';
  return release.youtubeTitle || release.youtubeStats?.title || release.title || '';
}

/**
 * Compares Registry vs YouTube packaging to detect metadata drift
 */
export function checkMetadataDrift(release: any): {
  hasTitleDrift: boolean;
  hasThumbnailDrift: boolean;
  canonicalTitle: string;
  youtubeTitle: string;
} {
  const canonicalTitle = getCanonicalTitle(release);
  const youtubeTitle = getYoutubeTitle(release);
  const canonicalThumb = release.canonicalThumbnail || release.thumbnailUrl || '';
  const youtubeThumb = release.youtubeThumbnailUrl || release.youtubeStats?.thumbnailUrl || '';

  const hasTitleDrift = Boolean(
    youtubeTitle && 
    canonicalTitle && 
    youtubeTitle.trim().toLowerCase() !== canonicalTitle.trim().toLowerCase()
  );

  const hasThumbnailDrift = Boolean(
    youtubeThumb && 
    canonicalThumb && 
    youtubeThumb !== canonicalThumb
  );

  return {
    hasTitleDrift,
    hasThumbnailDrift,
    canonicalTitle,
    youtubeTitle,
  };
}
