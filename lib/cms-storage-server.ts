import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cmsStorage, type CMSRelease } from '@/lib/cms-storage';
import { getBestReleaseDate } from './release-utils';

/**
 * Robust Data Directory Resolution
 * 1. Use process.env.DATA_DIR if provided
 * 2. In standalone mode, use /app/.data if it exists
 * 3. Default to process.cwd()/.data
 */
const resolveDataDir = () => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  
  // Docker standard path
  if (fs.existsSync('/app/.data')) return '/app/.data';
  
  // Fallback to local root
  return path.join(process.cwd(), '.data');
};

const SERVER_DATA_DIR = resolveDataDir();
const SERVER_DATA_FILE = path.join(SERVER_DATA_DIR, 'cms-releases.json');
const REQUESTS_DATA_FILE = path.join(SERVER_DATA_DIR, 'lyrics-requests.json');
const SEED_FILE = path.join(process.cwd(), 'lib', 'cms-seed-releases.json');

console.log(`[cms-storage-server] Initialized with SERVER_DATA_DIR: ${SERVER_DATA_DIR}`);

let hydrated = false;
let lastHydratedMtime = 0;

const ensureHydrated = (force = false) => {
  console.log(`[cms-storage-server] ensureHydrated(force=${force}) started. hydrated=${hydrated}`);
  let currentMtime = 0;
  try {
    if (fs.existsSync(SERVER_DATA_FILE)) {
      currentMtime = fs.statSync(SERVER_DATA_FILE).mtimeMs;
    }
  } catch (e: any) {
    console.warn(`[cms-storage-server] Failed to stat ${SERVER_DATA_FILE}:`, e.message);
  }

  const needsRehydration = force || !hydrated || (currentMtime > lastHydratedMtime);

  if (!needsRehydration) {
    console.log(`[cms-storage-server] No rehydration needed.`);
    return;
  }

  console.log(`[cms-storage-server] ${force ? 'FORCING' : 'Triggering'} re-hydration from disk... (File Mtime: ${currentMtime}, Last: ${lastHydratedMtime})`);
  try {
    if (fs.existsSync(SERVER_DATA_FILE)) {
      console.log(`[cms-storage-server] Reading ${SERVER_DATA_FILE}...`);
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
      } else {
        console.warn(`[cmsServerStorage] Seed file also NOT FOUND at ${SEED_FILE}`);
      }
    }

    if (fs.existsSync(REQUESTS_DATA_FILE)) {
      console.log(`[cms-storage-server] Reading ${REQUESTS_DATA_FILE}...`);
      const raw = fs.readFileSync(REQUESTS_DATA_FILE, 'utf8');
      const parsed = raw ? JSON.parse(raw) : [];
      const requests = Array.isArray(parsed) ? (parsed as any[]) : [];
      console.log(`[cmsServerStorage] Hydrating lyrics requests from ${REQUESTS_DATA_FILE}: ${requests.length} records found.`);
      cmsStorage.importLyricsRequests(requests);
    }

    hydrated = true;
    lastHydratedMtime = currentMtime;
    console.log(`[cms-storage-server] Hydration successful.`);
  } catch (error: any) {
    console.error('[cms-storage-server] FATAL hydration error:', error);
    // Mark as hydrated anyway to prevent infinite retry loops
    hydrated = true;
  }
};


const persist = () => {
  console.log(`[cms-storage-server] persist() started.`);
  const data = cmsStorage.exportReleases();
  const reqData = cmsStorage.exportLyricsRequests();
  
  try {
    if (!fs.existsSync(SERVER_DATA_DIR)) {
      console.log(`[cms-storage-server] Creating directory ${SERVER_DATA_DIR}...`);
      fs.mkdirSync(SERVER_DATA_DIR, { recursive: true });
    }
    console.log(`[cms-storage-server] Writing to ${SERVER_DATA_FILE}...`);
    fs.writeFileSync(SERVER_DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`[cms-storage-server] Writing to ${REQUESTS_DATA_FILE}...`);
    fs.writeFileSync(REQUESTS_DATA_FILE, JSON.stringify(reqData, null, 2));
    console.log(`[cms-storage-server] Persistence successful.`);
  } catch (error: any) {
    console.error('[cms-storage-server] FATAL persistence error:', error);
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

  bulkSaveReleases(releases: CMSRelease[]): CMSRelease[] {
    ensureHydrated();
    const saved: CMSRelease[] = [];
    for (const r of releases) {
      saved.push(cmsStorage.saveRelease(r));
    }
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
