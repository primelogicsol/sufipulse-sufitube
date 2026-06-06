import { entityStore } from '@/lib/atlas/atlas-entity';
import { relationshipStore } from '@/lib/atlas/atlas-relationship';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

// Conversion Components
import { WatchAction } from '@/components/atlas/conversion/WatchAction';
import { ListenAction } from '@/components/atlas/conversion/ListenAction';
import { ReadAction } from '@/components/atlas/conversion/ReadAction';
import { FollowAction } from '@/components/atlas/conversion/FollowAction';
import { SubscribeAction } from '@/components/atlas/conversion/SubscribeAction';
import { ExploreReleaseAction } from '@/components/atlas/conversion/ExploreReleaseAction';

export async function generateMetadata({ params }: { params: Promise<{ entityType: string; slug: string }> }): Promise<Metadata> {
  const { entityType, slug } = await params;
  
  // Clean up entityType from URL (e.g. 'artists' -> 'artist')
  const type = entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
  
  const entity = entityStore.findBySlug(slug);
  if (!entity || entity.entityType !== type || (!entity.isPublic && process.env.NODE_ENV !== 'development')) {
    return { title: 'Not Found | SufiPulse' };
  }

  return {
    title: `${entity.canonicalName} | SufiPulse Atlas`,
    description: entity.shortDescription,
    alternates: {
      canonical: `/discovery/${entityType}/${slug}`,
    }
  };
}

