import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cmsStorage, type CMSRelease } from '@/lib/cms-storage';
import { getBestReleaseDate } from './release-utils';

const SERVER_DATA_DIR = path.join(process.cwd(), '.data');
const SERVER_DATA_FILE = path.join(SERVER_DATA_DIR, 'cms-releases.json');
const REQUESTS_DATA_FILE = path.join(SERVER_DATA_DIR, 'lyrics-requests.json');
const SEED_FILE = path.join(process.cwd(), 'lib', 'cms-seed-releases.json');

let hydrated = false;

const ensureHydrated = () => {
  if (hydrated) return;

  try {
    if (fs.existsSync(SERVER_DATA_FILE)) {
      const raw = fs.readFileSync(SERVER_DATA_FILE, 'utf8');
      const parsed = raw ? JSON.parse(raw) : [];
      const releases = Array.isArray(parsed) ? (parsed as CMSRelease[]) : [];
      console.log(`[cmsServerStorage] Hydrating releases from ${SERVER_DATA_FILE}: ${releases.length} records found.`);
      cmsStorage.clearAll();
      if (releases.length > 0) {
        cmsStorage.importReleases(releases);
      }
    } else {
      console.warn(`[cmsServerStorage] Data file NOT FOUND at ${SERVER_DATA_FILE}`);
      if (fs.existsSync(SEED_FILE)) {
        console.log(`[cmsServerStorage] Seeding from ${SEED_FILE}`);
        const raw = fs.readFileSync(SEED_FILE, 'utf8');
        const seed = raw ? JSON.parse(raw) : [];
        const releases = Array.isArray(seed) ? (seed as CMSRelease[]) : [];
        if (releases.length > 0) {
          cmsStorage.clearAll();
          cmsStorage.importReleases(releases);
          persist();
        }
      }
    }

    if (fs.existsSync(REQUESTS_DATA_FILE)) {
      const raw = fs.readFileSync(REQUESTS_DATA_FILE, 'utf8');
      const parsed = raw ? JSON.parse(raw) : [];
      const requests = Array.isArray(parsed) ? (parsed as any[]) : [];
      console.log(`[cmsServerStorage] Hydrating lyrics requests from ${REQUESTS_DATA_FILE}: ${requests.length} records found.`);
      cmsStorage.importLyricsRequests(requests);
    }

    hydrated = true;
  } catch (error) {
    console.error('Failed to hydrate server CMS storage:', error);
    hydrated = true;
  }
};

const persist = () => {
  try {
    fs.mkdirSync(SERVER_DATA_DIR, { recursive: true });
    const releases = cmsStorage.exportReleases();
    fs.writeFileSync(SERVER_DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
    
    const requests = cmsStorage.exportLyricsRequests();
    fs.writeFileSync(REQUESTS_DATA_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to persist server CMS storage:', error);
  }
};

export const cmsServerStorage = {
  getRelease(id: string) {
    ensureHydrated();
    return cmsStorage.getRelease(id);
  },

  getReleaseBySlug(slug: string) {
    ensureHydrated();
    return cmsStorage.getReleaseBySlug(slug);
  },

  getReleaseByYoutubeId(youtubeId: string) {
    ensureHydrated();
    return cmsStorage.getReleaseByYoutubeId(youtubeId);
  },

  getAllReleases(filter?: { status?: string; category?: string }) {
    ensureHydrated();
    return cmsStorage.getAllReleases(filter);
  },

  getPublishedReleases(limit?: number) {
    ensureHydrated();
    return cmsStorage.getPublicReleases(limit);
  },

  getPublicReleases(limit?: number) {
    ensureHydrated();
    return cmsStorage.getPublicReleases(limit);
  },

  getRankedReleases(limit?: number) {
    ensureHydrated();
    const releases = cmsStorage.getPublicReleases();
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 3_600_000;
    const scored = releases.map((r) => {
      const ageMs = now - new Date(getBestReleaseDate(r)).getTime();
      const recency = Math.max(0, 1 - ageMs / thirtyDaysMs);
      const score = (r.viewCount || 0) * 0.5 + (r.likeCount || 0) * 0.3 + recency * 100 * 0.2;
      return { release: r, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const ranked = scored.map((s) => s.release);
    return limit ? ranked.slice(0, limit) : ranked;
  },

  saveRelease(release: CMSRelease) {
    ensureHydrated();
    const saved = cmsStorage.saveRelease(release);
    persist();
    return saved;
  },

  deleteRelease(id: string) {
    ensureHydrated();
    const deleted = cmsStorage.deleteRelease(id);
    if (deleted) {
      persist();
    }
    return deleted;
  },

  saveLyricsRequest(request: any) {
    ensureHydrated();
    const saved = cmsStorage.saveLyricsRequest(request);
    persist();
    return saved;
  },

  getLyricsRequest(id: string) {
    ensureHydrated();
    return cmsStorage.getLyricsRequest(id);
  },

  getAllLyricsRequests() {
    ensureHydrated();
    return cmsStorage.getAllLyricsRequests();
  },

  deleteLyricsRequest(id: string) {
    ensureHydrated();
    const deleted = cmsStorage.deleteLyricsRequest(id);
    if (deleted) {
      persist();
    }
    return deleted;
  },
};
