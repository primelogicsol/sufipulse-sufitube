"use client";

import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { Section } from '../../components/layout/Section';
import { PageContainer } from '../../components/layout/PageContainer';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';
import Link from 'next/link';
import { Play, Music } from 'lucide-react';

interface Release {
  id: string;
  title: string;
  slug: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  description?: string;
  durationFormatted?: string;
  viewCount?: number;
  vocalist?: { name: string };
  writer?: { name: string };
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/releases?status=published')
      .then(r => r.json())
      .then(data => setReleases(Array.isArray(data) ? data : []))
      .catch(() => setReleases([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <Section background="midnight" spacing="spacious">
        <PageContainer>
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              Registry
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4 leading-tight">
              SufiPulse Releases
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              Explore our collection of Sufi music and poetry
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-[var(--color-gold)]/30 border-t-[var(--color-gold)] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)]">Loading releases…</p>
              </div>
            </div>
          ) : releases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Music className="w-16 h-16 text-[var(--color-text-tertiary)] mb-4" />
              <p className="text-[var(--color-text-secondary)] text-lg">No releases published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map((release) => {
                const thumbnailCandidates = buildYouTubeThumbnailCandidates(release.youtubeId, [release.thumbnailUrl]);
                return (
                  <Link key={release.id} href={`/release-detail/${release.slug}`} className="group">
                    <div className="bg-[var(--color-slate)] border border-[var(--color-border)] rounded-[var(--radius-base)] overflow-hidden hover:border-[var(--color-gold)]/40 hover:shadow-[var(--shadow-gold-glow)] transition-all duration-[var(--transition-base)]">
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img
                          src={thumbnailCandidates[0]}
                          alt={release.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          data-thumb-index="0"
                          onError={(e) => advanceThumbnailFallback(e.currentTarget, thumbnailCandidates)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Play className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={48} fill="white" />
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors line-clamp-2 mb-2">
                          {release.title}
                        </h3>

                        {release.description && (
                          <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2 mb-4">
                            {release.description}
                          </p>
                        )}

                        {(release.durationFormatted || release.viewCount !== undefined) && (
                          <div className="flex items-center gap-4 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
                            {release.durationFormatted && <span>{release.durationFormatted}</span>}
                            {release.viewCount !== undefined && (
                              <span>{release.viewCount.toLocaleString()} views</span>
                            )}
                          </div>
                        )}

                        {(release.vocalist || release.writer) && (
                          <div className="mt-3 space-y-1 text-sm">
                            {release.vocalist && (
                              <p className="text-[var(--color-text-secondary)]">
                                <span className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs">Vocalist </span>
                                {release.vocalist.name}
                              </p>
                            )}
                            {release.writer && (
                              <p className="text-[var(--color-text-secondary)]">
                                <span className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs">Writer </span>
                                {release.writer.name}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </PageContainer>
      </Section>
    </Layout>
  );
}
