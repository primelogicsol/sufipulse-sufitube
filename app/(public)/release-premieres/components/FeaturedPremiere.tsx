"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type CMSRelease } from '@/lib/cms-storage';
import { ShareModal } from '@/app/components/share/ShareModal';
import { buildShareContext } from '@/lib/share-context';
import { Share2 } from 'lucide-react';
import { NotifyMeModal } from './NotifyMeModal';
import { PremiumTeaserModal } from './PremiumTeaserModal';

export function FeaturedPremiere({ release }: { release: any }) {
  const [showShare, setShowShare] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  const title = release.canonicalTitle || release.title;
  const tagline = release.premiereTagline || release.subtitle || null;
  const introduction = release.premiereIntroduction || release.description || 'A SufiPulse Studio Production.';
  
  const liveTeaser = release.preReleaseAssets?.find(
    (a: any) => a.type === 'premium_teaser' && a.status === 'live'
  );
  
  const rawArtwork = liveTeaser?.thumbnailUrl || release.canonicalThumbnail || release.thumbnailUrl;
  const hasArtwork = Boolean(rawArtwork);

  const isReleased = release.releaseLifecycle === 'released';

  return (
    <>
      <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-900 border border-[var(--color-border-strong)] shadow-2xl mb-20 group">
        <div className="absolute inset-0 z-0">
          {hasArtwork ? (
            <Image 
              src={rawArtwork!} 
              alt={title}
              fill
              className="object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-700"
            />
          ) : (
            /* No artwork yet — show a rich dark cinematic gradient */
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-end justify-between p-8 md:p-12 min-h-[400px]">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-[var(--color-gold)] text-black text-[10px] font-black uppercase tracking-widest rounded-sm mb-4">
              {isReleased ? 'Official Release' : liveTeaser ? 'Premium Teaser Live' : release.releaseLifecycle === 'premiere_scheduled' ? 'Premiere Scheduled' : 'Upcoming'}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
              {title}
            </h2>
            {tagline && (
              <p className="text-[var(--color-gold)] italic text-base md:text-lg mb-4 font-medium">
                {tagline}
              </p>
            )}
            <div className="flex items-center gap-4 text-neutral-300 text-sm mb-6">
              <span className="font-semibold text-[var(--color-gold)]">Official Release:</span>
              <span>{release.officialReleaseAt ? new Date(release.officialReleaseAt).toLocaleDateString() : 'TBA'}</span>
            </div>
            <p className="text-neutral-400 text-base md:text-lg mb-8 max-w-xl line-clamp-3">
              {introduction}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {isReleased ? (
                <Link href={`/release-detail/${release.slug}`} className="px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#FDE68A] transition-colors rounded-full shadow-lg shadow-[var(--color-gold)]/20">
                  Watch Official Release
                </Link>
              ) : liveTeaser ? (
                <button onClick={() => setShowTeaser(true)} className="px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#FDE68A] transition-colors rounded-full shadow-lg shadow-[var(--color-gold)]/20">
                  Watch Premium Teaser
                </button>
              ) : release.preReleaseAssets?.some((a: any) => a.type === 'premium_teaser' && a.status === 'scheduled') ? (
                <button disabled className="px-8 py-3 bg-neutral-800 text-neutral-500 font-bold uppercase tracking-wider text-xs rounded-full cursor-not-allowed">
                  Teaser Coming Soon
                </button>
              ) : null}

              {!isReleased && (
                <button onClick={() => setShowNotify(true)} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs transition-colors rounded-full border border-white/20 backdrop-blur-sm">
                  Notify Me
                </button>
              )}
              
              <button onClick={() => setShowShare(true)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 ml-2" aria-label="Share">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
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
        shareContext={buildShareContext(release, "premiere")}
      />
      
      {showNotify && (
        <NotifyMeModal releaseId={release.id} onClose={() => setShowNotify(false)} />
      )}
      
      {showTeaser && liveTeaser?.youtubeId && (
        <PremiumTeaserModal youtubeId={liveTeaser.youtubeId} onClose={() => setShowTeaser(false)} />
      )}
    </>
  );
}
