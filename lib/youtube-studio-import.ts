import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export interface YouTubeStudioVideoRow {
  videoId: string;
  title: string;
  views: number | null;
  watchTimeMinutes: number | null;
  avgViewDurationSecs: number | null;
  impressions: number | null;
  ctr: number | null;
  publishedAt: string | null;
}

export interface YouTubeStudioSnapshot {
  source: 'youtube_studio_advanced_mode_csv';
  importedAt: string;
  fileName: string;
  rowCount: number;
  columns: string[];
  rows: YouTubeStudioVideoRow[];
}

const resolveDataDir = () => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (fs.existsSync('/app/.data')) return '/app/.data';
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, 'youtube-studio-import.json');

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (quoted && next === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (ch === ',' && !quoted) {
      row.push(field);
      field = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some(value => value.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some(value => value.trim() !== '')) rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[%()]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/,/g, '').replace(/%/g, '').trim();
  if (!cleaned || cleaned === '—' || cleaned === '-') return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function parseDurationSeconds(value: string | undefined): number | null {
  if (!value) return null;
  const text = value.trim();
  if (!text || text === '—' || text === '-') return null;

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const seconds = Number(text);
    return Number.isFinite(seconds) ? Math.round(seconds) : null;
  }

  const parts = text.split(':').map(part => Number(part));
  if (parts.some(part => !Number.isFinite(part))) return null;
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  return null;
}

function extractVideoId(value: string | undefined): string | null {
  if (!value) return null;
  const text = value.trim();
  const direct = text.match(/^[A-Za-z0-9_-]{11}$/);
  if (direct) return direct[0];

  const urlMatch = text.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return urlMatch?.[1] ?? null;
}

function buildHeaderIndex(headers: string[]) {
  const normalized = headers.map(normalizeHeader);
  const aliases: Record<string, string[]> = {
    videoId: ['video id', 'video', 'content id', 'content'],
    title: ['video title', 'content title', 'title'],
    views: ['views'],
    watchHours: ['watch time hours', 'watch time hr', 'watch time'],
    watchMinutes: ['watch time minutes'],
    avgDuration: ['average view duration', 'avg view duration'],
    impressions: ['impressions', 'thumbnail impressions'],
    ctr: ['impressions click through rate', 'impression click through rate', 'impressions ctr', 'ctr'],
    publishedAt: ['video publish time', 'publish time', 'published at', 'published date', 'video publish date'],
  };

  const indexFor = (key: keyof typeof aliases): number => {
    for (const alias of aliases[key]) {
      const index = normalized.indexOf(alias);
      if (index >= 0) return index;
    }
    return -1;
  };

  return {
    videoId: indexFor('videoId'),
    title: indexFor('title'),
    views: indexFor('views'),
    watchHours: indexFor('watchHours'),
    watchMinutes: indexFor('watchMinutes'),
    avgDuration: indexFor('avgDuration'),
    impressions: indexFor('impressions'),
    ctr: indexFor('ctr'),
    publishedAt: indexFor('publishedAt'),
  };
}

export function parseYouTubeStudioCsv(text: string, fileName = 'youtube-studio.csv'): YouTubeStudioSnapshot {
  const csv = parseCsv(text);
  if (csv.length < 2) throw new Error('The CSV does not contain a header row and at least one data row.');

  const headers = csv[0].map(value => value.replace(/^\uFEFF/, '').trim());
  const index = buildHeaderIndex(headers);

  if (index.videoId < 0) {
    throw new Error('No YouTube video/content ID column was found. Export Advanced Mode with Content/Video as the breakdown.');
  }

  const byVideoId = new Map<string, YouTubeStudioVideoRow>();

  for (const values of csv.slice(1)) {
    const videoId = extractVideoId(values[index.videoId]);
    if (!videoId) continue;

    const watchMinutesDirect = index.watchMinutes >= 0 ? parseNumber(values[index.watchMinutes]) : null;
    const watchHours = index.watchHours >= 0 ? parseNumber(values[index.watchHours]) : null;
    const watchTimeMinutes = watchMinutesDirect ?? (watchHours !== null ? watchHours * 60 : null);

    const row: YouTubeStudioVideoRow = {
      videoId,
      title: index.title >= 0 && values[index.title]?.trim() ? values[index.title].trim() : videoId,
      views: index.views >= 0 ? parseNumber(values[index.views]) : null,
      watchTimeMinutes,
      avgViewDurationSecs: index.avgDuration >= 0 ? parseDurationSeconds(values[index.avgDuration]) : null,
      impressions: index.impressions >= 0 ? parseNumber(values[index.impressions]) : null,
      ctr: index.ctr >= 0 ? parseNumber(values[index.ctr]) : null,
      publishedAt: index.publishedAt >= 0 && values[index.publishedAt]?.trim() ? values[index.publishedAt].trim() : null,
    };

    byVideoId.set(videoId, row);
  }

  const rows = Array.from(byVideoId.values());
  if (rows.length === 0) {
    throw new Error('No valid 11-character YouTube video IDs were found in the CSV.');
  }

  return {
    source: 'youtube_studio_advanced_mode_csv',
    importedAt: new Date().toISOString(),
    fileName,
    rowCount: rows.length,
    columns: headers,
    rows,
  };
}

export function saveYouTubeStudioSnapshot(snapshot: YouTubeStudioSnapshot): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(snapshot, null, 2), 'utf8');
  fs.renameSync(temp, DATA_FILE);
}

export function getYouTubeStudioSnapshot(): YouTubeStudioSnapshot | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as YouTubeStudioSnapshot;
    if (!parsed || parsed.source !== 'youtube_studio_advanced_mode_csv' || !Array.isArray(parsed.rows)) return null;
    return parsed;
  } catch (error) {
    console.error('[youtube-studio-import] Failed to read stored Studio snapshot:', error);
    return null;
  }
}
