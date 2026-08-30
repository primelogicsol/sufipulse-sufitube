"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Keyed on pathname+search so /knowledge?page=1 and /knowledge?page=2 are independent.
const scrollHistory = new Map<string, number>();

function getScrollKey() {
  return window.location.pathname + window.location.search;
}

/**
 * Routes that ALWAYS start at the top — regardless of navigation type.
 *
 * This includes Back/Forward. These are hero/heading-oriented pages where
 * restoring a deep scroll position would disorient the visitor.
 *
 * Current always-top route family:
 *   /
 *   /knowledge
 *   /knowledge/*
 *
 * All other routes use intelligent Back/Forward restoration.
 */
function shouldAlwaysStartAtTop(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/knowledge' ||
    pathname.startsWith('/knowledge/')
  );
}

/**
 * ScrollToTop — global SPA scroll contract
 *
 * Decision order (evaluated top-to-bottom):
 *   1. Explicit hash  → native anchor behaviour
 *   2. always-top route  → TOP  (overrides Back/Forward)
 *   3. genuine Back/Forward on other routes  → restore saved position
 *   4. all other navigation  → TOP
 *
 * Initial page load (navigate/reload) is handled by the pre-hydration
 * inline <script> in layout.tsx. This component manages SPA transitions only.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isBackForwardRef = useRef(false);

  // ── One-time setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    const onPopState = () => { isBackForwardRef.current = true; };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ── Save position when leaving a route ──────────────────────────────────
  // Never save always-top routes — stale entries would serve no purpose
  // and could reintroduce restoration on future changes.
  useEffect(() => {
    return () => {
      const leavingPath = window.location.pathname;
      if (!shouldAlwaysStartAtTop(leavingPath)) {
        scrollHistory.set(getScrollKey(), window.scrollY);
      } else {
        // Delete any previously stored position for this route so
        // stale state cannot be reintroduced.
        scrollHistory.delete(getScrollKey());
      }
    };
  }, [pathname]);

  // ── Scroll decision for the newly-active route ───────────────────────────
  useEffect(() => {
    const isBackForward = isBackForwardRef.current;
    isBackForwardRef.current = false;

    // 1. Explicit hash — let the browser scroll to the anchor.
    if (window.location.hash) return;

    // 2. Always-top routes — TOP unconditionally (overrides Back/Forward).
    if (shouldAlwaysStartAtTop(pathname)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }

    // 3. Genuine Back/Forward on all other routes — restore saved position.
    if (isBackForward) {
      const saved = scrollHistory.get(getScrollKey()) ?? 0;
      window.scrollTo({ top: saved, left: 0, behavior: 'instant' });

      // Retry for async-loaded pages whose content inflates the DOM post-mount.
      if (saved > 0) {
        [100, 300, 600].forEach(delay => {
          setTimeout(() => {
            if (Math.abs(window.scrollY - saved) > 50) {
              window.scrollTo({ top: saved, left: 0, behavior: 'instant' });
            }
          }, delay);
        });
      }
      return;
    }

    // 4. All other navigation (PUSH) — TOP.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
