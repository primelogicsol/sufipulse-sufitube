import { entityStore } from '@/lib/atlas/atlas-entity';
import Link from 'next/link';

// Export metadata for SEO
export const metadata = {
  title: 'Global Sufi Song Discovery | SufiPulse',
  description: 'Explore the world\'s most comprehensive Sufi music authority platform. Discover qawwali, kalam, and sufi poetry connected directly to original SufiPulse content.',
};

export default function DiscoveryPage() {
  const entities = entityStore.findAll().filter(e => e.isActive && e.isPublic);

  // Filter out some featured ones
  const featuredFlagship = entities.find(e => e.slug === 'nund-rishi');
  const otherFlagships = entities.filter(e => e.slug !== 'nund-rishi').slice(0, 6);

  const categories = [
    { title: 'Saints', count: entities.filter(e => e.entityType === 'saint').length, slug: 'saints', color: 'emerald' },
    { title: 'Poets', count: entities.filter(e => e.entityType === 'poet').length, slug: 'poets', color: 'indigo' },
    { title: 'Singers', count: entities.filter(e => e.entityType === 'artist').length, slug: 'artists', color: 'amber' },
    { title: 'Traditions', count: entities.filter(e => e.entityType === 'tradition').length, slug: 'traditions', color: 'rose' },
    { title: 'Concepts', count: entities.filter(e => e.entityType === 'concept').length, slug: 'concepts', color: 'blue' },
    { title: 'Original Releases', count: entities.filter(e => e.entityType === 'release').length, slug: 'releases', color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-emerald-500 font-semibold tracking-wider uppercase text-sm mb-4 block">
            Global Sufi Knowledge & Music Discovery
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Global Sufi Song Discovery
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            Explore the saints, poets, singers, traditions, and teachings that shaped centuries of Sufi music and spiritual culture.
          </p>
        </div>

        {/* Featured Flagship */}
        {featuredFlagship && (
          <section className="mb-24">
            <h2 className="text-2xl font-bold text-white mb-8 border-b border-slate-800 pb-4">Featured Flagship</h2>
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 border border-emerald-500/20 rounded-3xl overflow-hidden flex flex-col lg:flex-row relative group">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="p-12 lg:w-3/5 relative z-10">
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider mb-6 inline-block">
                  {featuredFlagship.entityType}
                </span>
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  {featuredFlagship.canonicalName}
                </h3>
                <p className="text-xl text-emerald-400 font-medium mb-6">
                  The Spiritual Conscience of Kashmir
                </p>
                <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                  Explore the teachings, poetry, influence network, and SufiPulse interpretation of one of Kashmir's most important spiritual figures.
                </p>
                
                <Link 
                  href={`/discovery/${featuredFlagship.entityType}s/${featuredFlagship.slug}`}
                  className="inline-flex items-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/20"
                >
                  Explore {featuredFlagship.canonicalName}
                </Link>
              </div>

              {/* Featured Release Teaser inside Flagship card */}
              <div className="bg-black/40 border-l border-emerald-500/10 p-12 lg:w-2/5 flex flex-col justify-center relative z-10 backdrop-blur-sm">
                <div className="text-emerald-500 text-sm font-bold uppercase tracking-wider mb-4">Featured Release</div>
                <h4 className="text-2xl font-bold text-white mb-4">Release Intelligence</h4>
                <p className="text-slate-400 mb-8 italic">
                  "Nund Rishi: The Spiritual Conscience of Kashmir"
                </p>
                <Link 
                  href={`/releases/nund-rishi`}
                  className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all duration-300 border border-white/10 w-fit"
                >
                  Explore Release
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Explore Categories Hierarchy */}
        <section className="mb-24">
          <h2 className="text-2xl font-bold text-white mb-8 border-b border-slate-800 pb-4">Explore By Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map(cat => {
              // Map colors safely for Tailwind
              const colorMaps: Record<string, { border: string, text: string, hoverText: string }> = {
                emerald: { border: 'border-emerald-500/20', text: 'text-emerald-500/30', hoverText: 'group-hover:text-emerald-400' },
                indigo: { border: 'border-indigo-500/20', text: 'text-indigo-500/30', hoverText: 'group-hover:text-indigo-400' },
                amber: { border: 'border-amber-500/20', text: 'text-amber-500/30', hoverText: 'group-hover:text-amber-400' },
                rose: { border: 'border-rose-500/20', text: 'text-rose-500/30', hoverText: 'group-hover:text-rose-400' },
                blue: { border: 'border-blue-500/20', text: 'text-blue-500/30', hoverText: 'group-hover:text-blue-400' },
                purple: { border: 'border-purple-500/20', text: 'text-purple-500/30', hoverText: 'group-hover:text-purple-400' },
              };
              const style = colorMaps[cat.color];

              return (
                <div 
                  key={cat.title} 
                  className={`bg-slate-900/40 border ${style.border} rounded-2xl p-8 hover:bg-slate-800/60 transition-colors cursor-pointer group`}
                >
                  <div className={`text-4xl font-bold ${style.text} mb-2 ${style.hoverText} transition-colors`}>
                    {String(cat.count).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {cat.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </section>

        {/* Curated Entity Collections */}
        <section>
          <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-8">
            <h2 className="text-2xl font-bold text-white">Trending in the Graph</h2>
            <Link href="#" className="text-emerald-500 hover:text-emerald-400 font-medium text-sm transition-colors">
              View All Entities →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherFlagships.map(entity => (
              <Link 
                key={entity.id} 
                href={`/discovery/${entity.entityType}s/${entity.slug}`}
                className="group flex flex-col h-full bg-transparent border-t border-slate-800 pt-6 hover:border-emerald-500/50 transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-emerald-500 transition-colors mb-3">
                  {entity.entityType}
                </span>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">
                  {entity.canonicalName}
                </h3>
                <p className="text-slate-400 line-clamp-3 leading-relaxed">
                  {entity.shortDescription}
                </p>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
