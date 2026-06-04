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

function buildSchemas(release: any, canonicalUrl: string) {
  const title = release.title || release.name || "SufiPulse Release";
  const description = release.description
    || release.publicCommentary
    || `Listen to "${title}" — a sacred Sufi music release on SufiPulse.`;
  const artistName = release.artist || release.artistName;

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
    
    if (typeof release.lyrics === 'object') {
      const lang = release.defaultLanguage || Object.keys(release.lyrics)[0];
      const lines = release.lyrics[lang];
      if (Array.isArray(lines)) {
        return lines
          .map((l: any) => l.translation || l.transliteration || l.urdu || '')
          .filter(Boolean)
          .join('\n')
          .slice(0, 5000);
      }
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

  return { musicRecordingSchema, videoObjectSchema };
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
  };
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ReleaseDetailLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const release = getReleaseBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';
  const canonicalUrl = `${baseUrl}/release-detail/${slug}`;

  if (!release) {
    return <>{children}</>;
  }

  const { musicRecordingSchema, videoObjectSchema } = buildSchemas(release, canonicalUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicRecordingSchema) }}
      />
      {videoObjectSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectSchema) }}
        />
      )}
      
      {/* Search Engine Crawlability Layer (Pre-rendered SSR content for bot indexation) */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <h1>{release.title}</h1>
        {release.subtitle && <h2>{release.subtitle}</h2>}
        <p>{release.description}</p>
        
        {/* Render Lyrics */}
        {release.lyrics && Object.entries(release.lyrics).map(([lang, lines]: any) => (
          <div key={lang}>
            <h3>Lyrics ({lang})</h3>
            {Array.isArray(lines) && lines.map((line: any, idx: number) => (
              <p key={idx}>
                {line.urdu && <span>{line.urdu}<br /></span>}
                {line.transliteration && <span>{line.transliteration}<br /></span>}
                {line.translation && <span>{line.translation}<br /></span>}
              </p>
            ))}
          </div>
        ))}

        {/* Render Commentary / Meanings */}
        {release.publicCommentary && (
          <div>
            <h3>Commentary & Significance</h3>
            {release.publicCommentary.map((c: any) => (
              <div key={c.id}>
                <h4>{c.title}</h4>
                <p>{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Render Credits */}
        {release.publicCredits && (
          <div>
            <h3>Artistic & Production Credits</h3>
            {Object.entries(release.publicCredits).map(([category, roles]: any) => (
              <div key={category}>
                <h4>{category}</h4>
                <ul>
                  {Object.entries(roles).map(([role, name]: any) => (
                    <li key={role}><strong>{role}:</strong> {String(name)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {children}
    </>
  );
}
