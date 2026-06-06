export function getEntityRoute(entityType: string, slug: string): string {
  const map: Record<string, string> = {
    'saint': 'saints',
    'poet': 'poets',
    'artist': 'singers', // Mapping artist to singers as per UI guidelines
    'tradition': 'traditions',
    'concept': 'concepts',
    'release': 'releases',
    'publication': 'publications',
    'song': 'songs',
    'album': 'albums'
  };
  
  const mappedType = map[entityType] || `${entityType}s`;
  return `/discovery/${mappedType}/${slug}`;
}

export function getEntityLabel(entityType: string): string {
  const map: Record<string, string> = {
    'saint': 'Saint',
    'poet': 'Poet',
    'artist': 'Singer',
    'tradition': 'Tradition',
    'concept': 'Concept',
    'release': 'Release',
    'publication': 'Publication',
    'song': 'Song',
    'album': 'Album'
  };
  return map[entityType] || entityType;
}
