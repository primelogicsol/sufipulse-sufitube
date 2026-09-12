"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Play, Info, Subtitles, AlignLeft, Bell, Calendar, ArrowRight, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

import { ShareModal } from '@/app/components/share/ShareModal';
import { NotifyMeModal } from '@/app/(public)/release-premieres/components/NotifyMeModal';

export function PremiereReleaseCard({ 
  release, 
  variant = 'full',
  onNext,
  onPrev,
  currentIndex = 0,
  totalCount = 1
}: { 
  release: any; 
  variant: 'homepage' | 'full';
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalCount?: number;
}) {
  const [showShare, setShowShare] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  if (!release) return null;

  const isHomepage = variant === 'homepage';

  const isPremiumTeaserReady = release.premiumTeaserAvailable && (release.preReleaseAssets?.some((a: any) => a.type === 'premium_teaser' && a.youtubeId) || false);
  const isCommentaryReady = release.commentaryAvailable && !!(release.commentary || release.editorial_note || release.editorialNote);
  const isLyricsReady = release.lyricsTranslationsAvailable && !!((release.lyrics && Object.keys(release.lyrics).length > 0) || (release.lyricsStructures && release.lyricsStructures.length > 0));
  const isCreditsReady = release.creditsNotesAvailable && !!(release.credits || release.publicCredits);

  const hasAnyFeatures = isPremiumTeaserReady || isCommentaryReady || isLyricsReady || isCreditsReady;

  const descriptorParts = [];
  if (release.premiereStatus === 'coming_soon' || release.releaseLifecycle === 'upcoming') descriptorParts.push('Coming Soon to The Premiere Room');
  else if (release.premiereStatus === 'live' || release.releaseLifecycle === 'teaser_live') descriptorParts.push('Live in The Premiere Room');
  else descriptorParts.push('The Premiere Room');
  
  if (isPremiumTeaserReady) descriptorParts.push('First Listen');
  if (release.premiereVisibility === 'public') descriptorParts.push('SufiPulse.com');
  
  const descriptorLine = descriptorParts.join(' \u00B7 ');

  const statusDisplay = release.premiereStatus ? release.premiereStatus.replace('_', ' ') : 'Upcoming';
  
  let dateDisplay = 'To Be Announced';
  if (release.premiereDateTba) dateDisplay = 'To Be Announced';
  else if (release.premiereDate) dateDisplay = new Date(release.premiereDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  else if (release.officialReleaseAt) dateDisplay = new Date(release.officialReleaseAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const possibleImages = [
    release.premiereThumbnail,
    release.canonicalThumbnail,
    release.thumbnailUrl,
    release.youtubeId ? `https://i.ytimg.com/vi/${release.youtubeId}/maxresdefault.jpg` : null
  ].filter(Boolean);

  const [imageAttempt, setImageAttempt] = useState(0);
  const currentArtworkUrl = imageAttempt < possibleImages.length ? possibleImages[imageAttempt] : null;

  const hasVideo = !!(release.youtubeId || release.youtubeUrl);
  let DynamicCtaIcon = Bell;
  let dynamicCtaLabel = 'Notify Me';
  let dynamicCtaAction = () => setShowNotify(true);
  let showDynamicCta = false;
  let dynamicCtaHref: string | null = null;

  if (!hasVideo) {
    if (release.notifyEnabled) {
      DynamicCtaIcon = Bell;
      dynamicCtaLabel = 'Notify Me';
      showDynamicCta = true;
    }
  } else {
    if (release.premiereStatus === 'scheduled') {
      DynamicCtaIcon = Calendar;
      dynamicCtaLabel = 'Set YouTube Reminder';
      dynamicCtaHref = `https://www.youtube.com/watch?v=${release.youtubeId}`;
      showDynamicCta = true;
    } else if (release.premiereStatus === 'live') {
      DynamicCtaIcon = Play;
      dynamicCtaLabel = 'Join Premiere';
      dynamicCtaHref = `https://www.youtube.com/watch?v=${release.youtubeId}`;
      showDynamicCta = true;
    } else if (release.premiereStatus === 'completed' || release.releaseLifecycle === 'released') {
      DynamicCtaIcon = Play;
      dynamicCtaLabel = 'Watch & Listen';
      dynamicCtaHref = `https://www.youtube.com/watch?v=${release.youtubeId}`;
      showDynamicCta = true;
    } else {
      if (release.notifyEnabled) {
        DynamicCtaIcon = Bell;
        dynamicCtaLabel = 'Notify Me';
        showDynamicCta = true;
      }
    }
  }

  const handleDynamicCta = () => {
    if (dynamicCtaHref) window.open(dynamicCtaHref, '_blank');
    else dynamicCtaAction();
  };

  const fullDescription = release.premiereDescription || release.description || 'A forthcoming release exploring the boundaries of sacred contemporary expression.';
  const shortDescription = fullDescription.length > 220 ? fullDescription.substring(0, 220) + '...' : fullDescription;
  const renderDescription = isHomepage ? shortDescription : fullDescription;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-12 xl:gap-x-16 items-start w-full">
        
        {/* LEFT COLUMN WRAPPER (Desktop only wrapper, Mobile transparent) */}
        <div className="contents lg:flex lg:flex-col lg:col-span-5 xl:col-span-5 lg:col-start-1 xl:col-start-1 lg:row-start-1 w-full lg:gap-10">
          
          {/* 2. THUMBNAIL (Mobile: 2, Desktop: Left 1) */}
          <div className="order-2 lg:order-none w-full mt-2 lg:mt-0">
            <div className="w-full relative rounded-xl overflow-hidden shadow-2xl bg-black/40 ring-1 ring-white/10 group">
              <div className="aspect-[16/9] w-full relative">
                {showIframe ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${release.youtubeId}?rel=0&enablejsapi=1`}
                    title={release.canonicalTitle || release.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : currentArtworkUrl ? (
                  <>
                    <img 
                      src={currentArtworkUrl}
                      alt={release.canonicalTitle || release.title}
                      className="w-full h-full object-contain block bg-[#050810]"
                      onError={() => setImageAttempt(prev => prev + 1)}
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-slate)]/20 text-[var(--color-text-tertiary)]">
                    <Sparkles size={32} className="mb-4 opacity-30" />
                    <span className="text-xs tracking-[0.2em] uppercase font-bold opacity-50">Forthcoming Artwork</span>
                  </div>
                )}
              </div>
              
              {/* Carousel controls for homepage variant if multiple */}
              {isHomepage && totalCount > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[var(--color-midnight)]/90 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-lg z-20">
                  <button onClick={onPrev} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] transition-colors"><ChevronLeft size={16} /></button>
                  <div className="flex gap-2">
                    {Array.from({ length: totalCount }).map((_, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-[var(--color-gold)]' : 'bg-white/20'}`} />
                    ))}
                  </div>
                  <button onClick={onNext} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-gold)] transition-colors"><ChevronRight size={16} /></button>
                </div>
              )}
            </div>
          </div>

          {/* 4. FACTS (Mobile: 4, Desktop: Left 2) */}
          <div className="order-4 lg:order-none flex flex-col pt-2 lg:pt-0 w-full">
            <div className="grid grid-cols-2 gap-6 mb-10 w-full border-t border-white/5 lg:border-none pt-8 lg:pt-0">
              <div>
                <h3 className="text-[20px] md:text-[22px] font-serif text-[var(--color-text-tertiary)] mb-2">Premiere Status</h3>
                <p className="text-[14px] md:text-[15px] font-bold text-white tracking-widest uppercase">{statusDisplay}</p>
              </div>
              <div>
                <h3 className="text-[20px] md:text-[22px] font-serif text-[var(--color-text-tertiary)] mb-2">Official Premiere</h3>
                <p className="text-[14px] md:text-[15px] font-bold text-white tracking-widest uppercase">{dateDisplay}</p>
              </div>
            </div>

            {hasAnyFeatures && (
              <div className="w-full">
                <h3 className="text-[18px] md:text-[20px] font-serif text-[var(--color-gold)]/80 mb-4">Available at Premiere</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isPremiumTeaserReady && (
                    <div className="flex items-center gap-2 text-[11px] md:text-[12px] bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white/90 font-medium tracking-wide">
                      <Play size={14} className="text-[var(--color-gold)] shrink-0" /> Premium Teaser
                    </div>
                  )}
                  {isCommentaryReady && (
                    <div className="flex items-center gap-2 text-[11px] md:text-[12px] bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white/90 font-medium tracking-wide">
                      <Info size={14} className="text-[var(--color-gold)] shrink-0" /> Mystical Commentary
                    </div>
                  )}
                  {isLyricsReady && (
                    <div className="flex items-center gap-2 text-[11px] md:text-[12px] bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white/90 font-medium tracking-wide">
                      <Subtitles size={14} className="text-[var(--color-gold)] shrink-0" /> Lyrics & Translations
                    </div>
                  )}
                  {isCreditsReady && (
                    <div className="flex items-center gap-2 text-[11px] md:text-[12px] bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white/90 font-medium tracking-wide">
                      <AlignLeft size={14} className="text-[var(--color-gold)] shrink-0" /> Credits & Notes
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        
        </div>

        {/* RIGHT COLUMN WRAPPER (Desktop only wrapper, Mobile transparent) */}
        <div className="contents lg:flex lg:flex-col lg:col-span-7 xl:col-span-7 lg:col-start-6 xl:col-start-6 lg:row-start-1 pt-2 lg:pt-0">
          
          {/* 1. HEADER (Mobile: 1, Desktop: Right 1) */}
          <div className="order-1 lg:order-none flex flex-col lg:mb-8">
            <div className="mb-5">
              <span className="inline-block border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 text-[var(--color-gold)] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-md">
                {statusDisplay}
              </span>
            </div>
            
            <div className="text-[11px] md:text-[13px] text-[var(--color-gold)]/70 uppercase tracking-[0.25em] font-bold mb-5 flex items-center gap-2">
              THE PREMIERE ROOM <span className="opacity-50">&middot;</span> SUFIPULSE STUDIO USA
            </div>

            <h2 className="text-[42px] md:text-[48px] font-serif font-medium text-white mb-3 leading-[1.15] tracking-tight text-balance">
              {release.canonicalTitle || release.title}
            </h2>

            <p className="text-[11px] md:text-[13px] text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] font-semibold text-balance">
              {descriptorLine}
            </p>
          </div>

          {/* 3. ABOUT (Mobile: 3, Desktop: Right 2) */}
          <div className="order-3 lg:order-none flex flex-col max-w-[600px] lg:max-w-[700px] lg:mb-8">
            <h3 className="text-[28px] md:text-[32px] font-serif text-[var(--color-gold)] mb-3">About the Release</h3>
            {isHomepage ? (
              <p className="text-[16px] md:text-[18px] text-[var(--color-text-secondary)] leading-[1.8] line-clamp-3">
                {renderDescription}
              </p>
            ) : (
              <div className="text-[16px] md:text-[18px] text-[var(--color-text-secondary)] leading-[1.8] space-y-4">
                {fullDescription.split('\n\n').map((para: string, i: number) => <p key={i}>{para}</p>)}
              </div>
            )}
          </div>

          {/* 5. ACTIONS (Mobile: 5, Desktop: Right 3) */}
          <div className="order-5 lg:order-none flex flex-wrap items-center gap-8 pt-4 lg:pt-0">
            <Link 
              href={`/release-detail/${release.slug || release.youtubeId}`}
              className="px-8 py-4 bg-[var(--color-gold)] text-[var(--color-midnight)] hover:bg-white rounded-full font-bold text-[12px] md:text-[14px] uppercase tracking-widest transition-colors shadow-lg flex items-center gap-2"
            >
              {release.premiereCtaLabel || 'Explore the Release'} {!isHomepage && <ArrowRight size={16} />}
            </Link>
            
            {showDynamicCta && (
              <button 
                onClick={handleDynamicCta}
                className="flex items-center gap-2 text-[12px] md:text-[14px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                <DynamicCtaIcon size={16} /> {dynamicCtaLabel}
              </button>
            )}

            {!isHomepage && (
              <button onClick={() => setShowShare(true)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors" aria-label="Share">
                <Share2 size={16} />
              </button>
            )}
          </div>

        </div>

      </div>

      {showShare && ShareModal && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          title={release.canonicalTitle || release.title}
          canonicalUrl={`https://sufipulse.com/release-detail/${release.slug || release.youtubeId}`}
          context="premiere"
        />
      )}
      
      {showNotify && NotifyMeModal && (
        <NotifyMeModal releaseId={release.id} onClose={() => setShowNotify(false)} />
      )}
    </>
  );
}
