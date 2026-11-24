/**
 * lib/bing-webmaster.ts
 *
 * Official Bing Webmaster Tools JSON API Integration for SufiPulse USA.
 *
 * GOVERNANCE RULES:
 * - Uses official Bing Webmaster API endpoints when BING_WEBMASTER_API_KEY is configured.
 * - Reports explicit NOT_CONFIGURED status with setup checklist when absent (never synthetic rows).
 * - Complements IndexNow real-time submission protocol (lib/search-indexing-service.ts).
 */

import { CANONICAL_ORIGIN } from './canonical-seo';
import { appendIndexingEntry } from './search-indexing-service';

export type BingConnectionState = 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';

export interface BingQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
}

export interface BingPageRow {
  url: string;
  clicks: number;
  impressions: number;
  avgPosition: number;
}

export interface BingWebmasterReport {
  status: BingConnectionState;
  configured: boolean;
  siteUrl: string;
  fetchedAt: string;
  errorMessage: string | null;
  missingRequirements: string[];
  setupInstructions: string[];
  totals: {
    clicks: number;
    impressions: number;
    ctr: number;
    crawledPages: number | null;
    crawlErrors: number | null;
    inIndex: number | null;
  } | null;
  topQueries: BingQueryRow[];
  topPages: BingPageRow[];
}

const BING_API_BASE = 'https://ssl.bing.com/webmaster/api.svc/json';

async function fetchWithRetry(url: string, init: RequestInit, maxRetries = 2): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Bing API request failed after retries');
}

function getBingConfig() {
  const apiKey = (process.env.BING_WEBMASTER_API_KEY || '').trim();
  const siteUrl = (process.env.BING_SITE_URL || CANONICAL_ORIGIN).trim();
  return { apiKey, siteUrl };
}

