"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

export type TemporaryAudioPlayerAdapter = {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
  playVideo: () => Promise<void> | void;
  pauseVideo: () => void;
  setPlaybackRate: (rate: number) => void;
  setPlaybackQuality: (_quality: string) => void;
};

type TemporaryStreamAudioPlayerProps = {
  title: string;
  audioUrl: string;
  durationLabel?: string;
  onReady?: (adapter: TemporaryAudioPlayerAdapter) => void;
  onPlayingChange?: (playing: boolean) => void;
  onDurationChange?: (durationSeconds: number) => void;
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export default function TemporaryStreamAudioPlayer({
  title,
  audioUrl,
  durationLabel,
  onReady,
  onPlayingChange,
  onDurationChange,
}: TemporaryStreamAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const adapter = useMemo<TemporaryAudioPlayerAdapter>(() => ({
    getCurrentTime: () => audioRef.current?.currentTime || 0,
    getDuration: () => audioRef.current?.duration || 0,
    seekTo: (seconds: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(seconds)) return;
      audio.currentTime = Math.max(0, Math.min(seconds, Number.isFinite(audio.duration) ? audio.duration : seconds));
    },
    playVideo: async () => {
      await audioRef.current?.play();
    },
    pauseVideo: () => {
      audioRef.current?.pause();
    },
    setPlaybackRate: (rate: number) => {
      if (!audioRef.current || !Number.isFinite(rate)) return;
      audioRef.current.playbackRate = Math.max(0.5, Math.min(rate, 2));
    },
    // Audio has no video quality dimension. This no-op keeps the adapter
    // compatible with the existing release player's media-control surface.
    setPlaybackQuality: () => {},
  }), []);

  useEffect(() => {
    onReady?.(adapter);
  }, [adapter, onReady]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  const scrubTo = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg border border-neutral-800 bg-black shadow-2xl">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(event) => {
          const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
          setDuration(nextDuration);
          onDurationChange?.(nextDuration);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onPlay={() => {
          setPlaying(true);
          onPlayingChange?.(true);
        }}
        onPause={() => {
          setPlaying(false);
          onPlayingChange?.(false);
        }}
        onEnded={() => {
          setPlaying(false);
          onPlayingChange?.(false);
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/35">SufiPulse USA</div>
        <h2 className="mt-4 max-w-3xl font-serif text-2xl font-light text-white/90 sm:text-3xl md:text-4xl">{title}</h2>
        <div className="mt-3 text-xs uppercase tracking-[0.28em] text-white/35">Audio Release</div>

        <button
          type="button"
          onClick={() => void togglePlayback()}
          className="mt-8 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
          aria-label={playing ? 'Pause audio' : 'Play audio'}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>

        <div className="mt-7 flex w-full max-w-2xl items-center gap-3">
          <span className="w-10 text-right font-mono text-xs text-white/45">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.05}
            value={Math.min(currentTime, duration > 0 ? duration : 1)}
            onChange={(event) => scrubTo(Number(event.target.value))}
            className="min-w-0 flex-1 accent-white"
            aria-label="Audio position"
          />
          <span className="w-10 font-mono text-xs text-white/45">{durationLabel || formatTime(duration)}</span>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-white/35">
          <Volume2 className="h-3.5 w-3.5" />
          <span>Streamed for SufiPulse playback · no download action</span>
        </div>
      </div>
    </div>
  );
}
