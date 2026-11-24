import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { permanentRedirect, notFound } from 'next/navigation';
import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease } from '@/server/storage/release-dto';
import { verifyAccessToken } from '@/server/services/auth';
import { usersRepository } from '@/server/db/repositories/users';
import { checkIsAdmin } from '@/server/middleware/authenticate';
import { CANONICAL_ORIGIN, canonicalUrl, resolveCanonicalSongTitle, toIsoDuration } from '@/lib/canonical-seo';
import { graphResolver } from '@/lib/graph-resolver';

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

function isPubliclyEligibleRelease(release: any): boolean {
  if (!release || release.status !== 'published' || (release.visibility || 'public') !== 'public') {
    return false;
  }
  if (['upcoming', 'teaser_live', 'premiere_scheduled'].includes(release.releaseLifecycle || '')) {
    return release.premiereVisibility === 'public';
  }
  return true;
}

async function isRequestAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return false;
    const payload = await verifyAccessToken(token);
    if (!payload?.userId) return false;
    const user = usersRepository.findById(String(payload.userId));
    if (!user || user.is_blocked) return false;
    const { password_hash: _pw, ...safeUser } = user;
    return checkIsAdmin(safeUser);
  } catch {
    return false;
  }
}

function personName(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  return value.name || value.displayName || value.fullName || undefined;
}

const ZARF_E_NOORI_PERSON = (baseUrl: string) => ({
  '@type': 'Person',
  '@id': `${baseUrl}/about/zarf-e-noori`,
  name: 'Dr. Zarf-e-Noori',
  sameAs: `${baseUrl}/#founder`,
  url: `${baseUrl}/about/zarf-e-noori`,
});

function resolveCredit(
  release: any,
  artisticField: string,
  legacyField: string | null = null,
  corpusFallback: string | null = null,
): string | undefined {
  const fromArtistic = release?.publicCredits?.artistic?.[artisticField];
  if (fromArtistic && typeof fromArtistic === 'string' && fromArtistic.trim()) {
    return fromArtistic.trim();
  }
  if (legacyField) {
    const fromLegacy = personName(release?.[legacyField]);
    if (fromLegacy) return fromLegacy;
  }
  return corpusFallback ?? undefined;
}

function releaseDescription(release: any): string {
  const title = resolveCanonicalSongTitle(release);
  return (
    release?.description ||
    release?.publicCommentary?.[0]?.content ||
    `Listen to the full-length Sufi kalam "${title}" by SufiPulse USA with multilingual lyrics and translations.`
  );
}

function toLanguageTag(raw: string | undefined): string {
  const map: Record<string, string> = {
    ur: 'ur',
    urdu: 'ur',
    roman_urdu: 'ur-Latn',
    'ur-latn': 'ur-Latn',
    'en-rom': 'ur-Latn',
    en: 'en',
    english: 'en',
    'en-us': 'en',
    ks: 'ks',
    kashmiri: 'ks',
    ar: 'ar',
    arabic: 'ar',
    fa: 'fa',
    persian: 'fa',
    farsi: 'fa',
    pa: 'pa',
    punjabi: 'pa',
    hi: 'hi',
    hindi: 'hi',
    'ur-deva': 'hi',
    zxx: 'zxx',
  };
  const normalized = raw?.toLowerCase().trim();
  return (normalized && map[normalized]) || normalized || 'ur';
}

