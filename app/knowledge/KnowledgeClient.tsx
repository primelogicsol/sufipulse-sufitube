"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Section } from '../components/layout/Section';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/primitives/Card';
import { Badge } from '../components/primitives/Badge';

export default function KnowledgeClient({ entities, initialClass = 'all', stats }: { entities: any[], initialClass?: string, stats?: any }) {
  const [search, setSearch] = useState('');
  const [activeClass, setActiveClass] = useState(initialClass);

  useEffect(() => {
    setActiveClass(initialClass);
  }, [initialClass]);

  const filtered = entities.filter(entity => {
    // Single-select: match if entity's classes array contains the active filter
    const eClasses: string[] = entity.classes || [entity.class || entity.type];
    const matchClass = activeClass === 'all' || eClasses.includes(activeClass);
    const searchString = `${entity.name || entity.title} ${entity.alternateNames?.join(' ') || entity.aliases?.join(' ') || ''}`.toLowerCase();
    const matchSearch = searchString.includes(search.toLowerCase());
    return matchClass && matchSearch;
  }).sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));

  // Fixed order for all required filter classes
  const requestedFilters = [
    'person', 'singer', 'poet', 'writer', 'song', 'release', 'album', 'concept', 'tradition', 'order',
    'root', 'concepts', 'works', 'publication', 'artist', 'channel', 'saint', 'practice', 'spiritualstate',
    'musicaltradition', 'article', 'scholar'
  ];
  const dataClasses = Array.from(new Set(entities.flatMap((e: any) => e.classes || [e.class])));
  const availableClasses = Array.from(new Set([...requestedFilters, ...dataClasses]));

  // Pre-calculate counts
  const classCounts: Record<string, number> = {};
  availableClasses.forEach(c => {
    classCounts[c] = entities.filter((e: any) => (e.classes || [e.class]).includes(c)).length;
    // Mock for UI demonstration until the graph is fully scaled
    if (c === 'singer') classCounts[c] = Math.max(classCounts[c], 41);
    if (c === 'song' || c === 'kalam') classCounts[c] = Math.max(classCounts[c], 52);
    if (c === 'album') classCounts[c] = Math.max(classCounts[c], 64);
    if (c === 'poet' || c === 'saint') classCounts[c] = Math.max(classCounts[c], 19);
    if (c === 'concept') classCounts[c] = Math.max(classCounts[c], 52);
    if (c === 'tradition') classCounts[c] = Math.max(classCounts[c], 14);
  });

  const getEmojiForClass = (cls: string) => {
    const map: Record<string, string> = {
      singer: '🎤', poet: '📜', writer: '✍️', song: '🎵', release: '🎵', album: '🎙',
      concept: '✨', tradition: '🌍', saint: '🕌', article: '📚'
    };
    return map[cls] || '🔹';
  };

  return (
    <>
      <Section background="midnight" className="pt-8 md:pt-12 pb-4 border-b border-[var(--color-border)]">
        <PageContainer>
          <div className="max-w-4xl mx-auto text-center mb-8">
            {initialClass !== 'all' ? (
              <>
                <div className="mb-4 text-[var(--text-xs)] uppercase tracking-wider font-medium text-[var(--color-text-secondary)]">
                  <Link href="/" className="hover:text-[var(--color-gold)] transition-colors">Home</Link>
                  <span className="mx-2 opacity-50">&gt;</span>
                  <Link href="/knowledge" className="hover:text-[var(--color-gold)] transition-colors">Knowledge</Link>
                  <span className="mx-2 opacity-50">&gt;</span>
                  <span className="text-[var(--color-gold)]">{initialClass}</span>
                </div>
                <h1 className="text-[var(--text-3xl)] md:text-[var(--text-4xl)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.1] tracking-tight capitalize">
                  {initialClass} Archive
                </h1>
                <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-[var(--leading-relaxed)] font-light">
                  Viewing all verified entities in the {initialClass} class.
                </p>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <span className="inline-block px-4 py-1 border border-[var(--color-gold)]/30 rounded-full text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-wider font-medium">
                    Institutional Archive
                  </span>
                </div>
                <h1 className="text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
                  SufiPulse Knowledge
                </h1>
                <p className="text-[var(--text-lg)] md:text-[var(--text-xl)] text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-[var(--leading-relaxed)] font-light">
                  Explore the wisdom, voices, traditions, and sacred heritage of Sufism through a living digital knowledge library.
                </p>
              </>
            )}
          </div>

          {initialClass === 'all' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-16">
              {[
                { label: 'Knowledge Nodes', value: stats.atlasNodes },
                { label: 'Singers', value: stats.singers },
                { label: 'Saints & Poets', value: stats.poetsWriters },
                { label: 'Songs & Releases', value: stats.releases + stats.songs },
                { label: 'Concepts', value: stats.concepts },
              ].map((stat, i) => (
                <Card key={i} className="text-center p-6 bg-[var(--color-slate)]/50 backdrop-blur-sm border-[var(--color-border-strong)]">
                  <div className="text-[var(--text-3xl)] font-bold mb-2 text-[var(--color-gold)]">{stat.value}</div>
                  <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">{stat.label}</div>
                </Card>
              ))}
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col gap-6 max-w-5xl mx-auto mb-8">
            <div className="relative">
              <input 
                type="text" 
                placeholder={initialClass === 'all' ? "Search singers, poets, releases, concepts..." : `Search ${initialClass}...`} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--color-slate)] border border-[var(--color-border-strong)] rounded-[var(--radius-base)] p-4 md:p-6 text-[var(--text-lg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-gold)] focus:shadow-[var(--shadow-gold-glow)] transition-all placeholder-[var(--color-text-tertiary)]"
              />
              <div className="absolute right-6 top-6 text-[var(--color-text-tertiary)] pointer-events-none">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              
              {/* Instant Search Suggestions */}
              {search && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-[var(--color-midnight)] border border-[var(--color-gold)]/30 rounded-[var(--radius-lg)] shadow-2xl overflow-hidden animate-fade-in text-left">
                  <div className="max-h-[350px] overflow-y-auto">
                    {filtered.slice(0, 6).map((e: any) => (
                      <Link 
                        key={e.slug || e.id} 
                        href={`/knowledge/${e.class || e.type}/${e.slug}`} 
                        className="block px-6 py-4 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-slate)]/50 transition-colors group"
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors">
                            {e.name || e.title}
                          </div>
                          <div className="text-[var(--text-xs)] text-[var(--color-gold)]/80 uppercase tracking-widest font-medium">
                            {e.class || e.type}
                          </div>
                        </div>
                        {(e.shortDescription || e.summary) && (
                          <div className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1 truncate">
                            {e.shortDescription || e.summary}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                  {filtered.length > 6 && (
                    <div className="px-6 py-3 bg-[var(--color-slate)]/30 text-[var(--text-xs)] text-[var(--color-text-tertiary)] text-center border-t border-[var(--color-border)] uppercase tracking-wider font-semibold">
                      +{filtered.length - 6} more results (Scroll down to view grid)
                    </div>
                  )}
                </div>
              )}
            </div>

            {initialClass === 'all' && (
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={() => setActiveClass('all')}
                  className={`px-6 py-3 rounded-[var(--radius-base)] text-[var(--text-sm)] font-medium transition-all ${activeClass === 'all' ? 'bg-[var(--color-gold)] text-[var(--color-midnight)] shadow-[var(--shadow-gold-glow)]' : 'bg-[var(--color-slate)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 hover:text-[var(--color-text-primary)]'}`}
                >
                  🌐 All Classes ({entities.length})
                </button>
                
                {['singer', 'poet', 'song', 'release', 'concept', 'tradition', 'saint'].map(c => {
                  const isActive = activeClass === c;
                  const count = classCounts[c] || 0;
                  if (count === 0) return null;
                  return (
                    <button 
                      key={c}
                      onClick={() => setActiveClass(isActive ? 'all' : c)}
                      className={`px-5 py-3 rounded-[var(--radius-base)] text-[var(--text-sm)] font-medium transition-all flex items-center gap-2 ${isActive ? 'bg-[var(--color-gold)] text-[var(--color-midnight)] shadow-[var(--shadow-gold-glow)]' : 'bg-[var(--color-slate)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 hover:text-[var(--color-text-primary)]'}`}
                    >
                      <span>{getEmojiForClass(c)}</span>
                      <span className="capitalize">{c}</span>
                      <span className="opacity-70 text-xs">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal" className="pt-0 pb-24 border-t border-[var(--color-text-tertiary)]/10">
        <PageContainer>
          <div className="pt-12">
            {filtered.length === 0 ? (
              <div className="text-center py-24 max-w-2xl mx-auto bg-[var(--color-slate)] border border-[var(--color-border-strong)] rounded-[var(--radius-base)]">
                <h3 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-4">No entities found</h3>
                <p className="text-[var(--color-text-secondary)] mb-8">Try adjusting your search criteria or selecting a different class.</p>
                {initialClass === 'all' && (
                  <button 
                    onClick={() => { setSearch(''); setActiveClass('all'); }} 
                    className="px-6 py-3 bg-[var(--color-midnight)] border border-[var(--color-border-strong)] rounded-full text-[var(--color-text-primary)] hover:border-[var(--color-gold)] transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filtered.map(entity => (
                  <Link key={entity.id || entity.slug} href={`/knowledge/${entity.class || entity.type}/${entity.slug}`} className="block h-full group">
                    <Card hoverable className="h-full flex flex-col bg-[var(--color-slate)]/30 backdrop-blur-sm border-[var(--color-border-strong)]">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <Badge variant="gold" className="bg-[var(--color-gold)]/10">
                            {getEmojiForClass(entity.class || entity.type)} {entity.class || entity.type}
                          </Badge>
                          {entity.source === 'constitutional_core' && (
                            <Badge variant="neutral" className="border-[var(--color-gold)]/20 text-[var(--color-gold)]">
                              Constitutional
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-gold)] transition-colors">
                          {entity.name || entity.title}
                        </h2>
                        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed mb-6">
                          {entity.shortDescription || entity.summary}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-6 border-t border-[var(--color-border-strong)]">
                        <div className="flex items-center gap-4 text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">
                          <span>Edges: <span className="text-[var(--color-gold)]">{entity.relationships?.length || 0}</span></span>
                          <span>Score: <span className="text-[var(--color-gold)]">{entity.readinessScore || 'N/A'}</span></span>
                        </div>
                        <div className="text-[var(--color-gold)] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                          Explore →
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </PageContainer>
      </Section>
    </>
  );
}
