"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Keyed on pathname + search so paginated/filtered routes are tracked independently.
const scrollHistory = new Map();

function getScrollKey() {
  return window.location.pathname + window.location.search;
}

export function ScrollToTop() {
  const pathname = usePathname();
  const isBackForwardRef = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    const onPopState = () => {
      console.log('[ScrollToTop] popstate fired -- next nav classified as POP/RESTORE');
      isBackForwardRef.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Save position when LEAVING the current route.
  useEffect(() => {
    return () => {
      const key = getScrollKey();
      const pos = window.scrollY;
      scrollHistory.set(key, pos);
      console.log('[ScrollToTop] SAVE', key, '-> scrollY =', pos);
    };
  }, [pathname]);

  // Scroll logic on route change
  useEffect(() => {
    const key = getScrollKey();
    const isBackForward = isBackForwardRef.current;
    const savedPos = scrollHistory.get(key) ?? 0;
    const hasHash = !!window.location.hash;

    if (hasHash) {
      console.log('[ScrollToTop] HASH nav to', key, '-- deferring to browser');
      isBackForwardRef.current = false;
      return;
    }

    if (isBackForward) {
      console.log('[ScrollToTop] RESTORE', key, '-- saved =', savedPos, '| scrollY before =', window.scrollY);
      isBackForwardRef.current = false;
      window.scrollTo({ top: savedPos, left: 0, behavior: 'instant' });
      if (savedPos > 0) {
        [100, 300, 600].forEach(delay => {
          setTimeout(() => {
            const pageHeight = document.body.scrollHeight;
            const currentPos = window.scrollY;
            if (pageHeight > savedPos && Math.abs(currentPos - savedPos) > 50) {
              console.log('[ScrollToTop] RESTORE retry at +' + delay + 'ms, scrollY =', currentPos, '->', savedPos);
              window.scrollTo({ top: savedPos, left: 0, behavior: 'instant' });
            }
          }, delay);
        });
      }
    } else {
      console.log('[ScrollToTop] TOP nav to', key, '| scrollY before =', window.scrollY, '| isBackForward was', isBackForward);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Diagnostic: report scrollY at multiple points after nav
    [50, 250, 750].forEach(delay => {
      setTimeout(() => {
        console.log('[ScrollToTop] scrollY at +' + delay + 'ms:', window.scrollY, '| activeElement:', document.activeElement?.tagName, document.activeElement?.id || document.activeElement?.className?.slice(0,30) || '');
      }, delay);
    });
  }, [pathname]);

  return null;
}
