"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type CMSRelease } from '@/lib/cms-storage';
import { ShareModal } from '@/app/components/share/ShareModal';
import { buildShareContext } from '@/lib/share-context';
import { Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UpcomingPremiereCard({ release }: { release: any }) {
  const [showShare, setShowShare] = useState(false);
  const router = useRouter();

  const title = release.canonicalTitle || release.title;

  const liveTeaser = release.preReleaseAssets?.find(
    (a: any) => a.type === 'premium_teaser' && a.status === 'live'
  );

  const artworkUrl = liveTeaser?.thumbnailUrl || release.canonicalThumbnail || release.thumbnailUrl || '/empty-artwork.png';
  const isReleased = release.releaseLifecycle === 'released';

  let statusBadge = "UPCOMING";
  if (isReleased) statusBadge = "RELEASED";
  else if (liveTeaser) statusBadge = "PREMIUM TEASER LIVE";
  else if (release.releaseLifecycle === 'premiere_scheduled') statusBadge = "PREMIERE SCHEDULED";
  else if (release.preReleaseAssets?.some((a: any) => a.type === 'first_listen')) statusBadge = "FIRST LISTEN";

  const handleCardClick = (e: React.MouseEvent) => {
    // Let links and buttons handle themselves
    if ((e.target as HTMLElement).closest('button, a')) return;
    router.push(`/release-detail/${release.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if ((e.target as HTMLElement).closest('button, a') && (e.target as HTMLElement).closest('button, a') !== e.currentTarget) return;
      router.push(`/release-detail/${release.slug}`);
    }
  };

  return (
    <>
      <Link
        href={`/release-detail/${release.slug}`}
        aria-label={`View details for ${title}`}
        className="bg-[var(--color-midnight)]/60 border border-[var(--color-border-strong)] rounded-xl overflow-hidden hover:border-[var(--color-gold)]/50 transition-colors backdrop-blur-md flex flex-col h-full group relative focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
      >
        <div className="aspect-video bg-[#0a0f1c] relative border-b border-[var(--color-border)] overflow-hidden">
          <Image
            src={artworkUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
          />
          {!isReleased && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold tracking-wider border border-white/10 uppercase z-10 text-white">
              {release.officialReleaseAt ? new Date(release.officialReleaseAt).toLocaleDateString() : 'Coming Soon'}
            </div>
          )}
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest font-bold">
              {statusBadge}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowShare(true);
              }}
              className="text-neutral-500 hover:text-white transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-lg font-bold text-white mb-2 leading-tight">{title}</h4>

          {release.vocalist && (
            <p className="text-sm text-neutral-400 mb-4 line-clamp-1">
              Vocals: {typeof release.vocalist === 'string' ? release.vocalist : release.vocalist.name}
            </p>
          )}

          <div className="mt-auto">
            <span className="text-xs font-semibold text-[var(--color-gold)]/80 group-hover:text-[var(--color-gold)] transition-colors">
              {isReleased ? 'WATCH OFFICIAL RELEASE' : 'VIEW DETAILS'} &rarr;
            </span>
          </div>
        </div>
      </Link>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={title}
        canonicalUrl={`https://sufipulse.com/release-detail/${release.slug}`}
        context="premiere"
        socialShareKit={release.socialShareKit}
        shareContext={buildShareContext(release, "premiere")}
      />
    </>
  );
}
