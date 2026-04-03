/**
 * Pure utility functions for parsing and generating subtitle files (SRT, VTT, ASS)
 * and for manipulating cue timestamps.
 *
 * All functions are stateless and have no React or browser dependencies
 * (except triggerBlobDownload, which is browser-only but renders no React).
 *
 * Extracted from app/admin/cms-releases/[id]/page.tsx.
 */

import { ASSStylePack, DEFAULT_STYLE_PACK, DEFAULT_STYLE_NAME } from './release-constants';

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

export const assColorToHex = (value?: string, fallback = '#FFFFFF'): string => {
  const source = String(value || '').trim();
  if (!source) return fallback;
  if (source.startsWith('#') && source.length === 7) return source.toUpperCase();

  const match = source.match(/&?H([0-9A-Fa-f]{8})/);
  if (!match) return fallback;

  const hex = match[1].toUpperCase();
  const bb = hex.slice(2, 4);
  const gg = hex.slice(4, 6);
  const rr = hex.slice(6, 8);
  return `#${rr}${gg}${bb}`;
};

export const normalizeHexColor = (value?: string, fallback = '#FFFFFF'): string => {
  const candidate = String(value || '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(candidate)) return candidate.toUpperCase();
  return fallback;
};

export const assColorToRgba = (value?: string, fallback = 'rgba(0, 0, 0, 0.55)'): string => {
  const source = String(value || '').trim();
  if (!source) return fallback;

  if (/^#[0-9A-Fa-f]{6}$/.test(source)) {
    const hex = source.replace('#', '');
    const rr = parseInt(hex.slice(0, 2), 16);
    const gg = parseInt(hex.slice(2, 4), 16);
    const bb = parseInt(hex.slice(4, 6), 16);
    return `rgba(${rr}, ${gg}, ${bb}, 0.7)`;
  }

  const match = source.match(/&?H([0-9A-Fa-f]{8})/);
  if (!match) return fallback;

  const hex = match[1].toUpperCase();
  const aa = parseInt(hex.slice(0, 2), 16);
  const bb = parseInt(hex.slice(2, 4), 16);
  const gg = parseInt(hex.slice(4, 6), 16);
  const rr = parseInt(hex.slice(6, 8), 16);
  const opacity = Math.max(0, Math.min(1, 1 - aa / 255));
  return `rgba(${rr}, ${gg}, ${bb}, ${opacity.toFixed(3)})`;
};

// ---------------------------------------------------------------------------
// Alignment / position helpers
// ---------------------------------------------------------------------------

export const resolvePreviewAnchor = (
  alignment?: number,
): { x: 'left' | 'center' | 'right'; y: 'top' | 'middle' | 'bottom' } => {
  const safe = Number.isFinite(alignment as number) ? Number(alignment) : 2;
  if ([1, 4, 7].includes(safe))
    return { x: 'left', y: safe >= 7 ? 'top' : safe >= 4 ? 'middle' : 'bottom' };
  if ([3, 6, 9].includes(safe))
    return { x: 'right', y: safe >= 7 ? 'top' : safe >= 4 ? 'middle' : 'bottom' };
  return { x: 'center', y: safe >= 7 ? 'top' : safe >= 4 ? 'middle' : 'bottom' };
};

export const getAlignmentLabel = (alignment?: number): string => {
  const labels: Record<number, string> = {
    1: 'Bottom Left',
    2: 'Bottom Center',
    3: 'Bottom Right',
    4: 'Middle Left',
    5: 'Middle Center',
    6: 'Middle Right',
    7: 'Top Left',
    8: 'Top Center',
    9: 'Top Right',
  };
  return labels[alignment || 2] || 'Bottom Center';
};

// ---------------------------------------------------------------------------
// Timestamp helpers
// ---------------------------------------------------------------------------

export const normalizeCueTime = (input: string): string => {
  const cleaned = (input || '').trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length < 2) return '00:00:00.000';

  const padded = [...parts];
  while (padded.length < 3) padded.unshift('00');
  const [hh, mm, ssMs] = padded;
  const [ss, ms = '000'] = (ssMs || '0').split('.');

  const h = String(Number(hh || 0)).padStart(2, '0');
  const m = String(Number(mm || 0)).padStart(2, '0');
  const s = String(Number(ss || 0)).padStart(2, '0');
  const milli = String(Number(ms || 0)).padStart(3, '0').slice(0, 3);
  return `${h}:${m}:${s}.${milli}`;
};

export const cueTimeToSeconds = (input?: string): number => {
  const normalized = normalizeCueTime(input || '00:00:00.000');
  const [hh, mm, ssMs] = normalized.split(':');
  const [ss, ms = '000'] = ssMs.split('.');
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
};

