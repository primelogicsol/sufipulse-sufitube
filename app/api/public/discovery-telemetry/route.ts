import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { crawlerRegistry } from '@/lib/crawler-registry';
import {
  classifyReferrerChannel,
  organicDiscoveryTelemetry,
  type OrganicEventType,
} from '@/lib/organic-discovery-telemetry';
import { discoveryAnalytics } from '@/lib/discovery-analytics';

export const dynamic = 'force-dynamic';

const VALID_EVENTS = new Set<OrganicEventType>([
  'organic_entrance',
  'discovery_page_view',
  'release_page_view',
  'embedded_video_play',
  'outbound_youtube_click',
  'subscribe_intent',
]);

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get('user-agent') || '';
    const body = await request.json().catch(() => ({}));
    const rawPath = String(body.path || '/').slice(0, 300);

    // Exclude bots from human funnel metrics while recording real bot visits
    if (crawlerRegistry.isBot(ua)) {
      crawlerRegistry.logVisit(ua, rawPath);
      return NextResponse.json({ ok: true, recorded: false, botLogged: true });
    }

    const eventType = body.eventType as OrganicEventType;
    if (!VALID_EVENTS.has(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    const ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'anon';
    const dayBucket = new Date().toISOString().split('T')[0];
    const sessionHash = createHash('sha256')
      .update(`${ip}|${ua.slice(0, 120)}|${dayBucket}`)
      .digest('hex')
      .slice(0, 16);

    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : '';
    const utmSource = typeof body.utmSource === 'string' ? body.utmSource.slice(0, 100) : undefined;
    const utmMedium = typeof body.utmMedium === 'string' ? body.utmMedium.slice(0, 100) : undefined;
    const utmCampaign = typeof body.utmCampaign === 'string' ? body.utmCampaign.slice(0, 120) : undefined;

    const { channel, referrerHost } = classifyReferrerChannel(referrer, utmSource);

    const isReturningVisitor = request.cookies.get('sp_rl_v1')?.value === '1';

    const recorded = organicDiscoveryTelemetry.recordEvent({
      sessionHash,
      isReturningVisitor,
      eventType,
      path: rawPath,
      releaseSlug: body.releaseSlug ? String(body.releaseSlug).slice(0, 140) : undefined,
      youtubeId: body.youtubeId ? String(body.youtubeId).slice(0, 30) : undefined,
      entityType: body.entityType ? String(body.entityType).slice(0, 50) : undefined,
      entitySlug: body.entitySlug ? String(body.entitySlug).slice(0, 140) : undefined,
      referrerHost: referrerHost || undefined,
      referrerChannel: channel,
      utmSource,
      utmMedium,
      utmCampaign,
      destinationUrl: body.destinationUrl ? String(body.destinationUrl).slice(0, 400) : undefined,
    });

    // Mirror outbound YouTube & subscribe conversions into discoveryAnalytics when tied to a discovery entity
    if (body.entitySlug && (eventType === 'outbound_youtube_click' || eventType === 'subscribe_intent')) {
      const mappedAction = eventType === 'subscribe_intent' ? 'subscribe_click' : 'video_click';
      discoveryAnalytics.recordClick('discovery_entity', String(body.entitySlug), mappedAction, {
        sourcePage: rawPath,
      });
    }

    const res = NextResponse.json({ ok: true, recorded: true, id: recorded.id, channel });
    if (!isReturningVisitor && eventType === 'organic_entrance') {
      res.cookies.set('sp_rl_v1', '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Telemetry error' }, { status: 500 });
  }
}
