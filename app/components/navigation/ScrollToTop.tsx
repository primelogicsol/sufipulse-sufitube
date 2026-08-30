"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// In-memory scroll position store — persists for the tab session.
// Allows Back/Forward to restore where the user was on a previously visited page.
const scrollHistory = new Map();

export function ScrollToTop() {
  const pathname = usePathname();
  const isBackForwardRef = useRef(false);

  // One-time setup: take manual control of scroll restoration so the browser
  // does not fight us. popstate fires when Back or Forward is pressed,
  // BEFORE the pathname state updates — we flag it and react in the next cycle.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    const onPopState = () => { isBackForwardRef.current = true; };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Save position when LEAVING the current route.
  // Cleanup runs just before the new pathname takes effect,
  // so window.scrollY still reflects the departing page.
  useEffect(() => {
    return () => { scrollHistory.set(pathname, window.scrollY); };
  }, [pathname]);

  // Scroll logic on route change
  useEffect(() => {
    // Hash / anchor navigation — let the browser handle naturally.
    if (window.location.hash) {
      isBackForwardRef.current = false;
      return;
    }
    if (isBackForwardRef.current) {
      // Back / Forward: restore saved position for this pathname.
      const saved = scrollHistory.get(pathname) ?? 0;
      window.scrollTo({ top: saved, left: 0, behavior: 'instant' });
      isBackForwardRef.current = false;
    } else {
      // New primary navigation: always start at the top.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  return null;
}
