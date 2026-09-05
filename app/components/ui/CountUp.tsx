"use client";
import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  target: number;
  suffix?: string;
  duration?: number; // ms
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({ target, suffix = '', duration = 1400, className, style }: CountUpProps) {
  // Start from 0 — animates to target when the element enters the viewport.
  // Do NOT start from Math.floor(target * 0.5): that produced a stale fabricated number
  // in SSR HTML (e.g. 45 when the real catalog count was 91 or 97).
  const [display, setDisplay] = useState(0);

  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          observer.disconnect();

          const start = performance.now();
          const startValue = 0;
          
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // ease-out expo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            setDisplay(Math.round(startValue + (target - startValue) * eased));
            
            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 } // Lower threshold for faster start
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}{suffix}
    </span>
  );
}
