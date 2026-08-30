"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShareModal } from '@/app/components/share/ShareModal';
import { buildShareContext } from '@/lib/share-context';
import { Share2, Bell, Play, ExternalLink, Mic2, FileText, BookOpen, Users, Star } from 'lucide-react';
import { NotifyMeModal } from './NotifyMeModal';
import { PremiumTeaserModal } from './PremiumTeaserModal';

// â”€â”€â”€ Phase determination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
// Phase 1 (EDITORIAL)      lifecycle=upcoming | no youtubeId
// Phase 2 (PREMIERE LIVE)  lifecycle=premiere_scheduled | youtubeId present
// Phase 3 (RELEASED)       lifecycle=released | youtubeId present
//
// All three require: status=published, visibility=public, premiereVisibility=public
// No phase requires a YouTube ID. The editorial card is always valid.

type Phase = 'editorial' | 'premiere_live' | 'released';

function derivePhase(release: any): Phase {
  const lc = release.releaseLifecycle || '';
  const hasVideo = Boolean(release.youtubeId);
  if (lc === 'released' && hasVideo) return 'released';
  if (lc === 'premiere_scheduled' && hasVideo) return 'premiere_live';
  return 'editorial';
}

// â”€â”€â”€ Background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Background({ artworkUrl }: { artworkUrl: string | null }) {
  return (
    <div className="absolute inset-0 z-0">
      {artworkUrl ? (
        <Image
          src={artworkUrl}
          alt=""
          fill
          className="object-cover opacity-30"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-[#0a0a14] to-neutral-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/30" />
    </div>
  );
}

function Divider() {
  return <div className="border-t border-white/[0.08] my-8" />;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-gold)]/70 mb-3">
      {children}
    </h3>
  );
}

// â”€â”€â”€ Pill asset list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PREMIERE_ASSETS = [
  { icon: <Play className="w-3 h-3" />, label: 'Premium Teaser' },
  { icon: <Mic2 className="w-3 h-3" />, label: 'Mystical Commentary & Insights' },
  { icon: <BookOpen className="w-3 h-3" />, label: 'Lyrics & Translations' },
  { icon: <FileText className="w-3 h-3" />, label: 'Credits & Creative Notes' },
];

const RELEASE_ASSETS = [
  { icon: <BookOpen className="w-3 h-3" />, label: 'Lyrics' },
  { icon: <Star className="w-3 h-3" />, label: 'Lyrics in 18 Languages' },
  { icon: <Mic2 className="w-3 h-3" />, label: 'Mystical Commentary & Insights' },
  { icon: <FileText className="w-3 h-3" />, label: 'Credits & Creative Notes' },
  { icon: <Users className="w-3 h-3" />, label: 'Adopt This Song' },
  { icon: <Star className="w-3 h-3" />, label: 'Sponsors & Acknowledgements' },
];

