import React from 'react';
import type { Metadata } from 'next';
import { DiscoveryGraphNodeView } from '@/app/components/seo/DiscoveryGraphNodeView';
import { registriesStorage } from '@/lib/registries-storage';
import { canonicalUrl } from '@/lib/canonical-seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  registriesStorage.init();
  const mood = registriesStorage.getItem('moods', slug);

  if (!mood || !mood.isActive || !mood.isPublic) {
    return {
      title: 'Mood Not Found',
      robots: { index: false, follow: false },
    };
  }

  const url = canonicalUrl(`/moods/${slug}`);
  return {
    title: `${mood.title} — Sacred Moods & Atmospheres`,
    description:
      mood.description ||
      `Browse full-length Sufi songs, kalam, and contemplative releases connected to the mood of ${mood.title}.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${mood.title} — Sacred Moods | SufiPulse USA`,
      description: mood.description,
      url,
      type: 'website',
    },
  };
}

export default async function MoodDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <DiscoveryGraphNodeView
      slug={slug}
      type="mood"
      categoryLabel="Mood"
      categoryUrlPath="moods"
    />
  );
}
