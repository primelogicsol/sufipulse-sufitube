import { promises as fs } from 'fs';
import path from 'path';

export type StudioOAuthRecord = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  updatedAt: string;
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'google-ads-studio-oauth.json');

async function readRecord(): Promise<StudioOAuthRecord | null> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.accessToken ? (parsed as StudioOAuthRecord) : null;
  } catch {
    return null;
  }
}

async function writeRecord(record: StudioOAuthRecord): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(record, null, 2), 'utf8');
}

export async function getStudioOAuthRecord(): Promise<StudioOAuthRecord | null> {
  return readRecord();
}

export async function upsertStudioOAuthRecord(params: {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresInSeconds?: number;
}): Promise<StudioOAuthRecord> {
  const existing = await readRecord();
  const now = new Date();
  const expiresAt = params.expiresInSeconds
    ? new Date(now.getTime() + params.expiresInSeconds * 1000).toISOString()
    : (existing?.expiresAt ?? '');

  const record: StudioOAuthRecord = {
    accessToken: params.accessToken,
    refreshToken: params.refreshToken ?? existing?.refreshToken ?? '',
    tokenType: params.tokenType ?? existing?.tokenType ?? 'Bearer',
    expiresAt,
    updatedAt: now.toISOString(),
  };

  await writeRecord(record);
  return record;
}

function isExpiringSoon(record: StudioOAuthRecord): boolean {
  if (!record.expiresAt) return false;
  return Date.now() + 5 * 60 * 1000 >= new Date(record.expiresAt).getTime();
}

/** Returns a valid access token, refreshing if needed. Returns null if not connected. */
export async function getValidStudioAccessToken(): Promise<string | null> {
  const record = await readRecord();
  if (!record) return null;

  if (!isExpiringSoon(record)) return record.accessToken;
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

  await upsertStudioOAuthRecord({
    accessToken: tokens.access_token,
    refreshToken: record.refreshToken,
    tokenType: tokens.token_type || record.tokenType,
    expiresInSeconds: Number(tokens.expires_in || 3600),
  });

  return tokens.access_token;
}
