import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { crawlerRegistry } from '@/lib/crawler-registry';
import { 
  Network, ExternalLink, Film, BookOpen, Music2, Globe, ArrowRight, Percent, Award 
} from 'lucide-react';
import { Layout } from '@/app/components/layout/Layout';
import { JsonLd } from './JsonLd';
import { registriesStorage, type RegistryItem } from '@/lib/registries-storage';
import { graphResolver } from '@/lib/graph-resolver';

interface DiscoveryGraphNodeViewProps {
  slug: string;
  type: 'concept' | 'theme' | 'mood' | 'region' | 'language' | 'diasporaMarket' | 'playlist';
  categoryLabel: string;
  categoryUrlPath: string; // e.g. "concepts", "themes"
}

export async function DiscoveryGraphNodeView({
  slug,
  type,
  categoryLabel,
  categoryUrlPath
}: DiscoveryGraphNodeViewProps) {
  
  // Hydrate data sources
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

  // Identify trackable type for client-side telemetry ping
  const trackableTypeForPageView = ['concept', 'theme', 'region', 'release', 'playlist'].includes(type) ? type : null;

  // 1. Load the target registry node
  const registriesMap: Record<DiscoveryGraphNodeViewProps['type'], keyof typeof registriesStorage['data']> = {
    concept: 'concepts',
    theme: 'themes',
    mood: 'moods',
    region: 'regions',
    language: 'languages',
    diasporaMarket: 'diasporaMarkets',
    playlist: 'playlists'
  };

  const regKey = registriesMap[type];
  const node = registriesStorage.getItem(regKey, slug);

  // Return Not Found UI if node doesn't exist or is not public
  if (!node || !node.isActive || !node.isPublic) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Registry Node Not Found</h1>
          <p className="text-neutral-400 mb-8">The requested discover page is private or does not exist.</p>
          <Link href="/">
            <button className="px-6 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition">
              Return Home
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  // 2. Fetch connected published releases
  const releases = graphResolver.getReleasesForRegistry(slug, type);
  const publishedReleases = releases.filter(r => r.status === 'published');

  // 3. Dynamically resolve Related Taxonomy Nodes
  // We scan the connected releases and find other nodes of the SAME type linked to those releases.
  const rawJoins = graphResolver.getRawJoins();
  const relatedSlugsMap = new Map<string, number>();

  publishedReleases.forEach(release => {
    const overlappingJoins = rawJoins.filter(
      j => j.releaseId === release.id && j.relationshipType === type && j.registryId && j.registryId !== slug
    );
    overlappingJoins.forEach(j => {
      if (j.registryId) {
        relatedSlugsMap.set(j.registryId, (relatedSlugsMap.get(j.registryId) || 0) + 1);
      }
    });
  });

  // Sort overlapping connections by frequency
  const sortedRelatedSlugs = Array.from(relatedSlugsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  const relatedNodes = sortedRelatedSlugs
    .map(relSlug => registriesStorage.getItem(regKey, relSlug))
    .filter((n): n is RegistryItem => n !== undefined && n.isActive && n.isPublic);

  // 4. Generate JSON-LD schemas
  const canonicalUrl = `https://www.sufipulse.com/${categoryUrlPath}/${slug}`;
  
  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.sufipulse.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `Discover ${categoryLabel}s`,
        "item": `https://www.sufipulse.com/${categoryUrlPath}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": node.title,
        "item": canonicalUrl
      }
    ]
  };

  // DefinedTerm / Topic Schema
  const termSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": node.title,
    "description": node.description,
    "inDefinedTermSet": `https://www.sufipulse.com/${categoryUrlPath}`
  };

  if (node.wikidataId) {
    termSchema.sameAs = `https://www.wikidata.org/wiki/${node.wikidataId}`;
  }

  // Collection Page Schema with Music Recordings
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${node.title} - SufiPulse Discover`,
    "description": node.description,
    "url": canonicalUrl,
    "about": {
      "@type": "Thing",
      "name": node.title,
      "description": node.description,
      "sameAs": node.wikidataId ? `https://www.wikidata.org/wiki/${node.wikidataId}` : undefined
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": publishedReleases.length,
      "itemListElement": publishedReleases.map((release, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "MusicRecording",
          "name": release.title,
          "url": `https://www.sufipulse.com/release-detail/${release.slug}`,
          "image": release.thumbnailUrl || `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg`,
          "duration": release.durationFormatted,
          "byArtist": [
            {
              "@type": "MusicGroup",
              "name": release.vocalist?.name || "SufiPulse Artist"
            }
          ]
        }
      }))
    }
  };

  return (
    <Layout>
      {/* Inject schemas */}
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={termSchema} />
      <JsonLd data={collectionSchema} />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        
        {/* Breadcrumb Navigation */}
        <nav className="text-xs font-semibold text-neutral-500 flex items-center gap-2">
          <Link href="/" className="hover:text-amber-500 transition">Home</Link>
          <span>/</span>
          <span className="text-neutral-400">Discover {categoryLabel}s</span>
          <span>/</span>
          <span className="text-amber-500">{node.title}</span>
        </nav>

        {/* Node Profile Header Card (Glassmorphic) */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          {/* Decorative ambient background blur */}
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
            {/* Description & Notes */}
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

            {/* Meta refs & links sidebar */}
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

        {/* Main Connected Tracks / Releases List */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Music2 size={24} className="text-amber-500" /> Governed Sacred Music ({publishedReleases.length})
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Curated tracks within the SufiPulse library expressing the maqam or spiritual scope of {node.title}.
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
              {publishedReleases.map(release => {
                const coverImage = release.thumbnailUrl || `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg`;
                const trackableType = ['concept', 'theme', 'region', 'release', 'playlist'].includes(type) ? type : null;
                const releasePath = `/release-detail/${release.slug}`;
                const trackingHref = trackableType
                  ? `/api/track-click?type=${trackableType}&slug=${slug}&action=video_click&redirect=${encodeURIComponent(releasePath)}`
                  : releasePath;

                return (
                  <a 
                    key={release.id}
                    href={trackingHref}
                    className="group block backdrop-blur-md bg-white/5 border border-white/10 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                      <Image 
                        src={coverImage} 
                        alt={release.title} 
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
                          {release.title}
                        </h3>
                        {release.subtitle && (
                          <p className="text-[10px] text-neutral-400 line-clamp-1">{release.subtitle}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 border-t border-white/5 pt-3">
                        <span className="font-semibold text-neutral-300">
                          {release.vocalist?.name || 'SufiPulse Artist'}
                        </span>
                        <span className="font-mono">
                          {release.viewCount?.toLocaleString() ?? 0} views
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Overlapping / Related Nodes (Concept ↔ Related Concept) */}
        {relatedNodes.length > 0 && (
          <div className="space-y-6 pt-6 border-t border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Network size={20} className="text-amber-500" /> Dynamically Overlapping {categoryLabel}s
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Related thematic concepts based on shared song assignments in the Discovery Graph.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {relatedNodes.map(relNode => (
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

        {/* Client-side telemetry ping for actual users (excludes search and AI bots) */}
        {trackableTypeForPageView && !isRequestBot && (
          <script
            dangerouslySetInnerHTML={{
              __html: `fetch('/api/track-click?type=${trackableTypeForPageView}&slug=${slug}&action=page_view&json=true').catch(function(){})`
            }}
          />
        )}

      </div>
    </Layout>
  );
}
