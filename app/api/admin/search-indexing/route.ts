import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import {
  getSearchIndexingLogSnapshot,
  getUrlIndexingDiagnostics,
  submitUrlsViaIndexNow,
  verifyPublicIndexNowKey,
} from '@/lib/search-indexing-service';
import {
  getGoogleSearchConsoleStatus,
  inspectUrlInGoogleSearchConsole,
  submitSitemapToGoogleSearchConsole,
} from '@/lib/google-search-console';
import {
  getBingWebmasterReport,
  submitSitemapToBingWebmaster,
} from '@/lib/bing-webmaster';
import { runPublishedReleaseDiscoveryPipeline } from '@/lib/release-discovery-pipeline';
import { canonicalUrl } from '@/lib/canonical-seo';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const slug = searchParams.get('slug');
    const forceKeyCheck = searchParams.get('verifyKey') === '1';

    const [keyCheck, gscStatus, bingReport] = await Promise.all([
      verifyPublicIndexNowKey(forceKeyCheck),
      getGoogleSearchConsoleStatus(),
      getBingWebmasterReport(),
    ]);

    const resolvedUrl = targetUrl
      ? canonicalUrl(targetUrl)
      : slug
        ? canonicalUrl(`/release-detail/${slug}`)
        : null;

    const urlDiagnostics = resolvedUrl ? getUrlIndexingDiagnostics(resolvedUrl) : null;
    const logSnapshot = getSearchIndexingLogSnapshot(50);

    return NextResponse.json({
      indexNow: keyCheck,
      googleSearchConsole: gscStatus,
      bingWebmaster: {
        status: bingReport.status,
        configured: bingReport.configured,
        siteUrl: bingReport.siteUrl,
        missingRequirements: bingReport.missingRequirements,
        setupInstructions: bingReport.setupInstructions,
      },
      urlDiagnostics,
      logSnapshot,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load indexing diagnostics.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'submit_indexnow');
    const actor = authResult.email || authResult.id || 'admin';

    if (action === 'submit_indexnow') {
      const urls: string[] = Array.isArray(body.urls)
        ? body.urls
        : body.url
          ? [String(body.url)]
          : body.slug
            ? [canonicalUrl(`/release-detail/${body.slug}`)]
            : [];

      if (urls.length === 0) {
        return NextResponse.json({ error: 'Provide url, slug, or urls[] to submit.' }, { status: 400 });
      }

      const res = await submitUrlsViaIndexNow(urls, actor);
      const urlDiagnostics = getUrlIndexingDiagnostics(urls[0]);
      return NextResponse.json({
        ...res,
        urlDiagnostics,
      });
    }

    if (action === 'run_release_pipeline') {
      const releaseId = String(body.releaseId || body.slug || '').trim();
      if (!releaseId) {
        return NextResponse.json({ error: 'releaseId or slug is required.' }, { status: 400 });
      }
      const res = await runPublishedReleaseDiscoveryPipeline(releaseId, actor);
      const urlDiagnostics = getUrlIndexingDiagnostics(res.canonicalUrl);
      return NextResponse.json({
        ...res,
        urlDiagnostics,
      });
    }

    if (action === 'submit_gsc_sitemap') {
      const res = await submitSitemapToGoogleSearchConsole(actor);
      return NextResponse.json(res);
    }

    if (action === 'inspect_gsc_url') {
      const url = canonicalUrl(String(body.url || ''));
      const res = await inspectUrlInGoogleSearchConsole(url, actor);
      return NextResponse.json(res);
    }

    if (action === 'submit_bing_sitemap') {
      const res = await submitSitemapToBingWebmaster(actor);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Indexing action failed.' }, { status: 500 });
  }
}
