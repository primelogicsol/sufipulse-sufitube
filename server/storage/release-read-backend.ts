import { PostgresReleaseRepository } from '../db/release-repository';
import { cmsServerStorage } from '../../lib/cms-storage-server';

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

function filterFilesystemReleases(input: any) {
  let releases = cmsServerStorage.getAllReleases();

  if (input?.status) releases = releases.filter((r: any) => r.status === input.status);
  if (input?.type) releases = releases.filter((r: any) => r.releaseType === input.type);
  if (input?.format) releases = releases.filter((r: any) => r.format === input.format);
  if (input?.governance) {
    releases = releases.filter((r: any) => (r.governanceOrigin || r.govType) === input.governance);
  }
  if (input?.requirePublicEligibility) {
    releases = releases.filter((r: any) => r.status === 'published' && r.visibility === 'public');
  }
  if (input?.q) {
    const q = String(input.q).trim().toLowerCase();
    releases = releases.filter((r: any) => [
      r.canonicalTitle,
      r.title,
      r.youtubeTitle,
      r.description,
      r.youtubeId,
      r.slug,
      typeof r.writer === 'string' ? r.writer : r.writer?.name,
      typeof r.vocalist === 'string' ? r.vocalist : r.vocalist?.name,
      Array.isArray(r.tags) ? r.tags.join(' ') : '',
    ].filter(Boolean).join(' ').toLowerCase().includes(q));
  }
  if (input?.year) {
    const year = Number(input.year);
    releases = releases.filter((r: any) => {
      const d = new Date(r.releaseDate || r.publishedAt || r.createdAt || 0);
      return !Number.isNaN(d.getTime()) && d.getFullYear() === year;
    });
  }

  const sort = input?.sort || 'newest';
  releases.sort((a: any, b: any) => {
    const ta = new Date(a.releaseDate || a.publishedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.releaseDate || b.publishedAt || b.createdAt || 0).getTime();
    return sort === 'oldest' ? ta - tb : tb - ta;
  });

  return releases;
}

const filesystemStore: ReleaseReadStore = {
  async getById(id: string) {
    return cmsServerStorage.getRelease(id);
  },
  async getBySlug(slug: string) {
    return cmsServerStorage.getReleaseBySlug(slug);
  },
  async getByYoutubeId(youtubeId: string) {
    return cmsServerStorage.getReleaseByYoutubeId(youtubeId);
  },
  async query(input: any) {
    const releases = filterFilesystemReleases(input);
    const count = releases.length;
    const page = Math.max(1, Number(input?.page) || 1);
    const pageSize = Math.max(1, Number(input?.pageSize) || 12);
    const offset = Number.isFinite(Number(input?.offset)) ? Number(input.offset) : (page - 1) * pageSize;
    const paginate = input?.paginate !== false;
    const items = paginate ? releases.slice(offset, offset + pageSize) : releases;

    return {
      items,
      count,
      page,
      pageSize,
      totalPages: paginate ? Math.max(1, Math.ceil(count / pageSize)) : 1,
      facets: { years: [] },
    };
  },
};

const postgresRepository = new PostgresReleaseRepository();

// Direct lookups are hybrid by design. The server CMS file is the canonical
// mutation target used by the admin interface and YouTube ingestion. If a
// Postgres replica is enabled but lags or is incomplete, public metadata must
// still resolve from canonical CMS instead of returning a false 404.
const postgresHybridStore: ReleaseReadStore = {
  async getById(id: string) {
    return (await postgresRepository.getById(id)) || cmsServerStorage.getRelease(id);
  },
  async getBySlug(slug: string) {
    return (await postgresRepository.getBySlug(slug)) || cmsServerStorage.getReleaseBySlug(slug);
  },
  async getByYoutubeId(youtubeId: string) {
    return (await postgresRepository.getByYoutubeId(youtubeId)) || cmsServerStorage.getReleaseByYoutubeId(youtubeId);
  },
  async query(input: any) {
    return postgresRepository.query(input);
  },
};

export function getReleaseReadStore(): ReleaseReadStore {
  const backend = getReleaseStorageBackend();
  return backend === 'postgres' ? postgresHybridStore : filesystemStore;
}
