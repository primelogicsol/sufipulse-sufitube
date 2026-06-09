"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Music, ChevronLeft, ChevronRight, Calendar, BookOpen } from 'lucide-react';
import { Section } from '../layout/Section';
import { PageContainer } from '../layout/PageContainer';
import { Card } from '../primitives/Card';
import { Badge } from '../primitives/Badge';
import { PrimaryButton } from '../primitives/PrimaryButton';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';

interface Publication {
  id: string;
  type: 'music' | 'literary';
  title: string;
  slug: string;
  published_at: string;
  excerpt?: string;
  artwork_url?: string;
  youtube_video_id?: string;
  description?: string;
}

interface RegistrySectionProps {
  featuredReleases: Publication[];
  recentReleases: Publication[];
  loading: boolean;
}

export function RegistrySection({ featuredReleases, recentReleases, loading }: RegistrySectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (featuredReleases.length <= 1) return;
    const carouselTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredReleases.length);
    }, 7000);

    return () => clearInterval(carouselTimer);
  }, [featuredReleases.length]);

  const nextSlide = () => {
    if (featuredReleases.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % featuredReleases.length);
  };

  const prevSlide = () => {
    if (featuredReleases.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + featuredReleases.length) % featuredReleases.length);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const activeRelease = featuredReleases[currentSlide];
  const activeVideoId = activeRelease?.youtube_video_id || activeRelease?.slug;
  const activeThumbnailCandidates = buildYouTubeThumbnailCandidates(activeVideoId, [activeRelease?.artwork_url]);

  return (
    <>
      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto mb-12 sm:text-center">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              Songs Registry Highlights
            </div>
            <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Songs Registry Highlights
            </h2>
            <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-2xl md:mx-auto leading-[var(--leading-relaxed)]">
              Curated selections from the institutional registry of approved and distributed works.
            </p>
          </div>

          {loading ? (
            <div className="max-w-4xl mx-auto">
              <div className="aspect-video w-full bg-[var(--color-slate)]/20 animate-pulse rounded-xl border border-[var(--color-text-tertiary)]/10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--color-gold)]/20 border-t-[var(--color-gold)] rounded-full animate-spin"></div>
              </div>
            </div>
          ) : featuredReleases.length === 0 ? (
            <div className="flex items-center justify-center py-20 bg-[var(--color-slate)]/10 rounded-2xl border border-dashed border-[var(--color-text-tertiary)]/20">
              <div className="text-center">
                <Music className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
                <div className="text-[var(--color-text-secondary)] font-medium">Registry archive empty</div>
              </div>
            </div>
          ) : (
            <div className="relative max-w-4xl mx-auto">
              <Link
                href={`/release-detail/${activeVideoId}`}
                className="group block"
              >
                <div className="relative">
                  {activeVideoId ? (
                    <div className="relative w-full overflow-hidden rounded-xl shadow-2xl border border-[var(--color-text-tertiary)]/10" style={{ aspectRatio: '16/9' }}>
                      <img
                        key={activeVideoId}
                        src={activeThumbnailCandidates[0]}
                        alt={activeRelease?.title}
                        className="w-full h-full object-cover bg-black group-hover:scale-[1.02] transition-transform duration-700"
                        loading="lazy"
                        data-thumb-index="0"
                        onError={(e) => {
                          advanceThumbnailFallback(e.currentTarget, activeThumbnailCandidates);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-[var(--color-gold)] flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                          <Play className="w-10 h-10 text-[var(--color-midnight)] ml-1" fill="currentColor" />
                        </div>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-1 group-hover:text-[var(--color-gold)] transition-colors">
                          {activeRelease?.title}
                        </h3>
                        <div className="flex items-center gap-4 text-[var(--text-xs)] text-white/70 uppercase tracking-widest font-bold">
                          <span>{formatDate(activeRelease?.published_at)}</span>
                          <span className="w-1 h-1 bg-[var(--color-gold)] rounded-full"></span>
                          <span>{currentSlide + 1} / {featuredReleases.length}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-[var(--color-slate)]/20 rounded-xl flex items-center justify-center border border-[var(--color-text-tertiary)]/10" style={{ aspectRatio: '16/9' }}>
                      <Music className="w-12 h-12 text-[var(--color-text-tertiary)] opacity-30" />
                    </div>
                  )}
                </div>
              </Link>

              {featuredReleases.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.preventDefault(); prevSlide(); }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 md:-translate-x-16 w-12 h-12 bg-[var(--color-midnight)]/80 backdrop-blur-sm border border-[var(--color-border-strong)] hover:border-[var(--color-gold)] rounded-full flex items-center justify-center transition-all duration-300 group z-10 text-white hover:text-[var(--color-gold)]"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); nextSlide(); }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-16 w-12 h-12 bg-[var(--color-midnight)]/80 backdrop-blur-sm border border-[var(--color-border-strong)] hover:border-[var(--color-gold)] rounded-full flex items-center justify-center transition-all duration-300 group z-10 text-white hover:text-[var(--color-gold)]"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
          )}
        </PageContainer>
      </Section>

      {!loading && recentReleases.length > 0 && (
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="text-center mb-16">
              <Badge variant="gold">Latest Submissions</Badge>
              <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mt-4">
                Recent Songs Registry Entries
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentReleases.map((pub) => (
                <Link
                  key={pub.id}
                  href={pub.type === 'music' ? `/release-detail/${pub.youtube_video_id}` : `/literary-journal/${pub.slug}`}
                  className="group block"
                >
                  <Card hoverable className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-4">
                    {pub.type === 'music' && (pub.artwork_url || pub.youtube_video_id) ? (
                      <div className="aspect-video w-full overflow-hidden rounded-lg mb-6 bg-black border border-[var(--color-text-tertiary)]/10">
                        <img
                          src={pub.artwork_url || `https://i.ytimg.com/vi/${pub.youtube_video_id}/hqdefault.jpg`}
                          alt={pub.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-[var(--color-slate)]/30 mb-6 rounded-lg flex items-center justify-center border border-[var(--color-text-tertiary)]/10">
                        {pub.type === 'music' ? (
                          <Music className="w-12 h-12 text-[var(--color-text-tertiary)] opacity-30" />
                        ) : (
                          <BookOpen className="w-12 h-12 text-[var(--color-text-tertiary)] opacity-30" />
                        )}
                      </div>
                    )}

                    <div className="px-2">
                      <div className="mb-3">
                        <span className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest font-bold border border-[var(--color-gold)]/20 px-2 py-0.5 rounded bg-[var(--color-gold)]/5">
                          {pub.type === 'music' ? 'Studio Release' : 'Literary'}
                        </span>
                      </div>

                      <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-4 group-hover:text-[var(--color-gold)] transition-colors line-clamp-1 leading-tight">
                        {pub.title}
                      </h3>

                      <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-[0.15em] font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-gold)]" />
                        <span>{formatDate(pub.published_at)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-16">
              <Link href="/releases">
                <PrimaryButton variant="secondary" size="large">
                  Browse All Releases
                </PrimaryButton>
              </Link>
            </div>
          </PageContainer>
        </Section>
      )}
    </>
  );
}
