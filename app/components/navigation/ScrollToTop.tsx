"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Keyed on pathname+search so /knowledge?page=1 and /knowledge?page=2 are independent.
const scrollHistory = new Map<string, number>();

function getScrollKey() {
  return window.location.pathname + window.location.search;
}

/**
 * ScrollToTop — SPA scroll contract
 *
 * PUSH navigation   → TOP
 * POP  navigation   → restore saved position (with async-content retries)
 * Hash navigation   → defer to browser anchor behaviour
 *
 * Initial page load (navigate/reload) is handled by the pre-hydration
 * inline <script> in layout.tsx — this component only manages SPA transitions.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isBackForwardRef = useRef(false);

  // ── One-time setup ──────────────────────────────────────────────────
  // Re-assert manual scroll restoration (belt-and-suspenders alongside
  // the inline <script>) and listen for genuine Back/Forward navigation.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    const onPopState = () => { isBackForwardRef.current = true; };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ── Save position when leaving a route ──────────────────────────────
  useEffect(() => {
    return () => {
      scrollHistory.set(getScrollKey(), window.scrollY);
    };
  }, [pathname]);

  // ── Scroll decision for the newly-active route ───────────────────────
  useEffect(() => {
    // Hash URLs: let the browser handle the anchor.
    if (window.location.hash) return;

    if (isBackForwardRef.current) {
      // Genuine SPA Back/Forward: restore the saved position.
      isBackForwardRef.current = false;
      const saved = scrollHistory.get(getScrollKey()) ?? 0;
      window.scrollTo({ top: saved, left: 0, behavior: 'instant' });

      // Retry for pages whose async content inflates the DOM after mount.
      if (saved > 0) {
        [100, 300, 600].forEach(delay => {
          setTimeout(() => {
            if (Math.abs(window.scrollY - saved) > 50) {
              window.scrollTo({ top: saved, left: 0, behavior: 'instant' });
            }
          }, delay);
        });
      }
    } else {
      // New PUSH navigation: always start at hero/top.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return null;
}
