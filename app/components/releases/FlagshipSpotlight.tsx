import React from 'react';
import Link from 'next/link';
import { Play, Youtube, Sparkles } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';

export interface YouTubeRelease {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl: string;
    publishedDate: string;
    durationSeconds: number;
    durationFormatted: string;
    views: number;
    source: string;
    format: 'video' | 'audio' | 'short' | 'live' | 'playlist' | string;
    govType: string;
    vocalist: string;
    writer: string;
    tags: string;
    youtubeId: string;
    rawTitle?: string;
    youtubeTitle?: string;
}

interface FlagshipSpotlightProps {
    release: YouTubeRelease;
    sourcePage?: 'home' | 'releases';
}

export function FlagshipSpotlight({ release: featuredRelease, sourcePage }: FlagshipSpotlightProps) {
    if (!featuredRelease) return null;

    return (
        <section className="py-16 bg-gradient-to-b from-[var(--color-midnight)] to-[var(--color-slate)] border-b border-white/5">
            <PageContainer>
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                        <span className="text-xs font-black text-[var(--color-gold)] uppercase tracking-[0.3em]">
                            Flagship Spotlight
                        </span>
                    </div>

                    <div className="elite-card overflow-hidden bg-gradient-to-br from-amber-400/[0.04] to-transparent border-amber-400/20 p-6 md:p-10 shadow-2xl">
                        <div className="grid md:grid-cols-12 gap-8 items-center">
                            {/* Left: Artwork / Video Thumbnail */}
                            <div className="md:col-span-6 relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl group">
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
                                        className="w-16 h-16 rounded-full bg-[var(--color-gold)] flex items-center justify-center text-[var(--color-midnight)] shadow-2xl hover:scale-110 transition-transform duration-300"
                                    >
                                        <Play className="w-8 h-8 ml-1" fill="currentColor" />
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
                            <div className="md:col-span-6 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest">
                                        <span>{new Date(featuredRelease.publishedDate).getFullYear() || 2026}</span>
                                        <span>•</span>
                                        <span>{featuredRelease.format.toUpperCase()}</span>
                                        <span>•</span>
                                        <span>{(Number(featuredRelease.views) || 0).toLocaleString()} Views</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                                        {featuredRelease.title}
                                    </h2>
                                </div>

                                {/* Authorship Chain Line */}
                                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2">
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

                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                                    {featuredRelease.description || 'Institutional release preserving classical devotional poetry through contemporary arrangements and sacred sonic architecture.'}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 pt-2">
                                    <Link 
                                        href={`/release-detail/${featuredRelease.slug || featuredRelease.youtubeId || featuredRelease.id}`}
                                        className="px-6 py-3 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2"
                                    >
                                        <Play className="w-4 h-4" fill="currentColor" /> Watch & Listen
                                    </Link>
                                    {featuredRelease.youtubeId && (
                                        <a 
                                            href={`https://youtube.com/watch?v=${featuredRelease.youtubeId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-3 bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <Youtube className="w-4 h-4 text-red-500" /> YouTube
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </section>
    );
}
