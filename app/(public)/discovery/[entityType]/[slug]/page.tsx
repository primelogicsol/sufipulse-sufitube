import { entityStore } from '@/lib/atlas/atlas-entity';
import { relationshipStore } from '@/lib/atlas/atlas-relationship';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getEntityRoute, getEntityLabel } from '@/lib/utils/pluralize';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Conversion Components
import { WatchAction } from '@/components/atlas/conversion/WatchAction';
import { ReadAction } from '@/components/atlas/conversion/ReadAction';
import { FollowAction } from '@/components/atlas/conversion/FollowAction';
import { SubscribeAction } from '@/components/atlas/conversion/SubscribeAction';
import { ExploreReleaseAction } from '@/components/atlas/conversion/ExploreReleaseAction';

import { PlayCircle, ShieldCheck, MapPin, Hash, Network, Disc3, TrendingUp, Users, Activity } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ entityType: string; slug: string }> }): Promise<Metadata> {
  const { entityType, slug } = await params;
  const type = entityType.endsWith('s') ? entityType.slice(0, -1) : entityType;
  
  const entity = entityStore.findBySlug(slug);
  if (!entity || (!entity.isPublic && process.env.NODE_ENV !== 'development')) {
    return { title: 'Not Found | SufiPulse' };
  }

  return {
    title: `${entity.canonicalName} | SufiPulse Intelligence Profile`,
    description: entity.shortDescription,
    alternates: {
      canonical: `/discovery/${entityType}/${slug}`,
    }
  };
}

