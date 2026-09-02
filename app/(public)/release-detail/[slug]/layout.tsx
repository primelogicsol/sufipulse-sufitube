import type { Metadata } from 'next';
import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease } from '@/server/storage/release-dto';

async function getReleaseByKey(key: string): Promise<any | null> {
  try {
    const store = getReleaseReadStore();
    let release = await store.getBySlug(key);
    if (!release) release = await store.getByYoutubeId(key);
    if (!release) release = await store.getById(key);
    return release ? toCanonicalCMSRelease(release) : null;
  } catch (error) {
    console.error('[release-detail metadata] Failed to resolve release:', error);
    return null;
  }
}

function personName(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.name || value.displayName || value.fullName || undefined;
}

function releaseDescription(release: any): string {
  return (
    release?.description ||
    release?.publicCommentary?.[0]?.content ||
    `Listen to "${release?.title || 'this release'}" on SufiPulse.`
  );
}

function buildSchemas(release: any, canonicalUrl: string) {
  const title = release.title || release.canonicalTitle || release.youtubeTitle || 'SufiPulse Release';
  const description = releaseDescription(release);
  const writerName = personName(release.writer);
  const vocalistName = personName(release.vocalist);
  const thumbnail =
    release.canonicalThumbnail ||
    release.thumbnailUrl ||
    (release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg` : undefined);
  const publishedAt = release.publishedAt || release.releaseDate || release.createdAt;

  const musicRecordingSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: title,
    description,
    url: canonicalUrl,
    inLanguage: release.defaultLanguage || 'ur',
    genre: 'Sufi music',
  };

  if (release.youtubeId) {
    musicRecordingSchema.sameAs = `https://www.youtube.com/watch?v=${release.youtubeId}`;
  }
  if (vocalistName) {
    musicRecordingSchema.byArtist = { '@type': 'Person', name: vocalistName };
  }
  if (writerName) {
    musicRecordingSchema.lyricist = { '@type': 'Person', name: writerName };
  }
  if (release.durationSeconds) {
    musicRecordingSchema.duration = `PT${Math.floor(release.durationSeconds / 60)}M${release.durationSeconds % 60}S`;
  }

  const videoObjectSchema = release.youtubeId
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: title,
        description,
        ...(thumbnail ? { thumbnailUrl: [thumbnail] } : {}),
        embedUrl: `https://www.youtube.com/embed/${release.youtubeId}`,
        contentUrl: `https://www.youtube.com/watch?v=${release.youtubeId}`,
        url: canonicalUrl,
        ...(publishedAt ? { uploadDate: publishedAt } : {}),
        ...(release.durationSeconds
          ? { duration: `PT${Math.floor(release.durationSeconds / 60)}M${release.durationSeconds % 60}S` }
          : {}),
        inLanguage: release.defaultLanguage || 'ur',
        genre: 'Sufi music',
        isFamilyFriendly: true,
      }
    : null;

  return { musicRecordingSchema, videoObjectSchema };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const release = await getReleaseByKey(slug);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';
  const canonicalKey = release?.slug || slug;
  const canonicalUrl = `${baseUrl}/release-detail/${canonicalKey}`;

  if (!release) {
    return {
      title: 'Release',
      description: 'Discover sacred Sufi music releases on SufiPulse.',
      alternates: { canonical: canonicalUrl },
    };
  }

  const title = release.title || release.canonicalTitle || release.youtubeTitle || 'SufiPulse Release';
  const description = releaseDescription(release);
  const thumbnail =
    release.canonicalThumbnail ||
    release.thumbnailUrl ||
    (release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg` : undefined);
  const writerName = personName(release.writer);
  const vocalistName = personName(release.vocalist);
  const keywords = [
    title,
    release.canonicalTitle,
    release.youtubeTitle,
    writerName,
    vocalistName,
    'Sufi music',
    'kalam',
    'SufiPulse',
    ...(Array.isArray(release.tags) ? release.tags : []),
  ].filter(Boolean) as string[];

  return {
    title,
    description: description.slice(0, 160),
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | SufiPulse`,
      description: description.slice(0, 200),
      type: 'music.song',
      url: canonicalUrl,
      ...(thumbnail ? { images: [{ url: thumbnail, width: 1280, height: 720, alt: title }] } : {}),
      siteName: 'SufiPulse',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | SufiPulse`,
      description: description.slice(0, 200),
      ...(thumbnail ? { images: [thumbnail] } : {}),
    },
  };
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ReleaseDetailLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const release = await getReleaseByKey(slug);

  if (!release) return <>{children}</>;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';
  const canonicalKey = release.slug || slug;
  const canonicalUrl = `${baseUrl}/release-detail/${canonicalKey}`;
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
      {children}
    </>
  );
}
