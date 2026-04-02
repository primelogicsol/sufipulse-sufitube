import React, { useMemo } from 'react';
import { LyricsTrack } from './lyricsData';

interface VideoOverlayProps {
  track: LyricsTrack;
  currentTime: number;
  captionsEnabled: boolean;
}

export function VideoOverlay({ track, currentTime, captionsEnabled }: VideoOverlayProps) {
  const activeCue = useMemo(() => {
    if (!captionsEnabled) return null;
    return track.cues.find(c => currentTime >= c.start && currentTime < c.end);
  }, [currentTime, track.cues, captionsEnabled]);

  if (!captionsEnabled || !activeCue) return null;

  return (
    <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 w-full px-4 sm:px-12 flex justify-center pointer-events-none z-10 transition-all duration-300">
      <div
        className={`bg-neutral-900/50 backdrop-blur-md rounded-xl px-6 py-3 sm:px-8 sm:py-4 border border-neutral-700/50 shadow-2xl text-center max-w-3xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]`}
        dir={track.direction}
      >
        <p className={`text-white text-lg sm:text-2xl font-medium tracking-wide leading-snug drop-shadow-md ${track.direction === 'rtl' ? 'font-urdu' : ''}`}>
          {activeCue.text}
        </p>
      </div>
    </div>
  );
}
