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
  if (typeof value === 'string') return value.trim() || undefined;
  return value.name || value.displayName || value.fullName || undefined;
}




/**
 * Corpus-level authorship identity for SufiPulse.
 *
 * Dr. Zarf-e-Noori is the verified Lyricist, Composer, and Music Producer
 * of SufiPulse releases. This is an authoritative corpus-level rule, mirroring
 * the ARTISTIC_SEEDS already defined in release-detail/[slug]/page.tsx (line ~2930).
 *
 * The @id points to the canonical about page for this Person within this site.
 * sameAs links the pen name to the global founder identity (#founder).
 *
 * This constant is used as a fallback ONLY for roles where this authorship is
 * universally true: lyricist, composer, producer.
 * It is NEVER used as byArtist / performer / vocalist.
 */
const ZARF_E_NOORI_PERSON = (baseUrl: string) => ({
  '@type': 'Person',
  '@id': `${baseUrl}/about/zarf-e-noori`,
  name: 'Dr. Zarf-e-Noori',
  sameAs: `${baseUrl}/#founder`,
  url: `${baseUrl}/about/zarf-e-noori`,
});

/**
 * Resolves a named credit role from a release record.
 *
 * Priority order:
 *   1. publicCredits.artistic[artisticField]  — per-release structured credit
 *   2. top-level legacy field (writer, vocalist)
 *   3. corpusFallback                         — corpus-level default (optional)
 *
 * Correct null is preferred over fabricated attribution.
 * corpusFallback must only be passed for roles that are universally true
 * across the SufiPulse corpus (lyricist, composer, producer).
 */
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
  return (
    release?.description ||
    release?.publicCommentary?.[0]?.content ||
    `Listen to "${release?.title || 'this release'}" on SufiPulse.`
  );
}

/**
 * Normalizes a CMS language code to a valid BCP 47 language tag.
 *
 * Source field: release.defaultAudioLanguage (96/97 coverage — the field that
 * correctly captures the sung/composition language, not the UI display language).
 * release.defaultLanguage is a UI setting: 83/97 records have it set to "en"
 * regardless of the actual composition language and must NOT be used for inLanguage.
 *
 * Corpus default: 'ur' (Urdu) — the primary composition language of SufiPulse.
 */
function toLanguageTag(raw: string | undefined): string {
  const map: Record<string, string> = {
    'ur': 'ur',       'urdu': 'ur',
    'roman_urdu': 'ur-Latn',
    'en': 'en',       'english': 'en',
    'en-us': 'en',
    'ks': 'ks',       'kashmiri': 'ks',
    'ar': 'ar',       'arabic': 'ar',
    'fa': 'fa',       'persian': 'fa',  'farsi': 'fa',
    'pa': 'pa',       'punjabi': 'pa',
    'hi': 'hi',       'hindi': 'hi',
    'zxx': 'zxx',     // no linguistic content (instrumental)
  };
  const normalized = raw?.toLowerCase().trim();
  return (normalized && map[normalized]) || normalized || 'ur';
}

