import { promises as fs } from 'fs';
import path from 'path';

export type YTAnalyticsToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  updatedAt: string;
};

const STORE_FILE = path.join(process.cwd(), '.data', 'youtube-analytics-token.json');

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
  await fs.writeFile(STORE_FILE, JSON.stringify(record, null, 2), 'utf8');
}

export async function getYTAnalyticsToken(): Promise<YTAnalyticsToken | null> {
  return read();
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
  if (!record?.refreshToken) return null;

  const expiringSoon = record.expiresAt
    ? Date.now() + 5 * 60 * 1000 >= new Date(record.expiresAt).getTime()
    : true;

  if (!expiringSoon) return record.accessToken;

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
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

  await saveYTAnalyticsToken({
    accessToken: tokens.access_token,
    refreshToken: record.refreshToken,
    expiresInSeconds: Number(tokens.expires_in || 3600),
  });
  return tokens.access_token;
}
