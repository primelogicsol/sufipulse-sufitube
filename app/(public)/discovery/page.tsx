import { entityStore } from '@/lib/atlas/atlas-entity';
import { relationshipStore } from '@/lib/atlas/atlas-relationship';
import { buildGraphIndex, calculateHopsToContent } from '@/lib/atlas/atlas-graph-engine';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Export metadata for SEO
export const metadata = {
  title: 'Global Sufi Song Discovery | SufiPulse',
  description: 'Explore the world\'s most comprehensive Sufi music authority platform. Discover qawwali, kalam, and sufi poetry connected directly to original SufiPulse content.',
};

export default function DiscoveryPage() {
  // Load graph to verify conversion paths
  const entities = entityStore.findAll().filter(e => e.isActive && e.isPublic);
  const relationships = relationshipStore.findAll();
  
  // NOTE: In Phase 2A, entities are seeded as 'draft' and 'isPublic: false'.
  // They will not appear here until explicitly published by the admin.
  // The Admin Graph Explorer proves the conversion paths exist behind the scenes.
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-emerald-500 font-semibold tracking-wider uppercase text-sm mb-4 block">
            SufiPulse Discovery
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Global Sufi Song Discovery
          </h1>
          <p className="text-xl text-slate-400">
            Explore the interconnected universe of Sufi saints, poets, singers, and traditions — all leading to authentic SufiPulse original releases.
          </p>
        </div>

        {/* Phase 2 Gatekeeper UI */}
        {entities.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-6">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Discovery Engine is Maturing</h2>
            <p className="text-slate-400 mb-8">
              Our knowledge graph is currently indexing and verifying conversion paths for the global Sufi universe. Public discovery will unlock once entities have proven paths to SufiPulse content.
            </p>
            <div className="inline-flex items-center space-x-2 text-sm text-emerald-500 font-medium">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>Processing graph paths...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* The public entity cards will render here once entities are marked isPublic=true */}
            {entities.map(entity => (
              <Link 
                key={entity.id} 
                href={`/discovery/${entity.entityType}s/${entity.slug}`}
                className="group bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500/70 group-hover:text-emerald-500 transition-colors">
                    {entity.entityType}
                  </span>
                  {entity.hopsToSufiPulseContent <= 1 && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full font-medium">
                      Direct Connection
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {entity.canonicalName}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2">
                  {entity.shortDescription}
                </p>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
