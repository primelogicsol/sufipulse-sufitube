import React from 'react';
import type { Metadata } from 'next';
import { DiscoveryGraphNodeView } from '@/app/components/seo/DiscoveryGraphNodeView';
import { registriesStorage } from '@/lib/registries-storage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;
  
  registriesStorage.init();
  const mood = registriesStorage.getItem('moods', slug);

  if (!mood || !mood.isActive || !mood.isPublic) {
    return {
      title: 'Mood Not Found | SufiPulse Discover',
      description: 'The requested discover topic is private or does not exist.'
    };
  }

  return {
    title: `${mood.title} - Moods & Atmospheres | SufiPulse Discover`,
    description: mood.description || `Browse qawwalis, sufi music, and devotional releases associated with the mood of ${mood.title}.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.sufipulse.com'}/moods/${slug}`
    },
    openGraph: {
      title: `${mood.title} - Moods & Atmospheres | SufiPulse Discover`,
      description: mood.description,
      type: 'website'
    }
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
