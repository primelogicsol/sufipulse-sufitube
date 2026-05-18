// app/lib/server/google-ads-draft-store.ts
import { promises as fs } from 'fs';
import path from 'path';

export type GoogleAdsDraft = {
  adoptionId: string;
  budget?: number;
  regions?: string[];
  languages?: string[];
  sponsorNotes?: string;
  targetCustomerId?: string;
  updatedAt: string;
};

type DraftStore = {
  drafts: Record<string, GoogleAdsDraft>;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'google-ads-drafts.json');

function defaultStore(): DraftStore {
  return { drafts: {} };
}

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(defaultStore(), null, 2), 'utf8');
  }
}

async function readStore(): Promise<DraftStore> {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DraftStore;
    return {
      drafts: parsed?.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
    };
  } catch {
    return defaultStore();
  }
}

async function writeStore(store: DraftStore): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function saveGoogleAdsDraft(draft: Omit<GoogleAdsDraft, 'updatedAt'>): Promise<GoogleAdsDraft> {
  const store = await readStore();
  const next: GoogleAdsDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  store.drafts[draft.adoptionId] = next;
  await writeStore(store);
  return next;
}

export async function getGoogleAdsDraft(adoptionId: string): Promise<GoogleAdsDraft | null> {
  const store = await readStore();
  return store.drafts[adoptionId] || null;
}

export async function deleteGoogleAdsDraft(adoptionId: string): Promise<void> {
  const store = await readStore();
  delete store.drafts[adoptionId];
  await writeStore(store);
}
