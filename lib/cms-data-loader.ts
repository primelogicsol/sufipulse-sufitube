import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { type CMSRelease } from '@/lib/cms-storage';

const SERVER_DATA_DIR = path.join(process.cwd(), '.data');
const RELEASES_FILE = path.join(SERVER_DATA_DIR, 'cms-releases.json');

let releasesCache: CMSRelease[] | null = null;

function readReleasesFromFile(): CMSRelease[] {
  if (releasesCache) {
    return releasesCache;
  }
  try {
    if (fs.existsSync(RELEASES_FILE)) {
      const fileContent = fs.readFileSync(RELEASES_FILE, 'utf-8');
      releasesCache = JSON.parse(fileContent) as CMSRelease[];
      return releasesCache || [];
    }
  } catch (error) {
    console.error('Error reading or parsing cms-releases.json:', error);
  }
  return [];
}

export function getReleaseBySlug(slug: string): CMSRelease | null {
  const releases = readReleasesFromFile();
  const release = releases.find((r) => r.slug === slug);
  return release || null;
}