function extractCrawlableMultilingualLyrics(release: any): Array<{ lang: string; label: string; lines: string[] }> {
  if (release?.enableLyrics === false) return [];
  const tracks: Array<{ lang: string; label: string; lines: string[] }> = [];
  const subtitleCues: any[] = Array.isArray(release?.subtitleCues) ? release.subtitleCues : [];
  const subtitleTranslations = release?.subtitleTranslations || {};
  const subtitleStatuses = release?.subtitleLanguageStatuses || {};
  const lyricsMap = release?.lyrics || {};
  const lyricsStructure = release?.lyricsStructure || {};
  const unapprovedStatuses = new Set(['draft', 'in_translation', 'under_review', 'archived']);
  const isApprovedKey = (k: string) => !unapprovedStatuses.has(String(subtitleStatuses[k] || '').toLowerCase());

  const languageDefs = [
    { keys: ['ur', 'urdu'], bcp47: 'ur', label: 'Urdu (اردو)' },
    { keys: ['roman_urdu', 'ur-latn', 'en-rom'], bcp47: 'ur-Latn', label: 'Roman Urdu' },
    { keys: ['hi', 'hindi', 'ur-deva'], bcp47: 'hi', label: 'Hindi / Devanagari (देवनागरी)' },
    { keys: ['en', 'english'], bcp47: 'en', label: 'English Translation' },
  ];

  for (const def of languageDefs) {
    let lines: string[] = [];

    // 1. Subtitle cue translations (approved/published tracks only)
    for (const k of def.keys) {
      if (!isApprovedKey(k)) continue;
      const subMap = subtitleTranslations[k];
      if (subMap && typeof subMap === 'object') {
        const ordered =
          subtitleCues.length > 0
            ? subtitleCues
                .filter((c: any) => c?.active !== false)
                .map((c: any) => String(subMap[c.id] || '').trim())
                .filter(Boolean)
            : Object.values(subMap)
                .map((v) => String(v || '').trim())
                .filter(Boolean);
        if (ordered.length > 0) {
          lines = ordered;
          break;
        }
      }
    }

    // 2. Structured lyric blocks (approved/published tracks only)
    if (lines.length === 0) {
      for (const k of def.keys) {
        if (!isApprovedKey(k)) continue;
        const blocks = lyricsStructure[k];
        if (Array.isArray(blocks) && blocks.length > 0) {
          const blockLines = blocks
            .filter((b: any) => b?.isPublished !== false)
            .flatMap((b: any) => (Array.isArray(b?.lines) ? b.lines : []))
            .map((l: any) => String(l || '').trim())
            .filter(Boolean);
          if (blockLines.length > 0) {
            lines = blockLines;
            break;
          }
        }
      }
    }

    // 3. Legacy lyrics array or string (approved/published tracks only)
    if (lines.length === 0) {
      for (const k of def.keys) {
        if (!isApprovedKey(k)) continue;
        const raw = lyricsMap[k];
        if (typeof raw === 'string' && raw.trim()) {
          lines = raw
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          break;
        }
        if (Array.isArray(raw) && raw.length > 0) {
          const rowLines = raw
            .map((r: any) =>
              typeof r === 'string'
                ? r.trim()
                : String(r?.text || r?.translation || r?.transliteration || r?.urdu || '').trim()
            )
            .filter(Boolean);
          if (rowLines.length > 0) {
            lines = rowLines;
            break;
          }
        }
      }
    }

    if (lines.length > 0) {
      tracks.push({ lang: def.bcp47, label: def.label, lines: lines.slice(0, 80) });
    }
  }

  return tracks;
}

