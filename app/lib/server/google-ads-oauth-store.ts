import { promises as fs } from 'fs';
import path from 'path';

export type GoogleAdsUserOAuthRecord = {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresAt?: string;
  accessibleCustomerIds: string[];
  updatedAt: string;
};

type OAuthStore = {
  users: Record<string, GoogleAdsUserOAuthRecord>;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'google-ads-oauth.json');

function defaultStore(): OAuthStore {
  return { users: {} };
}

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
      users: parsed?.users && typeof parsed.users === 'object' ? parsed.users : {},
    };
  } catch {
    return defaultStore();
  }
}

async function writeStore(store: OAuthStore): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export async function upsertGoogleAdsUserOAuth(params: {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresInSeconds?: number;
  accessibleCustomerIds?: string[];
}): Promise<GoogleAdsUserOAuthRecord> {
  const store = await readStore();
  const now = new Date();
  const expiresAt = params.expiresInSeconds
    ? new Date(now.getTime() + params.expiresInSeconds * 1000).toISOString()
    : undefined;

  const existing = store.users[params.userId];
  const next: GoogleAdsUserOAuthRecord = {
    userId: params.userId,
    accessToken: params.accessToken,
    refreshToken: params.refreshToken ?? existing?.refreshToken ?? null,
    tokenType: params.tokenType ?? existing?.tokenType,
    expiresAt: expiresAt ?? existing?.expiresAt,
    accessibleCustomerIds: params.accessibleCustomerIds ?? existing?.accessibleCustomerIds ?? [],
    updatedAt: now.toISOString(),
  };

  store.users[params.userId] = next;
  await writeStore(store);
  return next;
}

export async function getGoogleAdsUserOAuth(userId: string): Promise<GoogleAdsUserOAuthRecord | null> {
  const store = await readStore();
  return store.users[userId] || null;
}

export async function deleteGoogleAdsUserOAuth(userId: string): Promise<void> {
  const store = await readStore();
  delete store.users[userId];
  await writeStore(store);
}

export function isTokenExpiringSoon(record: GoogleAdsUserOAuthRecord): boolean {
  if (!record.expiresAt) return false;
  return Date.now() + 5 * 60 * 1000 >= new Date(record.expiresAt).getTime();
}

export async function getValidUserAccessToken(
  userId: string,
  record: GoogleAdsUserOAuthRecord
): Promise<string> {
  if (!isTokenExpiringSoon(record)) return record.accessToken;
  if (!record.refreshToken) return record.accessToken;

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return record.accessToken;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: record.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await res.json();
  if (!res.ok || !tokens.access_token) return record.accessToken;

  await upsertGoogleAdsUserOAuth({
    userId,
    accessToken: tokens.access_token,
    refreshToken: record.refreshToken,
    tokenType: tokens.token_type || record.tokenType,
    expiresInSeconds: Number(tokens.expires_in || 3600),
    accessibleCustomerIds: record.accessibleCustomerIds,
  });

  return tokens.access_token;
}
