// app/(public)/releases-cms/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { cmsStorage, CMSRelease } from '@/lib/cms-storage';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';
import Link from 'next/link';
import { Play } from 'lucide-react';

export default function ReleasesPage() {
  const [releases, setReleases] = useState<CMSRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const allReleases = cmsStorage.getPublishedReleases();
        setReleases(allReleases);
      } catch (err) {
        console.error('Failed to load releases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading releases...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">SufiPulse Releases</h1>
            <p className="text-lg text-neutral-600">Explore our collection of Sufi music and poetry</p>
          </div>

          {releases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600 text-lg mb-4">No releases published yet</p>
              <Link href="/admin/cms-releases" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Create test releases
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map((release) => {
                const thumbnailCandidates = buildYouTubeThumbnailCandidates(release.youtubeId, [release.thumbnailUrl]);

                return (
                <Link key={release.id} href={`/releases-cms/${release.slug}`}>
                  <div className="group bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden cursor-pointer">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-black group-hover:bg-gray-900 transition overflow-hidden">
                      <img
                        src={thumbnailCandidates[0]}
                        alt={release.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition"
                        data-thumb-index="0"
                        onError={(e) => {
                          advanceThumbnailFallback(e.currentTarget, thumbnailCandidates);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <Play className="text-white opacity-0 group-hover:opacity-100 transition" size={48} fill="white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-neutral-900 group-hover:text-indigo-600 transition line-clamp-2">
                        {release.title}
                      </h3>
                      
                      {release.description && (
                        <p className="text-neutral-600 text-sm mt-2 line-clamp-2">
                          {release.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-neutral-500">
                        {release.durationFormatted && (
                          <span>{release.durationFormatted}</span>
                        )}
                        {release.viewCount !== undefined && (
                          <span>{release.viewCount.toLocaleString()} views</span>
                        )}
                      </div>

                      {(release.vocalist || release.writer) && (
                        <div className="mt-4 space-y-1 text-sm">
                          {release.vocalist && (
                            <p className="text-neutral-700">
                              <span className="font-semibold text-neutral-900">Vocalist:</span> {release.vocalist.name}
                            </p>
                          )}
                          {release.writer && (
                            <p className="text-neutral-700">
                              <span className="font-semibold text-neutral-900">Writer:</span> {release.writer.name}
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
        </div>
      </div>
    </Layout>
  );
}
