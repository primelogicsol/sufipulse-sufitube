'use client';

import { Youtube } from 'lucide-react';

interface FollowActionProps {
  channelUrl?: string;
  title?: string;
}

export function FollowAction({
  channelUrl = 'https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ?sub_confirmation=1',
  title = 'SufiPulse USA Official Channel',
}: FollowActionProps) {
  return (
    <a
      href={channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-conversion-intent="subscribe"
      className="group flex items-center justify-between bg-slate-900/80 hover:bg-emerald-900/20 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/10 transition-all duration-300">
          <Youtube className="w-6 h-6 text-slate-400 group-hover:text-red-500 transition-colors" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1">Subscribe on YouTube</p>
          <h4 className="text-white font-semibold text-sm">{title}</h4>
        </div>
      </div>
      <div className="text-slate-500 group-hover:text-emerald-400 transition-colors">→</div>
    </a>
  );
}
