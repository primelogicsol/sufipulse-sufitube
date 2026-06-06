'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Compass, Play, BookOpen, Music, MapPin, Hash, ArrowRight, Network, TrendingUp, BarChart3, Globe2 } from 'lucide-react';
import { getEntityRoute, getEntityLabel } from '@/lib/utils/pluralize';

interface Entity {
  id: string;
  canonicalName: string;
  slug: string;
  entityType: string;
  shortDescription: string;
  strategicGPS: number;
  authorityOpportunityScore: number;
  advantageScore: number;
  connectionScore: number;
  connectedReleaseIds: string[];
}

export function DiscoveryBuilder({ initialEntities }: { initialEntities: Entity[] }) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('All');

  // Intelligence Metrics
  const totalEntities = initialEntities.length;
  const avgGPS = Math.round(initialEntities.reduce((acc, e) => acc + (e.strategicGPS || 0), 0) / (totalEntities || 1));
  const highlyConnected = initialEntities.filter(e => (e.connectionScore || 0) > 80).length;

  const filteredEntities = useMemo(() => {
    return initialEntities.filter(e => {
      const matchQuery = e.canonicalName.toLowerCase().includes(query.toLowerCase()) || 
                         e.shortDescription.toLowerCase().includes(query.toLowerCase());
      const matchType = activeType === 'All' || e.entityType === activeType.toLowerCase() || 
                        (activeType === 'Voices' && e.entityType === 'artist');
      return matchQuery && matchType;
    });
  }, [initialEntities, query, activeType]);

  const topSaints = initialEntities.filter(e => e.entityType === 'saint').sort((a, b) => b.strategicGPS - a.strategicGPS).slice(0, 4);
  const topVoices = initialEntities.filter(e => e.entityType === 'artist').sort((a, b) => b.strategicGPS - a.strategicGPS).slice(0, 4);
  const topTraditions = initialEntities.filter(e => e.entityType === 'tradition').sort((a, b) => b.strategicGPS - a.strategicGPS).slice(0, 4);

  return (
    <div className="w-full">
      {/* LAYER 1: COMMAND CENTER */}
      <section className="bg-gradient-to-b from-slate-900 via-[#0A0A0A] to-[#0A0A0A] pt-24 pb-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                Global Sufi Music Intelligence
              </h1>
              <p className="text-slate-400 text-lg">The world's operating system for Sufi heritage, routing global search demand into original performances.</p>
            </div>
            <div className="mt-6 md:mt-0 flex space-x-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 min-w-[120px]">
                <div className="text-emerald-500 font-bold text-2xl">{totalEntities}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Nodes</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 min-w-[120px]">
                <div className="text-amber-500 font-bold text-2xl">{avgGPS}%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Avg Discovery GPS</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Global Search Intelligence (Trends) */}
            <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                <Globe2 className="w-4 h-4 mr-2 text-emerald-500" /> Global Search Demand
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-slate-300 font-medium">Nusrat Fateh Ali Khan</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+18%</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-slate-300 font-medium">Allah Hoo</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+11%</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-slate-300 font-medium">Bulleh Shah Poetry</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+8%</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-slate-300 font-medium">Kashmiri Sufiyana</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+41%</span>
                </div>
              </div>
            </div>

            {/* Emerging Topics */}
            <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" /> Fastest Growing Topics
              </h3>
              <div className="space-y-4">
                <div className="text-slate-300 font-medium pb-2 border-b border-slate-800/50">Female Sufi Voices</div>
                <div className="text-slate-300 font-medium pb-2 border-b border-slate-800/50">Modern Qawwali</div>
                <div className="text-slate-300 font-medium pb-2 border-b border-slate-800/50">Persian Sufi Poetry</div>
                <div className="text-slate-300 font-medium">Kashmir Rishi Tradition</div>
              </div>
            </div>

            {/* Most Connected Nodes */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                <Network className="w-4 h-4 mr-2 text-amber-500" /> Most Connected Nodes
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {topTraditions.concat(topSaints).slice(0, 6).map(node => (
                  <Link key={node.id} href={getEntityRoute(node.entityType, node.slug)} className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-3 rounded-lg hover:border-amber-500/30 transition-colors">
                    <span className="text-slate-300 font-medium truncate pr-2 hover:text-amber-400">{node.canonicalName}</span>
                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded whitespace-nowrap">GPS {node.strategicGPS}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LAYER 2: INTELLIGENCE EXPLORER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-slate-800/50">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-emerald-500" />
            Intelligence Explorer
          </h2>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center mb-8 shadow-2xl">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Query the global graph..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar scroll-smooth">
            {['All', 'Voices', 'Tradition', 'Saint', 'Song'].map(type => (
              <button 
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${
                  activeType === type ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {type === 'All' ? 'Global' : `By ${type}`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredEntities.slice(0, 12).map(entity => (
            <Link 
              key={entity.id} 
              href={getEntityRoute(entity.entityType, entity.slug)}
              className="bg-slate-900/30 hover:bg-slate-800/50 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-500">{getEntityLabel(entity.entityType)}</span>
                <span className="text-[10px] font-bold text-slate-600">GPS {entity.strategicGPS}</span>
              </div>
              <h4 className="text-white font-bold group-hover:text-emerald-400 mb-1 truncate">{entity.canonicalName}</h4>
              <div className="flex space-x-2 mt-4">
                {entity.connectedReleaseIds?.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected to Original Release"></span>
                )}
                {entity.authorityOpportunityScore > 80 && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500" title="High Search Demand"></span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* LAYER 3: KNOWLEDGE GRAPH VISUALIZER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Network className="w-6 h-6 mr-3 text-emerald-500" />
            Live Discovery Graph
          </h2>
          <span className="text-sm font-semibold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full">System Active</span>
        </div>
        
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 h-[500px] relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]"></div>
          
          {/* Mock Graph Visual for the Hub */}
          <div className="relative w-full max-w-3xl h-full flex items-center justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center z-20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <span className="text-white font-bold text-center">Nusrat Fateh<br/>Ali Khan</span>
            </div>
            
            {/* Edges & Nodes */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }}>
              <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="rgba(16,185,129,0.2)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
              <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="rgba(16,185,129,0.2)" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="30%" y2="80%" stroke="rgba(16,185,129,0.2)" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="70%" y2="80%" stroke="rgba(16,185,129,0.2)" strokeWidth="2" />
            </svg>
            
            <div className="absolute top-[20%] left-[20%] -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full z-20 hover:border-emerald-500 cursor-pointer transition-colors">
              <span className="text-slate-300 text-sm font-semibold">Qawwali</span>
            </div>
            <div className="absolute top-[30%] left-[80%] -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full z-20 hover:border-emerald-500 cursor-pointer transition-colors">
              <span className="text-slate-300 text-sm font-semibold">Amir Khusrau</span>
            </div>
            <div className="absolute top-[80%] left-[30%] -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full z-20 hover:border-emerald-500 cursor-pointer transition-colors">
              <span className="text-slate-300 text-sm font-semibold">Mustt Mustt</span>
            </div>
            <div className="absolute top-[80%] left-[70%] -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-full z-20 hover:border-emerald-500 cursor-pointer transition-colors">
              <span className="text-slate-300 text-sm font-semibold">World Music</span>
            </div>
          </div>
          
          <div className="absolute bottom-6 left-6 flex items-center space-x-2 text-xs text-slate-500 uppercase tracking-wider font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Real-time connections mapping</span>
          </div>
        </div>
      </section>

    </div>
  );
}
