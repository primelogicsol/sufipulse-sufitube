"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const scrollHistory = new Map();

function getScrollKey() {
  return window.location.pathname + window.location.search;
}

function snap() {
  return {
    scrollY: window.scrollY,
    docH: document.documentElement.scrollHeight,
    activeEl: (document.activeElement?.tagName || "?") + "#" + (document.activeElement?.id || "") + "." + ((document.activeElement?.className || "").toString().slice(0,20)),
  };
}

export function ScrollToTop() {
  const pathname = usePathname();
  const isBackForwardRef = useRef(false);
  const observersRef = useRef([]);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

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

  // Main scroll logic
  useEffect(() => {
    const key = getScrollKey();
    const isBackForward = isBackForwardRef.current;
    const savedPos = scrollHistory.get(key) ?? 0;
    const hasHash = !!window.location.hash;

    console.log('[ScrollToTop] ROUTE CHANGE ->', key, '| isBackForward:', isBackForward, '| savedPos:', savedPos, '| hash:', window.location.hash || 'none');
    console.log("[ScrollToTop] T+0", snap());

    // ---- attach layout-shift observer ----
    const observers = [];
    if (typeof PerformanceObserver !== "undefined") {
      try {
        const lsObs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              console.log('[LAYOUT-SHIFT]', {
                value: entry.value.toFixed(4),
                scrollY: window.scrollY,
                docH: document.documentElement.scrollHeight,
                activeEl: document.activeElement?.tagName + "#" + (document.activeElement?.id || ""),
              });
            }
          }
        });
        lsObs.observe({ type: "layout-shift", buffered: false });
        observers.push(lsObs);
      } catch(e) {}
    }

    // ---- focusin listener ----
    const onFocusIn = (e) => {
      console.log('[FOCUS-IN] scrollY =', window.scrollY, '| target:', e.target?.tagName, '#' + (e.target?.id || ''), '.' + (e.target?.className?.toString()?.slice(0,30) || ''));
    };
    window.addEventListener('focusin', onFocusIn);
    observers.push({ disconnect: () => window.removeEventListener("focusin", onFocusIn) });

    if (hasHash) {
      console.log('[ScrollToTop] HASH nav -- deferring to browser');
      isBackForwardRef.current = false;
      return () => observers.forEach(o => o.disconnect());
    }

    if (isBackForward) {
      console.log('[ScrollToTop] RESTORE', key, '-- saved =', savedPos);
      isBackForwardRef.current = false;
      window.scrollTo({ top: savedPos, left: 0, behavior: 'instant' });
      if (savedPos > 0) {
        [100, 300, 600].forEach(delay => {
          setTimeout(() => {
            const ph = document.documentElement.scrollHeight;
            const cp = window.scrollY;
            if (ph > savedPos && Math.abs(cp - savedPos) > 50) {
              console.log('[ScrollToTop] RESTORE retry +' + delay + 'ms ->', savedPos, '| was', cp);
              window.scrollTo({ top: savedPos, left: 0, behavior: 'instant' });
            }
          }, delay);
        });
      }
    } else {
      console.log('[ScrollToTop] TOP -- calling scrollTo(0,0)');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Timeline probe
    [16, 50, 100, 250, 500, 750, 1000, 1500].forEach(delay => {
      setTimeout(() => {
        console.log('[ScrollToTop] T+' + delay + 'ms', snap());
      }, delay);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [pathname]);

  return null;
}
