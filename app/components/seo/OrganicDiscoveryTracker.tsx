"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function sendTelemetry(payload: Record<string, any>) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/public/discovery-telemetry', blob);
      return;
    }
    fetch('/api/public/discovery-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

const DISCOVERY_PREFIXES = [
  '/discovery',
  '/concepts/',
  '/themes/',
  '/moods/',
  '/regions/',
  '/knowledge',
  '/literary-journal',
  '/sufitube',
  '/official-channels',
];

export function OrganicDiscoveryTracker() {
  const pathname = usePathname() || '/';

  // 1. Track external entrance once per browser session + route-level discovery/release views
  useEffect(() => {
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/user') ||
      pathname.startsWith('/partners') ||
      pathname.startsWith('/api')
    ) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source') || undefined;
    const utmMedium = params.get('utm_medium') || undefined;
    const utmCampaign = params.get('utm_campaign') || undefined;
    const referrer = document.referrer || '';

    try {
      if (!sessionStorage.getItem('sp_organic_entrance_logged')) {
        sessionStorage.setItem('sp_organic_entrance_logged', '1');
        sendTelemetry({
          eventType: 'organic_entrance',
          path: pathname,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
        });
      }
    } catch {}

    const releaseMatch = pathname.match(/^\/release-detail\/([^/]+)/);
    if (releaseMatch) {
      sendTelemetry({
        eventType: 'release_page_view',
        path: pathname,
        releaseSlug: decodeURIComponent(releaseMatch[1]),
        referrer,
        utmSource,
      });
      return;
    }

    if (DISCOVERY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
      const parts = pathname.split('/').filter(Boolean);
      sendTelemetry({
        eventType: 'discovery_page_view',
        path: pathname,
        entityType: parts[0],
        entitySlug: parts[parts.length - 1],
        referrer,
        utmSource,
      });
    }
  }, [pathname]);

  // 2. Delegated listener for outbound YouTube watch / channel / subscribe clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      let targetUrl = href;
      if (href.startsWith('/api/track-click')) {
        try {
          const parsed = new URL(href, window.location.origin);
          targetUrl = parsed.searchParams.get('redirect') || decodeURIComponent(href);
        } catch {
          try {
            targetUrl = decodeURIComponent(href);
          } catch {}
        }
      }
      if (!targetUrl.includes('youtube.com') && !targetUrl.includes('youtu.be')) return;

      const currentPath = window.location.pathname || '/';
      if (currentPath.startsWith('/admin')) return;

      const releaseMatch = currentPath.match(/^\/release-detail\/([^/]+)/);
      const discoveryMatch = currentPath.match(/^\/discovery\/([^/]+)\/([^/]+)/);
      const isSubscribe =
        targetUrl.includes('sub_confirmation=1') ||
        anchor.dataset.conversionIntent === 'subscribe' ||
        /subscribe|follow channel/i.test(anchor.textContent || '');

      const videoIdMatch =
        targetUrl.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
        targetUrl.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);

      sendTelemetry({
        eventType: isSubscribe ? 'subscribe_intent' : 'outbound_youtube_click',
        path: currentPath,
        releaseSlug: releaseMatch ? decodeURIComponent(releaseMatch[1]) : undefined,
        entityType: discoveryMatch ? discoveryMatch[1] : undefined,
        entitySlug: discoveryMatch ? decodeURIComponent(discoveryMatch[2]) : undefined,
        youtubeId: videoIdMatch ? videoIdMatch[1] : undefined,
        destinationUrl: targetUrl,
      });
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  return null;
}
