"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  Network, TrendingUp, Search, Youtube, Users, ShieldCheck, Sparkles, Activity, Link as LinkIcon, Database, ExternalLink, ArrowRight, Target
} from 'lucide-react';

interface OpsData {
  discoveryScore: {
    current: number;
    weeklyHistory: Array<{ week: string, score: number }>;
  };
  acquisition: {
    searchEntrances: number;
    aiReferrals: number;
    directEntrances: number;
  };
  authority: {
    mostVisitedEntities: Array<{ name: string, views: number }>;
    mostReadPublications: Array<{ name: string, reads: number }>;
  };
  exploration: {
    averageGraphDepth: number;
    topRoutes: Array<{ path: string, count: number }>;
    orphanExits: number;
  };
  conversion: {
    releaseOpens: number;
    videoClicks: number;
    youtubeTransfers: number;
  };
  growth: {
    returningVisitors: number;
    emailSignups: number;
    channelTransfers: number;
  };
}

export default function DiscoveryMissionOperationsCenter() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role.includes('admin') ?? false;
  const [data, setData] = useState<OpsData | null>(null);

  useEffect(() => {
    if (!isAdmin && user) {
      router.push('/admin');
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/admin/discovery-mission')
        .then(res => res.json())
        .then(d => setData(d))
        .catch(err => console.error("Failed to fetch telemetry:", err));
    }
  }, [isAdmin]);

  if (!isAdmin || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest">
              <Activity size={14} /> Telemetry Infrastructure Verified — Awaiting Real Market Data
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Discovery Mission <span className="text-neutral-600">Ops Center</span>
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-2">
              The single source of truth for the Discovery Mission. 30-60 Day Observation Window Active. Let the market dictate the expansion of Cluster 04.
            </p>
          </div>
        </div>

        {/* The Giant Discovery Mission Score Card */}
        <section className="bg-emerald-500/5 border-2 border-emerald-500/30 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <Target className="w-8 h-8" />
                Discovery Mission Score
              </h2>
              <p className="text-neutral-400 max-w-xl text-sm leading-relaxed">
                The ultimate KPI for the Discovery Engine. A weighted calculation of Organic Search Growth (30%), Publication Engagement (20%), Release Conversion (20%), YouTube Transfers (20%), and Returning Visitors (10%).
              </p>
              
              {/* Weekly History Mini-Chart */}
              <div className="flex items-end gap-3 pt-4">
                {data.discoveryScore.weeklyHistory.map((week, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div className="w-12 bg-black/40 rounded-t-lg border border-white/5 relative flex items-end justify-center pb-2" style={{ height: '80px' }}>
                      <div className="w-full bg-emerald-500/40 rounded-t-sm absolute bottom-0" style={{ height: `${week.score}%` }}></div>
                      <span className="text-[10px] font-mono font-bold text-white relative z-10">{week.score}</span>
                    </div>
                    <span className="text-[8px] text-neutral-500 uppercase font-bold tracking-wider">{week.week}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-shrink-0 text-center">
              <div className="text-[8rem] md:text-[10rem] font-black text-white font-mono leading-none tracking-tighter drop-shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                {data.discoveryScore.current}
              </div>
              <p className="text-emerald-500 font-bold tracking-[0.3em] uppercase text-xs mt-2">Current Score</p>
            </div>
          </div>
        </section>

        {/* The 5 Core Sections */}
        <div className="space-y-8">

          {/* 1. ACQUISITION */}
          <section className="bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-emerald-500/20 pb-3">
              <Search size={16} /> 1. Acquisition
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricBox label="Search Entrances" value={data.acquisition.searchEntrances} />
              <MetricBox label="AI Referrals" value={data.acquisition.aiReferrals} />
              <MetricBox label="Direct Entrances" value={data.acquisition.directEntrances} />
            </div>
          </section>

          {/* 2. AUTHORITY */}
          <section className="bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            <h2 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-purple-500/20 pb-3">
              <ShieldCheck size={16} /> 2. Authority
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Most Visited Entities</h3>
                <div className="space-y-2">
                  {data.authority.mostVisitedEntities.map((item, idx) => (
                    <RankRow key={idx} rank={idx + 1} name={item.name} value={item.views} label="views" />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Most Read Publications</h3>
                <div className="space-y-2">
                  {data.authority.mostReadPublications.map((item, idx) => (
                    <RankRow key={idx} rank={idx + 1} name={item.name} value={item.reads} label="reads" />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. EXPLORATION */}
          <section className="bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-blue-500/20 pb-3">
              <Network size={16} /> 3. Exploration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 space-y-4">
                <MetricBox label="Average Graph Depth" value={data.exploration.averageGraphDepth} isFloat />
                <MetricBox label="Orphan Exits" value={`${data.exploration.orphanExits}%`} />
              </div>
              <div className="col-span-2">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Top Routes Taken</h3>
                <div className="space-y-2">
                  {data.exploration.topRoutes.map((route, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 flex justify-between items-center text-xs font-mono">
                      <div className="flex items-center text-neutral-300">
                        {route.path.split('→').map((node, i, arr) => (
                          <span key={i} className="flex items-center">
                            <span className={i === arr.length - 1 ? 'text-blue-400 font-bold' : ''}>{node.trim()}</span>
                            {i < arr.length - 1 && <ArrowRight size={10} className="mx-2 text-neutral-600" />}
                          </span>
                        ))}
                      </div>
                      <span className="text-blue-500 font-bold">{route.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 4. CONVERSION */}
          <section className="bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            <h2 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-amber-500/20 pb-3">
              <Sparkles size={16} /> 4. Conversion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricBox label="Release Opens" value={data.conversion.releaseOpens} />
              <MetricBox label="Video Clicks" value={data.conversion.videoClicks} />
              <MetricBox label="YouTube Transfers" value={data.conversion.youtubeTransfers} />
            </div>
          </section>

          {/* 5. GROWTH */}
          <section className="bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
            <h2 className="text-sm font-black text-red-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-red-500/20 pb-3">
              <TrendingUp size={16} /> 5. Growth
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricBox label="Returning Visitors" value={`${data.growth.returningVisitors}%`} />
              <MetricBox label="Email Signups" value={data.growth.emailSignups} />
              <MetricBox label="Channel Transfers" value={data.growth.channelTransfers} />
            </div>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
}

// Subcomponents
function MetricBox({ label, value, isFloat = false }: { label: string, value: string | number, isFloat?: boolean }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-black text-white font-mono">{typeof value === 'number' && !isFloat ? value.toLocaleString() : value}</p>
    </div>
  );
}

function RankRow({ rank, name, value, label }: { rank: number, name: string, value: number, label: string }) {
  return (
    <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-bold text-neutral-500 w-4">{rank}.</span>
        <span className="text-sm font-bold text-white">{name}</span>
      </div>
      <div className="text-xs font-mono text-neutral-400">
        <span className="text-white font-bold">{value.toLocaleString()}</span> <span className="text-[10px] uppercase">{label}</span>
      </div>
    </div>
  );
}
