"use client";

import Link from 'next/link';
import { Play, Youtube, Sparkles } from 'lucide-react';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';

interface FlagshipSpotlightProps {
    featuredRelease: any;
}

export function FlagshipSpotlight({ featuredRelease }: FlagshipSpotlightProps) {
    if (!featuredRelease) return null;

    return (
        <section className="py-16 bg-gradient-to-b from-[var(--color-midnight)] to-[var(--color-slate)] border-b border-white/5">
            <PageContainer>
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                        <span className="text-xs font-black text-[var(--color-gold)] uppercase tracking-[0.3em]">
                            Flagship Spotlight
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Left: Artwork / Video Thumbnail */}
                        <div className="w-full md:w-[45%] relative aspect-video bg-black group">
                            {(() => {
                                const thumbCandidates = buildYouTubeThumbnailCandidates(featuredRelease.youtubeId || featuredRelease.id, [featuredRelease.thumbnailUrl]);
                                return (
                                    <img 
                                        src={thumbCandidates[0]} 
                                        alt={featuredRelease.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        onError={(e) => advanceThumbnailFallback(e.currentTarget, thumbCandidates)}
                                    />
                                );
                            })()}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <Link 
                                    href={`/release-detail/${featuredRelease.slug || featuredRelease.youtubeId || featuredRelease.id}`}
                                    className="w-14 h-14 rounded-full bg-[var(--color-gold)] flex items-center justify-center text-[var(--color-midnight)] shadow-2xl hover:scale-110 transition-transform duration-300"
                                >
                                    <Play className="w-6 h-6 ml-1" fill="currentColor" />
                                </Link>
                            </div>
                            <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white">
                                {featuredRelease.durationFormatted}
                            </div>
                            <div className="absolute top-3 left-3 bg-amber-400 text-black px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {featuredRelease.govType === 'native_governed' ? 'Governed Production' : 'Legacy Registry'}
                            </div>
                        </div>

                        {/* Right: Metadata & Context */}
                        <div className="w-full md:w-[55%] p-6 md:p-8 flex flex-col justify-center space-y-5">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest">
                                    <span>{featuredRelease.publishedDate ? new Date(featuredRelease.publishedDate).getFullYear() : 2026}</span>
                                    <span>&bull;</span>
                                    <span>{(featuredRelease.format || 'Video').toUpperCase()}</span>
                                    {featuredRelease.viewCount ? (
                                        <>
                                            <span>&bull;</span>
                                            <span>{Number(featuredRelease.viewCount).toLocaleString()} Views</span>
                                        </>
                                    ) : null}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                                    {featuredRelease.title}
                                </h2>
                            </div>

                            {/* Authorship Chain Line */}
                            <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-1.5">
                                <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-[0.3em]">Authorship & Lineage</p>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-[var(--color-text-tertiary)] block text-[10px] uppercase font-bold">Vocalist</span>
                                        <span className="text-white font-medium">{featuredRelease.vocalist || 'SufiPulse Vocal Ensemble'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--color-text-tertiary)] block text-[10px] uppercase font-bold">Kalam / Lyrics</span>
                                        <span className="text-white font-medium">{featuredRelease.writer || 'Traditional Sacred Kalam'}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                                {featuredRelease.description || 'Institutional release preserving classical devotional poetry through contemporary arrangements and sacred sonic architecture.'}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Link 
                                    href={`/release-detail/${featuredRelease.slug || featuredRelease.youtubeId || featuredRelease.id}`}
                                    className="px-5 py-2.5 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-black text-[11px] uppercase tracking-widest rounded-lg transition-all shadow-xl flex items-center gap-2"
                                >
                                    <Play className="w-3.5 h-3.5" fill="currentColor" /> Watch & Listen
                                </Link>
                                {featuredRelease.youtubeId && (
                                    <a 
                                        href={`https://youtube.com/watch?v=${featuredRelease.youtubeId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white font-black text-[11px] uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </section>
    );
}
