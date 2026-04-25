/**
 * server/db/repositories/releases.ts
 *
 * Release data access — delegates to the server-side CMS storage
 * which persists to .data/cms-releases.json.
 *
 * If you add a SQL backend, swap the implementation here;
 * callers don't need to change.
 */

import { cmsServerStorage } from '@/lib/cms-storage-server';
import type { CMSRelease } from '@/lib/cms-storage';

export const releasesRepository = {
  findById: (id: string) => cmsServerStorage.getRelease(id),
  findBySlug: (slug: string) => cmsServerStorage.getReleaseBySlug(slug),
  findByYoutubeId: (youtubeId: string) => cmsServerStorage.getReleaseByYoutubeId(youtubeId),

  listAll: (filter?: { status?: string }) => cmsServerStorage.getAllReleases(filter),
  listPublished: (limit?: number) => cmsServerStorage.getPublishedReleases(limit),

  save: (release: CMSRelease) => cmsServerStorage.saveRelease(release),
  delete: (id: string) => cmsServerStorage.deleteRelease(id),
};
