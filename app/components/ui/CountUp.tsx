"use client";
import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  target: number;
  suffix?: string;
  decimals?: number;
  duration?: number; // ms
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({ target, suffix = '', decimals = 0, duration = 1400, className, style }: CountUpProps) {
  // Initialize with the real target value so SSR renders the correct count.
  // The animation still runs client-side (0 → target) once the element enters
  // the viewport. Non-JS crawlers and SSR always see the honest catalog count.
  const [display, setDisplay] = useState(target);

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
            const rawValue = startValue + (target - startValue) * eased;
            
            setDisplay(decimals > 0 ? Number(rawValue.toFixed(decimals)) : Math.round(rawValue));
            
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
  }, [target, decimals, duration]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : String(Math.round(display));

  return (
    <span ref={ref} className={className} style={style}>
      {formatted}{suffix}
    </span>
  );
}
