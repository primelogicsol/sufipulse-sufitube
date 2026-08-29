"use client";

import { useEffect, useRef, useState } from "react";
import Link from 'next/link';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface SufiPulsePlayerProps {
  youtubeId: string;
  releaseId: string;
}

export default function SufiPulsePlayer({
  youtubeId,
  releaseId,
}: SufiPulsePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [continuousPlay, setContinuousPlay] = useState(false);
  const [nextRelease, setNextRelease] = useState<any>(null);
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sufipulse-continuous-play");
    setContinuousPlay(saved === "true");
  }, []);

  useEffect(() => {
    fetch(`/api/releases/${releaseId}/next-up`)
      .then((r) => r.json())
      .then(setNextRelease)
      .catch(console.error);
  }, [releaseId]);

  useEffect(() => {
    const createPlayer = () => {
      setApiReady(true);
      if (!containerRef.current) return;
      
      // We must render into a child div because YT.Player replaces the element entirely
      const el = document.createElement("div");
      el.id = `sufipulse-player-${youtubeId}`;
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(el);

      playerRef.current = new window.YT.Player(el.id, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          playsinline: 1,
          controls: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onStateChange: handleStateChange,
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
      return;
    }

    const existing = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
      
      window.onYouTubeIframeAPIReady = createPlayer;
    } else {
      // If script exists but YT not ready, we have to poll or rely on another mechanism.
      // Usually onYouTubeIframeAPIReady might have fired already if script is loaded.
      // We'll use an interval fallback in case it's mid-load.
      const interval = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(interval);
          createPlayer();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      playerRef.current?.destroy?.();
    };
  }, [youtubeId]);

  async function handleStateChange(event: any) {
    if (event.data !== window.YT.PlayerState.ENDED) return;

    if (!continuousPlay) return;

    const response = await fetch(
      `/api/releases/${releaseId}/next-up?reason=ended`
    );

    const next = await response.json();

    if (!next?.youtubeId) return;

    // Keep playback inside the same visible YouTube player.
    playerRef.current.loadVideoById(next.youtubeId);

    setNextRelease(next);

    // Update URL to match current playing
    window.history.replaceState(
      {},
      "",
      `/release-detail/${next.slug}`
    );
  }

  function toggleContinuousPlay() {
    const value = !continuousPlay;
    setContinuousPlay(value);
    localStorage.setItem("sufipulse-continuous-play", String(value));
  }

  return (
    <div className="w-full h-full relative flex flex-col group">
      <div 
        ref={containerRef}
        className="w-full aspect-video border-0 bg-neutral-900"
      />

      {/* Optional: Minimal non-intrusive continuity overlay/bar below player */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-neutral-200">
          <input
            type="checkbox"
            className="accent-primary-500 w-3.5 h-3.5 rounded-sm"
            checked={continuousPlay}
            onChange={toggleContinuousPlay}
          />
          <span>Continuous SufiPulse</span>
        </label>
      </div>
    </div>
  );
}
