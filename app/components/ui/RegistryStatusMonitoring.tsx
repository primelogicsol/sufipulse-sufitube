"use client";

import { 
  History, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Clock,
  ExternalLink,
  MessageSquare,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface StatusMonitoringProps {
  division: 'literary' | 'studio';
  title: string;
  mysticalName: string;
  steps: { label: string; desc: string; }[];
}

export function RegistryStatusMonitoring({ division, title, mysticalName, steps }: StatusMonitoringProps) {
  const [refId, setRefId] = useState('');
  const [token, setToken] = useState('');

  const trackingBase = division === 'literary' ? '/literary-contributors' : '/studio';
  
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left: Visual Roadmap */}
        <div className="lg:col-span-7 space-y-10">
          <div>
            <h2 className="text-[var(--text-3xl)] font-bold text-white mb-4">Application Progress</h2>
            <p className="text-neutral-500 max-w-xl leading-relaxed">
              Monitor your institutional intake progress through the {mysticalName} registry. All technical and editorial submissions follow a documented sequence of review and validation.
            </p>
          </div>

          <div className="space-y-0 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex gap-8 pb-10 last:pb-0 group">
                {idx < steps.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-0 w-px bg-white/10 group-hover:bg-amber-400/30 transition-colors" />
                )}
                <div className="relative z-10 w-6 h-6 rounded-full bg-neutral-900 border-2 border-white/10 flex items-center justify-center group-hover:border-amber-400/50 transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 group-hover:bg-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1 group-hover:text-white transition-colors">{step.label}</h4>
                  <p className="text-[10px] text-neutral-600 font-medium uppercase tracking-wider leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Functional Portal Access */}
        <div className="lg:col-span-5">
          <div className="bg-linear-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck size={120} className="text-amber-400" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-amber-400/10 rounded-2xl border border-amber-400/20">
                  <History size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Registry Portal</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Secure Status Monitoring</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                  Already submitted your credentials? Enter your reference ID and tracking token to access your live intake record.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Registry Reference ID</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-700" />
                      <input 
                        type="text" 
                        value={refId}
                        onChange={e => setRefId(e.target.value)}
                        placeholder="SP-..."
                        className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-neutral-800 focus:border-amber-400/30 focus:outline-none transition-all font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Secure Tracking Token</label>
                    <input 
                      type="password" 
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-neutral-800 focus:border-amber-400/30 focus:outline-none transition-all tracking-widest"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Link 
                    href={`/applications/${refId}?token=${token}`}
                    className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
                      refId && token 
                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 hover:bg-amber-500' 
                        : 'bg-white/5 text-neutral-600 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    Access Intake Record
                    <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-2 pt-4 opacity-50">
                  <Activity size={10} className="text-neutral-600" />
                  <span className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">Authorized Access Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