function buildSchemas(
  release: any,
  resolvedCanonicalUrl: string,
  baseUrl: string,
  lyricTracks: Array<{ lang: string; label: string; lines: string[] }>
) {
  const title = resolveCanonicalSongTitle(release);
  const description = releaseDescription(release);
  const zarfPerson = ZARF_E_NOORI_PERSON(baseUrl);

  const lyricistName = resolveCredit(release, 'lyricist', 'writer', 'Dr. Zarf-e-Noori');
  const composerName = resolveCredit(release, 'composer', null, 'Dr. Zarf-e-Noori');
  const producerName = resolveCredit(release, 'musicProducer', null, 'Dr. Zarf-e-Noori');
  const performerName = resolveCredit(release, 'leadVocalist', 'vocalist', null);

  const thumbnail =
    release.canonicalThumbnail ||
    release.thumbnailUrl ||
    (release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg` : undefined);
  const publishedAt = release.publishedAt || release.releaseDate || release.createdAt;
  const isoDuration = toIsoDuration(release.durationSeconds || release.durationFormatted);

  const publisherNode = {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'SufiPulse USA',
    url: baseUrl,
  };

  const compositionId = `${resolvedCanonicalUrl}#composition`;
  const primaryLyricTrack = lyricTracks[0];

  const buildPersonSchema = (creditedName: string | undefined) => {
    const clean = (creditedName || 'Dr. Zarf-e-Noori').trim();
    if (/^dr\.?\s*zarf[-\s]*e[-\s]*noori$/i.test(clean)) {
      return zarfPerson;
    }
    return {
      '@type': 'Person',
      name: clean,
    };
  };

  const musicCompositionSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    '@id': compositionId,
    name: title,
    inLanguage: toLanguageTag(release.defaultAudioLanguage),
    genre: ['Sufi music', 'Sufi kalam', 'Sacred devotional music'],
    publisher: publisherNode,
    lyricist: buildPersonSchema(lyricistName),
    composer: buildPersonSchema(composerName),
    ...(primaryLyricTrack
      ? {
          lyrics: {
            '@type': 'CreativeWork',
            inLanguage: primaryLyricTrack.lang,
            text: primaryLyricTrack.lines.slice(0, 30).join('\n'),
          },
        }
      : {}),
  };
  if (release.youtubeId) {
    musicCompositionSchema.sameAs = `https://www.youtube.com/watch?v=${release.youtubeId}`;
  }

  const musicRecordingSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    '@id': `${resolvedCanonicalUrl}#recording`,
    name: title,
    description,
    url: resolvedCanonicalUrl,
    inLanguage: toLanguageTag(release.defaultAudioLanguage),
    genre: 'Sufi music',
    publisher: publisherNode,
    recordingOf: { '@id': compositionId },
    producer: buildPersonSchema(producerName),
  };

  if (release.youtubeId) {
    musicRecordingSchema.sameAs = `https://www.youtube.com/watch?v=${release.youtubeId}`;
  }
  if (performerName) {
    musicRecordingSchema.byArtist = { '@type': 'Person', name: performerName };
  }
  if (isoDuration) {
    musicRecordingSchema.duration = isoDuration;
  }
  if (publishedAt) {
    musicRecordingSchema.datePublished = publishedAt;
  }

  const videoObjectSchema = release.youtubeId
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        '@id': `${resolvedCanonicalUrl}#video`,
        name: title,
        description,
        ...(thumbnail ? { thumbnailUrl: [thumbnail] } : {}),
        embedUrl: `https://www.youtube.com/embed/${release.youtubeId}`,
        contentUrl: `https://www.youtube.com/watch?v=${release.youtubeId}`,
        url: resolvedCanonicalUrl,
        ...(publishedAt ? { uploadDate: publishedAt } : {}),
        ...(isoDuration ? { duration: isoDuration } : {}),
        inLanguage: toLanguageTag(release.defaultAudioLanguage),
        ...(lyricTracks.length > 0
          ? { subtitleLanguage: lyricTracks.map((t) => t.lang) }
          : {}),
        genre: 'Sufi music',
        isFamilyFriendly: true,
        publisher: publisherNode,
      }
    : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Releases', item: `${baseUrl}/releases` },
      { '@type': 'ListItem', position: 3, name: title, item: resolvedCanonicalUrl },
    ],
  };

  return { musicCompositionSchema, musicRecordingSchema, videoObjectSchema, breadcrumbSchema };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const release = await getReleaseByKey(slug);
  const canonicalKey = release?.slug || slug;
  const resolvedCanonicalUrl = canonicalUrl(`/release-detail/${canonicalKey}`);

  if (!release || (!isPubliclyEligibleRelease(release) && !(await isRequestAdmin()))) {
    return {
      title: 'Release Not Found',
      description: 'This release could not be found on SufiPulse.',
      robots: { index: false, follow: false },
    };
  }

  const title = resolveCanonicalSongTitle(release);
  const description = releaseDescription(release);
  const thumbnail =
    release.canonicalThumbnail ||
    release.thumbnailUrl ||
    (release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg` : undefined);
  const lyricistKeyword = resolveCredit(release, 'lyricist', 'writer', 'Dr. Zarf-e-Noori');
  const performerKeyword = resolveCredit(release, 'leadVocalist', 'vocalist', null);
  const keywords = Array.from(
    new Set(
      [
        title,
        lyricistKeyword,
        performerKeyword,
        'Sufi music',
        'Sufi kalam',
        'Urdu Sufi kalam',
        'Kashmiri Sufi music',
        'SufiPulse USA',
        ...(Array.isArray(release.tags) ? release.tags : []),
      ].filter(Boolean) as string[]
    )
  );

  return {
    title,
    description: description.slice(0, 160),
    keywords,
    alternates: { canonical: resolvedCanonicalUrl },
    openGraph: {
      title: `${title} | SufiPulse USA`,
      description: description.slice(0, 200),
      type: 'music.song',
      url: resolvedCanonicalUrl,
      ...(thumbnail ? { images: [{ url: thumbnail, width: 1280, height: 720, alt: title }] } : {}),
      siteName: 'SufiPulse USA',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | SufiPulse USA`,
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

  if (!release || (!isPubliclyEligibleRelease(release) && !(await isRequestAdmin()))) {
    notFound();
  }

  const baseUrl = CANONICAL_ORIGIN;
  const canonicalSlug = release.slug;

  if (canonicalSlug && canonicalSlug !== slug) {
    permanentRedirect(`/release-detail/${canonicalSlug}`);
  }

  const resolvedCanonicalUrl = canonicalUrl(`/release-detail/${canonicalSlug}`);
  const lyricTracks = extractCrawlableMultilingualLyrics(release);
  const { musicCompositionSchema, musicRecordingSchema, videoObjectSchema, breadcrumbSchema } =
    buildSchemas(release, resolvedCanonicalUrl, baseUrl, lyricTracks);

  graphResolver.init();
  const connectedNodes = graphResolver.getRegistriesForRelease(release.id);
  const canonicalTitle = resolveCanonicalSongTitle(release);
  const description = releaseDescription(release);
  const lyricist = resolveCredit(release, 'lyricist', 'writer', 'Dr. Zarf-e-Noori');
  const vocalist = resolveCredit(release, 'leadVocalist', 'vocalist', null);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicCompositionSchema) }}
      />
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/*
       * SSR MULTILINGUAL SEARCH & DISCOVERY AUTHORITY LAYER
       * Ensures Googlebot, Bingbot, and AI crawlers index the canonical title, credits,
       * multilingual kalam lyrics (Urdu, Roman Urdu, Devanagari, English), and semantic
       * Discovery Graph links directly in raw SSR HTML before client hydration.
       */}
      <article className="sr-only" data-ssr-release-authority="true">
        <h1>{canonicalTitle}</h1>
        <p>{description}</p>
        {lyricist && <p>Lyricist & Composer: {lyricist}</p>}
        {vocalist && <p>Vocalist: {vocalist}</p>}
        {release.youtubeId && (
          <p>
            <a href={`https://www.youtube.com/watch?v=${release.youtubeId}`}>
              Watch {canonicalTitle} full song on SufiPulse USA YouTube
            </a>
          </p>
        )}
        {lyricTracks.map((track) => (
          <section key={track.lang} lang={track.lang}>
            <h2>{canonicalTitle} — {track.label}</h2>
            <p>{track.lines.join('\n')}</p>
          </section>
        ))}
        <nav aria-label="Related Sufi Discovery Topics">
          <ul>
            {connectedNodes.concept.map((item) => (
              <li key={`c-${item.slug}`}>
                <a href={`/concepts/${item.slug}`}>{item.title}</a>
              </li>
            ))}
            {connectedNodes.theme.map((item) => (
              <li key={`t-${item.slug}`}>
                <a href={`/themes/${item.slug}`}>{item.title}</a>
              </li>
            ))}
            {connectedNodes.mood.map((item) => (
              <li key={`m-${item.slug}`}>
                <a href={`/moods/${item.slug}`}>{item.title}</a>
              </li>
            ))}
            {connectedNodes.region.map((item) => (
              <li key={`r-${item.slug}`}>
                <a href={`/regions/${item.slug}`}>{item.title}</a>
              </li>
            ))}
            <li><a href="/discovery">SufiPulse Global Discovery Hub</a></li>
            <li><a href="/releases">All Full-Length SufiPulse Releases</a></li>
          </ul>
        </nav>
      </article>

      {children}
    </>
  );
}
