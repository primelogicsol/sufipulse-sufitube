'use client';

import { Headphones } from 'lucide-react';
import Link from 'next/link';

interface ListenActionProps {
  releaseId: string;
  title?: string;
}

export function ListenAction({ releaseId, title = 'Listen to Full Song' }: ListenActionProps) {
  return (
    <Link
      href={`/release-detail/${releaseId}`}
      className="group flex items-center justify-between bg-slate-900/80 hover:bg-emerald-900/20 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Headphones className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1">Listen to Full Song</p>
          <h4 className="text-white font-semibold text-sm">{title}</h4>
        </div>
      </div>
      <div className="text-slate-500 group-hover:text-emerald-400 transition-colors">→</div>
    </Link>
  );
}