export const secondsToCueTime = (seconds: number): string => {
  const safe = Math.max(0, seconds || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

export const formatPreviewSeconds = (value: number): string => {
  const safe = Math.max(0, value || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const fractional = Math.floor((safe % 1) * 10);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${fractional}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}.${fractional}`;
};

// ---------------------------------------------------------------------------
// Browser download helper
// ---------------------------------------------------------------------------

export const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const extractFilenameFromDisposition = (
  headerValue: string | null,
  fallback: string,
): string => {
  if (!headerValue) return fallback;
  const match = headerValue.match(/filename="?([^";]+)"?/i);
  if (!match) return fallback;
  return match[1] || fallback;
};

// ---------------------------------------------------------------------------
// Subtitle file parsers
// ---------------------------------------------------------------------------

export type ParsedCue = {
  cueNumber: number;
  startTime: string;
  endTime: string;
  text: string;
};

export type ParsedAssCue = ParsedCue & {
  styleName: string;
  alignment?: number;
  positionX?: number;
  positionY?: number;
};

export const parseSubtitleFile = (
  content: string,
  format: 'srt' | 'vtt',
): ParsedCue[] => {
  const rows = content.replace(/\r/g, '').split('\n');
  const cues: ParsedCue[] = [];

  if (format === 'vtt' && rows[0]?.toUpperCase().includes('WEBVTT')) {
    rows.shift();
  }

  const blocks = rows.join('\n').split('\n\n').map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    let idx = 0;
    if (/^\d+$/.test(lines[idx])) {
      idx += 1;
    }

    const timing = lines[idx] || '';
    if (!timing.includes('-->')) continue;
    idx += 1;

    const [startRaw, endRaw] = timing.split('-->').map((part) => part.trim());
    const text = lines.slice(idx).join(' ').trim();

    cues.push({
      cueNumber: cues.length + 1,
      startTime: normalizeCueTime(startRaw),
      endTime: normalizeCueTime(endRaw),
      text,
    });
  }

  return cues;
};

export const parseAssFile = (content: string): ParsedAssCue[] => {
  const lines = content.replace(/\r/g, '').split('\n');
  const cues: ParsedAssCue[] = [];

  const dialogueLines = lines.filter((line) => line.trim().startsWith('Dialogue:'));
  for (const raw of dialogueLines) {
    const payload = raw.replace(/^Dialogue:\s*/i, '');
    const fields = payload.split(',');
    if (fields.length < 10) continue;

    const start = normalizeCueTime(fields[1] || '00:00:00.000');
    const end = normalizeCueTime(fields[2] || '00:00:02.000');
    const styleName = (fields[3] || DEFAULT_STYLE_NAME).trim();
    const textRaw = fields.slice(9).join(',').trim();

    const alignmentMatch = textRaw.match(/\\an([1-9])/i);
    const posMatch = textRaw.match(/\\pos\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\)/i);
    const positionX = posMatch
      ? Math.max(0, Math.min(100, (Number(posMatch[1]) / 1920) * 100))
      : undefined;
    const positionY = posMatch
      ? Math.max(0, Math.min(100, (Number(posMatch[2]) / 1080) * 100))
      : undefined;

    const text = textRaw
      .replace(/\{[^}]*\}/g, '')
      .replace(/\\N/gi, '\n')
      .trim();

    cues.push({
      cueNumber: cues.length + 1,
      startTime: start,
      endTime: end,
      styleName,
      alignment: alignmentMatch ? Number(alignmentMatch[1]) : undefined,
      positionX,
      positionY,
      text,
    });
  }

  return cues;
};

export const parseAssStyles = (content: string): Record<string, ASSStylePack> => {
  const lines = content.replace(/\r/g, '').split('\n');
  const styles: Record<string, ASSStylePack> = {};
  let inStyleSection = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      inStyleSection = line.toLowerCase() === '[v4+ styles]';
      continue;
    }

    if (!inStyleSection || !line.toLowerCase().startsWith('style:')) continue;
    const fields = line.replace(/^Style:\s*/i, '').split(',').map((v) => v.trim());
    if (fields.length < 23) continue;

    const name = fields[0] || DEFAULT_STYLE_NAME;
    styles[name] = {
      fontFamily: fields[1] || DEFAULT_STYLE_PACK.fontFamily,
      fontSize: Number(fields[2] || DEFAULT_STYLE_PACK.fontSize),
      primaryColor: assColorToHex(fields[3], DEFAULT_STYLE_PACK.primaryColor),
      secondaryColor: assColorToHex(fields[4], DEFAULT_STYLE_PACK.secondaryColor),
      outlineColor: assColorToHex(fields[5], DEFAULT_STYLE_PACK.outlineColor),
      backColor: assColorToHex(fields[6], DEFAULT_STYLE_PACK.backColor),
      bold: Number(fields[7]) === -1,
      italic: Number(fields[8]) === -1,
      outline: Number(fields[16] || DEFAULT_STYLE_PACK.outline),
      shadow: Number(fields[17] || DEFAULT_STYLE_PACK.shadow),
      alignment: Number(fields[18] || DEFAULT_STYLE_PACK.alignment),
      marginL: Number(fields[19] || DEFAULT_STYLE_PACK.marginL),
      marginR: Number(fields[20] || DEFAULT_STYLE_PACK.marginR),
      marginV: Number(fields[21] || DEFAULT_STYLE_PACK.marginV),
      maxWidthPercent: DEFAULT_STYLE_PACK.maxWidthPercent,
    };
  }

  return styles;
};
