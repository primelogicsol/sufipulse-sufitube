import 'server-only';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { type CMSRelease } from '@/lib/cms-storage';

export function resolveRelease(input: string): CMSRelease | null {
  if (!input) {
    return null;
  }

  // 1. Direct ID match
  let release = cmsServerStorage.getRelease(input);
  if (release) return release;

  // 2. Slug match
  release = cmsServerStorage.getReleaseBySlug(input);
  if (release) return release;

  // 3. YouTube ID match
  release = cmsServerStorage.getReleaseByYoutubeId(input);
  if (release) return release;

  // 4. Fallback for legacy IDs (e.g., release_..._YOUTUBEID)
  const allReleases = cmsServerStorage.getAllReleases();
  release = allReleases.find(r => r.id.endsWith(`_${input}`)) || null;
  if (release) return release;

  // Add more checks here if needed for _id, videoId etc.

  return null;
}
