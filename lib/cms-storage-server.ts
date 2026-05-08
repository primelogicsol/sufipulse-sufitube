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
let lastHydratedMtime = 0;

const ensureHydrated = (force = false) => {
  let currentMtime = 0;
  try {
    if (fs.existsSync(SERVER_DATA_FILE)) {
      currentMtime = fs.statSync(SERVER_DATA_FILE).mtimeMs;
    }
  } catch (e) {}

  const needsRehydration = force || !hydrated || (currentMtime > lastHydratedMtime);

  if (!needsRehydration) {
    return;
  }

  console.log(`[cms-storage-server] ${force ? 'FORCING' : 'Triggering'} re-hydration from disk... (File Mtime: ${currentMtime}, Last: ${lastHydratedMtime})`);
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
    lastHydratedMtime = currentMtime;
    } catch (error) {
    console.error('Failed to hydrate server CMS storage:', error);
    hydrated = true;
    }
    };


const persist = () => {
  const data = cmsStorage.exportReleases();
  const reqData = cmsStorage.exportLyricsRequests();
  
  try {
    if (!fs.existsSync(SERVER_DATA_DIR)) {
      fs.mkdirSync(SERVER_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SERVER_DATA_FILE, JSON.stringify(data, null, 2));
    fs.writeFileSync(REQUESTS_DATA_FILE, JSON.stringify(reqData, null, 2));
  } catch (error) {
    console.error('Failed to persist CMS data to disk:', error);
  }
};

export const cmsServerStorage = {
  forceHydrate(): void {
    ensureHydrated(true);
  },

  getRelease(id: string): CMSRelease | null {
    ensureHydrated();
    return cmsStorage.getRelease(id);
  },

  getReleaseBySlug(slug: string): CMSRelease | null {
    ensureHydrated();
    return cmsStorage.getReleaseBySlug(slug);
  },

  getReleaseByYoutubeId(youtubeId: string): CMSRelease | null {
    ensureHydrated();
    return cmsStorage.getReleaseByYoutubeId(youtubeId);
  },

  getAllReleases(filter?: { status?: string; category?: string }): CMSRelease[] {
    ensureHydrated();
    return cmsStorage.getAllReleases(filter);
  },

  getPublishedReleases(limit?: number): CMSRelease[] {
    ensureHydrated();
    return cmsStorage.getPublishedReleases(limit);
  },

  saveRelease(release: CMSRelease): CMSRelease {
    ensureHydrated();
    const saved = cmsStorage.saveRelease(release);
    persist();
    return saved;
  },

  deleteRelease(id: string): boolean {
    ensureHydrated();
    const deleted = cmsStorage.deleteRelease(id);
    if (deleted) persist();
    return deleted;
  },

  saveLyricsRequest(request: any) {
    ensureHydrated();
    const saved = cmsStorage.saveLyricsRequest(request);
    persist();
    return saved;
  },

  getAllLyricsRequests() {
    ensureHydrated();
    return cmsStorage.getAllLyricsRequests();
  }
};
