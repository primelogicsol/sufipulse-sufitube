import { NextRequest, NextResponse } from 'next/server';
import { discoveryAnalytics, type DiscoverySourceType, type DiscoveryActionType } from '@/lib/discovery-analytics';
import { crawlerRegistry } from '@/lib/crawler-registry';

export const dynamic = 'force-dynamic';

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const botSubstrings = [
    'googlebot', 'bingbot', 'yandexbot', 'baiduspider', 'duckduckbot',
    'slurp', 'semrush', 'ahrefs', 'dotbot', 'rogerbot', 'exabot',
    'fast', 'ia_archiver', 'facebot', 'facebookexternalhit',
    'twitterbot', 'linkedinbot', 'pingdom', 'gptbot', 'chatgpt',
    'claudebot', 'perplexity', 'applebot', 'screaming frog', 'mj12bot'
  ];
  return botSubstrings.some(bot => ua.includes(bot));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as DiscoverySourceType;
    const slug = searchParams.get('slug');
    const action = searchParams.get('action') as DiscoveryActionType;
    const redirectUrl = searchParams.get('redirect') || '/';

    // Metadata for Brand Asset clicks
    const assetType = searchParams.get('assetType') || undefined;
    const assetName = searchParams.get('assetName') || undefined;
    const sourcePage = searchParams.get('sourcePage') || undefined;

    const validSourceTypes: DiscoverySourceType[] = ['concept', 'theme', 'region', 'release', 'playlist'];
    const validActionTypes: DiscoveryActionType[] = ['video_click', 'playlist_click', 'subscribe_click', 'page_view', 'brand_asset_click'];

    const userAgent = request.headers.get('user-agent') || '';
    const isRequestBot = isBot(userAgent);

    // If it is a bot, log the visit in the Crawler Registry for authority monitoring
    if (isRequestBot) {
      crawlerRegistry.logVisit(userAgent, redirectUrl || '/');
    }

    const isJson = searchParams.get('json') === 'true' || action === 'page_view';

    let shouldRecord = validSourceTypes.includes(type) && validActionTypes.includes(action) && !!slug && !isRequestBot;

    // Apply Duplicate View Protection (Throttling) for page views
    const cookieName = `sp_pv_${type}_${slug}`;
    if (action === 'page_view' && shouldRecord && slug) {
      const hasViewed = request.cookies.has(cookieName);
      if (hasViewed) {
        shouldRecord = false;
      }
    }

    if (shouldRecord && slug) {
      discoveryAnalytics.recordClick(type, slug, action, {
        assetType,
        assetName,
        sourcePage
      });
    }

    let response: NextResponse;
    if (isJson) {
      response = NextResponse.json({ success: true, recorded: shouldRecord, isBot: isRequestBot });
    } else {
      response = NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Set cookie if we logged a new page view
    if (action === 'page_view' && shouldRecord && slug) {
      response.cookies.set(cookieName, '1', {
        maxAge: 60 * 15, // 15 minutes duplicate view protection
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
      });
    }

    return response;
  } catch (error) {
    console.error('[TRACK-CLICK] Telemetry redirect error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
