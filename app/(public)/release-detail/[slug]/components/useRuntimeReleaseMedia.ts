"use client";

import { useEffect, useState } from "react";

export type ReleaseRuntimeMedia = {
  releaseId: string;
  mode: "youtube" | "audio_stream" | "coming_soon";
  youtubeId: string | null;
  audioUrl: string | null;
  audioDownloadAllowed: false;
  audioStorageMode?: "stream_only";
  durationSeconds?: number;
  publicAudioEligible?: boolean;
};

export function useRuntimeReleaseMedia(releaseId?: string) {
  const [media, setMedia] = useState<ReleaseRuntimeMedia | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!releaseId) {
      setMedia(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/releases/${encodeURIComponent(releaseId)}/runtime-media`,
          { cache: "no-store", signal: controller.signal },
        );

        if (!response.ok) {
          if (active) setMedia(null);
          return;
        }

        const payload = (await response.json()) as ReleaseRuntimeMedia;
        if (active) setMedia(payload);
      } catch (error: any) {
        if (error?.name !== "AbortError" && active) setMedia(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [releaseId]);

  return { media, loading };
}
