export function getEntityRoute(entityType: string, slug: string): string {
  const normalized = (entityType || '').trim().toLowerCase();
  const map: Record<string, string> = {
    saint: 'saints',
    poet: 'poets',
    artist: 'singers',
    singer: 'singers',
    tradition: 'traditions',
    order: 'orders',
    concept: 'concepts',
    release: 'releases',
    publication: 'publications',
    song: 'songs',
    album: 'albums',
  };

  const mappedType = map[normalized] || `${normalized}s`;
  return `/discovery/${mappedType}/${slug}`;
}

export function getEntityLabel(entityType: string): string {
  const normalized = (entityType || '').trim().toLowerCase();
  const map: Record<string, string> = {
    saint: 'Saint',
    poet: 'Poet',
    artist: 'Singer',
    singer: 'Singer',
    tradition: 'Tradition',
    order: 'Order',
    concept: 'Concept',
    release: 'Release',
    publication: 'Publication',
    song: 'Song',
    album: 'Album',
  };
  return map[normalized] || entityType;
}
