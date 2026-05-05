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
    new Date().toISOString()
  );
}

export function sortReleases(releases: any[], sortOrder: string = 'all') {
  const sorted = [...releases];
  
  if (sortOrder === 'new' || sortOrder === 'all') {
    sorted.sort((a, b) => {
      const dateA = new Date(getBestReleaseDate(a)).getTime();
      const dateB = new Date(getBestReleaseDate(b)).getTime();
      return dateB - dateA;
    });
  } else if (sortOrder === 'old') {
    sorted.sort((a, b) => {
      const dateA = new Date(getBestReleaseDate(a)).getTime();
      const dateB = new Date(getBestReleaseDate(b)).getTime();
      return dateA - dateB;
    });
  } else if (sortOrder === 'popular') {
    sorted.sort((a, b) => {
      const viewsA = a.views ?? a.viewCount ?? a.view_count ?? 0;
      const viewsB = b.views ?? b.viewCount ?? b.view_count ?? 0;
      return viewsB - viewsA;
    });
  }
  
  return sorted;
}
