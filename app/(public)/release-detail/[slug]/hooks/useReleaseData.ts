"use client";
import { useState, useEffect } from 'react';

interface ReleaseData {
  id: string;
  release_title: string;
  release_date: string;
  description: string;
  source: string;
  duration_seconds: number;
  views: number;
  likes: number;
  youtube_video_id: string;
  slug: string;
  thumbnail_url: string;
  subtitles_available: boolean;
  subtitle_languages: string[];
  lyrics: any;
  subtitle_cues: any[];
  subtitle_translations: any;
  subtitle_cue_metadata: any;
  subtitle_style_packs: any;
  language_style_overrides: any;
  lyrics_structure: any;
  enable_credits: boolean;
  enable_commentary: boolean;
  enable_sponsors: boolean;
  enable_adoption: boolean;
  enable_lyrics: boolean;
  public_commentary: any[];
  public_sponsors_intro: string;
  public_sponsors: any[];
  public_credits: any;
  credits: any[];
  lead_vocalists: any[];
  chorus_vocalists: any[];
  production_credits: any;
  streaming_platforms: any[];
  spotify_url: string;
  apple_music_url: string;
}

export function useReleaseData(slug: string) {
  const [release, setRelease] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolutionSource, setResolutionSource] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchVideoDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const mapCmsRelease = (cmsRelease: any): ReleaseData => ({
          id: cmsRelease.id,
          release_title: cmsRelease.title,
          release_date: cmsRelease.releaseDate,
          description: cmsRelease.description,
          source: "cms",
          duration_seconds: cmsRelease.durationSeconds,
          views: cmsRelease.viewCount || 0,
          likes: cmsRelease.likeCount || 0,
          youtube_video_id: cmsRelease.youtubeId,
          slug: cmsRelease.slug,
          thumbnail_url: cmsRelease.thumbnailUrl,
          subtitles_available: false,
          subtitle_languages: [],
          lyrics: cmsRelease.lyrics || {},
          subtitle_cues: cmsRelease.subtitleCues || [],
          subtitle_translations: cmsRelease.subtitleTranslations || {},
          subtitle_cue_metadata: cmsRelease.subtitleCueMetadata || {},
          subtitle_style_packs: cmsRelease.subtitleStylePacks || {},
          language_style_overrides: cmsRelease.languageStyleOverrides || {},
          lyrics_structure: cmsRelease.lyricsStructure || {},
          enable_credits: cmsRelease.enableCredits !== false,
          enable_commentary: cmsRelease.enableCommentary !== false,
          enable_sponsors: !!cmsRelease.enableSponsors,
          enable_adoption: cmsRelease.enableAdoption !== false,
          enable_lyrics: cmsRelease.enableLyrics !== false,
          public_commentary: cmsRelease.publicCommentary || [],
          public_sponsors_intro: cmsRelease.publicSponsorsIntro || "",
          public_sponsors: cmsRelease.publicSponsors || [],
          public_credits: cmsRelease.publicCredits || {},
          credits: [],
          lead_vocalists: cmsRelease.vocalist ? [cmsRelease.vocalist] : [],
          chorus_vocalists: cmsRelease.chorusVocalists || cmsRelease.chorus_vocalists || [],
          production_credits: cmsRelease.producer ? { producer: cmsRelease.producer } : {},
          streaming_platforms: cmsRelease.streamingPlatforms || [],
          spotify_url: "",
          apple_music_url: "",
        });

        let resolvedRelease: any = null;
        let resolvedSource: string | null = null;

        try {
          const keyRes = await fetch(`/api/releases?key=${encodeURIComponent(slug)}&nocache=1`);
          if (keyRes.ok) {
            const data = await keyRes.json();
            if (data && !data.error) {
              resolvedRelease = data;
              resolvedSource = "cms_key";
            }
          }
        } catch {}

        if (resolvedRelease) {
          setResolutionSource(resolvedSource);
          setRelease(mapCmsRelease(resolvedRelease));
          setLoading(false);
          return;
        }

        const { youtubeService } = await import("../../../../lib/youtube-service");
        const videos = await youtubeService.getVideosByIds(slug);

        if (!videos || videos.length === 0) {
          setError("Video not found on SufiTube.");
          setLoading(false);
          return;
        }

        const v = videos[0];
        setResolutionSource("external_youtube_fallback");

        setRelease({
          id: v.id,
          release_title: v.snippet.title,
          release_date: v.snippet.publishedAt,
          description: v.snippet.description,
          source: "youtube",
          duration_seconds: youtubeService["parseDuration"](v.contentDetails.duration),
          views: parseInt(v.statistics.viewCount || "0"),
          likes: parseInt(v.statistics.likeCount || "0"),
          youtube_video_id: v.id,
          thumbnail_url: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.standard?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
          slug: v.id,
          subtitles_available: false,
          subtitle_languages: [],
          lyrics: {},
          subtitle_cues: [],
          subtitle_translations: {},
          subtitle_cue_metadata: {},
          subtitle_style_packs: {},
          language_style_overrides: {},
          lyrics_structure: {},
          enable_credits: true,
          enable_commentary: true,
          enable_sponsors: false,
          enable_adoption: true,
          enable_lyrics: true,
          public_commentary: [],
          public_sponsors_intro: "",
          public_sponsors: [],
          public_credits: {},
          credits: [],
          lead_vocalists: [],
          chorus_vocalists: [],
          production_credits: {},
          streaming_platforms: [],
          spotify_url: "",
          apple_music_url: "",
        });
      } catch (err: any) {
        console.error("Critical error in fetchVideoDetails:", err);
        setError(`Failed to load release details: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [slug]);

  return { release, loading, error, resolutionSource, setRelease };
}
