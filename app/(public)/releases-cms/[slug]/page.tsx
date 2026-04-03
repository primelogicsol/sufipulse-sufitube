// app/(public)/releases-cms/[slug]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Layout } from '../../../components/layout/Layout';
import { cmsStorage, CMSRelease } from '@/lib/cms-storage';

export default function ReleasePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [release, setRelease] = useState<CMSRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchRelease = async () => {
      try {
        setLoading(true);
        const foundRelease = cmsStorage.getReleaseBySlug(slug);
        
        if (!foundRelease) {
          setError('Release not found');
          return;
        }

        setRelease(foundRelease);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load release');
      } finally {
        setLoading(false);
      }
    };

    fetchRelease();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading release...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !release) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Error</p>
            <p className="text-neutral-600">{error || 'Release not found'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Video Player */}
            <div className="aspect-video bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${release.youtubeId}`}
                title={release.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Content */}
            <div className="p-8">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">{release.title}</h1>
              
              {release.description && (
                <p className="text-neutral-600 text-lg mb-6">{release.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b">
                {release.durationFormatted && (
                  <div>
                    <p className="text-neutral-500 text-sm font-semibold">DURATION</p>
                    <p className="text-neutral-900 font-bold">{release.durationFormatted}</p>
                  </div>
                )}
                {release.viewCount !== undefined && (
                  <div>
                    <p className="text-neutral-500 text-sm font-semibold">VIEWS</p>
                    <p className="text-neutral-900 font-bold">{release.viewCount.toLocaleString()}</p>
                  </div>
                )}
                {release.likeCount !== undefined && (
                  <div>
                    <p className="text-neutral-500 text-sm font-semibold">LIKES</p>
                    <p className="text-neutral-900 font-bold">{release.likeCount.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-neutral-500 text-sm font-semibold">STATUS</p>
                  <p className="text-neutral-900 font-bold capitalize">{release.status}</p>
                </div>
              </div>

              {/* Credits */}
              {(release.vocalist || release.writer || release.producer) && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-neutral-900 mb-4">Credits</h2>
                  <div className="space-y-2">
                    {release.vocalist && (
                      <p className="text-neutral-700">
                        <span className="font-semibold">Vocalist:</span> {release.vocalist.name}
                        {release.vocalist.nameUrdu && ` (${release.vocalist.nameUrdu})`}
                      </p>
                    )}
                    {release.writer && (
                      <p className="text-neutral-700">
                        <span className="font-semibold">Writer:</span> {release.writer.name}
                        {release.writer.nameUrdu && ` (${release.writer.nameUrdu})`}
                      </p>
                    )}
                    {release.producer && (
                      <p className="text-neutral-700">
                        <span className="font-semibold">Producer:</span> {release.producer.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* YouTube Link */}
              <div className="flex gap-4">
                <a
                  href={`https://www.youtube.com/watch?v=${release.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
