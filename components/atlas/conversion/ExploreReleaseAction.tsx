'use client';

import { Disc3 } from 'lucide-react';
import Link from 'next/link';

interface ExploreReleaseActionProps {
  releaseSlug: string;
  title?: string;
}

export function ExploreReleaseAction({ releaseSlug, title = 'Explore Original Release' }: ExploreReleaseActionProps) {
  return (
    <Link 
      href={`/releases/${releaseSlug}`} 
      className="group flex flex-col sm:flex-row items-center sm:justify-between bg-gradient-to-br from-emerald-900/60 to-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-xl p-5 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]"
    >
      <div className="flex items-center space-x-4 mb-3 sm:mb-0">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Disc3 className="w-7 h-7 text-emerald-400 group-hover:animate-spin-slow" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-1">SufiPulse Original</p>
          <h4 className="text-white font-bold text-lg">{title}</h4>
        </div>
      </div>
      <div className="bg-emerald-500 text-slate-900 font-bold px-4 py-2 rounded-lg group-hover:bg-emerald-400 transition-colors">
        Explore Now
      </div>
    </Link>
  );
}