export default async function EntityIntelligenceProfile({ params }: { params: Promise<{ entityType: string; slug: string }> }) {
  const { entityType, slug } = await params;
  const entity = entityStore.findBySlug(slug);
  
  if (!entity || (!entity.isPublic && process.env.NODE_ENV !== 'development')) {
    notFound();
  }

  const allEdges = relationshipStore.findAll();
  const connectedEdges = allEdges.filter(e => e.sourceEntityId === entity.id || e.targetEntityId === entity.id);
  
  const relatedEntities = connectedEdges.map(edge => {
    const isSource = edge.sourceEntityId === entity.id;
    const targetId = isSource ? edge.targetEntityId : edge.sourceEntityId;
    const targetEntity = entityStore.findById(targetId);
    return { entity: targetEntity, relationshipType: edge.relationshipType };
  }).filter(e => e.entity !== null) as Array<{ entity: NonNullable<ReturnType<typeof entityStore.findById>>; relationshipType: string }>;

  const hasVideo = entity.connectedVideoIds?.length > 0;
  const hasRelease = entity.connectedReleaseIds?.length > 0;
  const hasArticle = entity.connectedArticleIds?.length > 0;

  const isFlagship = entity.strategicGPS >= 90;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32">
      {/* INTELLIGENCE HERO LAYER */}
      <section className="relative pb-16 overflow-hidden border-b border-slate-800 hero-bleed">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-[#0A0A0A] to-[#0A0A0A]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" style={{ paddingTop: 'var(--hero-content-top)' }}>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3 flex-wrap gap-y-3">
              <Link href="/discovery" className="text-slate-400 hover:text-white transition-colors text-sm font-bold tracking-wider uppercase">Discovery Hub</Link>
              <span className="text-slate-600">/</span>
              <span className="text-emerald-500 font-bold tracking-wider uppercase text-sm">
                Intelligence Profile
              </span>
            </div>
            {isFlagship && (
              <span className="text-amber-500 font-bold tracking-wider uppercase text-xs bg-amber-500/10 px-3 py-1.5 rounded-full flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1" /> Foundational Authority
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-xl leading-tight">
                {entity.canonicalName}
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light max-w-3xl">
                {entity.shortDescription}
              </p>
            </div>

            <div className="lg:col-span-4 w-full">
              {hasRelease ? (
                <div className="bg-slate-900/60 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4">
                    <Disc3 className="w-4 h-4 mr-2" /> Original Release Available
                  </div>
                  <h3 className="text-xl font-bold text-white mb-6">Experience the full intelligence report.</h3>
                  <ExploreReleaseAction releaseSlug={entity.slug} title="Explore Release" />
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
                  <div className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">
                    Production Status
                  </div>
                  <div className="text-amber-500 font-medium">
                    Analysis mapped. Pending SufiPulse original release.
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* SIDEBAR (IDENTITY & METRICS) */}
          <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            
            {/* Identity Module */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Identity Profile</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-800/50 pb-4">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-semibold capitalize">{getEntityLabel(entity.entityType)}</span>
                </div>
                {entity.authorityMetadata?.tradition && (
                  <div className="flex justify-between border-b border-slate-800/50 pb-4">
                    <span className="text-slate-400">Tradition</span>
                    <span className="text-white font-semibold">{entity.authorityMetadata.tradition}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-800/50 pb-4">
                  <span className="text-slate-400">Authority Level</span>
                  <span className="text-amber-500 font-semibold">{isFlagship ? 'Foundational' : 'Supporting'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/50 pb-4">
                  <span className="text-slate-400">Influence Score</span>
                  <span className="text-white font-semibold">{entity.strategicGPS || 85}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-400">Discovery Score</span>
                  <span className="text-white font-semibold">{entity.discoveryReadinessScore || 90}</span>
                </div>
              </div>
            </div>

            {/* Intelligence Metrics */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center"><Activity className="w-4 h-4 mr-2"/> Intelligence Metrics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Global Search Demand</span>
                    <span className="text-emerald-400 font-bold">Very High</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full w-[95%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Cultural Growth Rate</span>
                    <span className="text-indigo-400 font-bold">+14% YoY</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full w-[82%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Connected Nodes</span>
                    <span className="text-white font-bold">{relatedEntities.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Discovery Routes */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center"><Network className="w-4 h-4 mr-2"/> Discovery Routes</h3>
              <p className="text-slate-400 text-sm mb-4">If you explore {entity.canonicalName}, you should discover:</p>
              <div className="space-y-3">
                {relatedEntities.slice(0, 5).map(rel => (
                  <Link 
                    key={rel.entity.id}
                    href={getEntityRoute(rel.entity.entityType, rel.entity.slug)}
                    className="flex items-center text-slate-300 hover:text-emerald-400 font-medium transition-colors"
                  >
                    <span className="text-slate-600 mr-3">→</span>
                    {rel.entity.canonicalName}
                  </Link>
                ))}
              </div>
            </div>

          </div>
          
          {/* MAIN EDITORIAL COLUMN */}
          <div className="lg:col-span-8 space-y-16 order-1 lg:order-2">
            
            {/* The Intelligence Report (Markdown) */}
            <section className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                h2: ({node, ...props}) => <h2 className="text-3xl font-bold text-white mt-12 mb-6 border-b border-slate-800 pb-4" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-2xl font-bold text-emerald-400 mt-8 mb-4" {...props} />,
                p: ({node, ...props}) => <p className="text-slate-300 leading-relaxed mb-6" {...props} />,
                strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                ul: ({node, ...props}) => <ul className="space-y-3 mb-6 text-slate-300 marker:text-emerald-500 bg-slate-900/20 p-6 rounded-2xl border border-slate-800/50" {...props} />,
                li: ({node, ...props}) => <li className="" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500 pl-6 italic text-slate-400 my-8" {...props} />
              }}>
                {entity.longDescription}
              </ReactMarkdown>
            </section>

          </div>

        </div>

        {/* SUFIPULSE INTERPRETATION (CONVERSION BLOCK) */}
        {(hasVideo || hasRelease || hasArticle) && (
          <section className="mt-24 pt-16 border-t border-slate-800">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">SufiPulse Ecosystem Integration</h2>
              <p className="text-lg text-slate-400">Experience this discovery directly through our original cinematic releases and deep-dive publications.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hasRelease && (
                <ExploreReleaseAction releaseSlug={entity.slug} title="Explore Original Release" />
              )}
              {hasArticle && (
                <ReadAction articleSlug={entity.slug} title="Read Institutional Publication" />
              )}
              {hasVideo && (
                <WatchAction videoId={entity.connectedVideoIds[0]} title="Watch Living Tradition" />
              )}
              <div className="md:col-span-2 lg:col-span-3 grid md:grid-cols-2 gap-6 mt-6">
                <SubscribeAction />
                <FollowAction />
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
