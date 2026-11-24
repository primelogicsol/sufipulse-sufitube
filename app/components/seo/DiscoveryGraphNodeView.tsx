import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { crawlerRegistry } from '@/lib/crawler-registry';
import { Network, ExternalLink, Film, BookOpen, Music2, ArrowRight } from 'lucide-react';
import { Layout } from '@/app/components/layout/Layout';
import { JsonLd } from './JsonLd';
import { registriesStorage, type RegistryItem } from '@/lib/registries-storage';
import { graphResolver } from '@/lib/graph-resolver';
import { getVocalistDisplayName } from '@/lib/cms-storage';
import { CANONICAL_ORIGIN, resolveCanonicalSongTitle, toIsoDuration } from '@/lib/canonical-seo';

interface DiscoveryGraphNodeViewProps {
  slug: string;
  type: 'concept' | 'theme' | 'mood' | 'region' | 'language' | 'diasporaMarket' | 'playlist';
  categoryLabel: string;
  categoryUrlPath: string;
}

export async function DiscoveryGraphNodeView({
  slug,
  type,
  categoryLabel,
  categoryUrlPath,
}: DiscoveryGraphNodeViewProps) {
  registriesStorage.init();
  graphResolver.init();
  crawlerRegistry.init();

  let isRequestBot = false;
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    isRequestBot = crawlerRegistry.isBot(userAgent);
    if (isRequestBot) {
      crawlerRegistry.logVisit(userAgent, `/${categoryUrlPath}/${slug}`);
    }
  } catch (err) {
    console.error('[CRAWLER-LOG] Failed to read headers or log bot visit:', err);
  }

  const trackableTypeForPageView = ['concept', 'theme', 'mood', 'region', 'release', 'playlist'].includes(type)
    ? type
    : null;

  const registriesMap: Record<DiscoveryGraphNodeViewProps['type'], keyof typeof registriesStorage['data']> = {
    concept: 'concepts',
    theme: 'themes',
    mood: 'moods',
    region: 'regions',
    language: 'languages',
    diasporaMarket: 'diasporaMarkets',
    playlist: 'playlists',
  };

  const regKey = registriesMap[type];
  const node = registriesStorage.getItem(regKey, slug);

  // Return genuine HTTP 404 instead of Soft-404 when node is absent or private
  if (!node || !node.isActive || !node.isPublic) {
    notFound();
  }

  const releases = graphResolver.getReleasesForRegistry(slug, type);
  const publishedReleases = releases.filter(
    (r) => r.status === 'published' && (r.visibility || 'public') === 'public'
  );

  const rawJoins = graphResolver.getRawJoins();
  const relatedSlugsMap = new Map<string, number>();

  publishedReleases.forEach((release) => {
    const overlappingJoins = rawJoins.filter(
      (j) =>
        j.releaseId === release.id &&
        j.relationshipType === type &&
        j.registryId &&
        j.registryId !== slug
    );
    overlappingJoins.forEach((j) => {
      if (j.registryId) {
        relatedSlugsMap.set(j.registryId, (relatedSlugsMap.get(j.registryId) || 0) + 1);
      }
    });
  });

  const sortedRelatedSlugs = Array.from(relatedSlugsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => entry[0]);

  const relatedNodes = sortedRelatedSlugs
    .map((relSlug) => registriesStorage.getItem(regKey, relSlug))
    .filter((n): n is RegistryItem => n !== undefined && n.isActive && n.isPublic);

  const resolvedCanonicalUrl = `${CANONICAL_ORIGIN}/${categoryUrlPath}/${slug}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: CANONICAL_ORIGIN,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Discovery Hub',
        item: `${CANONICAL_ORIGIN}/discovery`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: node.title,
        item: resolvedCanonicalUrl,
      },
    ],
  };

  const termSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: node.title,
    description: node.description,
    url: resolvedCanonicalUrl,
    inDefinedTermSet: `${CANONICAL_ORIGIN}/discovery`,
  };

  if (node.wikidataId) {
    termSchema.sameAs = `https://www.wikidata.org/wiki/${node.wikidataId}`;
  }

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${node.title} — SufiPulse Discovery`,
    description: node.description,
    url: resolvedCanonicalUrl,
    about: {
      '@type': 'Thing',
      name: node.title,
      description: node.description,
      ...(node.wikidataId ? { sameAs: `https://www.wikidata.org/wiki/${node.wikidataId}` } : {}),
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: publishedReleases.length,
      itemListElement: publishedReleases.map((release, idx) => {
        const isoDur = toIsoDuration(release.durationSeconds || release.durationFormatted);
        return {
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': 'MusicRecording',
            name: resolveCanonicalSongTitle(release),
            url: `${CANONICAL_ORIGIN}/release-detail/${release.slug}`,
            image:
              release.thumbnailUrl || `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg`,
            ...(isoDur ? { duration: isoDur } : {}),
            byArtist: [
              {
                '@type': 'MusicGroup',
                name: getVocalistDisplayName(release.vocalist) || 'SufiPulse USA',
              },
            ],
          },
        };
      }),
    },
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={termSchema} />
      <JsonLd data={collectionSchema} />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        <nav className="text-xs font-semibold text-neutral-500 flex items-center gap-2">
          <Link href="/" className="hover:text-amber-500 transition">Home</Link>
          <span>/</span>
          <Link href="/discovery" className="hover:text-amber-500 transition">Discovery</Link>
          <span>/</span>
          <span className="text-amber-500">{node.title}</span>
        </nav>

        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="space-y-3">
            <span className="px-3 py-1 bg-amber-500/15 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/30">
              Sufi {categoryLabel}
            </span>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {node.title}
            </h1>

            {node.synonyms && node.synonyms.length > 0 && (
              <div className="text-xs text-neutral-400">
                Also known as: <span className="font-semibold text-neutral-300">{node.synonyms.join(', ')}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/10">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Definition & Core Concept</h3>
                <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                  {node.description}
                </p>
              </div>

              {node.theologicalNotes && (
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <BookOpen size={12} className="text-amber-500" /> Theological & Poetic Interpretations
                  </h3>
                  <p className="text-sm text-neutral-400 font-serif leading-relaxed italic bg-white/5 p-4 rounded-xl border border-white/5">
                    {node.theologicalNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                  <Network size={12} className="text-amber-500" /> Knowledge Graph Metadata
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-neutral-500">Node Identifier</span>
                    <span className="font-mono text-neutral-300">{node.slug}</span>
                  </div>

                  {node.wikidataId && (
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-neutral-500 font-sans">Wikidata Resource</span>
                      <a
                        href={`https://www.wikidata.org/wiki/${node.wikidataId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-500 hover:underline font-mono flex items-center gap-0.5"
                      >
                        {node.wikidataId} <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Music2 size={24} className="text-amber-500" /> Full-Length Sacred Songs ({publishedReleases.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Original full-length SufiPulse USA recordings expressing the maqam and spiritual meaning of {node.title}.
            </p>
          </div>

          {publishedReleases.length === 0 ? (
            <div className="backdrop-blur-sm bg-white/5 border border-white/5 rounded-2xl p-12 text-center text-neutral-400">
              <Film className="mx-auto mb-3 opacity-30" size={40} />
              <h4 className="text-sm font-bold text-white">No Tracks Currently Linked</h4>
              <p className="text-xs mt-1">This node does not have any verified public song connections yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedReleases.map((release) => {
                const coverImage =
                  release.thumbnailUrl || `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg`;
                const releasePath = `/release-detail/${release.slug}`;
                const displayTitle = resolveCanonicalSongTitle(release);

                // Direct crawlable canonical <Link> (not blocked by robots.txt Disallow: /api/)
                return (
                  <Link
                    key={release.id}
                    href={releasePath}
                    className="group block backdrop-blur-md bg-white/5 border border-white/10 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                      <Image
                        src={coverImage}
                        alt={displayTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <span className="absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-black/60 text-white rounded font-mono">
                        {release.durationFormatted}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-sm group-hover:text-amber-500 transition line-clamp-1">
                          {displayTitle}
                        </h3>
                        {release.subtitle && (
                          <p className="text-[10px] text-neutral-400 line-clamp-1">{release.subtitle}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 border-t border-white/5 pt-3">
                        <span className="font-semibold text-neutral-300">
                          {getVocalistDisplayName(release.vocalist) || 'SufiPulse USA'}
                        </span>
                        <span className="font-mono">
                          {release.viewCount?.toLocaleString() ?? 0} views
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {relatedNodes.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Network size={20} className="text-amber-500" /> Related {categoryLabel}s
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Connected topics sharing full-length song assignments in the Discovery Graph.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {relatedNodes.map((relNode) => (
                <Link
                  key={relNode.slug}
                  href={`/${categoryUrlPath}/${relNode.slug}`}
                  className="px-4 py-2 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 rounded-xl text-xs font-semibold text-neutral-300 hover:text-amber-500 flex items-center gap-1.5 transition"
                >
                  {relNode.title} <ArrowRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {trackableTypeForPageView && !isRequestBot && (
          <script
            dangerouslySetInnerHTML={{
              __html: `fetch('/api/track-click?type=${trackableTypeForPageView}&slug=${slug}&action=page_view&json=true').catch(function(){})`,
            }}
          />
        )}
      </div>
    </>
  );
}
