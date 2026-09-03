import 'server-only';

import { createHash } from 'node:crypto';

export type PrivateAlignedWord = {
  text: string;
  startSeconds: number;
  endSeconds: number;
};

export type PrivateAlignedLine = {
  index: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
  section?: string;
  isProductionDirection: boolean;
  words: PrivateAlignedWord[];
};

export type NormalizedPrivateAudioAlignment = {
  lines: PrivateAlignedLine[];
  words: PrivateAlignedWord[];
  waveformData: unknown[];
  alignmentQuality?: number;
  isStreamed?: boolean;
  durationSeconds: number;
  sourceMetadata: Record<string, unknown>;
  payloadHash: string;
  stats: {
    lineCount: number;
    publishableLineCount: number;
    productionDirectionCount: number;
    wordCount: number;
    waveformPointCount: number;
    overlapCount: number;
  };
};

const SENSITIVE_KEY = /(authorization|bearer|token|cookie|password|secret|email|device[_-]?id|session)/i;
const HEAVY_ALIGNMENT_KEY = /^(aligned[_-]?lyrics|aligned[_-]?words|waveform[_-]?data|lines|words)$/i;
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const firstDefined = (...values: unknown[]) => values.find((value) => value !== undefined && value !== null);

const toFiniteNumber = (value: unknown): number | undefined => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getArray = (payload: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const key of keys) {
    const direct = payload[key];
    if (Array.isArray(direct)) return direct;

    const data = payload.data;
    if (isRecord(data) && Array.isArray(data[key])) return data[key] as unknown[];
  }
  return [];
};

const getScalar = (payload: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (payload[key] !== undefined) return payload[key];
    const data = payload.data;
    if (isRecord(data) && data[key] !== undefined) return data[key];
  }
  return undefined;
};

const parseWord = (value: unknown): PrivateAlignedWord | null => {
  if (!isRecord(value)) return null;

  const text = String(firstDefined(value.text, value.word, value.value, '') || '').trim();
  const startSeconds = toFiniteNumber(firstDefined(value.start_s, value.start, value.startSeconds, value.start_time));
  const endSeconds = toFiniteNumber(firstDefined(value.end_s, value.end, value.endSeconds, value.end_time));

  if (!text || startSeconds === undefined || endSeconds === undefined || endSeconds <= startSeconds) {
    return null;
  }

  return { text, startSeconds, endSeconds };
};

export const isProductionDirection = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;

  return (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('(') && trimmed.endsWith(')'))
  );
};

const parseLine = (value: unknown, index: number): PrivateAlignedLine | null => {
  if (!isRecord(value)) return null;

  const text = String(firstDefined(value.text, value.line, value.lyric, '') || '').trim();
  const startSeconds = toFiniteNumber(firstDefined(value.start_s, value.start, value.startSeconds, value.start_time));
  const endSeconds = toFiniteNumber(firstDefined(value.end_s, value.end, value.endSeconds, value.end_time));

  if (!text || startSeconds === undefined || endSeconds === undefined || endSeconds <= startSeconds) {
    return null;
  }

  const nestedWordsRaw = Array.isArray(value.words) ? value.words : [];
  const words = nestedWordsRaw.map(parseWord).filter((word): word is PrivateAlignedWord => Boolean(word));
  const section = firstDefined(value.section, value.section_name, value.role);

  return {
    index,
    text,
    startSeconds,
    endSeconds,
    section: typeof section === 'string' && section.trim() ? section.trim() : undefined,
    isProductionDirection: isProductionDirection(text),
    words,
  };
};

const sanitizeMetadataValue = (value: unknown, depth = 0): unknown => {
  if (depth > 5) return '[max-depth]';
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeMetadataValue(item, depth + 1));
  if (!isRecord(value)) return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) {
      sanitized[key] = '[redacted]';
      continue;
    }
    if (HEAVY_ALIGNMENT_KEY.test(key)) continue;
    sanitized[key] = sanitizeMetadataValue(child, depth + 1);
  }
  return sanitized;
};

const extractSourceMetadata = (payload: Record<string, unknown>): Record<string, unknown> => {
  const sanitized = sanitizeMetadataValue(payload);
  return isRecord(sanitized) ? sanitized : {};
};

export const extractSourceAssetId = (input: string): string | null => {
  const candidate = String(input || '').trim();
  if (!candidate) return null;

  const uuid = candidate.match(UUID_PATTERN)?.[0];
  if (uuid) return uuid;

  // Allow non-UUID internal asset identifiers without allowing path/query injection.
  if (/^[A-Za-z0-9_-]{8,128}$/.test(candidate)) return candidate;
  return null;
};