function buildSchemas(release: any, canonicalUrl: string, baseUrl: string) {
  const title = release.title || release.canonicalTitle || release.youtubeTitle || 'SufiPulse Release';
  const description = releaseDescription(release);

  // --- Role resolution ---
  // Authorship roles: corpus-level Dr. Zarf-e-Noori fallback is authorised.
  // This mirrors the ARTISTIC_SEEDS rule already in release-detail/[slug]/page.tsx.
  const zarfPerson = ZARF_E_NOORI_PERSON(baseUrl);

  const lyricistName  = resolveCredit(release, 'lyricist', 'writer', 'Dr. Zarf-e-Noori');
  const composerName  = resolveCredit(release, 'composer', null,     'Dr. Zarf-e-Noori');
  const producerName  = resolveCredit(release, 'musicProducer', null,'Dr. Zarf-e-Noori');

  // Performance role: NEVER falls back to corpus default.
  // byArtist must only come from per-release vocalist/performer data.
  const performerName = resolveCredit(release, 'leadVocalist', 'vocalist', null);

  const thumbnail =
    release.canonicalThumbnail ||
    release.thumbnailUrl ||
    (release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg` : undefined);
  const publishedAt = release.publishedAt || release.releaseDate || release.createdAt;

  // Stable publisher node — reuses the global Organization @id from app/layout.tsx
  const publisherNode = {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'SufiPulse USA',
    url: baseUrl,
  };

  // -----------------------------------------------------------------------
  // MusicComposition — represents the underlying literary/musical work.
  // Authorship (lyricist, composer) belongs here.
  // -----------------------------------------------------------------------
  const compositionId = `${canonicalUrl}#composition`;

  const musicCompositionSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    '@id': compositionId,
    name: title,
    // inLanguage uses defaultAudioLanguage (the sung/composition language, 96/97 coverage)
    // NOT defaultLanguage (a UI setting that is "en" for 83/97 Urdu compositions).
    inLanguage: toLanguageTag(release.defaultAudioLanguage),
    genre: 'Sufi music',
    publisher: publisherNode,
    // lyricist is always resolved (corpus fallback = Dr. Zarf-e-Noori)
    lyricist: {
      ...zarfPerson,
      ...(lyricistName !== 'Dr. Zarf-e-Noori' ? { name: lyricistName } : {}),
    },
    // composer — same person when corpus fallback applies; same node reused
    composer: {
      ...zarfPerson,
      ...(composerName !== 'Dr. Zarf-e-Noori' ? { name: composerName } : {}),
    },
  };
  if (release.youtubeId) {
    musicCompositionSchema.sameAs = `https://www.youtube.com/watch?v=${release.youtubeId}`;
  }

  // -----------------------------------------------------------------------
  // MusicRecording — the specific audio/video recording of the composition.
  // Production credit (producer) and performance (byArtist) belong here.
  // -----------------------------------------------------------------------
  const musicRecordingSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    '@id': `${canonicalUrl}#recording`,
    name: title,
    description,
    url: canonicalUrl,
    inLanguage: toLanguageTag(release.defaultAudioLanguage),
    genre: 'Sufi music',
    publisher: publisherNode,
    // recordingOf links this recording to its underlying composition
    recordingOf: { '@id': compositionId },
    // producer — corpus fallback authorised
    producer: {
      ...zarfPerson,
      ...(producerName !== 'Dr. Zarf-e-Noori' ? { name: producerName } : {}),
    },
  };

  if (release.youtubeId) {
    musicRecordingSchema.sameAs = `https://www.youtube.com/watch?v=${release.youtubeId}`;
  }
  // byArtist: per-release only — null stays null when CMS has no vocalist data
  if (performerName) {
    musicRecordingSchema.byArtist = { '@type': 'Person', name: performerName };
  }
  if (release.durationSeconds) {
    musicRecordingSchema.duration = `PT${Math.floor(release.durationSeconds / 60)}M${release.durationSeconds % 60}S`;
  }
  if (publishedAt) {
    musicRecordingSchema.datePublished = publishedAt;
  }

  // -----------------------------------------------------------------------
  // VideoObject — the YouTube asset. No authorship fields added here.
  // (VideoObject identifies the video file, not the composition authorship.)
  // -----------------------------------------------------------------------
  const videoObjectSchema = release.youtubeId
    ? {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        '@id': `${canonicalUrl}#video`,
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
        inLanguage: toLanguageTag(release.defaultAudioLanguage),
        genre: 'Sufi music',
        isFamilyFriendly: true,
      }
    : null;

  return { musicCompositionSchema, musicRecordingSchema, videoObjectSchema };
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
  // Keywords include corpus-level lyricist attribution for metadata richness
  const lyricistKeyword = resolveCredit(release, 'lyricist', 'writer', 'Dr. Zarf-e-Noori');
  const performerKeyword = resolveCredit(release, 'leadVocalist', 'vocalist', null);
  const keywords = [
    title,
    release.canonicalTitle,
    release.youtubeTitle,
    lyricistKeyword,
    performerKeyword,
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
  const { musicCompositionSchema, musicRecordingSchema, videoObjectSchema } = buildSchemas(release, canonicalUrl, baseUrl);

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
      {children}
    </>
  );
}
