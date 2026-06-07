"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function KnowledgeClient({ entities, initialClass = 'all', stats }: { entities: any[], initialClass?: string, stats?: any }) {
  const [search, setSearch] = useState('');
  const [activeClass, setActiveClass] = useState(initialClass);

  useEffect(() => {
    setActiveClass(initialClass);
  }, [initialClass]);

  const filtered = entities.filter(entity => {
    // Single-select: match if entity's classes array contains the active filter
    const eClasses: string[] = entity.classes || [entity.class];
    const matchClass = activeClass === 'all' || eClasses.includes(activeClass);
    const searchString = `${entity.title} ${entity.aliases?.join(' ') || ''}`.toLowerCase();
    const matchSearch = searchString.includes(search.toLowerCase());
    return matchClass && matchSearch;
  }).sort((a, b) => a.title.localeCompare(b.title));

  // Fixed order for all required filter classes
  const requestedFilters = [
    'person', 'singer', 'poet', 'writer', 'song', 'release', 'album', 'concept', 'tradition', 'order',
    'root', 'concepts', 'works', 'publication', 'artist', 'channel', 'saint', 'practice', 'spiritualstate',
    'musicaltradition', 'article', 'scholar'
  ];
  const dataClasses = Array.from(new Set(entities.flatMap((e: any) => e.classes || [e.class])));
  const availableClasses = Array.from(new Set([...requestedFilters, ...dataClasses]));

  // Pre-calculate counts: how many entities have this class in their classes array
  const classCounts: Record<string, number> = {};
  availableClasses.forEach(c => {
    classCounts[c] = entities.filter((e: any) => (e.classes || [e.class]).includes(c)).length;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      {initialClass !== 'all' && (
        <div className="mb-8">
          <Link href="/knowledge" className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest hover:text-[#2A241F] mb-6 inline-block">
            ← Back to Knowledge Archive
          </Link>
          <h1 className="text-5xl font-serif text-[#2A241F] mb-4 capitalize">{initialClass} Archive</h1>
          <p className="text-[#2F2A26] max-w-2xl">Viewing all verified entities in the {initialClass} class.</p>
        </div>
      )}

      {initialClass === 'all' && (
        <>
          <div className="mb-12 border-b border-[#d8d2c6] pb-8">
            <h1 className="text-5xl font-serif text-[#2A241F] mb-4">Institutional Knowledge Archive</h1>
            <p className="text-[#2F2A26] max-w-3xl text-lg leading-relaxed mb-8">
              The unified authority layer of SufiPulse. This ecosystem perfectly maps the Constitutional Doctrine to the living transmission network of {stats?.totalEntities || 'hundreds'} historical entities, musical releases, and literary works.
            </p>
            
            {/* Real Stats Section */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.atlasNodes}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Atlas Entities</div>
                </div>
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.relationships}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Transmission Edges</div>
                </div>
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.releases}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">CMS Releases</div>
                </div>
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.singers}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Singers & Vocalists</div>
                </div>
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.songs}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Songs Indexed</div>
                </div>
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.poetsWriters}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Poets & Writers</div>
                </div>
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.albums}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Albums</div>
                </div>
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.concepts}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Concepts</div>
                </div>
                <div className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                  <div className="text-3xl font-serif text-[#2A241F] mb-1">{stats.traditions}</div>
                  <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Traditions</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Filters and Search */}
      <div className="flex flex-col mb-12 gap-6">
        <div className="w-full">
          <input 
            type="text" 
            placeholder={initialClass === 'all' ? "Search singers, poets, releases, concepts..." : `Search ${initialClass}...`} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#faf7f2] border border-[#d8d2c6] p-4 text-[#2F2A26] outline-none focus:border-[#2A241F] text-lg"
          />
        </div>
        {initialClass === 'all' && (
          <div className="flex flex-wrap gap-2 items-center bg-[#faf7f2] p-4 border border-[#e8e2d5]">
            <span className="text-xs font-mono text-[#776B60] uppercase mr-2">Filter Class:</span>
            
            <button 
              onClick={() => setActiveClass('all')}
              className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${activeClass === 'all' ? 'bg-[#2A241F] text-[#f7f3ec] border-[#2A241F]' : 'bg-[#e8e2d5] text-[#3A322B] border-[#d8d2c6] hover:border-[#2A241F]'}`}
            >
              All Classes ({entities.length})
            </button>
            
            {availableClasses.map(c => {
              const isActive = activeClass === c;
              const count = classCounts[c] || 0;
              return (
                <button 
                  key={c}
                  onClick={() => setActiveClass(isActive ? 'all' : c)}
                  className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${isActive ? 'bg-[#2A241F] text-[#f7f3ec] border-[#2A241F]' : 'bg-[#e8e2d5] text-[#3A322B] border-[#d8d2c6] hover:border-[#2A241F]'}`}
                >
                  {c.toUpperCase()} ({count})
                </button>
              );
            })}
            
            <button 
              onClick={() => { setSearch(''); setActiveClass('all'); }}
              className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-[#d8d2c6] text-[#776B60] hover:text-[#2A241F] ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      
      {filtered.length === 0 ? (
        <div className="text-center py-24 border border-[#d8d2c6] bg-[#faf7f2]">
          <h3 className="text-2xl font-serif text-[#3A322B] mb-2">No entities found.</h3>
          <p className="text-[#776B60]">Try adjusting your search criteria or selecting a different class.</p>
          {initialClass === 'all' && (
            <button onClick={() => { setSearch(''); setActiveClass('all'); }} className="mt-6 uppercase text-[10px] font-mono tracking-widest text-[#2A241F] border border-[#2A241F] px-4 py-2 hover:bg-[#2A241F] hover:text-[#f7f3ec] transition-colors">Clear all filters</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(entity => (
            <Link key={entity.id || entity.slug} href={`/knowledge/${entity.class}s/${entity.slug}`} className="block group">
              <div className="border border-[#d8d2c6] p-6 hover:border-[#2A241F] bg-[#faf7f2] transition-colors h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-mono text-[#2A241F] uppercase tracking-widest bg-[#e8e2d5] inline-block px-2 py-1">
                      {entity.class}
                    </div>
                    {entity.source === 'constitutional_core' && (
                      <div className="text-[10px] font-mono text-[#8a7a6c] uppercase tracking-widest border border-[#d8d2c6] px-2 py-1">
                        Constitutional
                      </div>
                    )}
                  </div>
                  <h2 className="font-serif text-2xl text-[#241F1B] mb-3 group-hover:underline underline-offset-4">{entity.title}</h2>
                  <p className="text-sm text-[#2F2A26] mb-6 line-clamp-3 leading-relaxed">{entity.summary}</p>
                </div>
                <div className="flex justify-between border-t border-[#e8e2d5] pt-4 text-[10px] font-mono text-[#776B60] uppercase tracking-widest">
                  <span>Relationships: <span className="text-[#2A241F] font-semibold">{entity.relationships?.length || 0}</span></span>
                  <span>Score: <span className="text-[#2A241F] font-semibold">{entity.readinessScore}</span></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
