// app/(public)/releases-cms/[slug]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout/Layout';
import { Section } from '../../../components/layout/Section';
import { PageContainer } from '../../../components/layout/PageContainer';
import { cmsStorage, CMSRelease } from '@/lib/cms-storage';
import { ExternalLink } from 'lucide-react';

export default function ReleasePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [release, setRelease] = useState<CMSRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    try {
      const found = cmsStorage.getReleaseBySlug(slug);
      if (!found) setError('Release not found');
      else setRelease(found);
    } catch (err: any) {
      setError(err.message || 'Failed to load release');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[var(--color-gold)]/30 border-t-[var(--color-gold)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--color-text-secondary)]">Loading release…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !release) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 font-semibold mb-2">Not found</p>
            <p className="text-[var(--color-text-secondary)]">{error || 'Release not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Section background="midnight" spacing="spacious">
        <PageContainer>
          <div className="max-w-4xl mx-auto">
            {/* Video */}
            <div className="aspect-video bg-black rounded-[var(--radius-base)] overflow-hidden mb-8 shadow-2xl">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${release.youtubeId}`}
                title={release.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="bg-[var(--color-slate)] border border-[var(--color-border)] rounded-[var(--radius-base)] p-8">
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3">{release.title}</h1>

              {release.description && (
                <p className="text-[var(--color-text-secondary)] text-lg mb-8 leading-relaxed">{release.description}</p>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-[var(--color-border)]">
                {release.durationFormatted && (
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-widest font-semibold mb-1">Duration</p>
                    <p className="text-[var(--color-text-primary)] font-bold">{release.durationFormatted}</p>
                  </div>
                )}
                {release.viewCount !== undefined && (
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-widest font-semibold mb-1">Views</p>
                    <p className="text-[var(--color-text-primary)] font-bold">{release.viewCount.toLocaleString()}</p>
                  </div>
                )}
                {release.likeCount !== undefined && (
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-widest font-semibold mb-1">Likes</p>
                    <p className="text-[var(--color-text-primary)] font-bold">{release.likeCount.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-widest font-semibold mb-1">Status</p>
                  <p className="text-[var(--color-text-primary)] font-bold capitalize">{release.status}</p>
                </div>
              </div>

              {/* Credits */}
              {(release.vocalist || release.writer || release.producer) && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">Credits</h2>
                  <div className="space-y-2">
                    {release.vocalist && (
                      <p className="text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">Vocalist </span>
                        {release.vocalist.name}
                        {release.vocalist.nameUrdu && ` — ${release.vocalist.nameUrdu}`}
                      </p>
                    )}
                    {release.writer && (
                      <p className="text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">Writer </span>
                        {release.writer.name}
                        {release.writer.nameUrdu && ` — ${release.writer.nameUrdu}`}
                      </p>
                    )}
                    {release.producer && (
                      <p className="text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">Producer </span>
                        {release.producer.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* YouTube link */}
              <a
                href={`https://www.youtube.com/watch?v=${release.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-[var(--radius-sm)] font-semibold transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Watch on YouTube
              </a>
            </div>
          </div>
        </PageContainer>
      </Section>
    </Layout>
  );
}
