import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cmsStorage, type CMSRelease } from '@/lib/cms-storage';
import { getBestReleaseDate } from './release-utils';

/**
 * Robust Data Directory Resolution
 * We MUST use the absolute path /app/.data in production (Docker)
 * to ensure data is written to the persistent volume.
 */
const resolveDataDir = () => {
  // 1. Environment variable override
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  
  // 2. Explicit Docker persistent volume path (Highest priority in production)
  // We check /app/.data which is where the volume is mounted in docker-compose.yml
  if (fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  
  // 3. Fallback to local root
  return path.join(process.cwd(), '.data');
};

const SERVER_DATA_DIR = resolveDataDir();
const SERVER_DATA_FILE = path.join(SERVER_DATA_DIR, 'cms-releases.json');
const REQUESTS_DATA_FILE = path.join(SERVER_DATA_DIR, 'lyrics-requests.json');
const SEED_FILE = path.join(process.cwd(), 'lib', 'cms-seed-releases.json');

console.log(`[CMS-SERVER] Data Directory: ${SERVER_DATA_DIR}`);
console.log(`[CMS-SERVER] Data File: ${SERVER_DATA_FILE}`);

let hydrated = false;
let lastHydratedMtime = 0;

const ensureHydrated = (force = false) => {
  let currentMtime = 0;
  try {
    if (fs.existsSync(SERVER_DATA_FILE)) {
      currentMtime = fs.statSync(SERVER_DATA_FILE).mtimeMs;
    }
  } catch (e: any) {}

  const needsRehydration = force || !hydrated || (currentMtime > lastHydratedMtime);

  if (!needsRehydration) return;

  console.log(`[CMS-SERVER] Re-hydrating from disk... (Force: ${force}, File Mtime: ${currentMtime})`);
  try {
    if (fs.existsSync(SERVER_DATA_FILE)) {
      const raw = fs.readFileSync(SERVER_DATA_FILE, 'utf8');
      const releases = JSON.parse(raw || '[]');
      cmsStorage.clearAll();
      cmsStorage.importReleases(releases);
      console.log(`[CMS-SERVER] Hydrated ${releases.length} releases.`);
    } else {
      console.warn(`[CMS-SERVER] Data file not found, seeking seed...`);
      if (fs.existsSync(SEED_FILE)) {
        const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8') || '[]');
        cmsStorage.importReleases(seed);
        persist();
      }
    }

    if (fs.existsSync(REQUESTS_DATA_FILE)) {
      const requests = JSON.parse(fs.readFileSync(REQUESTS_DATA_FILE, 'utf8') || '[]');
      cmsStorage.importLyricsRequests(requests);
    }

    hydrated = true;
    lastHydratedMtime = currentMtime;
  } catch (error: any) {
    console.error('[CMS-SERVER] Hydration Error:', error.message);
    hydrated = true; // Prevent loops
  }
};

const persist = () => {
  try {
    if (!fs.existsSync(SERVER_DATA_DIR)) {
      fs.mkdirSync(SERVER_DATA_DIR, { recursive: true });
    }
    const data = cmsStorage.exportReleases();
    const reqData = cmsStorage.exportLyricsRequests();
    
    fs.writeFileSync(SERVER_DATA_FILE, JSON.stringify(data, null, 2));
    fs.writeFileSync(REQUESTS_DATA_FILE, JSON.stringify(reqData, null, 2));
    
    // Update mtime tracker immediately to avoid redundant re-hydration in this process
    lastHydratedMtime = fs.statSync(SERVER_DATA_FILE).mtimeMs;
    console.log(`[CMS-SERVER] Persisted ${data.length} releases to ${SERVER_DATA_FILE}`);
  } catch (error: any) {
    console.error('[CMS-SERVER] Persistence Error:', error.message);
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
