/**
 * server/services/instant-indexer.ts
 *
 * Real-time Instant Search Engine Indexing Engine.
 * Submits published releases and discovery pages directly to IndexNow (Bing, Yahoo,
 * Yandex, Seznam, Perplexity) and Google Search Console endpoints for sub-15-minute crawling.
 */

import { logger } from '@/app/lib/logger';

export interface IndexingResult {
  url: string;
  indexNowStatus: 'submitted' | 'skipped' | 'failed';
  googlePingStatus: 'submitted' | 'skipped' | 'failed';
  timestamp: string;
  details?: string;
}

export async function submitInstantIndexing(targetUrl: string): Promise<IndexingResult> {
  const host = 'www.sufipulse.com';
  const cleanUrl = targetUrl.startsWith('http') ? targetUrl : `https://${host}${targetUrl}`;
  const now = new Date().toISOString();

  let indexNowStatus: 'submitted' | 'skipped' | 'failed' = 'skipped';
  let googlePingStatus: 'submitted' | 'skipped' | 'failed' = 'skipped';
  const detailLogs: string[] = [];

  // 1. IndexNow API (Supported by Bing, Yahoo, Yandex, Seznam, and used by AI search engines)
  try {
    const indexNowKey = process.env.INDEXNOW_KEY || 'sufipulse-discovery-indexnow-key-2026';
    const indexNowPayload = {
      host,
      key: indexNowKey,
      keyLocation: `https://${host}/${indexNowKey}.txt`,
      urlList: [cleanUrl],
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(indexNowPayload),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok || res.status === 200 || res.status === 202) {
      indexNowStatus = 'submitted';
      detailLogs.push(`IndexNow accepted URL: HTTP ${res.status}`);
    } else {
      indexNowStatus = 'failed';
      detailLogs.push(`IndexNow returned HTTP ${res.status}`);
    }
  } catch (err: any) {
    indexNowStatus = 'failed';
    detailLogs.push(`IndexNow network error: ${err.message}`);
  }

  // 2. Google Sitemap Ping endpoint
  try {
    const sitemapUrl = encodeURIComponent(`https://${host}/sitemap.xml`);
    const googlePingUrl = `https://www.google.com/ping?sitemap=${sitemapUrl}`;

    const gRes = await fetch(googlePingUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(6000),
    });

    if (gRes.ok || gRes.status === 200) {
      googlePingStatus = 'submitted';
      detailLogs.push('Google sitemap ping accepted');
    } else {
      googlePingStatus = 'failed';
      detailLogs.push(`Google ping HTTP ${gRes.status}`);
    }
  } catch (err: any) {
    // In local dev without internet or on rate limits, fallback gracefully
    googlePingStatus = 'skipped';
    detailLogs.push(`Google ping notice: ${err.message}`);
  }

  const result: IndexingResult = {
    url: cleanUrl,
    indexNowStatus,
    googlePingStatus,
    timestamp: now,
    details: detailLogs.join(' | '),
  };

  logger.api.info(`[InstantIndexer] Processed ${cleanUrl}: ${result.details}`);
  return result;
}
