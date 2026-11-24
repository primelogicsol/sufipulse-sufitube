import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { entityStore } from '@/lib/atlas/atlas-entity';
import { relationshipStore } from '@/lib/atlas/atlas-relationship';
import { getEntityRoute, getEntityLabel } from '@/lib/utils/pluralize';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { literaryArticles } from '@/app/data/literary-articles';
import { CANONICAL_ORIGIN, canonicalUrl, resolveCanonicalSongTitle } from '@/lib/canonical-seo';
import { Compass, Network, ArrowLeft, Disc3 } from 'lucide-react';

import { ExploreReleaseAction } from '@/components/atlas/conversion/ExploreReleaseAction';
import { ReadAction } from '@/components/atlas/conversion/ReadAction';
import { WatchAction } from '@/components/atlas/conversion/WatchAction';
import { FollowAction } from '@/components/atlas/conversion/FollowAction';
import { SubscribeAction } from '@/components/atlas/conversion/SubscribeAction';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ entityType: string; slug: string }>;
};

// Historical biographical entities whose comprehensive canonical essays live under /knowledge/*
const KNOWLEDGE_CANONICAL_OVERRIDES: Record<string, string> = {
  'amir-khusrau': '/knowledge/poets/amir-khusrau',
  'nusrat-fateh-ali-khan': '/knowledge/singers/nusrat-fateh-ali-khan',
  'abida-parveen': '/knowledge/singers/abida-parveen',
  'rahat-fateh-ali-khan': '/knowledge/singers/rahat-fateh-ali-khan',
  'sabri-brothers': '/knowledge/singers/sabri-brothers',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const entity = entityStore.findAll().find((e: any) => e.slug === resolvedParams.slug);
  if (!entity || entity.status !== 'published' || entity.isPublic === false) {
    return {
      title: 'Discovery Topic Not Found',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = KNOWLEDGE_CANONICAL_OVERRIDES[entity.slug] || getEntityRoute(entity.entityType, entity.slug);
  const fullCanonical = canonicalUrl(canonicalPath);

  return {
    title: `${entity.canonicalName} — ${getEntityLabel(entity.entityType)}`,
    description: entity.shortDescription,
    alternates: {
      canonical: fullCanonical,
    },
    openGraph: {
      title: `${entity.canonicalName} — ${getEntityLabel(entity.entityType)} | SufiPulse USA`,
      description: entity.shortDescription,
      url: fullCanonical,
      siteName: 'SufiPulse USA',
      type: 'article',
    },
  };
}

export default async function UniversalEntityPage({ params }: Props) {
  const resolvedParams = await params;
  const { entityType, slug } = resolvedParams;

  const entity = entityStore.findAll().find((e: any) => e.slug === slug);
  if (!entity || entity.status !== 'published' || entity.isPublic === false) {
    notFound();
  }

  const expectedPath = getEntityRoute(entity.entityType, entity.slug);
  const actualPath = `/discovery/${entityType}/${slug}`;
  if (expectedPath !== actualPath) {
    permanentRedirect(expectedPath);
  }

  // Fetch verified graph relationships
  const allRelationships = relationshipStore.findAll();
  const outgoing = allRelationships.filter((r: any) => r.sourceEntityId === entity.id);
  const incoming = allRelationships.filter((r: any) => r.targetEntityId === entity.id);
  const allRels = [...outgoing, ...incoming];

  const relatedIds = new Set<string>();
  allRels.forEach((r: any) => {
    if (r.sourceEntityId !== entity.id) relatedIds.add(r.sourceEntityId);
    if (r.targetEntityId !== entity.id) relatedIds.add(r.targetEntityId);
  });

  const relatedEntities = Array.from(relatedIds)
    .map((id) => entityStore.findById(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e && e.status === 'published' && e.isPublic !== false));

  // Resolve real published SufiPulse full-length songs & literary articles
  const publicReleases = cmsServerStorage
    .getPublicReleases()
    .filter((r) => r.status === 'published' && (r.visibility || 'public') === 'public');

  const connectedReleases = (entity.connectedReleaseIds || [])
    .map((idOrSlug: string) => publicReleases.find((r) => r.id === idOrSlug || r.slug === idOrSlug))
    .filter((r: any): r is NonNullable<typeof r> => Boolean(r));

  // Fallback to top verified SufiPulse flagship full-length release so visitors always have a real listen path
  const featuredRelease = connectedReleases[0] || publicReleases[0] || null;
  const featuredArticle =
    (entity.connectedArticleIds || [])
      .map((idOrSlug: string) => literaryArticles.find((a) => a.id === idOrSlug || a.slug === idOrSlug))
      .find(Boolean) || literaryArticles[0] || null;

  const fullCanonical = canonicalUrl(expectedPath);
  const schemaType =
    ['singer', 'poet', 'saint'].includes(entity.entityType.toLowerCase())
      ? 'Person'
      : entity.entityType.toLowerCase() === 'song'
        ? 'MusicComposition'
        : entity.entityType.toLowerCase() === 'album'
          ? 'MusicAlbum'
          : 'DefinedTerm';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Discovery', item: `${CANONICAL_ORIGIN}/discovery` },
          { '@type': 'ListItem', position: 3, name: entity.canonicalName, item: fullCanonical },
        ],
      },
      {
        '@type': schemaType,
        '@id': `${fullCanonical}#entity`,
        name: entity.canonicalName,
        description: entity.shortDescription,
        url: fullCanonical,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO SECTION */}
      <div className="bg-gradient-to-b from-slate-900 via-[#0A0A0A] to-[#0A0A0A] pt-24 pb-16 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/discovery"
              className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Discovery Hub
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                  {getEntityLabel(entity.entityType)}
                </span>
                {entity.primaryDomain && (
                  <span className="text-xs font-semibold text-slate-500 capitalize">
                    {entity.primaryDomain.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                {entity.canonicalName}
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed font-light">
                {entity.shortDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BODY LAYOUT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT: KNOWLEDGE & GRAPH */}
          <div className="lg:col-span-2 space-y-12">
            <section className="prose prose-invert prose-emerald max-w-none">
              <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-4 mb-6 flex items-center">
                <Compass className="w-6 h-6 mr-3 text-emerald-500" /> Historical & Spiritual Context
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                {entity.longDescription || entity.shortDescription}
              </p>

              {entity.sufipulseJustification && (
                <div className="bg-emerald-950/20 border-l-4 border-emerald-500 p-6 rounded-r-xl my-8">
                  <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-2">
                    SufiPulse Interpretive Lens
                  </h4>
                  <p className="text-slate-300 m-0 text-base italic">
                    &ldquo;{entity.sufipulseJustification}&rdquo;
                  </p>
                </div>
              )}
            </section>

            {entity.authorityMetadata && Object.keys(entity.authorityMetadata).length > 0 && (
              <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Archival Metadata</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {Object.entries(entity.authorityMetadata).map(([key, val]) => (
                    <div key={key}>
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{key}</div>
                      <div className="text-slate-200 font-medium">
                        {Array.isArray(val) ? val.join(', ') : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* GRAPH CONNECTIONS */}
            <section>
              <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-4 mb-6 flex items-center">
                <Network className="w-6 h-6 mr-3 text-emerald-500" /> Connected Sufi Knowledge Nodes ({relatedEntities.length})
              </h2>
              {relatedEntities.length === 0 ? (
                <p className="text-slate-500 italic">No direct peer entities linked yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedEntities.map((rel) => {
                    const relEdge = allRels.find(
                      (r) => r.sourceEntityId === rel.id || r.targetEntityId === rel.id
                    );
                    return (
                      <Link
                        key={rel.id}
                        href={getEntityRoute(rel.entityType, rel.slug)}
                        className="bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 transition-all group"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-400">
                            {getEntityLabel(rel.entityType)}
                          </span>
                          {relEdge && (
                            <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-1 rounded">
                              {relEdge.relationshipType.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-white font-bold text-lg group-hover:text-emerald-300 transition-colors">
                          {rel.canonicalName}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-2">{rel.shortDescription}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: VERIFIED GRAPH STATS & FULL-SONG CONVERSION PATHWAY */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Graph Connectivity
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Editorial & Graph Registry
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div className="text-emerald-400 font-bold text-2xl">{relatedEntities.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Connected Nodes</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div className="text-amber-400 font-bold text-2xl">{publicReleases.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Full-Length Songs</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-slate-900/40 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                <Disc3 className="w-5 h-5 mr-2 text-emerald-500" /> Listen on SufiPulse USA
              </h3>

              {featuredRelease && (
                <ExploreReleaseAction
                  releaseSlug={featuredRelease.slug}
                  title={resolveCanonicalSongTitle(featuredRelease)}
                />
              )}

              {featuredRelease?.youtubeId && (
                <WatchAction
                  videoId={featuredRelease.youtubeId}
                  title={`Watch "${resolveCanonicalSongTitle(featuredRelease)}" on YouTube`}
                />
              )}

              {featuredArticle && (
                <ReadAction
                  articleSlug={featuredArticle.slug}
                  title={featuredArticle.title}
                />
              )}

              <FollowAction />
            </div>

            <SubscribeAction />
          </div>
        </div>
      </div>
    </div>
  );
}
