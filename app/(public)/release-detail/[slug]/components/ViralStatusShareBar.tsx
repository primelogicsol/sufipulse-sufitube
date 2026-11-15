'use client';

import React, { useState } from 'react';
import { Share2, Check, MessageCircle, X, Sparkles } from 'lucide-react';

interface ViralStatusShareBarProps {
  title: string;
  youtubeId?: string;
  slug: string;
  lyricSnippet?: string;
}

export function ViralStatusShareBar({
  title,
  youtubeId,
  slug,
  lyricSnippet,
}: ViralStatusShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const ytUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}`
    : `https://www.sufipulse.com/release-detail/${slug}`;

  const snippet = lyricSnippet || 'Kab tak khamosh, kab tak khamosh? Apne zameer ke parde kholo!';
  
  const shareText = `🌙 *"${title}"*\n\n"${snippet}"\n\nA sacred spiritual kalam from Kashmir — watch the master video with multilingual subtitles on YouTube:\n▶️ ${ytUrl}\n\n#SufiPulse #Kashmir #SufiMusic #Kalam`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <aside
      aria-label="Share release to WhatsApp"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-neutral-950/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 shadow-2xl shadow-emerald-950/40 text-white flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Kashmir & Global Viral Share
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-neutral-400 hover:text-white p-1 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-snug">
          Put this kalam on your <strong className="text-emerald-300">WhatsApp Status</strong> or Story to spread the message of spiritual preservation.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            Share to WhatsApp Status
          </a>

          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 text-neutral-200 hover:text-white font-medium text-xs rounded-xl transition-all"
            title="Copy formatted text and link"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
