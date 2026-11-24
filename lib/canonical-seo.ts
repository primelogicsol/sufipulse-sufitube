/**
 * lib/canonical-seo.ts
 *
 * Canonical URL, ISO-8601 duration, and title-governance helpers for SufiPulse USA.
 * Enforces single-host canonical authority (https://sufipulse.com, non-www)
 * and GEMINI.md Canonical Title Authority across metadata, sitemaps, and JSON-LD.
 */

export const CANONICAL_ORIGIN = 'https://sufipulse.com';
export const DEFAULT_INDEXNOW_KEY = 'a7f3c9e2d4b841f69e0c5a2d8b7e4f1a';

/**
 * Resolves any relative path or URL into the single authoritative canonical URL
 * on https://sufipulse.com (stripping www., query strings, hashes, and trailing slashes).
 */
export function canonicalUrl(pathOrUrl: string = '/'): string {
  const raw = String(pathOrUrl || '/').trim();
  if (!raw || raw === '/') return CANONICAL_ORIGIN;

  let pathname = raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw);
      pathname = parsed.pathname || '/';
    } catch {
      pathname = raw.replace(/^https?:\/\/[^/]+/i, '') || '/';
    }
  }

  // Strip query string and fragment from canonical path
  pathname = pathname.split('?')[0].split('#')[0] || '/';
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.replace(/\/+$/, '');
  }

  return pathname === '/' ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${pathname}`;
}

/**
 * Converts a duration in seconds (or "mm:ss" / "hh:mm:ss" string) to valid ISO 8601 duration (PT#H#M#S).
 */
export function toIsoDuration(input?: number | string | null): string | undefined {
  if (input === null || input === undefined) return undefined;

  let totalSeconds = 0;
  if (typeof input === 'number') {
    totalSeconds = Math.round(input);
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^PT/i.test(trimmed)) return trimmed.toUpperCase();
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      totalSeconds = Math.round(Number(trimmed));
    } else if (/^\d+:\d{2}(:\d{2})?$/.test(trimmed)) {
      const parts = trimmed.split(':').map(Number);
      if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        totalSeconds = parts[0] * 60 + parts[1];
      }
    }
  }

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return undefined;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let iso = 'PT';
  if (hours > 0) iso += `${hours}H`;
  if (minutes > 0 || hours > 0) iso += `${minutes}M`;
  iso += `${seconds}S`;
  return iso;
}

/**
 * Enforces GEMINI.md Canonical Title Authority:
 * canonicalTitle / Variant A is permanent public-facing song identity on SufiPulse.com;
 * YouTube packaging variants never overwrite canonicalTitle.
 */
export function resolveCanonicalSongTitle(release: Record<string, any> | null | undefined): string {
  if (!release) return 'SufiPulse Release';
  const candidates = [
    release.canonicalTitle,
    release.title,
    release.youtubeTitleVariantA,
    release.youtubeTitle,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return 'SufiPulse Release';
}