export async function getBingWebmasterReport(): Promise<BingWebmasterReport> {
  const { apiKey, siteUrl } = getBingConfig();
  const fetchedAt = new Date().toISOString();
  const setupInstructions = [
    '1. Sign in to https://www.bing.com/webmasters and verify https://sufipulse.com (or import directly from Google Search Console).',
    '2. Generate an API Key under Settings -> API Access -> API Key.',
    '3. Set BING_WEBMASTER_API_KEY=<key> and optional BING_SITE_VERIFICATION=<msvalidate.01 token> in .env.local / VPS .env.',
  ];

  if (!apiKey) {
    return {
      status: 'NOT_CONFIGURED',
      configured: false,
      siteUrl,
      fetchedAt,
      errorMessage: null,
      missingRequirements: ['BING_WEBMASTER_API_KEY'],
      setupInstructions,
      totals: null,
      topQueries: [],
      topPages: [],
    };
  }

  try {
    const encodedSite = encodeURIComponent(siteUrl);
    const encodedKey = encodeURIComponent(apiKey);

    const [queryRes, pageRes, crawlRes] = await Promise.all([
      fetchWithRetry(`${BING_API_BASE}/GetQueryStats?siteUrl=${encodedSite}&apikey=${encodedKey}`, {
        cache: 'no-store',
      }),
      fetchWithRetry(`${BING_API_BASE}/GetPageStats?siteUrl=${encodedSite}&apikey=${encodedKey}`, {
        cache: 'no-store',
      }),
      fetchWithRetry(`${BING_API_BASE}/GetCrawlStats?siteUrl=${encodedSite}&apikey=${encodedKey}`, {
        cache: 'no-store',
      }).catch(() => null),
    ]);

    if (!queryRes.ok) {
      const errBody = (await queryRes.text().catch(() => '')).slice(0, 240);
      return {
        status: 'ERROR',
        configured: true,
        siteUrl,
        fetchedAt,
        errorMessage: `Bing Webmaster API returned HTTP ${queryRes.status}${errBody ? `: ${errBody}` : ''}`,
        missingRequirements: [],
        setupInstructions,
        totals: null,
        topQueries: [],
        topPages: [],
      };
    }

    const queryJson = await queryRes.json().catch(() => ({ d: [] }));
    const pageJson = pageRes.ok ? await pageRes.json().catch(() => ({ d: [] })) : { d: [] };
    const crawlJson = crawlRes && crawlRes.ok ? await crawlRes.json().catch(() => ({ d: [] })) : { d: [] };

    const rawQueries: any[] = Array.isArray(queryJson?.d) ? queryJson.d : [];
    const rawPages: any[] = Array.isArray(pageJson?.d) ? pageJson.d : [];
    const rawCrawl: any[] = Array.isArray(crawlJson?.d) ? crawlJson.d : [];

    // Aggregate query rows across dates
    const queryMap = new Map<string, { clicks: number; impressions: number; posWeight: number }>();
    for (const row of rawQueries) {
      const q = String(row.Query || '').trim();
      if (!q) continue;
      const clicks = Number(row.Clicks || 0);
      const impressions = Number(row.Impressions || 0);
      const avgPos = Number(row.AvgImpressionPosition || 0);
      const prev = queryMap.get(q) || { clicks: 0, impressions: 0, posWeight: 0 };
      prev.clicks += clicks;
      prev.impressions += impressions;
      prev.posWeight += avgPos * impressions;
      queryMap.set(q, prev);
    }

    const topQueries: BingQueryRow[] = Array.from(queryMap.entries())
      .map(([query, v]) => ({
        query,
        clicks: v.clicks,
        impressions: v.impressions,
        ctr: v.impressions > 0 ? Number(((v.clicks / v.impressions) * 100).toFixed(2)) : 0,
        avgPosition: v.impressions > 0 ? Number((v.posWeight / v.impressions).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 25);

    const pageMap = new Map<string, { clicks: number; impressions: number; posWeight: number }>();
    for (const row of rawPages) {
      const url = String(row.Query || row.Url || '').trim();
      if (!url) continue;
      const clicks = Number(row.Clicks || 0);
      const impressions = Number(row.Impressions || 0);
      const avgPos = Number(row.AvgImpressionPosition || 0);
      const prev = pageMap.get(url) || { clicks: 0, impressions: 0, posWeight: 0 };
      prev.clicks += clicks;
      prev.impressions += impressions;
      prev.posWeight += avgPos * impressions;
      pageMap.set(url, prev);
    }

    const topPages: BingPageRow[] = Array.from(pageMap.entries())
      .map(([url, v]) => ({
        url,
        clicks: v.clicks,
        impressions: v.impressions,
        avgPosition: v.impressions > 0 ? Number((v.posWeight / v.impressions).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 20);

    const latestCrawl = rawCrawl.length > 0 ? rawCrawl[rawCrawl.length - 1] : null;
    const totalClicks = topQueries.reduce((s, q) => s + q.clicks, 0);
    const totalImpressions = topQueries.reduce((s, q) => s + q.impressions, 0);

    return {
      status: 'CONNECTED',
      configured: true,
      siteUrl,
      fetchedAt,
      errorMessage: null,
      missingRequirements: [],
      setupInstructions: [],
      totals: {
        clicks: totalClicks,
        impressions: totalImpressions,
        ctr: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
        crawledPages: latestCrawl ? Number(latestCrawl.CrawledPages || 0) : null,
        crawlErrors: latestCrawl ? Number(latestCrawl.CrawlErrors || 0) : null,
        inIndex: latestCrawl ? Number(latestCrawl.InIndex || 0) : null,
      },
      topQueries,
      topPages,
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      configured: true,
      siteUrl,
      fetchedAt,
      errorMessage: err?.message || 'Bing Webmaster API query failed.',
      missingRequirements: [],
      setupInstructions,
      totals: null,
      topQueries: [],
      topPages: [],
    };
  }
}

export async function submitSitemapToBingWebmaster(triggeredBy = 'admin') {
  const { apiKey, siteUrl } = getBingConfig();
  const feedUrl = `${CANONICAL_ORIGIN}/sitemap.xml`;

  if (!apiKey) {
    appendIndexingEntry({
      url: feedUrl,
      protocol: 'bing_webmaster',
      state: 'NOT_CONFIGURED',
      httpStatus: null,
      responseSummary: 'BING_WEBMASTER_API_KEY is not configured.',
      errorMessage: 'BING_WEBMASTER_API_KEY missing in environment.',
      triggeredBy,
    });
    return { success: false, state: 'NOT_CONFIGURED', message: 'BING_WEBMASTER_API_KEY is not configured.' };
  }

  try {
    const res = await fetch(`${BING_API_BASE}/SubmitFeed?apikey=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ siteUrl, feedUrl }),
      signal: AbortSignal.timeout(8000),
    });

    const accepted = res.ok;
    appendIndexingEntry({
      url: feedUrl,
      protocol: 'bing_webmaster',
      state: accepted ? 'SUBMISSION_ACCEPTED' : 'SUBMISSION_FAILED',
      httpStatus: res.status,
      responseSummary: accepted
        ? `Submitted ${feedUrl} to Bing Webmaster Tools (HTTP ${res.status}).`
        : `Bing SubmitFeed returned HTTP ${res.status}.`,
      errorMessage: accepted ? null : `HTTP ${res.status}`,
      triggeredBy,
    });

    return {
      success: accepted,
      state: accepted ? 'SUBMISSION_ACCEPTED' : 'SUBMISSION_FAILED',
      message: accepted ? 'Sitemap feed submitted to Bing Webmaster Tools.' : `Bing SubmitFeed HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      state: 'SUBMISSION_FAILED',
      message: err?.message || 'Bing SubmitFeed request failed.',
    };
  }
}
