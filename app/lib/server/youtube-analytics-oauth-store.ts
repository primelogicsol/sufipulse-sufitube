import { promises as fs } from 'fs';
import path from 'path';

export type YTAnalyticsToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  updatedAt: string;
};

const resolveDataDir = () => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  return path.join(process.cwd(), '.data');
};

const STORE_FILE = path.join(resolveDataDir(), 'youtube-analytics-token.json');

export function normalizeYTAnalyticsCredential(raw: unknown, keyName = ''): string {
  let value = String(raw ?? '').trim();
  if (keyName && value.startsWith(`${keyName}=`)) value = value.slice(keyName.length + 1).trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

async function read(): Promise<YTAnalyticsToken | null> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.refreshToken ? (parsed as YTAnalyticsToken) : null;
  } catch {
    return null;
  }
}

async function write(record: YTAnalyticsToken): Promise<void> {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  const temp = `${STORE_FILE}.tmp`;
  await fs.writeFile(temp, JSON.stringify(record, null, 2), 'utf8');
  await fs.rename(temp, STORE_FILE);
}

export async function getYTAnalyticsToken(): Promise<YTAnalyticsToken | null> {
  return read();
}

export async function hasYTAnalyticsRefreshCredential(): Promise<boolean> {
  const stored = await read();
  if (stored?.refreshToken) return true;
  return Boolean(normalizeYTAnalyticsCredential(process.env.YOUTUBE_REFRESH_TOKEN, 'YOUTUBE_REFRESH_TOKEN'));
}

export async function saveYTAnalyticsToken(params: {
  accessToken: string;
  refreshToken?: string | null;
  expiresInSeconds?: number;
}): Promise<YTAnalyticsToken> {
  const existing = await read();
  const now = new Date();
  const record: YTAnalyticsToken = {
    accessToken: params.accessToken,
    refreshToken: params.refreshToken ?? existing?.refreshToken ?? '',
    expiresAt: params.expiresInSeconds
      ? new Date(now.getTime() + params.expiresInSeconds * 1000).toISOString()
      : (existing?.expiresAt ?? ''),
    updatedAt: now.toISOString(),
  };
  await write(record);
  return record;
}

export async function getValidYTAnalyticsAccessToken(): Promise<string | null> {
  const record = await read();
  const environmentRefreshToken = normalizeYTAnalyticsCredential(process.env.YOUTUBE_REFRESH_TOKEN, 'YOUTUBE_REFRESH_TOKEN');
  const refreshToken = record?.refreshToken || environmentRefreshToken;
  if (!refreshToken) return null;

  const expiresAtMs = record?.expiresAt ? new Date(record.expiresAt).getTime() : Number.NaN;
  const expiringSoon = !Number.isFinite(expiresAtMs) || Date.now() + 5 * 60 * 1000 >= expiresAtMs;

  if (record?.refreshToken && !expiringSoon && record.accessToken) return record.accessToken;

  const clientId = normalizeYTAnalyticsCredential(process.env.YOUTUBE_CLIENT_ID, 'YOUTUBE_CLIENT_ID');
  const clientSecret = normalizeYTAnalyticsCredential(process.env.YOUTUBE_CLIENT_SECRET, 'YOUTUBE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    console.warn('[youtube-analytics-oauth-store] Access token is expired/expiring and OAuth client credentials are unavailable.');
    return null;
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      cache: 'no-store',
    });
    const tokens = await res.json();

    if (!res.ok || !tokens.access_token) {
      console.warn('[youtube-analytics-oauth-store] Refresh token exchange failed; reconnect is required.', tokens?.error || res.status);
      return null;
    }

    await saveYTAnalyticsToken({
      accessToken: tokens.access_token,
      refreshToken,
      expiresInSeconds: Number(tokens.expires_in || 3600),
    });
    return String(tokens.access_token);
  } catch (error) {
    console.warn('[youtube-analytics-oauth-store] Refresh token exchange could not be completed; reconnect is required.', error);
    return null;
  }
}