export function normalizePrivateAudioAlignment(payloadInput: unknown): NormalizedPrivateAudioAlignment {
  if (!isRecord(payloadInput)) {
    throw new Error('Alignment payload must be a JSON object.');
  }

  const lineValues = getArray(payloadInput, ['aligned_lyrics', 'alignedLyrics', 'lines']);
  const lines = lineValues
    .map((value, index) => parseLine(value, index + 1))
    .filter((line): line is PrivateAlignedLine => Boolean(line));

  if (!lines.length) {
    throw new Error('Alignment payload did not contain any valid timed lyric lines.');
  }

  const topLevelWords = getArray(payloadInput, ['aligned_words', 'alignedWords', 'words'])
    .map(parseWord)
    .filter((word): word is PrivateAlignedWord => Boolean(word));

  const words = topLevelWords.length
    ? topLevelWords
    : lines.flatMap((line) => line.words);

  const waveformData = getArray(payloadInput, ['waveform_data', 'waveformData', 'waveform']);
  const alignmentQuality = toFiniteNumber(
    getScalar(payloadInput, ['alignment_quality', 'alignmentQuality', 'hoot_cer', 'quality'])
  );
  const isStreamedValue = getScalar(payloadInput, ['is_streamed', 'isStreamed']);
  const isStreamed = typeof isStreamedValue === 'boolean' ? isStreamedValue : undefined;

  const sortedLines = [...lines].sort((a, b) => a.startSeconds - b.startSeconds || a.endSeconds - b.endSeconds);
  let overlapCount = 0;
  for (let index = 1; index < sortedLines.length; index += 1) {
    if (sortedLines[index].startSeconds < sortedLines[index - 1].endSeconds) overlapCount += 1;
  }

  const durationFromPayload = toFiniteNumber(
    getScalar(payloadInput, ['duration', 'duration_s', 'durationSeconds', 'audio_duration'])
  );
  const durationFromLines = Math.max(...lines.map((line) => line.endSeconds));
  const durationSeconds = Math.max(durationFromPayload || 0, durationFromLines || 0);

  const stablePayload = JSON.stringify(payloadInput);
  const payloadHash = createHash('sha256').update(stablePayload).digest('hex');
  const productionDirectionCount = lines.filter((line) => line.isProductionDirection).length;

  return {
    lines,
    words,
    waveformData,
    alignmentQuality,
    isStreamed,
    durationSeconds,
    sourceMetadata: extractSourceMetadata(payloadInput),
    payloadHash,
    stats: {
      lineCount: lines.length,
      publishableLineCount: lines.length - productionDirectionCount,
      productionDirectionCount,
      wordCount: words.length,
      waveformPointCount: waveformData.length,
      overlapCount,
    },
  };
}

const parseExtraHeaders = (): Record<string, string> => {
  const raw = process.env.PRIVATE_AUDIO_ALIGNMENT_EXTRA_HEADERS_JSON?.trim();
  if (!raw) return {};

  const parsed = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error('PRIVATE_AUDIO_ALIGNMENT_EXTRA_HEADERS_JSON must be a JSON object.');

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string' && value.trim()) headers[key] = value;
  }
  return headers;
};

export async function fetchConfiguredPrivateAudioAlignment(sourceAssetId: string): Promise<unknown> {
  const template = process.env.PRIVATE_AUDIO_ALIGNMENT_URL_TEMPLATE?.trim();
  if (!template) {
    throw new Error('Private audio alignment fetch is not configured on this server.');
  }
  if (!template.includes('{assetId}')) {
    throw new Error('PRIVATE_AUDIO_ALIGNMENT_URL_TEMPLATE must contain {assetId}.');
  }

  const url = template.replaceAll('{assetId}', encodeURIComponent(sourceAssetId));
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...parseExtraHeaders(),
  };

  const authorization = process.env.PRIVATE_AUDIO_ALIGNMENT_AUTHORIZATION?.trim();
  if (authorization) headers.Authorization = authorization;

  const timeoutMs = Math.min(
    Math.max(Number(process.env.PRIVATE_AUDIO_ALIGNMENT_TIMEOUT_MS || 15000), 1000),
    60000
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Private audio alignment fetch failed with HTTP ${response.status}.`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}
