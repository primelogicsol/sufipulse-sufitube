"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const scrollHistory = new Map();

function getScrollKey() {
  return window.location.pathname + window.location.search;
}

function snap(label) {
  const s = {
    t: label,
    scrollY: window.scrollY,
    docH: document.documentElement.scrollHeight,
    active: (document.activeElement && document.activeElement !== document.body)
      ? document.activeElement.tagName + "#" + (document.activeElement.id || "") + "." + ((document.activeElement.className || "").toString().slice(0,20))
      : "body",
  };
  console.log("[ScrollToTop]", JSON.stringify(s));
  return s;
}

export function ScrollToTop() {
  const pathname = usePathname();
  const isBackForwardRef = useRef(false);

  // One-time setup: scrollRestoration + popstate
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const onPopState = () => {
      console.log('[ScrollToTop] popstate fired -> next nav = POP/RESTORE');
      isBackForwardRef.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Save position when LEAVING route
  useEffect(() => {
    return () => {
      const key = getScrollKey();
      const pos = window.scrollY;
      scrollHistory.set(key, pos);
      console.log('[ScrollToTop] SAVE', key, '-> scrollY =', pos);
    };
  }, [pathname]);

  // Main scroll decision
  useEffect(() => {
    const key = getScrollKey();
    const isBackForward = isBackForwardRef.current;
    const savedPos = scrollHistory.get(key) ?? 0;
    const hasHash = !!window.location.hash;

    // Navigation type from PerformanceAPI — distinguish initial navigate from back/forward
    const navEntry = performance.getEntriesByType("navigation")[0];
    const navType = navEntry ? navEntry.type : "unknown";

    console.log('[ScrollToTop] DECISION key=' + key,
      "| isBackForward=" + isBackForward,
      "| navType=" + navType,
      "| savedPos=" + savedPos,
      "| hash=" + (window.location.hash || "none")
    );
    snap("T+0 (useEffect fired)");

    // Attach layout-shift observer for this route
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
                active: document.activeElement?.tagName + "#" + (document.activeElement?.id || ""),
              });
            }
          }
        });
        lsObs.observe({ type: "layout-shift", buffered: false });
        observers.push(lsObs);
      } catch(e) {}
    }

    const onFocusIn = (e) => {
      console.log('[FOCUS-IN] scrollY=' + window.scrollY + ' target=' + (e.target?.tagName || '?') + '#' + (e.target?.id || '') + '.' + ((e.target?.className || '').toString().slice(0,30)));
    };
    window.addEventListener('focusin', onFocusIn);
    observers.push({ disconnect: () => window.removeEventListener("focusin", onFocusIn) });

    if (hasHash) {
      console.log('[ScrollToTop] -> HASH, deferring to browser');
      isBackForwardRef.current = false;
      return () => observers.forEach(o => o.disconnect());
    }

    // Genuine back/forward: popstate fired before this pathname change
    if (isBackForward) {
      console.log('[ScrollToTop] -> RESTORE, pos=' + savedPos);
      isBackForwardRef.current = false;
      window.scrollTo({ top: savedPos, left: 0, behavior: 'instant' });
      if (savedPos > 0) {
        [100, 300, 600].forEach(delay => {
          setTimeout(() => {
            const ph = document.documentElement.scrollHeight;
            const cp = window.scrollY;
            if (ph > savedPos && Math.abs(cp - savedPos) > 50) {
              console.log('[ScrollToTop] RESTORE retry +' + delay + 'ms was=' + cp + ' -> ' + savedPos);
              window.scrollTo({ top: savedPos, left: 0, behavior: 'instant' });
            }
          }, delay);
        });
      }
    } else {
      // Push nav OR initial navigate — always top
      console.log('[ScrollToTop] -> TOP (navType=' + navType + ')');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Timeline: watch for scroll jumps after we set to 0
    [16, 50, 100, 250, 500, 750, 1000, 1500, 2000].forEach(delay => {
      setTimeout(() => snap("T+" + delay + "ms"), delay);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [pathname]);

  return null;
}
