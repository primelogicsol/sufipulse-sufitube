/**
 * lib/search-indexing-service.ts
 *
 * Authoritative Search Engine Submission & Verification Ledger (.data/search-indexing-log.json).
 *
 * GOVERNANCE & INTEGRITY RULES:
 * 1. Never fakes HTTP 200/202 responses or uses setTimeout simulations.
 * 2. Never uses Google's restricted Indexing API for music pages or Google's retired /ping endpoint.
 * 3. Blocks non-public, draft, approved, or unpublished URLs before any external request is sent.
 * 4. Verifies IndexNow keyLocation reachability on https://sufipulse.com before marking IndexNow
 *    submissions as SUBMISSION_ACCEPTED (preventing silent async drops when key file 404s).
 * 5. Strictly distinguishes:
 *    - NOT_ELIGIBLE_PRIVATE
 *    - NOT_CONFIGURED
 *    - ELIGIBLE_IN_SITEMAP
 *    - SUBMISSION_ACCEPTED (protocol accepted URL; does NOT mean indexed)
 *    - SUBMISSION_FAILED
 *    - CRAWL_OBSERVED (verified bot hit recorded on URL)
 *    - INDEXED_VERIFIED (confirmed ONLY by GSC URL Inspection API or Bing Webmaster API)
 */

import fs from 'node:fs';
import path from 'node:path';
import { CANONICAL_ORIGIN, DEFAULT_INDEXNOW_KEY, canonicalUrl } from './canonical-seo';
import { cmsServerStorage } from './cms-storage-server';
import { crawlerRegistry } from './crawler-registry';

export type UrlIndexingState =
  | 'NOT_ELIGIBLE_PRIVATE'
  | 'NOT_CONFIGURED'
  | 'ELIGIBLE_IN_SITEMAP'
  | 'SUBMISSION_ACCEPTED'
  | 'SUBMISSION_FAILED'
  | 'CRAWL_OBSERVED'
  | 'INDEXED_VERIFIED';

export interface SearchIndexingEntry {
  id: string;
  url: string;
  releaseId?: string;
  slug?: string;
  protocol: 'indexnow' | 'gsc_sitemap' | 'gsc_url_inspection' | 'bing_webmaster';
  state: UrlIndexingState;
  httpStatus: number | null;
  responseSummary: string;
  errorMessage?: string | null;
  keyLocationVerified?: boolean;
  timestamp: string;
  triggeredBy: string;
}

interface SearchIndexingStore {
  updatedAt: string | null;
  lastKeyCheck: {
    checkedAt: string;
    keyLocation: string;
    httpStatus: number | null;
    verified: boolean;
    message: string;
  } | null;
  entries: SearchIndexingEntry[];
}

const resolveDataDir = (): string => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (typeof window === 'undefined' && fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const LOG_FILE = path.join(DATA_DIR, 'search-indexing-log.json');
const MAX_ENTRIES = 500;

export function getConfiguredIndexNowKey(): {
  key: string;
  source: 'env' | 'static_repo_key';
  localKeyFileExists: boolean;
  keyLocation: string;
} {
  const envKey = (process.env.INDEXNOW_KEY || '').trim();
  const key = /^[A-Za-z0-9-]{8,128}$/.test(envKey) ? envKey : DEFAULT_INDEXNOW_KEY;
  const source = /^[A-Za-z0-9-]{8,128}$/.test(envKey) ? 'env' : 'static_repo_key';
  const publicKeyPath = path.join(process.cwd(), 'public', `${key}.txt`);
  const localKeyFileExists = fs.existsSync(publicKeyPath);

  return {
    key,
    source,
    localKeyFileExists,
    keyLocation: `${CANONICAL_ORIGIN}/${key}.txt`,
  };
}

function readStore(): SearchIndexingStore {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8') || '{}');
      return {
        updatedAt: parsed.updatedAt || null,
        lastKeyCheck: parsed.lastKeyCheck || null,
        entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      };
    }
  } catch (err) {
    console.error('[SEARCH-INDEXING-SERVICE] Read store failed:', err);
  }
  return { updatedAt: null, lastKeyCheck: null, entries: [] };
}

