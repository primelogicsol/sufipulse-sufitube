import { promises as fs } from 'fs';
import path from 'path';

export type AdoptionGoogleOAuthRecord = {
  adoptionId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresAt?: string;
  accessibleCustomerIds: string[];
  updatedAt: string;
};

type OAuthStore = {
  adoptions: Record<string, AdoptionGoogleOAuthRecord>;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'adoption-google-oauth.json');

const defaultStore = (): OAuthStore => ({ adoptions: {} });

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(defaultStore(), null, 2), 'utf8');
  }
}

async function readStore(): Promise<OAuthStore> {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as OAuthStore;
    return {
      adoptions: parsed?.adoptions && typeof parsed.adoptions === 'object' ? parsed.adoptions : {},
    };
  } catch {
    return defaultStore();
  }
}

async function writeStore(store: OAuthStore): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function upsertAdoptionGoogleOAuthRecord(params: {
  adoptionId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresInSeconds?: number;
  accessibleCustomerIds?: string[];
}) {
  const store = await readStore();
  const now = new Date();
  const expiresAt = params.expiresInSeconds
    ? new Date(now.getTime() + params.expiresInSeconds * 1000).toISOString()
    : undefined;

  const next: AdoptionGoogleOAuthRecord = {
    adoptionId: params.adoptionId,
    accessToken: params.accessToken,
    refreshToken: params.refreshToken ?? null,
    tokenType: params.tokenType,
    expiresAt,
    accessibleCustomerIds: params.accessibleCustomerIds || [],
    updatedAt: now.toISOString(),
  };

  store.adoptions[params.adoptionId] = next;
  await writeStore(store);
  return next;
}

export async function getAdoptionGoogleOAuthRecord(adoptionId: string): Promise<AdoptionGoogleOAuthRecord | null> {
  const store = await readStore();
  return store.adoptions[adoptionId] || null;
}