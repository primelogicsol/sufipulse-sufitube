import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cmsStorage, type CMSRelease } from '@/lib/cms-storage';
import { getBestReleaseDate } from './release-utils';
import { graphResolver } from './graph-resolver';

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
    let releasesToImport: CMSRelease[] = [];
    let sourceUsed = 'none';

    // 1. Read seed file if it exists (Repo Truth)
    let seedReleases: CMSRelease[] = [];
    if (fs.existsSync(SEED_FILE)) {
      try {
        const seedRaw = fs.readFileSync(SEED_FILE, 'utf8');
        seedReleases = JSON.parse(seedRaw || '[]');
      } catch (e) {
        console.error('[CMS-SERVER] Error reading seed file:', e);
      }
    }

    // 2. Read current data file (Persistent Truth)
    let diskReleases: CMSRelease[] = [];
    if (fs.existsSync(SERVER_DATA_FILE)) {
      try {
        const raw = fs.readFileSync(SERVER_DATA_FILE, 'utf8');
        diskReleases = JSON.parse(raw || '[]');
      } catch (e) {
        console.error('[CMS-SERVER] Error reading data file:', e);
      }
    }

    // 3. Logic: Prefer seed if it has more releases or if disk is empty
    // This allows repo-pushed data updates to "win" over stale persistent volumes
    if (seedReleases.length > diskReleases.length) {
      console.log(`[CMS-SERVER] Seed file has MORE releases (${seedReleases.length}) than disk (${diskReleases.length}). Using seed.`);
      releasesToImport = seedReleases;
      sourceUsed = 'seed';
    } else if (diskReleases.length > 0) {
      releasesToImport = diskReleases;
      sourceUsed = 'disk';
    } else if (seedReleases.length > 0) {
      releasesToImport = seedReleases;
      sourceUsed = 'seed';
    }

    if (releasesToImport.length > 0) {
      cmsStorage.clearAll();
      cmsStorage.importReleases(releasesToImport);
      console.log(`[CMS-SERVER] Hydrated ${releasesToImport.length} releases from ${sourceUsed}.`);
      
      // If we used the seed because it was better, persist it to disk now
      if (sourceUsed === 'seed') {
        persist();
      }
    } else {
      console.warn(`[CMS-SERVER] No releases found in either disk or seed.`);
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

let lastPersistenceError: string | null = null;

const persist = () => {
  try {
    if (!fs.existsSync(SERVER_DATA_DIR)) {
      fs.mkdirSync(SERVER_DATA_DIR, { recursive: true });
    }
    const data = cmsStorage.exportReleases();
    const reqData = cmsStorage.exportLyricsRequests();
    
    // Atomic write for releases
    const tempFile = `${SERVER_DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, SERVER_DATA_FILE);
    
    // Atomic write for requests
    const tempReqFile = `${REQUESTS_DATA_FILE}.tmp`;
    fs.writeFileSync(tempReqFile, JSON.stringify(reqData, null, 2));
    fs.renameSync(tempReqFile, REQUESTS_DATA_FILE);
    
    // Update mtime tracker immediately
    lastHydratedMtime = fs.statSync(SERVER_DATA_FILE).mtimeMs;
    lastPersistenceError = null;
    console.log(`[CMS-SERVER] Successfully persisted ${data.length} releases.`);
  } catch (error: any) {
    lastPersistenceError = error.message;
    console.error('[CMS-SERVER] Persistence FAILED:', error.message);
    throw error; // Throw so the API can report it
  }
};

export const cmsServerStorage = {
  getPersistenceError() {
    return lastPersistenceError;
  },
  // ... rest of methods
  getInfo() {
    return {
      dataDir: SERVER_DATA_DIR,
      dataFile: SERVER_DATA_FILE,
      requestsFile: REQUESTS_DATA_FILE,
      seedFile: SEED_FILE,
      cwd: process.cwd(),
      exists: fs.existsSync(SERVER_DATA_FILE),
      mtime: fs.existsSync(SERVER_DATA_FILE) ? fs.statSync(SERVER_DATA_FILE).mtimeMs : 0
    };
  },

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
    try {
      graphResolver.syncReleaseJoins(saved);
    } catch (e) {
      console.error('[CMS-SERVER] Failed to sync graph joins for release:', e);
    }
    persist();
    return saved;
  },

  bulkSaveReleases(releases: CMSRelease[]): CMSRelease[] {
    ensureHydrated();
    const saved: CMSRelease[] = [];
    for (const r of releases) {
      const s = cmsStorage.saveRelease(r);
      try {
        graphResolver.syncReleaseJoins(s);
      } catch (e) {
        console.error('[CMS-SERVER] Failed to sync graph joins for bulk release:', e);
      }
      saved.push(s);
    }
    persist();
    return saved;
  },

  deleteRelease(id: string): boolean {
    ensureHydrated();
    const deleted = cmsStorage.deleteRelease(id);
    if (deleted) {
      try {
        graphResolver.removeAllJoinsForRelease(id);
      } catch (e) {
        console.error('[CMS-SERVER] Failed to remove graph joins for deleted release:', e);
      }
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

  deleteLyricsRequest(id: string): boolean {
    ensureHydrated();
    const deleted = cmsStorage.deleteLyricsRequest(id);
    if (deleted) persist();
    return deleted;
  },

  getAllLyricsRequests() {
    ensureHydrated();
    return cmsStorage.getAllLyricsRequests();
  }
};