export default async function EntityExperiencePage({ params }: { params: Promise<{ entityType: string; slug: string }> }) {
  const { entityType, slug } = await params;
  
  const type = entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
  const entity = entityStore.findBySlug(slug);
  
  // Gate check
  if (!entity || entity.entityType !== type || (!entity.isPublic && process.env.NODE_ENV !== 'development')) {
    notFound();
  }

  // Fetch relationships
  const allEdges = relationshipStore.findAll();
  
  // Get connected entities (1 hop)
  const connectedEdges = allEdges.filter(e => e.sourceEntityId === entity.id || e.targetEntityId === entity.id);
  
  const relatedEntities = connectedEdges.map(edge => {
    const isSource = edge.sourceEntityId === entity.id;
    const targetId = isSource ? edge.targetEntityId : edge.sourceEntityId;
    const relType = edge.relationshipType;
    const targetEntity = entityStore.findById(targetId);
    return { entity: targetEntity, relationshipType: relType, isOutgoing: isSource };
  }).filter(e => e.entity !== null && !e.entity.canonicalName.match(/^(Saint|Singer|Album|Concept|Channel|Poet|Song)\s+\d+$/i)) as Array<{ entity: NonNullable<ReturnType<typeof entityStore.findById>>; relationshipType: string; isOutgoing: boolean }>;

  // We want to group by type
  const groupedRelations: Record<string, typeof relatedEntities> = {};
  for (const rel of relatedEntities) {
    if (!groupedRelations[rel.entity.entityType]) {
      groupedRelations[rel.entity.entityType] = [];
    }
    groupedRelations[rel.entity.entityType].push(rel);
  }

  // Content Connections (For Conversion Components)
  // In a real implementation, these would pull from the actual connected content IDs.
  // For the template, we'll extract them if available, else fallback or omit.
  const hasVideo = entity.connectedVideoIds.length > 0;
  const hasRelease = entity.connectedReleaseIds.length > 0;
  const hasArticle = entity.connectedArticleIds.length > 0;

  // We also check edges for content connections
  const connectedReleases = relatedEntities.filter(r => r.entity.entityType === 'release');
  const connectedArticles = relatedEntities.filter(r => r.entity.entityType === 'publication');

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      
      {/* ── SEO JSON-LD ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": entity.schemaType || "Thing",
            "name": entity.canonicalName,
            "description": entity.shortDescription,
            "alternateName": entity.alternateNames,
            "url": `https://sufipulse.com/discovery/${entityType}/${slug}`,
          })
        }}
      />

      {/* ── BREADCRUMBS ── */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm text-slate-400">
            <Link href="/" className="hover:text-emerald-400">SufiPulse</Link>
            <span className="mx-2">/</span>
            <Link href="/discovery" className="hover:text-emerald-400">Discovery</Link>
            <span className="mx-2">/</span>
            <span className="capitalize">{entityType}</span>
            <span className="mx-2">/</span>
            <span className="text-white">{entity.canonicalName}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-16">
          
          {/* Identity & Knowledge */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 lg:p-12">
            <div className="mb-8">
              <span className="text-emerald-500 font-bold tracking-wider uppercase text-sm">{entity.entityType}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">
              {entity.canonicalName}
            </h1>
            
            {/* Entity Authority Metadata */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row gap-4 md:gap-8 justify-between">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1">
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Entity Type</div>
                  <div className="text-slate-200 capitalize">{entity.entityType}</div>
                </div>
                {entity.authorityMetadata && Object.entries(entity.authorityMetadata).map(([key, value]) => {
                  if (key === 'relatedConcepts' || !value) return null;
                  const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                  return (
                    <div key={key}>
                      <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{formattedKey}</div>
                      <div className="text-slate-200">{Array.isArray(value) ? value.join(', ') : value}</div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Discovery Status</div>
                <div className="text-emerald-400 font-medium">Flagship</div>
              </div>
            </div>

            {entity.authorityMetadata?.relatedConcepts && entity.authorityMetadata.relatedConcepts.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {entity.authorityMetadata.relatedConcepts.map(concept => (
                  <span key={concept} className="bg-slate-800/50 border border-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm">
                    {concept}
                  </span>
                ))}
              </div>
            )}

            <div className="prose prose-invert prose-lg max-w-none text-slate-300">
              <p className="lead text-2xl text-emerald-400 font-medium mb-8 leading-relaxed">{entity.shortDescription}</p>
              <div className="leading-relaxed space-y-6">
                {entity.longDescription.split('\n\n').map((block, idx) => {
                  if (block.startsWith('## ')) {
                    return <h2 key={idx} className="text-2xl font-bold text-white mt-12 mb-4">{block.replace('## ', '')}</h2>;
                  }
                  // Basic bold formatting support
                  const parts = block.split(/(\*\*.*?\*\*|\*.*?\*)/g);
                  return (
                    <p key={idx} className="text-slate-300">
                      {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={pIdx} className="text-white">{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('*') && part.endsWith('*')) {
                          return <em key={pIdx} className="text-slate-400">{part.slice(1, -1)}</em>;
                        }
                        return part;
                      })}
                    </p>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Why SufiPulse Covers This */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-white mb-8 border-b border-slate-800 pb-4">Why SufiPulse Covers This</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-emerald-400 mb-4">Why This Matters To Sufi Music</h3>
                <p className="text-slate-300 leading-relaxed">
                  {entity.sufipulseJustification || "This entity serves as a foundational pillar in the evolution and preservation of Sufi musical traditions globally."}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-emerald-400 mb-4">Why It Matters Today</h3>
                <p className="text-slate-300 leading-relaxed">
                  In the modern era, preserving this heritage bridges the gap between historical devotion and contemporary spiritual seeking.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-emerald-400 mb-4">How SufiPulse Interprets It</h3>
                <p className="text-slate-300 leading-relaxed">
                  {entity.sufipulseInterpretation || "Through high-fidelity recordings, authentic translations, and modern visual storytelling, SufiPulse contextualizes this legacy for a global audience without compromising its sacred roots."}
                </p>
              </div>
            </div>
          </section>

          {/* Influence Network */}
          <section className="pt-8 border-t border-slate-800">
            <h2 className="text-3xl font-bold text-white mb-8">Influence Network</h2>
            {Object.keys(groupedRelations).length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(groupedRelations).map(([type, relations]) => {
                  if (type === 'related_concept' || type === 'related_publication') return null; // Save for Further Study
                  return (
                    <div key={type} className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-400 capitalize tracking-wider">{type.replace(/_/g, ' ')}</h3>
                      <div className="grid gap-3">
                        {relations.map(rel => (
                          <Link 
                            key={rel.entity.id}
                            href={`/discovery/${rel.entity.entityType}s/${rel.entity.slug}`}
                            className="flex items-center space-x-3 p-4 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/60 transition-colors group"
                          >
                            <div className="flex-1">
                              <div className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                                {rel.entity.canonicalName}
                              </div>
                              <div className="text-sm text-slate-500">
                                {rel.entity.entityType}
                              </div>
                            </div>
                            <span className="text-slate-600 group-hover:text-emerald-500 transition-colors">→</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-500 p-8 border border-slate-800 rounded-xl bg-slate-900/20 text-center">
                Influence network is currently being mapped.
              </div>
            )}
          </section>

          {/* Further Study */}
          <section className="pt-16 pb-8 border-t border-slate-800">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Further Study</h2>
              <p className="text-slate-400">Continue your journey into the intellectual and literary dimensions of this legacy.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {connectedArticles.map(rel => (
                <ReadAction 
                  key={rel.entity.id} 
                  articleSlug={rel.entity.slug} 
                  title={rel.entity.canonicalName} 
                />
              ))}
              {connectedArticles.length === 0 && (
                <div className="text-slate-500 italic p-6 border border-slate-800 rounded-xl bg-slate-900/30">
                  New research and publications are currently in development.
                </div>
              )}
            </div>
          </section>

          {/* SufiPulse Interpretation (The Destination) */}
          <section className="pt-16 pb-8 border-t border-slate-800">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white tracking-tight mb-4">SufiPulse Interpretation</h2>
              <p className="text-xl text-slate-400">Experience our original releases, deep-dive publications, and performances related to {entity.canonicalName}.</p>
            </div>

            <div className="grid gap-6">
              {/* Priority 1: Explore Release */}
              {connectedReleases.map(rel => (
                <ExploreReleaseAction 
                  key={`explore-${rel.entity.id}`} 
                  releaseSlug={rel.entity.slug} 
                  title={rel.entity.canonicalName} 
                />
              ))}

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Priority 2: Watch Performance */}
                {connectedReleases.map(rel => (
                  <WatchAction 
                    key={`watch-${rel.entity.id}`} 
                    videoId={rel.entity.connectedVideoIds[0] || 'dQw4w9WgXcQ'} 
                    title={rel.entity.canonicalName} 
                  />
                ))}
                {(connectedReleases.length === 0 && hasVideo) && (
                  <WatchAction videoId={entity.connectedVideoIds[0]} />
                )}

                {/* Priority 3 & 4: Audience Growth */}
                <div className="space-y-6">
                  <SubscribeAction />
                  <FollowAction />
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
