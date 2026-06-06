'use client';

import { Youtube } from 'lucide-react';

interface FollowActionProps {
  channelUrl?: string;
  title?: string;
}

export function FollowAction({ channelUrl = 'https://youtube.com/@SufiPulse-USA', title = 'SufiPulse-USA' }: FollowActionProps) {
  return (
    <a 
      href={channelUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group flex items-center justify-between bg-slate-900/80 hover:bg-emerald-900/20 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/10 transition-all duration-300">
          <Youtube className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-500 mb-1">Follow Channel</p>
          <h4 className="text-white font-semibold">{title}</h4>
        </div>
      </div>
      <div className="text-slate-500 group-hover:text-emerald-400 transition-colors">
        →
      </div>
    </a>
  );
}
