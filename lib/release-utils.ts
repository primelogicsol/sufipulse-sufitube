/**
 * Shared Release Utilities
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

