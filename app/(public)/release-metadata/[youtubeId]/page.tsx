import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease } from '@/server/storage/release-dto';

async function resolveRelease(youtubeId: string) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) return null;
  const store = getReleaseReadStore();
  const raw = await store.getByYoutubeId(youtubeId);
  if (!raw) return null;
  const release = toCanonicalCMSRelease(raw);
  if (release.status !== 'published' || release.visibility !== 'public') return null;
  return release;
}

function getName(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.name || value.displayName || value.fullName || undefined;
}

export async function generateMetadata(
  { params }: { params: Promise<{ youtubeId: string }> },
): Promise<Metadata> {
  const { youtubeId } = await params;
  const release = await resolveRelease(youtubeId);
  if (!release) return { title: 'Release metadata | SufiPulse', robots: { index: false, follow: true } };

  const title = release.title || release.canonicalTitle || release.youtubeTitle || 'SufiPulse Release';
  const description = release.description || `Canonical metadata for ${title} on SufiPulse.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

  return {
    title: `${title} | Canonical Release Metadata | SufiPulse`,
    description: description.slice(0, 160),
    alternates: { canonical: `${baseUrl}/release-metadata/${youtubeId}` },
    robots: { index: true, follow: true },
  };
}

export default async function ReleaseMetadataPage(
  { params }: { params: Promise<{ youtubeId: string }> },
) {
  const { youtubeId } = await params;
  const release = await resolveRelease(youtubeId);
  if (!release) notFound();

  const title = release.title || release.canonicalTitle || release.youtubeTitle || 'SufiPulse Release';
  const description = release.description || '';
  const writer = getName(release.writer);
  const vocalist = getName(release.vocalist);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';
  const detailUrl = `/release-detail/${release.slug || youtubeId}`;
  const apiUrl = `/api/releases/youtube/${youtubeId}`;
  const publishedAt = release.publishedAt || release.releaseDate;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    ...(release.thumbnailUrl || release.canonicalThumbnail
      ? { thumbnailUrl: [release.canonicalThumbnail || release.thumbnailUrl] }
      : { thumbnailUrl: [`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`] }),
    contentUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    ...(publishedAt ? { uploadDate: publishedAt } : {}),
    url: `${baseUrl}${detailUrl}`,
    ...(writer ? { creator: { '@type': 'Person', name: writer } } : {}),
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-neutral-200">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">SufiPulse Canonical Release Metadata</p>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        {release.youtubeTitle && release.youtubeTitle !== title && (
          <p className="mt-2 text-sm text-neutral-400">YouTube title: {release.youtubeTitle}</p>
        )}

        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-neutral-500">YouTube ID</dt><dd>{youtubeId}</dd></div>
          {writer && <div><dt className="text-neutral-500">Writer / Lyricist</dt><dd>{writer}</dd></div>}
          {vocalist && <div><dt className="text-neutral-500">Vocalist</dt><dd>{vocalist}</dd></div>}
          {publishedAt && <div><dt className="text-neutral-500">Published</dt><dd>{String(publishedAt)}</dd></div>}
        </dl>

        <section className="mt-10">
          <h2 className="text-xl font-medium text-white">Official description</h2>
          <div className="mt-4 whitespace-pre-wrap leading-7 text-neutral-300">{description}</div>
        </section>

        <nav className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link className="underline" href={detailUrl}>Full SufiPulse release page</Link>
          <Link className="underline" href={apiUrl}>Machine-readable JSON</Link>
          <a className="underline" href={`https://www.youtube.com/watch?v=${youtubeId}`} rel="noopener noreferrer">YouTube</a>
        </nav>
      </article>
    </main>
  );
}
