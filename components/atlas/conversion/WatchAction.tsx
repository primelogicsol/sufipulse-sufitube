'use client';

import { PlayCircle } from 'lucide-react';

interface WatchActionProps {
  videoId: string;
  title?: string;
}

export function WatchAction({ videoId, title = 'Watch Full Song on YouTube' }: WatchActionProps) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${videoId}&utm_source=sufipulse.com&utm_medium=organic_discovery`}
      target="_blank"
      rel="noopener noreferrer"
      data-conversion-intent="watch"
      className="group flex items-center justify-between bg-slate-900/80 hover:bg-emerald-900/20 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <PlayCircle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1">Watch on YouTube</p>
          <h4 className="text-white font-semibold text-sm line-clamp-1">{title}</h4>
        </div>
      </div>
      <div className="text-slate-500 group-hover:text-emerald-400 transition-colors">→</div>
    </a>
  );
}
