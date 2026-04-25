import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

function getReleaseBySlug(slug: string): any | null {
  try {
    const file = path.join(process.cwd(), '.data', 'cms-releases.json');
    if (!fs.existsSync(file)) return null;
    const releases: any[] = JSON.parse(fs.readFileSync(file, 'utf8'));
    return releases.find((r) => r.slug === slug) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const release = getReleaseBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';
  const canonicalUrl = `${baseUrl}/release-detail/${slug}`;

  if (!release) {
    return {
      title: "Release",
      description: "Discover sacred Sufi music releases on SufiPulse.",
      alternates: { canonical: canonicalUrl },
    };
  }

  const title = release.title || release.name || "SufiPulse Release";
  const description = release.description
    || release.publicCommentary
    || `Listen to "${title}" — a sacred Sufi music release on SufiPulse.`;

  const thumbnail = release.youtubeId
    ? `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg`
    : `/og?title=${encodeURIComponent(title)}&subtitle=Listen+on+SufiPulse`;

  const artistName = release.artist || release.artistName;
  const keywords = [
    title, "Sufi music", "kalam", "qawwali",
    ...(artistName ? [artistName] : []),
    ...(release.availableLanguages || []),
    "SufiPulse release", "sacred music",
  ].filter(Boolean);

  const lyricsText = (() => {
    if (!release.lyrics) return undefined;
    if (typeof release.lyrics === 'string') return release.lyrics.slice(0, 5000);
    if (Array.isArray(release.lyrics)) {
      return release.lyrics
        .map((l: any) => (typeof l === 'string' ? l : l.text || l.content || l.line || ''))
        .filter(Boolean)
        .join('\n')
        .slice(0, 5000);
    }
    return undefined;
  })();

  const musicRecordingSchema = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: title,
    description,
    url: canonicalUrl,
    ...(release.youtubeId && {
      embedUrl: `https://www.youtube.com/embed/${release.youtubeId}`,
    }),
    ...(artistName && {
      byArtist: { "@type": "MusicGroup", name: artistName },
    }),
    ...(release.durationSeconds && {
      duration: `PT${Math.floor(release.durationSeconds / 60)}M${release.durationSeconds % 60}S`,
    }),
    inLanguage: release.defaultLanguage || "ur",
    genre: "Sufi music",
    ...(lyricsText && {
      lyrics: { "@type": "CreativeWork", text: lyricsText },
    }),
  };

  const videoObjectSchema = release.youtubeId ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title,
    description: description.slice(0, 300),
    thumbnailUrl: `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${release.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${release.youtubeId}`,
    url: canonicalUrl,
    uploadDate: release.published_at || release.created_at || new Date().toISOString(),
    ...(release.durationSeconds && {
      duration: `PT${Math.floor(release.durationSeconds / 60)}M${release.durationSeconds % 60}S`,
    }),
    ...(artistName && {
      author: { "@type": "MusicGroup", name: artistName },
    }),
    ...(lyricsText && { transcript: lyricsText }),
    inLanguage: release.defaultLanguage || "ur",
    genre: "Sufi music",
    isFamilyFriendly: true,
    potentialAction: {
      "@type": "WatchAction",
      target: `https://www.youtube.com/watch?v=${release.youtubeId}`,
    },
  } : null;

  return {
    title,
    description: description.slice(0, 160),
    keywords,
    openGraph: {
      title: `${title} | SufiPulse`,
      description: description.slice(0, 160),
      type: "music.song",
      url: canonicalUrl,
      images: [{ url: thumbnail, width: 1280, height: 720, alt: title }],
      siteName: "SufiPulse",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | SufiPulse`,
      description: description.slice(0, 160),
      images: [thumbnail],
    },
    alternates: { canonical: canonicalUrl },
    other: {
      "script:ld+json": JSON.stringify(musicRecordingSchema),
      ...(videoObjectSchema && { "script:ld+json:video": JSON.stringify(videoObjectSchema) }),
    },
  };
}

export default function ReleaseDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
