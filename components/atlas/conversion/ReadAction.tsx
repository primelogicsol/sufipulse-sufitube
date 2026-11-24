'use client';

import { BookOpen } from 'lucide-react';
import Link from 'next/link';

interface ReadActionProps {
  articleSlug: string;
  title?: string;
}

export function ReadAction({ articleSlug, title = 'Read Literary Essay' }: ReadActionProps) {
  return (
    <Link
      href={`/literary-journal/${articleSlug}`}
      className="group flex items-center justify-between bg-slate-900/80 hover:bg-emerald-900/20 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <BookOpen className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-400 mb-1">SufiPulse Literary Journal</p>
          <h4 className="text-white font-semibold text-sm line-clamp-1">{title}</h4>
        </div>
      </div>
      <div className="text-slate-500 group-hover:text-emerald-400 transition-colors">→</div>
    </Link>
  );
}
