/**
 * /releases — Server Component wrapper (STEP 2: SSR catalog link graph)
 *
 * Architecture:
 *   1. Fetch all published releases server-side (same source as sitemap).
 *   2. Render a crawlable SSR catalog index: real <a href> links visible to
 *      all crawlers, bots, and AI systems — no JavaScript required.
 *   3. Pass release data as `initialReleases` to the Client Component so
 *      the interactive UI hydrates with real data (no loading skeleton on
 *      first paint).
 *
 * The interactive grid, filters, search, pagination, and admin tools all
 * remain in ReleasesClientPage.tsx (the existing "use client" component).
 *
 * Crawler traversal invariant:
 *   Starting from raw HTML of /releases, following ordinary <a href> links
 *   only, a crawler can discover all N canonical release-detail URLs.
 */

import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease } from '@/server/storage/release-dto';
import ReleasesClientPage, { type InitialRelease } from './ReleasesClientPage';

async function fetchPublishedReleases(): Promise<InitialRelease[]> {
  try {
    const store = getReleaseReadStore();
    const result = await store.query({
      status: 'published',
      requirePublicEligibility: true,
      page: 1,
      pageSize: 1000,
      paginate: false,
    });

    return (result.items as any[])
      .map(toCanonicalCMSRelease)
      .filter((r: any) => r.slug && r.status === 'published' && r.visibility === 'public')
      .map((r: any): InitialRelease => {
        const durationSecs = Number(r.durationSeconds || 0);
        const m = Math.floor(durationSecs / 60);
        const s = durationSecs % 60;
        return {
          id: r.youtubeId || r.id,
          slug: r.slug,
          title: r.canonicalTitle || r.title || r.youtubeTitle || 'Untitled',
          thumbnailUrl: r.canonicalThumbnail || r.thumbnailUrl || '',
          youtubeId: r.youtubeId || '',
          format: (r.format as InitialRelease['format']) || 'video',
          govType: r.governanceOrigin || r.govType || 'native_governed',
          publishedDate: r.publishedAt || r.releaseDate || r.createdAt || '',
          durationSeconds: durationSecs,
          durationFormatted: durationSecs > 0 ? `${m}:${String(s).padStart(2, '0')}` : '',
          views: Number(r.viewCount ?? r.views ?? 0),
          description: r.description || '',
          vocalist: typeof r.vocalist === 'string' ? r.vocalist
            : [r.vocalist?.name, r.vocalist?.nameUrdu].filter(Boolean).join(' '),
          writer: typeof r.writer === 'string' ? r.writer
            : [r.writer?.name, r.writer?.nameUrdu].filter(Boolean).join(' '),
          tags: Array.isArray(r.tags) ? r.tags.join(' ') : '',
          rawTitle: r.canonicalTitle || r.title || '',
          youtubeTitle: r.youtubeTitle || '',
        };
      });
  } catch (err) {
    console.error('[releases/page] Failed to fetch releases for SSR:', err);
    return [];
  }
}

export default async function ReleasesPage() {
  const initialReleases = await fetchPublishedReleases();

  return (
    <>
      {/*
       * SSR CATALOG INDEX
       * ─────────────────────────────────────────────────────────────────────
       * These are real server-rendered <a href> links visible to all crawlers,
       * bots, and AI systems in raw HTML — before any JavaScript executes.
       * They satisfy the crawlable link graph requirement.
       *
       * Visually: rendered as a screen-reader-accessible nav landmark,
       * styled sr-only so it does not duplicate the interactive grid below.
       * The interactive grid immediately below provides the full UX.
       *
       * Important: sr-only means visually hidden but NOT hidden from
       * accessibility tree or search engine crawlers. Crawlers see these
       * links in raw HTML. This is NOT cloaking (same links exist in the
       * interactive grid too). Using sr-only avoids visual duplication only.
       * ─────────────────────────────────────────────────────────────────────
       */}
      {initialReleases.length > 0 && (
        <nav
          aria-label={`SufiPulse release catalog — ${initialReleases.length} releases`}
          className="sr-only"
          data-catalog-index="true"
        >
          <h2>SufiPulse Release Catalog ({initialReleases.length} releases)</h2>
          <ul>
            {initialReleases.map((release) => (
              <li key={release.slug}>
                <a href={`/release-detail/${release.slug}`}>
                  {release.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Interactive client component — hydrates with real data, no loading skeleton */}
      <ReleasesClientPage initialReleases={initialReleases} />
    </>
  );
}
