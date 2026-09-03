import 'server-only';

const RANGE_PATTERN = /^bytes=(\d*)-(\d*)$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseExtraHeaders = (): Record<string, string> => {
  const raw = process.env.PRIVATE_AUDIO_STREAM_EXTRA_HEADERS_JSON?.trim();
  if (!raw) return {};

  const parsed = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new Error('PRIVATE_AUDIO_STREAM_EXTRA_HEADERS_JSON must be a JSON object.');
  }

  const blocked = new Set([
    'host',
    'content-length',
    'connection',
    'transfer-encoding',
    'range',
  ]);

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (blocked.has(key.toLowerCase())) continue;
    if (typeof value === 'string' && value.trim()) headers[key] = value;
  }
  return headers;
};

export const normalizeSingleRangeHeader = (input: string | null): string | undefined => {
  const value = String(input || '').trim();
  if (!value) return undefined;

  const match = value.match(RANGE_PATTERN);
  if (!match) throw new Error('Only a single HTTP byte range is supported.');
  if (!match[1] && !match[2]) throw new Error('Invalid HTTP byte range.');

  return `bytes=${match[1]}-${match[2]}`;
};

const buildConfiguredStreamUrl = (sourceAssetId: string): string => {
  const template = process.env.PRIVATE_AUDIO_STREAM_URL_TEMPLATE?.trim();
  if (!template) {
    throw new Error('Private audio streaming is not configured on this server.');
  }
  if (!template.includes('{assetId}')) {
    throw new Error('PRIVATE_AUDIO_STREAM_URL_TEMPLATE must contain {assetId}.');
  }

  const candidate = template.replaceAll('{assetId}', encodeURIComponent(sourceAssetId));
  const parsed = new URL(candidate);
  if (parsed.protocol !== 'https:') {
    throw new Error('Private audio stream endpoint must use HTTPS.');
  }
  return parsed.toString();
};

export const isPrivateAudioStreamConfigured = (): boolean =>
  Boolean(process.env.PRIVATE_AUDIO_STREAM_URL_TEMPLATE?.trim());

export async function fetchConfiguredPrivateAudioStream(
  sourceAssetId: string,
  rangeHeader?: string,
): Promise<Response> {
  const url = buildConfiguredStreamUrl(sourceAssetId);
  const headers: Record<string, string> = {
    Accept: 'audio/*,application/octet-stream;q=0.9,*/*;q=0.1',
    ...parseExtraHeaders(),
  };

  const authorization = process.env.PRIVATE_AUDIO_STREAM_AUTHORIZATION?.trim();
  if (authorization) headers.Authorization = authorization;
  if (rangeHeader) headers.Range = rangeHeader;

  const timeoutMs = Math.min(
    Math.max(Number(process.env.PRIVATE_AUDIO_STREAM_CONNECT_TIMEOUT_MS || 15000), 1000),
    60000,
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export const buildSafeAudioProxyHeaders = (upstream: Response): Headers => {
  const headers = new Headers();
  const allowList = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'etag',
    'last-modified',
  ];

  for (const key of allowList) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }

  if (!headers.has('content-type')) headers.set('Content-Type', 'audio/mpeg');
  headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  headers.set('Content-Disposition', 'inline');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return headers;
};