// â”€â”€â”€ Phase 1: Editorial â€” no YouTube ID required â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EditorialCard({ release, title, tagline, introduction, liveTeaser, onNotify, onTeaser, onShare }: {
  release: any; title: string; tagline: string | null; introduction: string;
  liveTeaser: any; onNotify: () => void; onTeaser: () => void; onShare: () => void;
}) {
  const hasScheduledTeaser = release.preReleaseAssets?.some(
    (a: any) => a.type === 'premium_teaser' && a.status === 'scheduled'
  );

  return (
    <div className="relative z-10 p-8 md:p-14">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="inline-block px-3 py-1 bg-[var(--color-gold)] text-black text-[10px] font-black uppercase tracking-widest rounded-sm">
            {liveTeaser ? 'Premium Teaser Live' : 'Upcoming'}
          </span>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
            The Premiere Room &nbsp;Â·&nbsp; SufiPulse Studio USA
          </span>
        </div>

        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
          {title}
        </h2>

        {tagline && (
          <p className="text-[var(--color-gold)] italic text-lg md:text-xl font-medium mb-6">
            {tagline}
          </p>
        )}

        <p className="text-neutral-400 text-sm uppercase tracking-[0.12em] font-semibold">
          Coming Soon to The Premiere Room &nbsp;&middot;&nbsp; First Listen &nbsp;&middot;&nbsp; Premium Teaser &nbsp;&middot;&nbsp; SufiPulse.com
        </p>
      </div>

      <Divider />

      {/* About */}
      <div className="mb-10 max-w-3xl">
        <SectionHeading>About the Release</SectionHeading>
        <div className="text-neutral-300 text-base leading-relaxed space-y-4">
          {introduction.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      <Divider />

      {/* Status grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
        <div>
          <SectionHeading>Premiere Status</SectionHeading>
          <p className="text-white font-semibold text-sm">Coming Soon</p>
        </div>
        <div>
          <SectionHeading>Official Premiere</SectionHeading>
          <p className="text-white font-semibold text-sm">
            {release.officialReleaseAt
              ? new Date(release.officialReleaseAt).toLocaleDateString('en-US', { dateStyle: 'long' })
              : 'To Be Announced'}
          </p>
        </div>
      </div>

      <Divider />

      {/* Available at premiere */}
      <div className="mb-10">
        <SectionHeading>Available at Premiere</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {PREMIERE_ASSETS.map(({ icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-neutral-300 text-xs font-medium">
              <span className="text-[var(--color-gold)]/70">{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      <Divider />

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/release-detail/${release.slug}`}
          className="px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#FDE68A] transition-colors rounded-full shadow-lg shadow-[var(--color-gold)]/20"
        >
          Explore the Release
        </Link>

        {liveTeaser ? (
          <button
            onClick={onTeaser}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs transition-colors rounded-full border border-white/20"
          >
            Watch Premium Teaser
          </button>
        ) : hasScheduledTeaser ? (
          <span className="px-8 py-3 text-neutral-500 text-xs font-bold uppercase tracking-wider rounded-full border border-white/5 bg-white/5 cursor-not-allowed">
            Teaser Coming Soon
          </span>
        ) : null}

        <button
          onClick={onNotify}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs transition-colors rounded-full border border-white/20"
        >
          <Bell className="w-3.5 h-3.5" /> Notify Me
        </button>

        <button
          onClick={onShare}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Phase 2: Premiere Live â€” YouTube + premiere_scheduled â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PremiereLiveCard({ release, title, tagline, introduction, onShare }: {
  release: any; title: string; tagline: string | null; introduction: string; onShare: () => void;
}) {
  return (
    <div className="relative z-10 p-8 md:p-14">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="inline-block px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm animate-pulse">
          Now Premiering
        </span>
        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
          SufiPulse Premiere Room
        </span>
      </div>

      <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">{title}</h2>
      {tagline && (
        <p className="text-[var(--color-gold)] italic text-lg md:text-xl font-medium mb-8">{tagline}</p>
      )}

      <SectionHeading>Watch the Premiere</SectionHeading>
      <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 border border-neutral-800">
        <iframe
          src={`https://www.youtube.com/embed/${release.youtubeId}?rel=0&enablejsapi=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <Divider />

      <div className="mb-8 max-w-3xl">
        <SectionHeading>About the Release</SectionHeading>
        <div className="text-neutral-300 text-base leading-relaxed space-y-4">
          {introduction.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>

      <Divider />

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/release-detail/${release.slug}`}
          className="px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#FDE68A] transition-colors rounded-full"
        >
          Explore the Release
        </Link>
        <a
          href={`https://www.youtube.com/watch?v=${release.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs rounded-full border border-white/20"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Watch on YouTube
        </a>
        <button onClick={onShare} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20" aria-label="Share">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Phase 3: Released â€” full video + rich content inventory â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReleasedCard({ release, title, tagline, introduction, onShare }: {
  release: any; title: string; tagline: string | null; introduction: string; onShare: () => void;
}) {
  return (
    <div className="relative z-10 p-8 md:p-14">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="inline-block px-3 py-1 bg-[var(--color-gold)] text-black text-[10px] font-black uppercase tracking-widest rounded-sm">
          Official Release
        </span>
      </div>

      <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">{title}</h2>
      {tagline && (
        <p className="text-[var(--color-gold)] italic text-lg md:text-xl font-medium mb-8">{tagline}</p>
      )}

      <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 border border-neutral-800">
        <iframe
          src={`https://www.youtube.com/embed/${release.youtubeId}?rel=0&enablejsapi=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <Divider />

      <div className="mb-8 max-w-3xl">
        <SectionHeading>About the Release</SectionHeading>
        <div className="text-neutral-300 text-base leading-relaxed space-y-4">
          {introduction.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>

      <Divider />

      <div className="mb-8">
        <SectionHeading>Explore the Work</SectionHeading>
        <div className="flex flex-wrap gap-2 mb-6">
          {RELEASE_ASSETS.map(({ icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-neutral-300 text-xs font-medium">
              <span className="text-[var(--color-gold)]/70">{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/release-detail/${release.slug}`}
          className="px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#FDE68A] transition-colors rounded-full shadow-lg shadow-[var(--color-gold)]/20"
        >
          Explore Full Release
        </Link>
        <a
          href={`https://www.youtube.com/watch?v=${release.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs rounded-full border border-white/20"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Watch on YouTube
        </a>
        <button onClick={onShare} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20" aria-label="Share">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Root export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function FeaturedPremiere({ release }: { release: any }) {
  const [showShare, setShowShare] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const title = release.canonicalTitle || release.title;
  const tagline = release.premiereTagline || release.subtitle || null;
  const introduction = release.premiereIntroduction || release.description || 'A SufiPulse Studio Production.';

  const liveTeaser = release.preReleaseAssets?.find(
    (a: any) => a.type === 'premium_teaser' && a.status === 'live'
  );

  const artworkUrl: string | null =
    liveTeaser?.thumbnailUrl || release.canonicalThumbnail || release.thumbnailUrl || null;

  const phase = derivePhase(release);

  return (
    <>
      <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-950 border border-[var(--color-border-strong)] shadow-2xl mb-20">
        <Background artworkUrl={artworkUrl} />

        {phase === 'editorial' && (
          <EditorialCard
            release={release}
            title={title}
            tagline={tagline}
            introduction={introduction}
            liveTeaser={liveTeaser}
            onNotify={() => setShowNotify(true)}
            onTeaser={() => setShowTeaser(true)}
            onShare={() => setShowShare(true)}
          />
        )}

        {phase === 'premiere_live' && (
          <PremiereLiveCard
            release={release}
            title={title}
            tagline={tagline}
            introduction={introduction}
            onShare={() => setShowShare(true)}
          />
        )}

        {phase === 'released' && (
          <ReleasedCard
            release={release}
            title={title}
            tagline={tagline}
            introduction={introduction}
            onShare={() => setShowShare(true)}
          />
        )}
      </div>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={title}
        canonicalUrl={`https://sufipulse.com/release-detail/${release.slug}`}
        context="premiere"
        socialShareKit={release.socialShareKit}
        shareContext={buildShareContext(release, 'premiere')}
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

