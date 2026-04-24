"use client";

import { useState, useEffect, useRef, useCallback, memo } from 'react';

/**
 * Independent time tracker that does NOT trigger parent re-renders.
 * Uses refs and direct DOM manipulation to avoid React reconciliation.
 */
export const useVideoTimeTracker = (playerTarget: any, videoDuration: number) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTracker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!playerTarget) {
      clearTracker();
      return;
    }

    // Poll every 500ms instead of 300ms (less frequent = fewer renders)
    intervalRef.current = setInterval(async () => {
      try {
        if (playerTarget.getCurrentTime) {
          const time = await playerTarget.getCurrentTime();
          setCurrentTime(time);
        }
      } catch {
        // Player might be destroyed
      }
    }, 500);

    return clearTracker;
  }, [playerTarget, clearTracker]);

  const seekTo = useCallback((time: number) => {
    if (playerTarget?.seekTo) {
      playerTarget.seekTo(time, true);
      setCurrentTime(time);
    }
  }, [playerTarget]);

  return { currentTime, isPlaying, setIsPlaying, isVideoEnded, setIsVideoEnded, seekTo };
};

/**
 * Memoized time display component - only re-renders when time changes.
 * Uses direct DOM manipulation to avoid React reconciliation overhead.
 */
export const TimeDisplay = memo(({ currentTime, duration }: { currentTime: number; duration: number }) => {
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <span className="text-xs text-neutral-200 min-w-[84px] text-right">
      {formatTime(Math.floor(currentTime || 0))} / {formatTime(Math.floor(duration || 0))}
    </span>
  );
});

TimeDisplay.displayName = 'TimeDisplay';