function writeStore(store: SearchIndexingStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serialized = JSON.stringify(store, null, 2);
    fs.writeFileSync(LOG_FILE, serialized, 'utf-8');
    const standaloneDir = path.join(process.cwd(), '.next', 'standalone', '.data');
    if (fs.existsSync(standaloneDir)) {
      fs.writeFileSync(path.join(standaloneDir, 'search-indexing-log.json'), serialized, 'utf-8');
    }
  } catch (err) {
    console.error('[SEARCH-INDEXING-SERVICE] Write store failed:', err);
  }
}

export function appendIndexingEntry(
  entry: Omit<SearchIndexingEntry, 'id' | 'timestamp'> & { timestamp?: string }
): SearchIndexingEntry {
  const store = readStore();
  const now = entry.timestamp || new Date().toISOString();
  const full: SearchIndexingEntry = {
    ...entry,
    id: `idx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
  };
  store.entries.unshift(full);
  if (store.entries.length > MAX_ENTRIES) {
    store.entries = store.entries.slice(0, MAX_ENTRIES);
  }
  store.updatedAt = now;
  writeStore(store);
  return full;
}

/**
 * Verifies whether the IndexNow key file is publicly live at https://sufipulse.com/{key}.txt
 */
export async function verifyPublicIndexNowKey(force = false): Promise<{
  checkedAt: string;
  key: string;
  keyLocation: string;
  localKeyFileExists: boolean;
  httpStatus: number | null;
  verified: boolean;
  message: string;
}> {
  const keyConfig = getConfiguredIndexNowKey();
  const store = readStore();

  // Cache check for 5 minutes unless forced
  if (
    !force &&
    store.lastKeyCheck &&
    store.lastKeyCheck.keyLocation === keyConfig.keyLocation &&
    Date.now() - new Date(store.lastKeyCheck.checkedAt).getTime() < 5 * 60 * 1000
  ) {
    return {
      ...store.lastKeyCheck,
      key: keyConfig.key,
      localKeyFileExists: keyConfig.localKeyFileExists,
    };
  }

  const checkedAt = new Date().toISOString();
  let httpStatus: number | null = null;
  let verified = false;
  let message = '';

  try {
    const res = await fetch(keyConfig.keyLocation, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    httpStatus = res.status;
    const text = (await res.text()).trim();
    if (res.status === 200 && text === keyConfig.key) {
      verified = true;
      message = `Verified IndexNow key file live at ${keyConfig.keyLocation} (HTTP 200).`;
    } else {
      verified = false;
      message =
        res.status === 404
          ? `Key file exists locally (${keyConfig.localKeyFileExists ? 'public/' + keyConfig.key + '.txt' : 'dynamic route'}), but ${keyConfig.keyLocation} returned HTTP 404 on production. Deploy to sufipulse.com to activate live IndexNow verification.`
          : `Key check returned HTTP ${res.status} (body match: ${text === keyConfig.key}).`;
    }
  } catch (err: any) {
    verified = false;
    message = `Unable to reach ${keyConfig.keyLocation}: ${err?.message || 'network error'}`;
  }

  store.lastKeyCheck = {
    checkedAt,
    keyLocation: keyConfig.keyLocation,
    httpStatus,
    verified,
    message,
  };
  writeStore(store);

  return {
    checkedAt,
    key: keyConfig.key,
    keyLocation: keyConfig.keyLocation,
    localKeyFileExists: keyConfig.localKeyFileExists,
    httpStatus,
    verified,
    message,
  };
}

/**
 * Validates that a target URL belongs to sufipulse.com and, if it is a release URL,
 * corresponds to a strictly published + public release.
 */
export function validateUrlPublicEligibility(targetUrl: string): {
  eligible: boolean;
  canonical: string;
  releaseId?: string;
  slug?: string;
  reason?: string;
} {
  const canonical = canonicalUrl(targetUrl);
  const parsed = new URL(canonical);

  if (parsed.origin !== CANONICAL_ORIGIN) {
    return { eligible: false, canonical, reason: `URL host must be ${CANONICAL_ORIGIN}.` };
  }

  const releaseMatch = parsed.pathname.match(/^\/release-detail\/([^/]+)$/);
  if (releaseMatch) {
    const slug = decodeURIComponent(releaseMatch[1]);
    const release =
      cmsServerStorage.getReleaseBySlug(slug) ||
      cmsServerStorage.getRelease(slug) ||
      cmsServerStorage.getReleaseByYoutubeId(slug);

    if (!release) {
      return { eligible: false, canonical, slug, reason: `Release "${slug}" does not exist in CMS.` };
    }
    if (release.status !== 'published' || (release.visibility || 'public') !== 'public') {
      return {
        eligible: false,
        canonical,
        releaseId: release.id,
        slug: release.slug,
        reason: `Release "${release.slug}" has status="${release.status}", visibility="${release.visibility || 'private'}" and is excluded from public indexing.`,
      };
    }
    return {
      eligible: true,
      canonical: canonicalUrl(`/release-detail/${release.slug}`),
      releaseId: release.id,
      slug: release.slug,
    };
  }

  return { eligible: true, canonical };
}

/**
 * Submits one or more public canonical URLs to IndexNow ONLY after verifying eligibility
 * and public keyLocation reachability. Records actual HTTP status codes and errors.
 */
export async function submitUrlsViaIndexNow(
  urls: string[],
  triggeredBy = 'admin'
): Promise<{
  accepted: boolean;
  state: UrlIndexingState;
  httpStatus: number | null;
  keyCheck: Awaited<ReturnType<typeof verifyPublicIndexNowKey>>;
  entries: SearchIndexingEntry[];
  message: string;
}> {
  const entries: SearchIndexingEntry[] = [];
  const validTargets: Array<{ canonical: string; releaseId?: string; slug?: string }> = [];

  for (const rawUrl of urls) {
    const check = validateUrlPublicEligibility(rawUrl);
    if (!check.eligible) {
      entries.push(
        appendIndexingEntry({
          url: check.canonical,
          releaseId: check.releaseId,
          slug: check.slug,
          protocol: 'indexnow',
          state: 'NOT_ELIGIBLE_PRIVATE',
          httpStatus: null,
          responseSummary: check.reason || 'URL is not publicly eligible.',
          errorMessage: check.reason || null,
          keyLocationVerified: false,
          triggeredBy,
        })
      );
    } else {
      validTargets.push({ canonical: check.canonical, releaseId: check.releaseId, slug: check.slug });
    }
  }

  const keyCheck = await verifyPublicIndexNowKey(false);

  if (validTargets.length === 0) {
    return {
      accepted: false,
      state: 'NOT_ELIGIBLE_PRIVATE',
      httpStatus: null,
      keyCheck,
      entries,
      message: entries[0]?.responseSummary || 'No publicly eligible URLs provided.',
    };
  }

  if (!keyCheck.verified) {
    for (const target of validTargets) {
      entries.push(
        appendIndexingEntry({
          url: target.canonical,
          releaseId: target.releaseId,
          slug: target.slug,
          protocol: 'indexnow',
          state: 'NOT_CONFIGURED',
          httpStatus: keyCheck.httpStatus,
          responseSummary: keyCheck.message,
          errorMessage: 'Public IndexNow key file is not yet reachable with HTTP 200 on https://sufipulse.com.',
          keyLocationVerified: false,
          triggeredBy,
        })
      );
    }
    return {
      accepted: false,
      state: 'NOT_CONFIGURED',
      httpStatus: keyCheck.httpStatus,
      keyCheck,
      entries,
      message: keyCheck.message,
    };
  }

  // Execute real IndexNow submission against api.indexnow.org
  const payload = {
    host: 'sufipulse.com',
    key: keyCheck.key,
    keyLocation: keyCheck.keyLocation,
    urlList: Array.from(new Set(validTargets.map((t) => t.canonical))),
  };

  try {
    let res: Response | null = null;
    for (let attempt = 0; attempt <= 2; attempt++) {
      res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 450 * (attempt + 1)));
        continue;
      }
      break;
    }
    if (!res) throw new Error('No response from IndexNow endpoint');

    const bodyText = (await res.text().catch(() => '')).slice(0, 300);
    const accepted = res.status === 200 || res.status === 202;
    const state: UrlIndexingState = accepted ? 'SUBMISSION_ACCEPTED' : 'SUBMISSION_FAILED';
    const summary = accepted
      ? `IndexNow accepted submission (HTTP ${res.status}). Protocol acceptance notifies Bing/Yandex/IndexNow partners to crawl; it does not guarantee indexing.`
      : `IndexNow rejected submission with HTTP ${res.status}${bodyText ? `: ${bodyText}` : ''}`;

    for (const target of validTargets) {
      entries.push(
        appendIndexingEntry({
          url: target.canonical,
          releaseId: target.releaseId,
          slug: target.slug,
          protocol: 'indexnow',
          state,
          httpStatus: res.status,
          responseSummary: summary,
          errorMessage: accepted ? null : summary,
          keyLocationVerified: true,
          triggeredBy,
        })
      );
    }

    return {
      accepted,
      state,
      httpStatus: res.status,
      keyCheck,
      entries,
      message: summary,
    };
  } catch (err: any) {
    const errMsg = `IndexNow network request failed: ${err?.message || 'unknown error'}`;
    for (const target of validTargets) {
      entries.push(
        appendIndexingEntry({
          url: target.canonical,
          releaseId: target.releaseId,
          slug: target.slug,
          protocol: 'indexnow',
          state: 'SUBMISSION_FAILED',
          httpStatus: null,
          responseSummary: errMsg,
          errorMessage: errMsg,
          keyLocationVerified: true,
          triggeredBy,
        })
      );
    }
    return {
      accepted: false,
      state: 'SUBMISSION_FAILED',
      httpStatus: null,
      keyCheck,
      entries,
      message: errMsg,
    };
  }
}

/**
 * Computes the honest, evidence-backed indexing status for a given canonical URL.
 */
export function getUrlIndexingDiagnostics(targetUrl: string): {
  canonicalUrl: string;
  eligibleForPublicIndex: boolean;
  eligibilityReason?: string;
  currentState: UrlIndexingState;
  crawlObservedCount: number;
  lastCrawledAt: string | null;
  crawledByBots: string[];
  history: SearchIndexingEntry[];
} {
  const eligibility = validateUrlPublicEligibility(targetUrl);
  const store = readStore();
  const history = store.entries.filter((e) => e.url === eligibility.canonical).slice(0, 20);

  const pathOnly = new URL(eligibility.canonical).pathname;
  const crawlers = crawlerRegistry.getRecords();
  const crawledByBots: string[] = [];
  let crawlObservedCount = 0;
  let lastCrawledAt: string | null = null;

  for (const rec of crawlers) {
    const matchingHits = (rec.recentPaths || []).filter((p) => p.path === pathOnly);
    if (matchingHits.length > 0) {
      crawledByBots.push(rec.crawler);
      crawlObservedCount += matchingHits.length;
      for (const hit of matchingHits) {
        if (!lastCrawledAt || hit.timestamp > lastCrawledAt) {
          lastCrawledAt = hit.timestamp;
        }
      }
    }
  }

  let currentState: UrlIndexingState = 'ELIGIBLE_IN_SITEMAP';
  if (!eligibility.eligible) {
    currentState = 'NOT_ELIGIBLE_PRIVATE';
  } else if (history.some((h) => h.state === 'INDEXED_VERIFIED')) {
    currentState = 'INDEXED_VERIFIED';
  } else if (crawlObservedCount > 0) {
    currentState = 'CRAWL_OBSERVED';
  } else if (history[0]) {
    currentState = history[0].state;
  }

  return {
    canonicalUrl: eligibility.canonical,
    eligibleForPublicIndex: eligibility.eligible,
    eligibilityReason: eligibility.reason,
    currentState,
    crawlObservedCount,
    lastCrawledAt,
    crawledByBots,
    history,
  };
}

export function getSearchIndexingLogSnapshot(limit = 50) {
  const store = readStore();
  const keyConfig = getConfiguredIndexNowKey();
  return {
    updatedAt: store.updatedAt,
    indexNowConfig: {
      ...keyConfig,
      lastPublicVerification: store.lastKeyCheck,
    },
    entries: store.entries.slice(0, limit),
  };
}
