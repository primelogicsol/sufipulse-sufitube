/**
 * server/services/instant-indexer.ts
 *
 * Authoritative Search Engine Submission Bridge.
 * Delegates to lib/search-indexing-service.ts so:
 *   1. Non-public / draft / approved / unpublished URLs are strictly blocked.
 *   2. Canonical non-www https://sufipulse.com URLs are enforced.
 *   3. Google's retired /ping?sitemap= endpoint (HTTP 404 since 2023) is never called.
 *   4. IndexNow keyLocation reachability is verified before claiming submission.
 */

import { logger } from '@/app/lib/logger';
import { canonicalUrl } from '@/lib/canonical-seo';
import { submitUrlsViaIndexNow } from '@/lib/search-indexing-service';
import { submitSitemapToGoogleSearchConsole } from '@/lib/google-search-console';

export interface IndexingResult {
  url: string;
  indexNowStatus: 'submitted' | 'skipped' | 'failed';
  googlePingStatus: 'submitted' | 'skipped' | 'failed';
  timestamp: string;
  details?: string;
}

export async function submitInstantIndexing(targetUrl: string): Promise<IndexingResult> {
  const cleanUrl = canonicalUrl(targetUrl);
  const now = new Date().toISOString();

  const indexNowRes = await submitUrlsViaIndexNow([cleanUrl], 'instant_indexer');
  const gscRes = await submitSitemapToGoogleSearchConsole('instant_indexer');

  const indexNowStatus: IndexingResult['indexNowStatus'] = indexNowRes.accepted
    ? 'submitted'
    : indexNowRes.state === 'NOT_CONFIGURED' || indexNowRes.state === 'NOT_ELIGIBLE_PRIVATE'
      ? 'skipped'
      : 'failed';

  const googlePingStatus: IndexingResult['googlePingStatus'] = gscRes.success
    ? 'submitted'
    : gscRes.state === 'NOT_CONFIGURED' || gscRes.state === 'CONFIGURED_UNVERIFIED'
      ? 'skipped'
      : 'failed';

  const result: IndexingResult = {
    url: cleanUrl,
    indexNowStatus,
    googlePingStatus,
    timestamp: now,
    details: `${indexNowRes.message} | GSC: ${gscRes.message}`,
  };

  logger.api.info(`[InstantIndexer] Processed ${cleanUrl}: ${result.details}`);
  return result;
}
