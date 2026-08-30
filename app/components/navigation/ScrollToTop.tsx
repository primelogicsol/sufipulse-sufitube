"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Keyed on pathname + search so paginated/filtered routes are tracked independently.
// e.g. /knowledge?page=1 and /knowledge?page=2 get separate saved positions.
const scrollHistory = new Map();

function getScrollKey() {
  return window.location.pathname + window.location.search;
}

export function ScrollToTop() {
  const pathname = usePathname();
  const isBackForwardRef = useRef(false);

  // One-time setup: disable browser scroll restoration and intercept popstate.
  // popstate fires on Back/Forward BEFORE pathname updates — flag it so the
  // next effect cycle can branch correctly.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    const onPopState = () => { isBackForwardRef.current = true; };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Save position when LEAVING the current route.
  // Cleanup runs just before the new pathname takes effect, so window.scrollY
  // still reflects the departing page. Key includes search params.
  useEffect(() => {
    return () => {
      scrollHistory.set(getScrollKey(), window.scrollY);
    };
  }, [pathname]);

  // Scroll logic on route change
  useEffect(() => {
    // Hash / anchor — let browser handle natively.
    if (window.location.hash) {
      isBackForwardRef.current = false;
      return;
    }

    if (isBackForwardRef.current) {
      isBackForwardRef.current = false;
      const key = getScrollKey();
      const saved = scrollHistory.get(key) ?? 0;

      // Attempt immediate restoration.
      window.scrollTo({ top: saved, left: 0, behavior: 'instant' });

      // For async / lazy-loaded pages: content may not be rendered at full
      // height yet when this effect fires. Retry at 100ms, 300ms, 600ms.
      // Stop once we are within 50px of the saved position.
      if (saved > 0) {
        [100, 300, 600].forEach(delay => {
          setTimeout(() => {
            const pageHeight = document.body.scrollHeight;
            const currentPos = window.scrollY;
            if (pageHeight > saved && Math.abs(currentPos - saved) > 50) {
              window.scrollTo({ top: saved, left: 0, behavior: 'instant' });
            }
          }, delay);
        });
      }
    } else {
      // New primary navigation: always start at the top.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return null;
}
