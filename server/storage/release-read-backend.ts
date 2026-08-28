import { PostgresReleaseRepository } from '../db/release-repository';
import { cmsStorage } from '../../lib/cms-storage';

export type ReleaseStorageBackend = 'filesystem' | 'postgres';

export function getReleaseStorageBackend(): ReleaseStorageBackend {
  const value = process.env.RELEASE_STORAGE_BACKEND?.trim();

  if (!value || value === 'filesystem') {
    return 'filesystem';
  }

  if (value === 'postgres') {
    return 'postgres';
  }

  throw new Error(`Invalid RELEASE_STORAGE_BACKEND: ${value}`);
}

export interface ReleaseReadStore {
  getById(id: string): Promise<any | null>;
  getBySlug(slug: string): Promise<any | null>;
  getByYoutubeId(youtubeId: string): Promise<any | null>;
  query(input: any): Promise<any>;
}

// Ensure cmsStorage conforms to ReleaseReadStore adapter
const filesystemStore: ReleaseReadStore = {
  async getById(id: string) {
    return cmsStorage.getRelease(id);
  },
  async getBySlug(slug: string) {
    return cmsStorage.getReleaseBySlug(slug);
  },
  async getByYoutubeId(youtubeId: string) {
    const releases = cmsStorage.getPublishedReleases();
    return releases.find(r => r.youtubeId === youtubeId) || null;
  },
  async query(input: any) {
    // We'll handle filesystem query manually in the route since the API requires filtering.
    // Or we can adapt here? It's better to adapt in route.ts because cmsStorage.getPublishedReleases() 
    // is currently filtered inside route.ts for the filesystem.
    throw new Error("query() shouldn't be called directly on filesystem adapter; route.ts handles its own filesystem query logic.");
  }
};

const postgresStore: ReleaseReadStore = new PostgresReleaseRepository();

export function getReleaseReadStore(): ReleaseReadStore {
  const backend = getReleaseStorageBackend();
  return backend === 'postgres' ? postgresStore : filesystemStore;
}
