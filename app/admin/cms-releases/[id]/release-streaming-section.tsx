"use client";

import React from 'react';
import { PLATFORMS, type CMSRelease, type PlatformDistribution, type DistributionStatus } from '@/lib/cms-storage';
import { Globe, CheckCircle, AlertCircle, Clock, Play, Archive, ExternalLink, ShieldCheck } from 'lucide-react';

const Activity = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

type Props = {
  form: Partial<CMSRelease>;
  onUpdateDistribution: (platformId: string, patch: Partial<PlatformDistribution>) => void;
};

const STATUS_ICONS: Record<DistributionStatus, any> = {
  not_started: Clock,
  pending: Clock,
  scheduled: Clock,
  processing: Activity,
  published: CheckCircle,
  partially_live: Play,
  unavailable: AlertCircle,
  failed: AlertCircle,
  archived: Archive,
};

const STATUS_COLORS: Record<DistributionStatus, string> = {
  not_started: 'text-neutral-500',
  pending: 'text-amber-500',
  scheduled: 'text-indigo-400',
  processing: 'text-blue-400',
  published: 'text-emerald-500',
  partially_live: 'text-cyan-400',
  unavailable: 'text-red-400',
  failed: 'text-red-500',
  archived: 'text-neutral-600',
};

export function ReleaseStreamingSection({
  form,
  onUpdateDistribution,
}: Props) {
  const distribution = form.distribution || {};

  return (
    <div id="streaming-platforms-section" className="mb-12 pb-12 border-b border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            Institutional Distribution
            <span className="text-[10px] font-black bg-amber-400/5 text-amber-400 border border-amber-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Governed Workflow</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">Track and authorize platform-specific release states</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {PLATFORMS.map((platform) => {
          const state = distribution[platform.id] || { 
            platform: platform.id, 
            status: 'not_started', 
            isVerified: false, 
            isVisible: true 
          };
          const Icon = STATUS_ICONS[state.status as DistributionStatus] || Clock;
          const statusColor = STATUS_COLORS[state.status as DistributionStatus] || 'text-neutral-500';

          return (
            <div 
              key={platform.id} 
              className="bg-black/40 border border-white/5 rounded-2xl p-6 transition-all hover:border-white/10 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                {/* Platform Info */}
                <div className="lg:w-48 flex items-center gap-4 shrink-0">
                  <div className={`p-3 rounded-xl bg-white/[0.02] border border-white/5 ${state.status === 'published' ? 'text-amber-400 border-amber-400/20' : 'text-neutral-500'}`}>
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{platform.label}</h3>
                    <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mt-0.5">{platform.id.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Status Control */}
                <div className="lg:w-64 shrink-0">
                  <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2 ml-1">Distribution Status</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                       <Icon size={14} className={statusColor} />
                    </div>
                    <select
                      value={state.status}
                      onChange={(e) => onUpdateDistribution(platform.id, { status: e.target.value as any })}
                      className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-amber-400 outline-none cursor-pointer appearance-none uppercase font-bold tracking-widest"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="pending">Pending</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="processing">Processing</option>
                      <option value="published">Published</option>
                      <option value="partially_live">Partially Live</option>
                      <option value="unavailable">Unavailable</option>
                      <option value="failed">Failed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* URL Input */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2 ml-1">Platform URL / Endpoint</label>
                  <div className="relative group/url">
                    <input
                      type="url"
                      value={state.url || ''}
                      onChange={(e) => onUpdateDistribution(platform.id, { url: e.target.value })}
                      placeholder={`https://...`}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-blue-400 focus:border-amber-400 outline-none placeholder:text-neutral-800 transition-all font-mono"
                    />
                    {state.url && (
                       <a href={state.url} target="_blank" rel="noopener noreferrer" className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors">
                          <ExternalLink size={14} />
                       </a>
                    )}
                  </div>
                </div>

                {/* Verification & Visibility */}
                <div className="lg:w-48 flex items-center gap-6 shrink-0">
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={() => onUpdateDistribution(platform.id, { isVerified: !state.isVerified })}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${state.isVerified ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/[0.02] text-neutral-600 border-white/5'}`}
                    >
                      <ShieldCheck size={12} /> {state.isVerified ? 'Verified' : 'Unverified'}
                    </button>
                    <button
                      onClick={() => onUpdateDistribution(platform.id, { isVisible: !state.isVisible })}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${state.isVisible ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-neutral-900 text-neutral-700 border-white/5'}`}
                    >
                      {state.isVisible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 p-6 bg-amber-400/[0.02] border border-amber-400/10 rounded-2xl flex items-start gap-4">
        <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-500 leading-relaxed font-light">
          <strong className="text-neutral-400">Institutional Protocol:</strong> Platforms marked as <span className="text-emerald-500 font-bold">PUBLISHED</span> must have a validated destination URL to appear as active links on public release pages. Unverified or pending platforms will show a "Distribution Pending" status.
        </p>
      </div>
    </div>
  );
}
