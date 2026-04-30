import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cmsStorage, type CMSRelease } from '@/lib/cms-storage';

const SERVER_DATA_DIR = path.join(process.cwd(), '.data');
const SERVER_DATA_FILE = path.join(SERVER_DATA_DIR, 'cms-releases.json');
const SEED_FILE = path.join(process.cwd(), 'lib', 'cms-seed-releases.json');

let hydrated = false;

const ensureHydrated = () => {
  if (hydrated) return;

  try {
    if (!fs.existsSync(SERVER_DATA_FILE)) {
      // First run: seed from bundled release data if available
      if (fs.existsSync(SEED_FILE)) {
        const raw = fs.readFileSync(SEED_FILE, 'utf8');
        const seed = raw ? JSON.parse(raw) : [];
        const releases = Array.isArray(seed) ? (seed as CMSRelease[]) : [];
        if (releases.length > 0) {
          cmsStorage.clearAll();
          cmsStorage.importReleases(releases);
          persist(); // write to volume so future restarts use the file
          console.log(`[cms] Seeded ${releases.length} releases from bundled data`);
        }
      }
      hydrated = true;
      return;
    }

    const raw = fs.readFileSync(SERVER_DATA_FILE, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];
    const releases = Array.isArray(parsed) ? (parsed as CMSRelease[]) : [];

    cmsStorage.clearAll();
    if (releases.length > 0) {
      cmsStorage.importReleases(releases);
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
    return cmsStorage.getPublishedReleases(limit);
  },

  getRankedReleases(limit?: number) {
    ensureHydrated();
    const releases = cmsStorage.getPublishedReleases();
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 3_600_000;
    const scored = releases.map((r) => {
      const ageMs = now - new Date(r.releaseDate || r.createdAt || now).getTime();
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
};
