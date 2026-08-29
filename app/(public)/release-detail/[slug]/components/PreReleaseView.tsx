"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type CMSRelease } from '@/lib/cms-storage';
import { Calendar, Clock, Share2, Play } from 'lucide-react';
import { ShareModal } from '@/app/components/share/ShareModal';
import { NotifyMeModal } from '@/app/(public)/release-premieres/components/NotifyMeModal';
import { PremiumTeaserModal } from '@/app/(public)/release-premieres/components/PremiumTeaserModal';

export function PreReleaseView({ release, isAdmin }: { release: any; isAdmin: boolean }) {
  const [showShare, setShowShare] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  const title = release.release_title || release.title || 'Untitled';
  const liveTeaser = release.preReleaseAssets?.find(
    (a: any) => a.type === 'premium_teaser' && a.status === 'live'
  );
  const artworkUrl = liveTeaser?.thumbnailUrl || release.thumbnailUrl || '/empty-artwork.png';
  const officialDate = release.officialReleaseAt ? new Date(release.officialReleaseAt) : null;

  useEffect(() => {
    if (!officialDate) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = officialDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setTimeLeft({ d, h, m, s });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [officialDate]);

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center py-20 px-4 bg-neutral-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={artworkUrl} 
          alt={title}
          fill
          className="object-cover opacity-20 blur-xl scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        {isAdmin && (
          <div className="mb-8 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg text-amber-400 text-sm">
            You are viewing the Pre-Release page as an Admin. Normal users will see this until the release is set to 'Released'.
          </div>
        )}
        
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full border border-[var(--color-gold)]/30 bg-black/50 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse mr-2" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-gold)]">
            {liveTeaser ? 'Premium Teaser Now Playing' : release.releaseLifecycle === 'premiere_scheduled' ? 'Premiere Scheduled' : 'Upcoming Release'}
          </span>
        </div>

        <div className="relative w-64 h-64 mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
          <Image src={artworkUrl} alt={title} fill className="object-cover" />
          {liveTeaser && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setShowTeaser(true)}
                className="w-16 h-16 rounded-full bg-[var(--color-gold)] flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Play className="w-6 h-6 text-black ml-1" />
              </button>
            </div>
          )}
        </div>

        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight drop-shadow-lg">
          {title}
        </h1>
        
        {release.description && (
          <p className="text-neutral-400 max-w-2xl mx-auto mb-8 text-lg">
            {release.description}
          </p>
        )}

        {timeLeft && (
          <div className="flex items-center justify-center gap-4 mb-12">
            {[
              { label: 'Days', value: timeLeft.d },
              { label: 'Hours', value: timeLeft.h },
              { label: 'Mins', value: timeLeft.m },
              { label: 'Secs', value: timeLeft.s }
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl md:text-3xl font-bold text-white">
                    {unit.value.toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2 font-semibold">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {liveTeaser ? (
            <button 
              onClick={() => setShowTeaser(true)}
              className="w-full sm:w-auto px-8 py-4 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-sm rounded-full hover:bg-[#FDE68A] transition-colors"
            >
              Watch Premium Teaser
            </button>
          ) : (
            <button 
              onClick={() => setShowNotify(true)}
              className="w-full sm:w-auto px-8 py-4 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-sm rounded-full hover:bg-[#FDE68A] transition-colors"
            >
              Notify Me on Release
            </button>
          )}
          
          <div className="flex gap-4">
            {liveTeaser && (
              <button 
                onClick={() => setShowNotify(true)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                aria-label="Notify Me"
              >
                <Clock className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setShowShare(true)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={title}
        canonicalUrl={`https://sufipulse.com/release-detail/${release.slug}`}
        context="premiere"
        socialShareKit={release.socialShareKit}
      />
      
      {showNotify && (
        <NotifyMeModal releaseId={release.id} onClose={() => setShowNotify(false)} />
      )}
      
      {showTeaser && liveTeaser?.youtubeId && (
        <PremiumTeaserModal youtubeId={liveTeaser.youtubeId} onClose={() => setShowTeaser(false)} />
      )}
    </div>
  );
}
